#!/usr/bin/env bun
// AI sprite üretim pipeline — txt2img (recraft-v3) + BiRefNet arka plan silme + sharp normalizasyon.
//
// Kullanım:
//   FAL_KEY=... bun tools/generate-sprite.mjs dusenin-dostu --all
//   FAL_KEY=... bun tools/generate-sprite.mjs dusenin-dostu player-idle brick
//   FAL_KEY=... bun tools/generate-sprite.mjs dusenin-dostu bg-cave --skip-removal
//
// Tema dosyası tools/sprites-prompts/<tema>.mjs: BASE_PROMPT, NEGATIVE, PALETTE,
// ELEMENTS, OUT_DIR export eder. Çıktı doğrudan oyunun assets/ klasörüne yazılır
// (DUSENIN-DOSTU-SPEC K15/K16, T-20).
//
// Akış: recraft-v3 txt2img -> (bg dışı) fal-ai/birefnet/v2 -> sharp trim +
// frame'e oturt + şeffaf canvas -> assets/<element>.png
import { fal } from "@fal-ai/client";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { SPRITE_SPECS } from "./sprites-spec.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const THEMES_DIR = path.join(__dirname, "sprites-prompts");
const MODEL = "fal-ai/nano-banana";
const REMBG_MODEL = "fal-ai/birefnet/v2";

const args = process.argv.slice(2);
const skipRemoval = args.includes("--skip-removal");
const positional = args.filter((a) => !a.startsWith("--"));
const themeName = positional[0];

if (!themeName) {
  console.error("Kullanım: bun tools/generate-sprite.mjs <tema> [element...] [--all] [--skip-removal]");
  process.exit(1);
}

const availableThemes = (await readdir(THEMES_DIR))
  .filter((f) => f.endsWith(".mjs"))
  .map((f) => f.replace(/\.mjs$/, ""));
if (!availableThemes.includes(themeName)) {
  console.error(`[gen] bilinmeyen tema: ${themeName} — mevcut: ${availableThemes.join(", ")}`);
  process.exit(1);
}

const { BASE_PROMPT, BG_BASE_PROMPT, ELEMENTS, OUT_DIR } = await import(
  `./sprites-prompts/${themeName}.mjs`
);

const outRoot = path.join(REPO_ROOT, OUT_DIR);
const names = args.includes("--all")
  ? Object.keys(ELEMENTS)
  : positional.slice(1);

if (names.length === 0) {
  console.error("Kullanım: bun tools/generate-sprite.mjs <tema> <element...> | --all");
  console.error(`Elementler: ${Object.keys(ELEMENTS).join(", ")}`);
  process.exit(1);
}

if (!process.env.FAL_KEY) {
  console.error("FAL_KEY ortam değişkeni gerekli. https://fal.ai/dashboard/keys adresinden alın.");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// İçerik bbox'ına kırp → frame'e orantılı sığdır → şeffaf canvas'a ortala.
// Tüm sprite'lar aynı canvas boyutunda çıkar; Pixi'de anchor 0.5 güvenle kullanılır.
async function normalize(buffer, spec, element) {
  const { width: cw, height: ch } = spec.canvas;
  const margin = spec.margin ?? 6;
  const innerW = Math.max(1, cw - margin * 2);
  const innerH = Math.max(1, ch - margin * 2);

  const trimmed = await sharp(buffer)
    .ensureAlpha()
    .trim({ threshold: 1 })
    .toBuffer({ resolveWithObject: true });
  const { width: tw, height: th } = trimmed.info;
  if (!tw || !th) throw new Error(`${element}: içerik bulunamadı (tamamen şeffaf)`);

  const scale = Math.min(innerW / tw, innerH / th);
  const w = Math.max(1, Math.round(tw * scale));
  const h = Math.max(1, Math.round(th * scale));
  const resized = await sharp(trimmed.data).resize(w, h, { fit: "fill" }).png().toBuffer();

  return sharp({
    create: { width: cw, height: ch, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: resized, left: Math.round((cw - w) / 2), top: Math.round((ch - h) / 2) },
    ])
    .png()
    .toBuffer();
}

async function coverResize(buffer, spec) {
  const { width, height } = spec.canvas;
  return sharp(buffer).resize(width, height, { fit: "cover" }).png().toBuffer();
}

/**
 * Tam kare karo (full) — köşe düzeltmesi: model yuvarlak köşe çiziyor; köşeler
 * karonun gövde rengiyle doldurulur ki oyun ızgarasında beyaz leke kalmasın.
 */
async function flattenCorners(buffer, spec) {
  const { width, height } = spec.canvas;
  // Beyaz dış boşluğu kırp → içeriği çerçeveye cover ile oturt.
  const trimmed = await sharp(buffer).trim({ threshold: 12 }).toBuffer();
  const resized = await sharp(trimmed).resize(width, height, { fit: "cover" }).toBuffer();
  const { data, info } = await sharp(resized)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Gövde rengi: merkez %40 bölgenin ortalaması.
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  const x0 = Math.floor(info.width * 0.3);
  const x1 = Math.floor(info.width * 0.7);
  const y0 = Math.floor(info.height * 0.3);
  const y1 = Math.floor(info.height * 0.7);
  for (let y = y0; y < y1; y += 2) {
    for (let x = x0; x < x1; x += 2) {
      const i = (y * info.width + x) * 4;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n += 1;
    }
  }
  const bodyR = Math.round(r / Math.max(1, n));
  const bodyG = Math.round(g / Math.max(1, n));
  const bodyB = Math.round(b / Math.max(1, n));

  // Köşe bölgelerinde (20%) beyaz/zemini gövde rengiyle değiştir.
  const cw = Math.floor(info.width * 0.2);
  const ch = Math.floor(info.height * 0.2);
  const zones = [
    [0, 0],
    [info.width - cw, 0],
    [0, info.height - ch],
    [info.width - cw, info.height - ch],
  ];
  for (const [zx, zy] of zones) {
    for (let y = zy; y < zy + ch; y++) {
      for (let x = zx; x < zx + cw; x++) {
        const i = (y * info.width + x) * 4;
        if (data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200) {
          data[i] = bodyR;
          data[i + 1] = bodyG;
          data[i + 2] = bodyB;
          data[i + 3] = 255;
        }
      }
    }
  }

  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

/**
 * Panel/çerçeve cutout: iç bölgedeki beyazı şeffafa çevirir (çerçeve/panel
 * "ortası boş" olması gereken assetlerde model beyaz dolgu bırakabiliyor).
 */
async function cutoutWhite(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235) {
      data[i + 3] = 0;
    }
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

async function generateOne(element) {
  const specEl = ELEMENTS[element];
  if (!specEl) {
    console.error(`[gen] bilinmeyen element: ${element}`);
    return false;
  }
  const spec = SPRITE_SPECS[element];
  if (!spec) {
    console.error(`[gen] ${element}: sprites-spec.mjs'te canvas tanımı yok`);
    return false;
  }
  const isBg = specEl.bg === true;
  const isFull = isBg || specEl.full === true;

  // Yüz/karakter özellikleri yalnız `character: true` elementlerde serbest —
  // taş/kırıcı/coin gibi nesneler inanimate kalmalı (2026-11-10: brick'e yüz çizdi).
  const noFace = specEl.character
    ? ""
    : " It has NO face, NO eyes, NO mouth, NO character features — it is a plain inanimate object.";
  const prompt = isBg
    ? `${BG_BASE_PROMPT} Scene: ${specEl.describe}.`
    : `${BASE_PROMPT} The object is ${specEl.describe}.${noFace}`;
  // recraft-v3 prompt sınırı 1000 karakter — aşarsa API 422 döner.
  if (prompt.length > 1000) {
    throw new Error(`${element}: prompt ${prompt.length} karakter — recraft sınırı 1000`);
  }
  console.log(`[gen] ${element}: recraft-v3 üretiliyor...`);

  const gen = await fal.subscribe(MODEL, {
    input: {
      prompt,
      num_images: 1,
      output_format: "png",
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs?.map((log) => log.message).forEach((m) => console.log(`  [fal] ${m}`));
      }
    },
  });

  let imageUrl = gen.data?.images?.[0]?.url;
  if (!imageUrl) {
    console.error(`[gen] ${element}: üretim yanıtında görsel yok`);
    return false;
  }

  if (!isFull && !skipRemoval) {
    console.log(`[gen] ${element}: BiRefNet arka plan temizliği...`);
    const rem = await fal.subscribe(REMBG_MODEL, {
      input: { image_url: imageUrl, output_format: "png", refine_foreground: true },
      logs: true,
    });
    imageUrl = rem.data?.image?.url ?? imageUrl;
  }

  console.log(`[gen] ${element}: indiriliyor...`);
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`${element}: indirme başarısız (${res.status})`);
  const raw = Buffer.from(await res.arrayBuffer());

  const final = isBg
    ? await coverResize(raw, spec)
    : specEl.full === true
      ? await flattenCorners(raw, spec)
      : await normalize(raw, spec, element);
  let processed = specEl.cutout === true ? await cutoutWhite(final) : final;
  // Renk düzeltmesi (2026-11-11): koyu cam kaide gibi assetler için.
  if (specEl.brightness !== undefined) {
    processed = await sharp(processed).modulate({ brightness: specEl.brightness }).png().toBuffer();
  }
  if (specEl.tint !== undefined) {
    processed = await sharp(processed).tint(specEl.tint).png().toBuffer();
  }

  await mkdir(outRoot, { recursive: true });
  const outPath = path.join(outRoot, specEl.out ?? `${element}.png`);
  await writeFile(outPath, processed);
  console.log(
    `[gen] ${element}: kaydedildi -> ${path.relative(REPO_ROOT, outPath)} (${(processed.length / 1024).toFixed(1)} KB)`,
  );
  return true;
}

let failed = 0;
for (const name of names) {
  try {
    const ok = await generateOne(name);
    if (!ok) failed++;
  } catch (err) {
    console.error(`[gen] ${name}: hata — ${err?.message ?? err}`);
    failed++;
  }
  await sleep(1200);
}

if (failed > 0) {
  console.error(`[gen] ${failed}/${names.length} element başarısız`);
  process.exit(1);
}
console.log(`[gen] tamamlandı -> ${OUT_DIR}`);
