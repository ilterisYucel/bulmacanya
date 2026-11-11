---
status: active
space: games
tags: [oyun, kelime, game7, entegrasyon, gdd, spec]
review_date: 2026-11-07
---

# FAZ-GAME7-ENTEGRASYONU — SPEC

> **İş akışı aşaması:** 1/5 — SPEC (AGENTS.md "Geliştirme İş Akışı").
> **Durum:** ✅ IMPL TAMAM — KAPANIŞ yazıldı (§A/§B, 2026-11-07). Gözle kontrol turları kullanıcıda sürüyor.
> **İlişkili:** [SPEC-SABLONU](docs/SPEC-SABLONU.md), [README §2/§4.3/§7.3.2](README.md), [AGENTS-GAMES](AGENTS-GAMES.md), emsal: [FAZ-SHAPETRIS-ENTEGRASYONU-SPEC](docs/FAZ-SHAPETRIS-ENTEGRASYONU-SPEC.md), tool paketi: [FAZ-GAME-FX-SPEC](docs/FAZ-GAME-FX-SPEC.md)
> **Referans (eski oyun):** `/home/ilteris/Downloads/game7-master/` (`static/main.js`, `static/main.html`, `cordova-config/config.xml`)

---

## Parça Planı (inşa günlüğü)

| Parça | İçerik | Durum |
| :---- | :----- | :---- |
| P-1 | İskelet + §1 Kimlik + §2 Kararlar + §3 Bulgular + UC-1 (harf havuzu) | ✅ (2026-11-07) |
| P-2 | Mod kararları işleme (K12-K15) + UC-3 — kelime kontrolü ve mod kuralları | ✅ Bu parça (2026-11-07) |
| P-3 | UC-2 — Yerleştirme, slot ve balon yaşam döngüsü (A paketi kalan) | ✅ Bu parça (2026-11-07) |
| P-4 | UC-4 — Seviye, skor, kazan/kaybet + Uzman tier açılımı (A paketi sonu) | ✅ (2026-11-07) |
| P-5 | UC-5 — Juice / oyun hissi (B paketi) | ✅ Bu parça (2026-11-07) |
| P-6 | UC-6 — HUD ve menüler (C paketi) + grafik varlık planı | ✅ Bu parça (2026-11-07) |
| P-7 | §4 Mimari + UC-7 — bulmacanya entegrasyonu (IGameModule, paket, i18n, varlıklar) | ✅ Bu parça (2026-11-07) |
| — | Onay → JSDoc → TEST (RED) → IMPL → KAPANIŞ (§A/§B) | ✅ (2026-11-07) |

---

## 1. Amaç ve Bağlam

### 1.1 Oyun Kimliği (GDD özeti)

**HarfGüder (game7)** — yukarı süzülen harf balonlarını tutup sağ kenardaki dikey yuvalara sürükleyerek kelime oluşturma oyunu. Yuvaların yukarıdan aşağı sırası kelimeyi heceler: oyuncu harfleri **doğru sırada dikey dizerek** hedef kelimeleri tamamlar; tamamlanan kelimenin balonları patlar. Hız/dexterity (balonlar serbestçe yüzer) + kelime bilgisi karışımı. Eski `game7-master` prototipi doğrudan bulmacanya üzerinde yeniden yazılır — ayrı standalone cilalama fazı YOKTUR. **Teknik modül ID: `game7` (K1 — marka adı HarfGüder'dir, ID değişmez — A6).**

- **Tür:** Kelime bulma/türetme — README §2 "Kelime" (fikir aşamasındaki ürünün karşılığı)
- **Hedef kitle:** Günlük 5-10 dakikalık kısa bulmaca oturumu arayan mobil kullanıcı (web PWA + iOS/Android)
- **Oturum:** Bölüm (seviye) başına ~1-3 dk; seviye ilerlemeli
- **Kontroller:** Sürükle-bırak (touch/mouse); yuvadan geri çekerek iptal (eski davranış)
- **Game feel:** Balon patlama, snap tween, yanlış yerleştirmede geri bildirim (detay UC-5, P-5)
- **Modlar (v1 — K12):** Klasik (kelime açık — tarama/hız/dexterity), Dedektif (kategori + uzunluk, kelime gizli — tümdengelim, çoklu aday — K13), Sabit Harf (desen + kategori — çapraz bulmaca, algoritmik desen — K14). Motor ortak; mod `init` parametresi (shapetris campaign/daily/endless deseni emsali).
- **Dil:** Türkçe kelimeler + Türkçe UI (bulmacanya i18n'i TR — eski oyun İngilizce "GAME/SEVEN" idi)

### 1.2 Kapsam

| Katman | Dahil | Hariç |
| :----- | :---- | :---- |
| Oyun modülü | Harf havuzu, balon hareketi, slot yerleştirme, kelime kontrolü (3 mod — K12), seviye/skor/kazan-kaybet, juice, HUD/menüler, ipucu türleri | Günlük puzzle takvimi, çok oyunculu, tema sistemi, mağaza/coin ekranı |
| İçerik | LibreOffice TR'den filtreli kelime çekimi + kürasyonlu tier'lar (kolay/orta/zor) + kategori etiketleri + Uzman tier (tam liste) — K15 | 100k+ kelimenin tamamının elle etiketlenmesi — yalnız başlangıç seti işaretlenir; gerisi filtreli ham liste |
| Araçlar | `@bulmacanya/game-fx` + `game-fx-pixi` TÜKETİMİ (particles/fx-atlas/audio/shake) | Tool geliştirme (ayrı paket — [FAZ-GAME-FX-SPEC](docs/FAZ-GAME-FX-SPEC.md)) |
| Grafik | Balon sprite'ları (29 TR harf), patlama/partikül, arka plan, HUD ikonları | 3D, video, karmaşık karakter animasyonları |
| Entegrasyon | `IGameModule` kontratı, lazy load, Home'dan giriş, skor/ipucu/kayıt event'leri | Oyun seçim sayfası, reklam SDK'sı (shell'in işi), backend skor kalıcılığı |
| Backend | Yok (modül shell ile konuşur) | Skor saklama (shell/saveRequested payload'ı üretir, saklamaz) |

---

## 2. Kararlar (kullanıcı onaylı — 2026-11-07)

| Kod | Karar | Sonuç | Durum |
| :-- | :---- | :---- | :---- |
| K1 | Modül ID `game7`; paket `apps/games/src/game7/`; README §2 "Kelime" kategorisinin ürün karşılığıdır (marka: HarfGüder) | `registerGame("game7", () => import("@bulmacanya/games/game7"))` | ✅ |
| K2 | Eski mekanik korunur: balonlar yukarı süzülür, sağ kenara sürüklenince dikey slot'a yapışır, slot sırası (yukarıdan aşağı) kelimeyi oluşturur | `main.js#onDragMove` birebir referans | ✅ |
| K3 | Harf havuzu çoğulludur: hedef-set'in harf frekansına göre balon üretilir (SEVEN bug'ının kök çözümü) | UC-1 | ✅ |
| K4 | Sözlük Türkçe; tier'lı (kolay/orta/zor/uzman — K15) | UC-1, UC-4 | ✅ |
| K5 | Yerleştirmede kelime kontrolü slot bazlı; aynı harf balonları id ile izlenir | UC-2/UC-3 | ✅ |
| K6 | Hata bedeli (A3 kapanışı): Klasik'te EK CEZA YOK (yanlış yerleştirme geri seker — doğal süre kaybı; kelime açıkken can tüketecek olay yoktur); Dedektif'te yanlış tam kelime = 1 hak; Sabit'te geçersiz tam kelime = 1 can | UC-2/UC-4 | ✅ |
| K7 | Kazan/kaybet (A2 kapanışı): Klasik = bölüm süresi (süre bitince fail); Dedektif = yanlış kelime hakkı 3/3/2; Sabit = can 3/2/2. Kural: sınır modun zorluk kaynağıyla eşleşir (yürütme→süre, bilgi→hak/can). Fail → aynı bölüm restart, toplam skor KORUNUR | UC-4 | ✅ |
| K8 | Kelime tamamlanınca balonlar patlar + slot serbest kalır; tekrar üretim havuz dağılımından | UC-5 | ✅ |
| K9 | HUD DOM katmanında (React/Ionic), oyun alanı Pixi canvas — shapetris emsali (K14) | UC-6 | ✅ |
| K10 | İpucu türleri (4): `game7.harf-vurgula` (Klasik, 1 coin — sıradaki gerekli harfin balonunu parlat), `game7.sure-ekle` (Klasik, 2 coin — +15s), `game7.harf-ac` (Dedektif/Sabit, uzunluk ≤4 → 1, ≥5 → 2 coin), `game7.hak-iade` (Dedektif/Sabit, 2 coin — fail anında +1 hak/can). Modül maliyet bilmez; shell'e `hintType` iletir (README §7.3.2) | UC-7 | ✅ |
| K11 | Grafikler: eski 26 harf PNG'si (A-Z) YETERLİ DEĞİL — TR alfabesi 29 harf (Ç,Ğ,İ,Ö,Ş,Ü eksik); balon grafik seti yenilenir/yeniden üretilir | P-6 grafik planı | ✅ |
| K12 | Üç mod v1: `klasik` (kelime açık), `dedektif` (kategori+uzunluk, kelime gizli), `sabit` (desen+kelime bilgisi); motor ortak, mod `init` parametresi (shapetris campaign/daily/endless deseni emsali) | UC-3 | ✅ |
| K13 | Dedektif çoklu aday kabulü: kategori+uzunluğa uyan HERHANGİ geçerli kelime kazançtır; tek gizli hedef YOK (tahmin oyunu değil, tümdengelim) | UC-3 | ✅ |
| K14 | Sabit Harf desenleri algoritmik üretilir (seed'li; harflerin %30-50'si sabit); sabit harfler slotlara kilitli yerleşir, taşınamaz | UC-3 | ✅ |
| K15 | Kelime verisi: LibreOffice TR wordlist'inden filtreli çekim (uzunluk 3-8, TR karakter normalizasyonu, çekimli form çıkarma) + kürasyonlu tier'lar (kolay/orta/zor — elle işaretli + kategori etiketli) + Uzman tier (filtreli tam liste) Zor kampanyası bitince açılır (shapetris K20 emsali; başlangıç eşiği — tune edilir). Dedektif kategori gerektirdiğinden YALNIZ kürasyonlu setlerle çalışır; Uzman → Klasik + Sabit Harf | UC-1/UC-4, A1 kapanışı | ✅ |
| K16 | Zorluk tier parametreleri (3×3 tablolar, tek kaynak `model/progression.ts`; tüm değerler başlangıç — tune edilir): Klasik = süre 90/60/45s, uzunluk 3-4/4-5/5-6, balon hızı ×1/×1.25/×1.5, çeldirici %20/30/40, seviye kelimesi 2/3/4; Dedektif = hak 3/3/2, uzunluk 3-4/4-5/5-7, kategori genişliği dar/orta/geniş, sinyal 3/3/2 durum; Sabit = can 3/2/2, uzunluk 3-4/4-6/5-8, sabit harf oranı %50/40/30 | UC-4 | ✅ |
| K17 | Dedektif sinyali (Wordle tarzı, aday seti bazlı, durumsuz): YOK = hiçbir adayda o pozisyonda olamaz; VAR = en az bir adayda olabilir; YERİNDE = tüm adaylarda o pozisyonda aynı harf. Zor tier'da 2 durum (YOK/VAR). Sinyal bilgi verir; kazanç kuralını DEĞİŞTİRMEZ (K13 — orijinal aday seti geçerlidir) | UC-3 | ✅ |
| K18 | Balon süzülme hızı yalnız Klasik'te zorluk kolu; Dedektif/Sabit'te sabit rahat tempo (bekleme kaynağı, baskı değil — fail sürücüsü hak/can) | UC-2 | ✅ |
| K19 | Slot düzeni (D1): N adet tam slot (N = hedef kelime uzunluğu), sağ kolonda dikey ortalanmış, HUD kelime/çizgi göstergeleriyle birebir hizalı | UC-2 | ✅ |
| K20 | Ekran balon kapasitesi (D2): sabit 14 balon; tepeden çıkan havuz dağılımından yeniden doğar; aynı harften 2+ balon eşzamanlı uçabilir | UC-2 | ✅ |
| K21 | Yerinden edilen/geri çekilen balon HARFİNİ KORUR (D3); yeniden doğum yalnız tepeden çıkışta | UC-2 | ✅ |
| K22 | Snap (D4): bırakılan balon en yakın slota oturur; slot doluysa eski balon serbest bırakılır (eski `main.js#onDragMove` davranışı) | UC-2 | ✅ |
| K23 | Doğrulama modeli (D5): Klasik = otomatik per-slot doğrulama (yalnız beklenen harf oturur, yanlış geri seker — saf hız oyunu); Dedektif/Sabit = serbest oturma + "Kontrol Et" teslimi (hak/can yalnız teslimde — Wordle Enter emsali) | UC-2/UC-3 | ✅ |
| K24 | Restart (D6): aynı bölüm yeni seed ile yeniden kurulur; Sabit modda desen KORUNUR (bölümün parçası), balon dağılımı yenilenir; toplam skor korunur | UC-2/UC-4 | ✅ |
| K25 | Tek aktif sürükleme (D7): bir balon DRAG'dayken diğer balonların sürüklemesi yok sayılır (shapetris "ilk parmak kazanır" emsali) | UC-2 | ✅ |
| K26 | Süzülme düz dikey (D8); salınım/görsel zenginlik UC-5'e ertelenir | UC-2/UC-5 | ✅ |
| K27 | Layout (D9): `model/layout.ts#calculateLayout(viewport) → LayoutMetrics` saf fonksiyon; slot kolonu + balon alanı + HUD rezervi; phoneArea ≤480px, tek dikey oryantasyon (shapetris S14 deseni) | UC-2 | ✅ |
| K28 | Particle yaklaşımı: game7 tool YAZMAZ — `@bulmacanya/game-fx` (zero-dep çekirdek) + `@bulmacanya/game-fx-pixi` (adapter) TÜKETİR ([FAZ-GAME-FX-SPEC](docs/FAZ-GAME-FX-SPEC.md)). Pixi v8'de dominant particle kütüphanesi YOK (araştırma 2026-11-07); tam emitter ihtiyacında pixi-v8-particles (FAZ-GAME-FX-SPEC A1) | UC-5 | ✅ |
| K29 | Juice efekt seti v1 (E1-E7): E1 balon patlaması (kazanç), E2 yanlış geri sekme, E3 snap pufu, E4 doğru harf ışıltısı, E5 kelime zaferi burst + ekran sarsıntısı, E6 Dedektif sinyal glow, E7 hak/can kaybı kırmızı flash. E8 sürükleme izi İLERİ İŞ | UC-5 | ✅ |
| K30 | Particle grafikleri programatik üretilir — `@bulmacanya/game-fx` FxGeometri + `game-fx-pixi` FxAtlas (TEK TextureSource); elle çizim yalnız 29 harf balonu + arka plan (A4/P-6). Sonradan elle PNG'ler aynı atlas slotlarına takılır — kod DEĞİŞMEZ (shapetris S10 emsali) | UC-5/UC-6 | ✅ |
| K31 | Ses programatik WebAudio — `@bulmacanya/game-fx` FxAudio (pop/tık/arpej/boop, asset YOK); ilk dokunuşta audio unlock + mute toggle (UC-6); gerçek ses dosyaları sonra aynı arayüze takılır (A5 kapanışı) | UC-5 | ✅ |
| K32 | HUD kapsamı: oyun-içi HUD modülde (DOM katmanı, Ionic — shapetris ShapetrisRoot/K14 emsali): skor, süre (Klasik), hak/can (Dedektif/Sabit), hedef göstergesi (kelime/çizgi/desen), "Kontrol Et" (Dedektif/Sabit), ipucu butonu, mute. MENÜ/hub/navigasyon YOK — bulmacanya'nın (apps/app) işi (UC-7) | UC-6 | ✅ |
| K33 | Grafik varlık seti (A4 kapanışı): 29 TR harf balonu — 26 eski (A-Z) + 6 yeni (Ç,Ğ,İ,Ö,Ş,Ü) eski stile birebir uyumlu, oran ~4:5 (genişlik:yükseklik), şeffaf arka plan; TEK arka plan görseli (gökyüzü/doku, mod bazlı tonlama kodla — tint); kart ikonu balon görselinden TÜRETİLİR (ayrı çizim YOK) | UC-6 | ✅ |
| K34 | HUD ikonları Ionicons'tan (ampul/kum saati/kalp/kilit/hoparlör — asset çizimi YOK); slot çerçevesi, hedef çizgileri, sinyal renkleri programatik (CSS/renk overlay); particle'lar game-fx'ten (K28/K30) | UC-6 | ✅ |
| K35 | Mod kilitleri: üç mod BAŞTAN AÇIK — hub'da 3 kart, modlar arası kilit YOK; yalnız tier kilitleri var (kolay→orta→zor, UC-4 FR-4.7) ve Uzman tier (K15) | UC-7 | ✅ |
| K36 | İlk oyun dersi: TEK ortak 3 adımlı atlanabilir overlay (sürükle → yuvaya bırak → kontrol/sinyal); mod başına ders YOK; bir kez gösterilir — `tutorialDone` bayrağı hub/localStorage'da (shapetris K18/UC-13 emsali) | UC-7 | ✅ |

---

## 3. Mevcut Durum / Referans Analizi

### 3.1 Eski oyun bulguları (kaynak: game7-master)

| Kod | Bulgu | Kanıt |
| :-- | :---- | :---- |
| B1 | 26 balon, harf başına TEK kopya — `SEVEN` (2×E) oynanamaz; sözlükteki 2 kelimeden biri fiilen imkânsız | `static/main.js#window.onload` (alphabet.forEach → 1 Balloon) + `static/main.js#DICTIONARY` |
| B2 | Sözlük sabit 2 kelime: `GAME`, `SEVEN` (İngilizce) | `static/main.js#DICTIONARY` |
| B3 | Kelime kontrolü: slotlar `word[pos]` sözlüğünde; sıralama slot indeksine (yukarıdan aşağı) göre, yerleştirme sırasına göre DEĞİL | `static/main.js#checkWord` |
| B4 | Balon yaşam döngüsü: FREE→yükselir; tepeden çıkınca alttan RASTGELE harfle yeniden doğar (havuz/frekans yok) | `static/main.js#Balloon.move` + `static/main.js#reposition` |
| B5 | Slot mantığı: sağ kenara (x > x−step) sürüklenince `quantize(y)` ile slot'a snap; dolu slot'a yeni balon gelirse eskisi serbest kalır | `static/main.js#onDragMove` + `static/main.js#quantize` |
| B6 | Geri bildirim YOK: doğru kelimede balonlar sessizce serbest kalır — skor, animasyon, ses yok | `static/main.js#checkWord` |
| B7 | Skor/seviye/süre/yaşam/HUD YOK; kazan-kaybet koşulu YOK | `static/main.js` dosya geneli |
| B8 | Cordova config önceki oyundan kalma: widget adı "Shapetris", id `com.deadbeef.game3`; AdMob plugin tanımlı ama kodda tetikleyici YOK | `cordova-config/config.xml` |
| B9 | `pixi-multistyle-text` yükleniyor ama kullanılmıyor (ölü bağımlılık) | `static/main.html` |
| B10 | Çalıştırma: Express 8000 portunda statik dosya sunumu; oyun tek vanilla JS dosyası (131 satır, global state, sınıf yok) | `index.js`, `static/main.js` |

### 3.2 Hedef sistem (bulmacanya)

| Kod | Bulgu | Kanıt |
| :-- | :---- | :---- |
| B11 | Shell kontratı `IGameModule` + `GameEventMap` (score/levelCompleted/hintRequested/adRequested/saveRequested); durum makinesi idle→initialized→running⇄paused→stopped | `packages/shared/src/contracts/game-module.ts#IGameModule` |
| B12 | `apps/games` paketi gerçek modül paketi: şu an yalnız `./shapetris` export'u; `@pixi/react@8` + pixi 8 kurulu | `apps/games/package.json#exports` |
| B13 | Shapetris entegrasyonu emsal: model/ui ayrımı, purity lint, hintHost enjeksiyonu, hub sayfası deseni | `docs/FAZ-SHAPETRIS-ENTEGRASYONU-SPEC.md` |
| B14 | README §2 "Kelime" ürünü: zeka+hafıza skill katsayıları (0.8/0.6/0.3/0.1/0.1/0.4), ipucu maliyeti 1-2 coin | `README.md#§2` + `README.md#§7.3.2` |

---

## 4. Mimari

### 4.1 Modül yapısı (apps/games/src/game7)

```
apps/games/src/game7/
├── index.ts                 # default export: IGameModule (Game7Module) + Game7Options
├── model/                   # SAF — Pixi/React bağımlılığı YOK (unit test)
│   ├── words.ts             # TR kelime listeleri (tier'lı) + candidatesFor/wordsMatching
│   ├── letter-pool.ts       # buildLetterPool(hedefSet, mode, …) + ağırlıklı çekim
│   ├── patterns.ts          # buildPattern + patternMatch (seed'li)
│   ├── word-check.ts        # checkSlotWord (3 kural) + dedektifSinyal
│   ├── slots.ts             # SlotBoard + yerleştirme/çıkarma kuralları
│   ├── balloons.ts          # balon durum makinesi + spawn/respawn + kapasite (14)
│   ├── layout.ts            # calculateLayout(viewport) → LayoutMetrics (K27)
│   ├── scoring.ts           # mod bazlı skor + ipucu kesintisi + toplam
│   ├── progression.ts       # tier parametre tabloları + kilit/checkpoint (K16)
│   └── module-state.ts      # GameModuleState makinesi + event yayını (kontrat)
├── ui/                      # PIXI + DOM — yalnız sunum
│   ├── Game7Stage.tsx       # @pixi/react Stage + balon/slot katmanları + sürükleme
│   ├── hud.tsx              # oyun-içi HUD + modallar + ders overlay (K32/K36)
│   ├── fx.ts                # game-fx bağlama — efekt tetikleyicileri (UC-5)
│   ├── atlas.ts             # varlık manifest'i — 29 balon + arka plan (K33)
│   └── strings.ts           # TR UI metinleri (games paketi app i18n'ine bağımlı değil)
└── assets/                  # 29 balon PNG + arka plan (kullanıcı çizimi — K33)
```

### 4.2 Shell bağlantısı

```
HomePage → registerGame("game7", loader)  (app başlangıcında bir kez)
tıklama → loadGame("game7") → init → start
modül ──score/levelCompleted/hintRequested/saveRequested──► shell (GameEventMap)
shell ──(hintType sonucu: coin/reklam onayı)──► modüle dönüş (hintHost enjeksiyonu)
```

> DİKKAT: `IGameModule` kontratında "ipucu onayı" taşıyan metot YOKTUR (shapetris A3 ile aynı). En az invaziv çözüm: `Game7Options`'a opsiyonel `Game7HintHost { grant(hintType): Promise<boolean> }` enjeksiyonu — kontrat GENİŞLETİLMEZ. App tarafı geçici host: her zaman onay (shell ekonomisi FAZ-1'de — shapetris S6 shortcut emsali).

### 4.3 Mod parametreleri

```ts
type Game7Mode = "klasik" | "dedektif" | "sabit";   // K12
interface Game7Options {
  mode: Game7Mode;
  tier: "kolay" | "orta" | "zor" | "uzman";         // K15/K16
  levelNo?: number;                                  // checkpoint'ten devam
  hintHost?: Game7HintHost;                          // A3 deseni
}
```

---

## 5. Purity Kuralları

1. `model/` Pixi/React/DOM API'sine dokunmaz; yalnız saf fonksiyon + veri (harf havuzu, kelime kontrolü, skor — unit test).
2. Modül dış dünyaya yalnız `IGameModule` + `GameEventMap` ile konuşur; oyun-spesifik tip (`BalloonState`, `SlotBoard`, `LetterPool`) `packages/shared`'a KONULMAZ (tek-app tipi).
3. Oyun-spesifik tip `packages/shared`'a konulmaz; `apps/games/src/game7/model/` içinde yaşar (AGENTS.md placement kuralı).
4. Asset yolları tek kaynak: `ui/atlas.ts` (veya varlık manifest'i). Başka dosyada sabit yol YOK.
5. İpucu/reklam kararı modülde ALINMAZ — `hintRequested`/`adRequested` event'i ile shell'e devredilir.
6. `@bulmacanya/game-fx` yalnız `ui/` katmanında kullanılır; `model/` game-fx import ETMEZ (FAZ-GAME-FX-SPEC K10).

---

## 6. Use Case'ler

### 6.1 UC-1 — Kelime Üretimi ve Harf Havuzu (A paketi — P-1)

**Status:** ✏️ Specified (onay bekliyor)

**Kapsam:**
- dahil: Türkçe sözlük verisi (tier'lı kelime listeleri — K15); moda göre harf havuzu üretimi — `klasik`: tek hedef kelimenin harfleri, `dedektif`: aday seti birleşimi, `sabit`: desene uyan adayların SERBEST pozisyon harfleri (K12/K14); çoğullama kuralı (max tekrar — B1 kök çözümü); çeldirici (distractor) harf politikası; balon yeniden doğumunda ağırlıklı harf seçimi; seed'li deterministik üretim (test edilebilirlik).
- hariç: kelime listesi editoryal içeriğinin kendisi (ayrı içerik görevi — K15/T-x); seviye/skor akışı (UC-4); TR harf görselleri (P-6 grafik planı).

**Akış:**
1. Seviye açılır → moda göre hedef-set kurulur: `klasik` → 1 kelime; `dedektif` → `candidatesFor(kategori, uzunluk, tier)` aday seti; `sabit` → desene uyan kelimeler (desen UC-3'ten gelir).
2. `buildLetterPool(hedefSet, mode, distractorRatio, rng)` her adayın (sabit modda yalnız SERBEST pozisyonlarının) harf frekansını biriktirir: havuz sayısı = aday başına o harfin max tekrarı (SEVEN → E×2 garantisi).
3. Çeldiriciler eklenir: hedefte olmayan harflerden kontrollü oranda (başlangıç oranı — tune edilir).
4. Balonlar havuz dağılımından üretilir; `reposition` (yeniden doğum) da aynı ağırlık tablosundan çeker (B4'ün yerine).
5. RNG seed parametresiyle enjekte edilir → aynı seviye+seed aynı havuzu üretir.

**Gereksinimler (FR-1):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-1.1 | Havuzda her harfin sayısı, hedef-set'teki HİÇBİR aday kelimeyi imkânsız bırakmaz: sayı ≥ max(aday içindeki tekrar); sabit modda yalnız serbest pozisyonlar hesaba katılır | AK-1.1 |
| FR-1.2 | Çeldirici harfler yalnız hedefte olmayan harflerden; oranı parametriktir (başlangıç: %30 — tune edilir) | AK-1.2 |
| FR-1.3 | Balon yeniden doğumu havuz ağırlık dağılımına göre yapılır (B4 davranışı değişir) | AK-1.3 |
| FR-1.4 | Üretim seed'li ve deterministiktir (aynı girdi → aynı havuz) | AK-1.4 |
| FR-1.5 | Kelime listesi TR; alfabe 29 harf (Ç,Ğ,İ,Ö,Ş,Ü dahil) | AK-1.5 |
| FR-1.6 | Havuz üretimi `mode` parametresi alır: `klasik`/`dedektif`/`sabit` için ayrı hedef-set girdisi; bilinmeyen mod → hata | AK-1.6 |

**Kabul Senaryoları (GWT):**
1. **AK-1.1 — GIVEN** hedef-set tekrarlı harf içeriyor (SEVEN emsali) **WHEN** havuz üretilir **THEN** tekrar eden harften en az max tekrar kadar balon vardır ve her aday birebir harf seçimiyle oluşturulabilir (B1 bug'ı kapanır)
2. **AK-1.2 — GIVEN** çeldirici oranı 0.3 **WHEN** havuz üretilir **THEN** çeldirici balon sayısı ≈ toplamın %30'udur ve hedef harflerden ÇELDİRİCİ üretilmez
3. **AK-1.3 — GIVEN** bir balon tepeden çıkar **WHEN** yeniden doğar **THEN** yeni harfi havuz dağılımından çekilir (rastgele-tek-düze DEĞİL)
4. **AK-1.4 — GIVEN** aynı `(mode, hedefSet, seed)` **WHEN** iki kez üretilir **THEN** iki havuz birebir aynıdır; farklı seed → farklı havuz
5. **AK-1.5 — GIVEN** seviye kelimeleri **WHEN** incelenir **THEN** tümü Türkçe karakter setiyle yazılabilir durumdadır (harf seti 29 TR harfini kapsar)
6. **AK-1.6 — GIVEN** `mode: "sabit"` + desene uyan adaylar **WHEN** havuz üretilir **THEN** sabit pozisyonların harfleri havuz hesabına GİRMEZ (slotlarda kilitli — UC-3); serbest pozisyonda gereken her harf adaylardan üretilir

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-1.1 | max-tekrar garantisi (tüm adaylar oynanabilir) | unit | ⬜ |
| AK-1.2 | çeldirici oranı + hedef harf dışlanması | unit | ⬜ |
| AK-1.3 | ağırlıklı yeniden doğum | unit | ⬜ |
| AK-1.4 | seed determinizmi | unit | ⬜ |
| AK-1.5 | TR alfabe kapsamı | unit | ⬜ |
| AK-1.6 | sabit modda serbest-pozisyon kuralı | unit | ⬜ |

**T Görev Listesi:**
- [ ] T-1: `model/words.ts` — TR kelime listeleri (tier'lı) + zorluk skalası seçimi
- [ ] T-2: `model/letter-pool.ts` — `buildLetterPool(hedefSet, mode, distractorRatio, rng)` + ağırlıklı çekim
- [ ] T-3: `model/letter-pool.test.ts` — AK-1.1..1.6 (RED → GREEN)

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| Kelimede aynı harf 3+ kez (örn. "KAKAO" gibi) | Havuz sayısı max tekrarı izler; balon kıtlığı yaşanmaz |
| Çeldirici oranı 0 | Yalnız hedef harfleri — havuz saf olur (test/düşük zorluk için) |
| Tüm harfler hedefteyse (çeldirici adayı kalmadıysa) | Çeldirici üretilmez; havuz hedef harfleriyle dolar |
| Sabit modda serbest pozisyon kalmadıysa | Oluşamaz: desen üreteci en az 1 serbest pozisyon bırakır (FR-3.6) |
| Kelime listesi boş | Havuz boş döner; seviye üretimi `LEVEL_DATA_EMPTY` fırlatır (§7) |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/game7/model/words.ts` | TR kelime verisi + seviye seçimi |
| `apps/games/src/game7/model/letter-pool.ts` | Havuz üretimi + ağırlıklı çekim |
| `apps/games/src/game7/model/letter-pool.test.ts` | RED testler |

---

### 6.2 UC-2 — Yerleştirme, Slot ve Balon Yaşam Döngüsü (A paketi — P-3)

**Status:** ✏️ Specified (onay bekliyor)

**Kapsam:**
- dahil: `SlotBoard` (N slot, kilit bayraklı — Sabit mod); balon durumları (FREE/DRAG/SET) ve yaşam döngüsü (süzülme → tepe çıkışı → havuzdan yeniden doğum); snap kuralları (en yakın slot + yerinden etme — K22); Klasik per-slot doğrulama (K23); kilitli slot reddi (Sabit — FR-3.4'ün mekanik yanı); tek aktif sürükleme kilidi (K25); sabit 14 balon kapasitesi (K20); responsive layout (`model/layout.ts` — K27).
- hariç: kelime kontrolü ve sinyal (UC-3); skor/hak-can sayaçları (UC-4); animasyon/tween/partikül (UC-5); HUD DOM katmanı ve "Kontrol Et" butonunun kendisi (UC-6); pixi sahnesi/event bağlama (P-7 — ui katmanı).

**Akış:**
1. `init`: `calculateLayout(viewport)` ile slot kolonu + balon alanı hesaplanır; `SlotBoard` N slot ile kurulur (Sabit'te desenin sabit harfleri kilitli slotlara yerleşir — UC-3).
2. Havuz dağılımından 14 balon spawn edilir (K20); FREE durumda düz dikey yukarı süzülürler (K26).
3. Oyuncu balona dokunur → tek-parmak kilidi alınır (K25) → DRAG; balon üst katmana çıkar.
4. Bırakma — slot kolonu üzerindeyse en yakın slot hesaplanır (K22):
   - kilitli slot → RED (balon FREE döner, geri sekme);
   - Klasik: balon harfi slotun beklenen harfine uymuyorsa → RED (geri sekme — K23);
   - slot doluysa → eski balon FREE döner, HARFİNİ KORUR (K21), yeni balon SET;
   - aksi halde → SET (slot koordinatına oturur).
5. Slot değişimi → UC-3 kontrolü (Klasik otomatik; Dedektif/Sabit "Kontrol Et" teslimiyle — K23).
6. SET balona tekrar dokunulursa yuvadan çıkar, FREE döner (harf korunur — K21).
7. Tepeyi geçen FREE balon havuz dağılımından yeniden doğar (altta, yeni harf olabilir — FR-1.3).
8. Restart: slotlar boşalır, kilitler yeniden kurulur (Sabit deseni korunur), balonlar yeni seed ile yeniden spawn edilir (K24).

**Gereksinimler (FR-2):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-2.1 | Slot sayısı = hedef kelime uzunluğu N; slotlar sağ kolonda dikey ortalanmış, HUD göstergeleriyle hizalı (K19) | AK-2.1 |
| FR-2.2 | Ekranda sabit 14 balon; aynı harften 2+ balon eşzamanlı uçabilir (K20) | AK-2.2 |
| FR-2.3 | FREE balon düz dikey yukarı süzülür; tepeyi geçince havuz dağılımından yeniden doğar (K26) | AK-2.3 |
| FR-2.4 | Snap = en yakın slot; dolu slotta eski balon FREE döner ve harfini KORUR (K21/K22) | AK-2.4 |
| FR-2.5 | Klasik'te yalnız slotun beklenen harfiyle eşleşen balon oturur; uymayan geri seker (K23) | AK-2.5 |
| FR-2.6 | Kilitli slot (Sabit) tüm balonları reddeder; kilitli harf yerinde kalır | AK-2.6 |
| FR-2.7 | Tek aktif sürükleme: bir balon DRAG'dayken diğerlerinin sürüklemesi yok sayılır (K25) | AK-2.7 |
| FR-2.8 | SET balon dokununca yuvadan çıkar, FREE döner; harfi değişmez (K21) | AK-2.8 |
| FR-2.9 | Layout saf fonksiyonla hesaplanır; viewport değişince yeniden hesap; canvas dışına taşma YOK (K27) | AK-2.9 |

**Kabul Senaryoları (GWT):**
1. **AK-2.1 — GIVEN** hedef "KEDİ" (N=4) **WHEN** slot kurulur **THEN** 4 slot sağ kolonda dikey ortalanır ve HUD göstergeleriyle aynı hizadadır
2. **AK-2.2 — GIVEN** havuz E×2 içeriyor **WHEN** balonlar spawn edilir **THEN** iki E balonu aynı anda uçabilir; toplam ekran balonu 14'ü aşmaz
3. **AK-2.3 — GIVEN** FREE balon tepeyi geçer **WHEN** yeniden doğar **THEN** ekran altında, havuz dağılımından çekilen harfle belirir
4. **AK-2.4 — GIVEN** slot 1'de E balonu SET **WHEN** K balonu slot 1'e bırakılır **THEN** K oturur, E serbest döner ve harfi "E" kalır
5. **AK-2.5 — GIVEN** Klasik mod, slot 0 "K" bekliyor **WHEN** "A" balonu slot 0'a bırakılır **THEN** RED: balon oturmaz, geri seker, slot boş kalır
6. **AK-2.6 — GIVEN** Sabit mod, slot 2 kilitli ("D") **WHEN** balon oraya bırakılır **THEN** RED: oturmaz, kilitli harf yerinde kalır
7. **AK-2.7 — GIVEN** balon A DRAG'da **WHEN** balon B'ye dokunulur **THEN** B sürüklenmez (tek aktif sürükleme)
8. **AK-2.8 — GIVEN** SET balon ("K") **WHEN** dokunulur **THEN** yuvadan çıkar, serbest süzülür, harfi "K" kalır
9. **AK-2.9 — GIVEN** 390×844 viewport **WHEN** layout hesaplanır **THEN** slot kolonu + balon alanı + HUD rezervi canvas içindedir (taşma/negatif yok); resize'da yeniden hesaplanır

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-2.1 | N slot hizalaması | unit | ⬜ |
| AK-2.2 | 14 kapasite + çift harf | unit | ⬜ |
| AK-2.3 | yeniden doğum dağılımı | unit | ⬜ |
| AK-2.4 | snap + yerinden etme + harf koruma | unit | ⬜ |
| AK-2.5 | Klasik per-slot doğrulama | unit | ⬜ |
| AK-2.6 | kilitli slot reddi | unit | ⬜ |
| AK-2.7 | tek aktif sürükleme | unit | ⬜ |
| AK-2.8 | SET'ten çıkarma | unit | ⬜ |
| AK-2.9 | layout taşmasızlığı (çoklu viewport) | unit | ⬜ |

**T Görev Listesi:**
- [ ] T-11: `model/slots.ts` — `SlotBoard` (N slot, kilit, yerleştirme/çıkarma kuralları — saf)
- [ ] T-12: `model/balloons.ts` — balon durum makinesi (FREE/DRAG/SET) + spawn/respawn + kapasite (saf)
- [ ] T-13: `model/layout.ts` — `calculateLayout(viewport) → LayoutMetrics` (K27)
- [ ] T-14: `model/slots.test.ts` + `balloons.test.ts` + `layout.test.ts` (RED → GREEN)

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| Bırakma iki slot arasında | En yakına yuvarlanır; eşit uzaklıkta üstteki slot (eski `quantize` davranışı) |
| DRAG sırasında pause/restart | Sürükleme iptal olur; balon FREE döner |
| Klasik'te çift harf (KAKAO) | Harf eşleşmesi yeterli — iki K balonu birbirinin yerine oturabilir (slot id'si değil, harf belirleyicidir) |
| Restart'ta Sabit deseni | KORUNUR (aynı bölüm); yalnız balon dağılımı yeni seed ile yenilenir (K24) |
| Çok küçük viewport | `step` alt sınırı 8px (shapetris emsali); altında oynanamaz uyarısı |
| Slot kolonu dışına bırakma | Balon FREE döner; bırakıldığı noktadan süzülmeye devam eder (eski davranış) |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/game7/model/slots.ts` | SlotBoard + yerleştirme kuralları |
| `apps/games/src/game7/model/balloons.ts` | Balon yaşam döngüsü |
| `apps/games/src/game7/model/layout.ts` | Responsive layout |
| `apps/games/src/game7/ui/*` (P-7'de) | Sürükleme bağlama + render |

### 6.3 UC-3 — Kelime Kontrolü ve Mod Kuralları (A paketi — P-2)

**Status:** ✏️ Specified (onay bekliyor)

**Kapsam:**
- dahil: slot okumasından kelime üretimi (boş slot sıkıştırmalı — eski `checkWord` davranışı); üç modun kazanç kuralı (K12): klasik = birebir hedef; dedektif = aday seti üyeliği (K13); sabit = desen + sözlük geçerliliği (K14); sabit harf slot kilidi; aday seti üretimi (`candidatesFor`); algoritmik desen üreteci (seed'li); Dedektif yanlış kelimede harf sinyali (K17); kazançta slot serbest bırakma + patlama bildirimi (animasyon UC-5'te).
- hariç: slot yerleştirme/snap mekaniği (UC-2); skor formülü, hak/can sayaçları ve event şemaları (UC-4); patlama animasyonu (UC-5); seviye seçimi/tier ilerlemesi (UC-4).

**Akış:**
1. Mod başlarken hedef-set kurulur: `klasik` → `pickWord(tier)`; `dedektif` → `candidatesFor(kategori, uzunluk, tier)`; `sabit` → `buildPattern(word, rng)` + `wordsMatching(pattern, tier)`.
2. Sabit modda desenin sabit harfleri ilgili slotlara kilitli yerleşir (FR-3.4).
3. Oyuncu balonları slotlara yerleştirir (UC-2); her yerleştirme/değişiklik sonrası `checkSlotWord(slots, mode, hedefSet)` çağrılır (eski `main.js#checkWord` karşılığı).
4. Kural eşleşirse kazanç: slotlar serbest kalır, patlama bildirimi UC-5'e devredilir.
5. Dedektif'te tam dolmuş satır eşleşmezse: 1 hak düşer (UC-4) ve harf sinyali üretilir (K17) — oyuncu sinyalle yeniden dener.

**Gereksinimler (FR-3):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-3.1 | Klasik kazanç: slot kelimesi == hedef kelime; okuma boş slotları sıkıştırır (yukarıdan aşağı sıra korunur) | AK-3.1 |
| FR-3.2 | Dedektif kazanç: slot kelimesi ∈ aday seti (kategori+uzunluk tutan geçerli kelime); tek gizli hedef YOK (K13) | AK-3.2 |
| FR-3.3 | Sabit kazanç: sabit pozisyonlar desenle birebir eşleşir VE tam kelime tier sözlüğünde geçerlidir | AK-3.3 |
| FR-3.4 | Sabit harfler kilitli slotlardır: oyuncu taşıyamaz/değiştiremez; kelime okumasına dahildir | AK-3.4 |
| FR-3.5 | Kazançta tüm slotlar serbest kalır ve patlama bildirimi yayınlanır (görsel iş UC-5) | AK-3.5 |
| FR-3.6 | Desen üreteci: kelime harflerinin %30-50'sini sabitler (seed'li); en az 1 serbest pozisyon kalır (K14) | AK-3.6 |
| FR-3.7 | Aday seti boşsa (kategori+uzunluk ya da desen eşleşmesi yoksa) `LEVEL_DATA_EMPTY` fırlatılır (§7) | AK-3.7 |
| FR-3.8 | Dedektif sinyali aday seti bazlı + durumsuzdur: YOK = hiçbir adayda o pozisyonda olamaz; VAR = en az bir adayda olabilir ama kesin değil; YERİNDE = tüm adaylarda o pozisyonda aynı harf. Zor tier'da YERİNDE yok (2 durum) — K17 | AK-3.8 |

**Kabul Senaryoları (GWT):**
1. **AK-3.1 — GIVEN** klasik mod, hedef "KEDİ" **WHEN** slotlar yukarıdan aşağı K-E-D-İ okur **THEN** kazanç ilan edilir; "EKİD" okunursa kazanç YOK
2. **AK-3.2 — GIVEN** dedektif mod, kategori "HAYVAN", uzunluk 4, aday seti {KEDİ, KUZU, EŞEK...} **WHEN** slotlar KUZU okur **THEN** kazanç (tek hedef yoktu — setteki herhangi kelime kazanır)
3. **AK-3.3 — GIVEN** sabit mod, desen K _ _ İ **WHEN** slotlar K-A-L-İ okur ve "KALİ" tier sözlüğündeyse **THEN** kazanç; sözlükte değilse kazanç YOK
4. **AK-3.4 — GIVEN** sabit mod kuruldu **WHEN** oyuncu sabit harf slotuna balon sürükler **THEN** yerleştirme REDDEDİLİR, kilitli harf yerinde kalır
5. **AK-3.5 — GIVEN** kazanç kuralı eşleşir **WHEN** kontrol döner **THEN** slotlar boşalır ve patlama bildirimi yayınlanır
6. **AK-3.6 — GIVEN** 6 harfli kelime + seed **WHEN** desen üretilir **THEN** sabit sayısı 2-3 (%30-50 arası) ve serbest pozisyon ≥1; aynı seed aynı deseni üretir
7. **AK-3.7 — GIVEN** kategori+uzunluk kombinasyonunda kelime yok **WHEN** aday seti istenir **THEN** `LEVEL_DATA_EMPTY` fırlar
8. **AK-3.8 — GIVEN** dedektif, aday seti {KEDİ, KADİ, KODU}, yanlış kelime "KAZİ" **WHEN** sinyal üretilir **THEN** K→YERİNDE (1. pozisyonda tüm adaylar K), A→VAR (2. pozisyonda E/A/O — A bazılarında), Z→YOK (3. pozisyonda tüm adaylar D), İ→VAR (4. pozisyonda İ/İ/U); zor tier'da yalnız YOK/VAR döner

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-3.1 | klasik kazanç + sıkıştırmalı okuma | unit | ⬜ |
| AK-3.2 | dedektif çoklu aday | unit | ⬜ |
| AK-3.3 | sabit desen + sözlük geçerliliği | unit | ⬜ |
| AK-3.4 | kilitli slot | unit | ⬜ |
| AK-3.5 | kazanç temizliği + bildirim | unit | ⬜ |
| AK-3.6 | desen üreteci determinizmi + oran | unit | ⬜ |
| AK-3.7 | boş aday seti hatası | unit | ⬜ |
| AK-3.8 | dedektif sinyali (3/2 durum) | unit | ⬜ |

**T Görev Listesi:**
- [ ] T-4: `model/patterns.ts` — `buildPattern(word, rng)` + `patternMatch` (seed'li)
- [ ] T-5: `model/word-check.ts` — `checkSlotWord(slots, mode, hedefSet)` üç kural + `dedektifSinyal(harfler, adaySeti, tier)`
- [ ] T-6: `model/words.ts#candidatesFor(kategori, uzunluk, tier)` + `wordsMatching(pattern, tier)`
- [ ] T-7: `model/word-check.test.ts` + `model/patterns.test.ts` (RED → GREEN)

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| Slotlarda boşluk var (arada boş slot) | Okuma boş slotları sıkıştırır (eski `checkWord`: `if (word[i])`) — boş slot okumayı bölmez |
| Dedektif: desene uyan kelime birden çok | Hepsi kazançtır (çoklu aday ruhu — K13 uyumu) |
| Sabit: tüm pozisyonlar dolu ama kelime geçersiz | Kazanç YOK; oyuncu balonları geri çekip yeniden dener (hata bedeli UC-2/K6'da netleşir) |
| Sabit desen kısa kelimede (3 harf) | %30-50 aralığı 1 sabit harfe karşılık gelir; en az 1 serbest pozisyon kuralı korunur |
| Dedektif: sinyal sonrası kazanç kuralı | DEĞİŞMEZ — kazanç orijinal aday setinde (K13); sinyal bilgi verir, seti daraltmaz (durumsuz — K17) |
| Eski `word[pos]` çakışması: aynı slota iki balon | Yeni modelde slot TEK balon alır (id izlemeli — K5); gelen balon eskisini serbest bırakır (eski davranış — B5) |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/game7/model/patterns.ts` | Desen üreteci |
| `apps/games/src/game7/model/word-check.ts` | Üç modun kazanç kuralı |
| `apps/games/src/game7/model/words.ts` | Aday seti sorguları |
| `apps/games/src/game7/model/slots.ts` (UC-2'de) | SlotBoard okuması |

---

### 6.4 UC-4 — Seviye, Skor ve Kazan/Kaybet (A paketi — P-4)

**Status:** ✏️ Specified (onay bekliyor)

**Kapsam:**
- dahil: mod bazlı sınırlar (K7) — Klasik: bölüm süresi; Dedektif: yanlış kelime hakkı; Sabit: can; tier parametre tabloları (K16 — tek kaynak `model/progression.ts`); bölüm geçme mantığı (kazanç koşulları + fail/restart); skor formülü (mod ağırlıklı + hız bonusu + ipucu kesintisi); `score`/`levelCompleted`/`saveRequested` event şemaları; tier kilitleri + Uzman açılımı (K15).
- hariç: slot/balon mekaniği (UC-2); kelime kontrolü ve sinyal (UC-3); HUD gösterimi (UC-6); shell'in coin/reklam kararı ve kalıcılığı (modül payload üretir, saklamaz — shapetris K21 emsali).

**Akış:**
1. Bölüm başlar: `progression.ts` tablosundan mod+tier parametreleri okunur (süre/hak/can, uzunluk, çeldirici, hız...).
2. Klasik: süre sayacı kurulur (pause'ta donar). Dedektif/Sabit: hak/can sayacı kurulur.
3. Kazanç (UC-3'ten gelir): Klasik'te N kelime (2/3/4) tamamlanınca; Dedektif/Sabit'te 1 kelime çözülünce bölüm biter → skor hesaplanır, `score` + `levelCompleted {levelId}` yayınlanır, checkpoint `saveRequested` gönderilir.
4. Fail: sınır bitince (süre/hak/can) → fail bildirimi + kurtarma teklifi (`game7.sure-ekle` / `game7.hak-iade` — shell kararı); ret → aynı bölüm restart (toplam skor KORUNUR, sınır sayaçları ve ipucu sayacı sıfırlanır).
5. Tier ilerlemesi: tier'da 10 bölüm geçilince sonraki tier kilidi açılır (kolay→orta→zor); Uzman (Klasik+Sabit) Zor bitince açılır (K15).

**Gereksinimler (FR-4):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-4.1 | Klasik sınır = bölüm süresi (K16 tablosu); süre bitince fail ilan edilir | AK-4.1 |
| FR-4.2 | Dedektif sınır = hak (3/3/2); yanlış tam kelime → 1 hak; hak bitince fail | AK-4.2 |
| FR-4.3 | Sabit sınır = can (3/2/2); geçersiz tam kelime → 1 can; can bitince fail | AK-4.3 |
| FR-4.4 | Kazanç: Klasik N kelime (2/3/4); Dedektif/Sabit 1 kelime → `levelCompleted` | AK-4.4 |
| FR-4.5 | Skor: Klasik kelime = uzunluk×10 + bölüm sonu bonusu kalan saniye×5; Dedektif/Sabit = uzunluk×20 + kalan hak/can×15; her ipucu kullanımı bölüm skorundan 10 düşer (alt sınır 1); toplam birikir (başlangıç değerleri — tune edilir) | AK-4.5 |
| FR-4.6 | `score` {total} ve `levelCompleted {levelId: "game7.<mode>.<tier>.<levelNo>"}` yayınlanır; `saveRequested` payload `{mode, tier, levelNo, totalScore, completed}` | AK-4.6 |
| FR-4.7 | Tier kilitleri: kolay açık; orta kolay bitince, zor orta bitince; Uzman (Klasik+Sabit) Zor bitince (K15). Tier = 10 bölüm (başlangıç değeri — tune edilir) | AK-4.7 |
| FR-4.8 | Parametreler tek kaynaktan (`model/progression.ts`) okunur; dağınık sabit sayı YOK | AK-4.8 |

**Kabul Senaryoları (GWT):**
1. **AK-4.1 — GIVEN** Klasik kolay (90s) **WHEN** süre 0'a iner **THEN** fail ilan edilir; restart'ta toplam skor korunur ve süre yeniden 90s kurulur
2. **AK-4.2 — GIVEN** Dedektif 3 hak **WHEN** 3. yanlış tam kelime kontrol edilir **THEN** fail ilan edilir
3. **AK-4.3 — GIVEN** Sabit 2 can **WHEN** 2. geçersiz tam kelime kontrol edilir **THEN** fail ilan edilir
4. **AK-4.4 — GIVEN** Klasik zor (4 kelime) **WHEN** 4. kelime tamamlanır **THEN** `levelCompleted` yayınlanır; Dedektif/Sabit'te 1 kelime yeterlidir
5. **AK-4.5 — GIVEN** Dedektif'te 5 harfli kelime 2 hakla çözüldü, 1 ipucu kullanıldı **WHEN** skor hesaplanır **THEN** bölüm skoru = 5×20 + 2×15 − 10 = 120; toplama eklenir
6. **AK-4.6 — GIVEN** bölüm biter **WHEN** event yayınlanır **THEN** `levelId = game7.klasik.kolay.3` biçimindedir ve `saveRequested` payload şemaya uyar
7. **AK-4.7 — GIVEN** kolay tier'da 10 bölüm geçildi **WHEN** checkpoint okunur **THEN** orta kilidi açılır; Uzman yalnız Klasik+Sabit Zor'u bitince açılır
8. **AK-4.8 — GIVEN** tier değişir **WHEN** parametreler okunur **THEN** değerler `progression.ts` tablosundan gelir (kodda sabit yok)

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-4.1 | Klasik süre + restart davranışı | unit | ⬜ |
| AK-4.2 | Dedektif hak sayacı | unit | ⬜ |
| AK-4.3 | Sabit can sayacı | unit | ⬜ |
| AK-4.4 | kazanç koşulları | unit | ⬜ |
| AK-4.5 | skor formülü (mod ağırlıkları + ipucu kesintisi) | unit | ⬜ |
| AK-4.6 | event şemaları | unit | ⬜ |
| AK-4.7 | tier kilitleri + Uzman açılımı | unit | ⬜ |
| AK-4.8 | tek kaynak parametre tablosu | unit | ⬜ |

**T Görev Listesi:**
- [ ] T-8: `model/scoring.ts` — mod bazlı skor + ipucu kesintisi + toplam
- [ ] T-9: `model/progression.ts` — tier parametre tabloları + kilit/checkpoint durumu
- [ ] T-10: `model/scoring.test.ts` + `model/progression.test.ts` (RED → GREEN)

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| Süre bitimi ile zafer aynı anda | Zafer önceliklidir (shapetris emsali) |
| Hak/can bitimi ile geçerli kelime aynı anda | Kazanç önceliklidir |
| Fail'de skor hesabı | Bonus hesaplanmaz; fail'de `score` yayını YOK (yalnız fail bildirimi + kurtarma teklifi) |
| Restart sonrası ipucu sayacı | Sıfırlanır (bölüme özgüdür) |
| 10. bölüm sonrası aynı tier | Oynamaya devam edilebilir; kilit zaten açıktır |
| Uzman tier'da Dedektif | YOK (K15 — kategori kürasyonu gerektirir) |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/game7/model/scoring.ts` | Skor formülü |
| `apps/games/src/game7/model/progression.ts` | Tier parametreleri + kilit/checkpoint |
| `apps/games/src/game7/index.ts` (P-7'de) | Süre/hak-can sayaçları + event yayını |

### 6.5 UC-5 — Juice / Oyun Hissi (B paketi — P-5)

**Status:** ✏️ Specified (onay bekliyor)

**Kapsam:**
- dahil: 7 efekt (E1-E7 — K29); `@bulmacanya/game-fx` + `@bulmacanya/game-fx-pixi` tüketimi ve bağlama katmanı (`ui/fx.ts` — efekt tetikleyicileri); pixi v8 tween desenleri (shapetris UC-9 emsali); ekran sarsıntısı (`game-fx/shake`); efekt tetikleyicilerinin UC-2/UC-3/UC-4 olaylarına bağlanması.
- hariç: tool GELİŞTİRME (particles/fx-atlas/audio pakette — FAZ-GAME-FX-SPEC); E8 sürükleme izi (ileri iş); elle çizilmiş particle PNG'leri (K30 — sonradan takılabilir); müzik/loop ambiyans; HUD'un kendisi (UC-6 — mute butonu orada); model katmanına efekt kodu (YASAK — purity).

**Akış:**
1. `init`: fx atlası programatik üretilir (Graphics → generateTexture → tek atlas); particle havuzu kurulur; audio context hazırlanır (ilk dokunuşta unlock — mobil).
2. UC-2/UC-3/UC-4 olayları efektleri tetikler: SET → E3 puf + tık sesi; Klasik doğru yerleştirme → E4 ışıltı; Klasik RED → E2 geri sekme tween + toz + hata sesi; Dedektif sinyal → E6 glow (YOK gri / VAR sarı / YERİNDE yeşil — Wordle paleti); hak/can kaybı → E7 kırmızı kenar flash + sallanma + boop; kelime kazancı → E1 patlamalar + E5 zafer burst + ekran sarsıntısı (2-3px, 150ms) + arpej.
3. Burst biter → particle'lar havuza döner (sızıntı yok); pause'ta tüm efektler donar; exit'te havuz + ticker temizlenir.

**Gereksinimler (FR-5):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-5.1 | Kelime kazancında (UC-3 FR-3.5 bildirimi) balon patlaması (E1) + zafer burst (E5) + ekran sarsıntısı + zafer arpeji | AK-5.1 |
| FR-5.2 | Klasik yanlış yerleştirmede (UC-2 FR-2.5 RED) geri sekme tween + toz (E2) + hata sesi | AK-5.2 |
| FR-5.3 | Balon slota oturunca (SET) snap pufu (E3) + tık sesi | AK-5.3 |
| FR-5.4 | Klasik doğru yerleştirmede ışıltı (E4, ~300ms) | AK-5.4 |
| FR-5.5 | Dedektif sinyalinde (UC-3 FR-3.8) glow flash: YOK=gri, VAR=sarı, YERİNDE=yeşil | AK-5.5 |
| FR-5.6 | Hak/can kaybında (UC-4) kırmızı kenar flash + sallanma + boop sesi | AK-5.6 |
| FR-5.7 | Tüm particle grafikleri `@bulmacanya/game-fx` programatik atlasından; tüm sesler FxAudio'dan; game7 içinde particle/ses asset DOSYASI yok (K30/K31, FAZ-GAME-FX-SPEC) | AK-5.7 |
| FR-5.8 | Efekt kodu yalnız `ui/` katmanında; `model/` import'u YOK (SC-1); game-fx de yalnız ui'da (FAZ-GAME-FX-SPEC K10) | AK-5.8 |
| FR-5.9 | Particle havuzu sınırlı (eşzamanlı tavan ~150); burst bitince havuza dönüş — sızıntı yok | AK-5.9 |

**Kabul Senaryoları (GWT):**
1. **AK-5.1 — GIVEN** kelime kazancı **WHEN** bildirim gelir **THEN** N balon E1 patlaması + E5 burst + 2-3px ekran sarsıntısı (150ms) + arpej çalar
2. **AK-5.2 — GIVEN** Klasik RED **WHEN** balon geri seker **THEN** sekme tween + E2 toz + hata sesi; slot boş kalır
3. **AK-5.3 — GIVEN** balon SET olur **WHEN** yuvaya oturur **THEN** E3 pufu + tık sesi
4. **AK-5.4 — GIVEN** Klasik doğru harf oturur **WHEN** SET anında **THEN** E4 ışıltısı ~300ms görünür
5. **AK-5.5 — GIVEN** Dedektif sinyali YOK/VAR/YERİNDE **WHEN** glow uygulanır **THEN** sırasıyla gri/sarı/yeşil renkte flash
6. **AK-5.6 — GIVEN** hak/can düşer **WHEN** UC-4 bildirir **THEN** kırmızı kenar flash + sallanma + boop
7. **AK-5.7 — GIVEN** proje taranır **WHEN** particle/ses asset dosyası aranır **THEN** YOKTUR (hepsi kod üretimi)
8. **AK-5.8 — GIVEN** purity lint çalışır **WHEN** `ui/` incelenir **THEN** `model/`'den import YOKTUR (SC-1 korunur)
9. **AK-5.9 — GIVEN** 10 burst art arda tetiklenir **WHEN** hepsi biter **THEN** havuzda sızıntı yok (aktif particle sayısı 0'a döner, tavan aşılmaz)

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-5.1 | kazanç efekti zinciri | unit (sim) + gözle | ⬜ |
| AK-5.2 | geri sekme efekti | gözle | ⬜ |
| AK-5.3 | snap pufu | gözle | ⬜ |
| AK-5.4 | doğru harf ışıltısı | gözle | ⬜ |
| AK-5.5 | sinyal renk eşlemesi | unit (eşleme tablosu) | ⬜ |
| AK-5.6 | hak kaybı efekti | gözle | ⬜ |
| AK-5.7 | asset dosyası yokluğu | grep | ⬜ |
| AK-5.8 | ui purity | lint | ⬜ |
| AK-5.9 | havuz sızıntısı | unit (sim) | ⬜ |

**T Görev Listesi:**
- [ ] T-15: `@bulmacanya/game-fx` + `@bulmacanya/game-fx-pixi` kurulumu (bağımlılık + adapter/atlas/audio init)
- [ ] T-16: `ui/fx.ts` — efekt tetikleyici bağlama (UC-2/UC-3/UC-4 olayları → burst/ses/shake; E1-E7)
- [ ] T-17: `ui/fx.test.ts` — bağlama testleri (AK-5.5 renk eşleme, AK-5.9 havuz — game-fx mock adapter ile; RED → GREEN)

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| Pause sırasında efekt tetiklenir | Efekt ertelenir/donar (ticker pause) — oyun durumuyken efekt YOK |
| `exit` sırasında aktif burst var | Havuz + ticker temizlenir; sızıntı yok |
| Audio context henüz unlock olmamış | Sessiz no-op (ilk dokunuşta unlock — FR-5.7 ruhu) |
| Hızlı art arda kazanç (kombo) | Havuz tavanı (~150) aşılmaz; en eski particle'lar öncelikli geri dönüşür |
| Mute açık | Tüm sesler no-op; görsel efektler etkilenmez |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `@bulmacanya/game-fx` + `@bulmacanya/game-fx-pixi` | Tool paketleri (FAZ-GAME-FX-SPEC) |
| `apps/games/src/game7/ui/fx.ts` | Efekt tetikleyici bağlama |
| `apps/games/src/game7/ui/Game7Stage.tsx` (P-7'de) | Sahne + tween'ler |

### 6.6 UC-6 — Oyun-İçi HUD ve Grafik Varlık Planı (C paketi — P-6)

**Status:** ✏️ Specified (onay bekliyor)

**Kapsam:**
- dahil: oyun-içi HUD (DOM katmanı, Ionic, TR i18n — K32): skor, süre (Klasik), hak/can (Dedektif/Sabit), hedef göstergesi (kelime/çizgi/desen — moda göre), "Kontrol Et" butonu (Dedektif/Sabit), ipucu butonu (`hintRequested`), mute toggle (`FxAudio#setMuted`); bölüm sonu modalları (zafer/fail + kurtarma teklifi); varlık manifest'i (`ui/atlas.ts` — Purity 4 tek kaynak).
- hariç: MENÜ/hub/navigasyon (bulmacanya — apps/app, UC-7); coin/reklam kararı (shell — K10); asset ÇİZİMİ (kullanıcı — K33); particle/ses üretimi (game-fx — K28/K31).

**Akış:**
1. `init`: HUD DOM katmanı kurulur; `ui/atlas.ts` manifest'inden balon/arka plan varlıkları yüklenir.
2. Moda göre göstergeler bağlanır: Klasik → süre + hedef kelime; Dedektif → kategori + çizgiler + hak; Sabit → desen + can (FR-6.1).
3. Oyun olayları HUD'ı günceller: skor değişimi, hak/can düşüşü, sinyal (UC-3), bölüm sonu.
4. "Kontrol Et" → UC-3 `checkSlotWord` teslimi (yalnız tam doluyken aktif — FR-6.2).
5. İpucu butonu → `hintRequested {hintType}` yayınlanır; shell onayı beklenirken buton pasif (FR-6.3).
6. Fail anında kurtarma modalı: `game7.hak-iade` / `game7.sure-ekle` teklifi (K10) → ret → restart (UC-4).
7. `exit`: DOM katmanı temizlenir; mute bayrağı oturum boyu geçerlidir.

**Gereksinimler (FR-6):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-6.1 | HUD moda göre doğru gösterge setini gösterir (Klasik/Dedektif/Sabit) | AK-6.1 |
| FR-6.2 | "Kontrol Et" yalnız Dedektif/Sabit'te; slotlar tam dolmadan PASİF | AK-6.2 |
| FR-6.3 | İpucu butonu `hintRequested {hintType}` yayınlar; modül maliyet kararı VERMEZ (K10); onay beklerken pasif | AK-6.3 |
| FR-6.4 | Mute toggle `FxAudio#setMuted`'a bağlanır; görsel efektler etkilenmez | AK-6.4 |
| FR-6.5 | Tüm görünür metinler Türkçe (`ui/strings.ts` — games paketi app i18n'ine bağımlı değil, shapetris emsali) | AK-6.5 |
| FR-6.6 | Varlık yolları tek kaynak `ui/atlas.ts`: 29 balon + arka plan; boyut/oran manifest'te sabit (K33) | AK-6.6 |
| FR-6.7 | Modül menü/hub/navigasyon İÇERMEZ (K32) — yalnız oyun-içi katman | AK-6.7 |
| FR-6.8 | Bölüm sonu modalları: zafer (sonraki bölüm), fail + kurtarma teklifi (K10); metinler TR | AK-6.8 |

**Kabul Senaryoları (GWT):**
1. **AK-6.1 — GIVEN** mod seçilir **WHEN** HUD kurulur **THEN** Klasik'te süre+kelime, Dedektif'te kategori+çizgi+hak, Sabit'te desen+can görünür; başka modun göstergesi GÖRÜNMEZ
2. **AK-6.2 — GIVEN** Dedektif, 2/4 slot dolu **WHEN** HUD incelenir **THEN** "Kontrol Et" pasiftir; 4/4 dolunca aktif olur; Klasik'te buton YOKTUR
3. **AK-6.3 — GIVEN** kullanıcı ipucu ister **WHEN** butona dokunur **THEN** `hintRequested {hintType: game7.*}` yayınlanır; onay gelene kadar buton pasiftir
4. **AK-6.4 — GIVEN** mute açılır **WHEN** efekt tetiklenir **THEN** ses YOK, görsel efekt aynen oynar
5. **AK-6.5 — GIVEN** oyun ekranı **WHEN** incelenir **THEN** tüm metinler Türkçedir (`ui/strings.ts`)
6. **AK-6.6 — GIVEN** proje taranır **WHEN** varlık yolu aranır **THEN** tümü `ui/atlas.ts` manifest'inden gelir (dağınık sabit yol YOK)
7. **AK-6.7 — GIVEN** modül kodu **WHEN** incelenir **THEN** menü/hub/navigasyon komponenti YOKTUR
8. **AK-6.8 — GIVEN** fail **WHEN** modal açılır **THEN** kurtarma teklifi (moda göre hak-iade/sure-ekle) + "Yeniden Başla" sunulur; ret → UC-4 restart

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-6.1 | mod→gösterge eşlemesi | unit (selector) + gözle | ⬜ |
| AK-6.2 | Kontrol Et görünürlük/pasiflik | unit (selector) | ⬜ |
| AK-6.3 | ipucu akışı | unit + kod inceleme | ⬜ |
| AK-6.4 | mute davranışı | gözle | ⬜ |
| AK-6.5 | TR metinler | gözle | ⬜ |
| AK-6.6 | tek kaynak manifest | grep | ⬜ |
| AK-6.7 | menü yokluğu | kod inceleme | ⬜ |
| AK-6.8 | bölüm sonu modalları | gözle + kod inceleme | ⬜ |

**T Görev Listesi:**
- [ ] T-18: `ui/atlas.ts` — varlık manifest'i (29 balon + arka plan; boyut/oran sabitleri)
- [ ] T-19: `ui/hud.tsx` — HUD komponenti (moda göre göstergeler + Kontrol Et + ipucu + mute + modallar)
- [ ] T-20: `ui/strings.ts` — TR UI metinleri
- [ ] T-21: `ui/hud.test.ts` — mod→gösterge selector'ü + buton pasiflik kuralları (RED → GREEN)

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| Shell ipucu onayı reddeder | Buton tekrar aktif olur; oyun durumu değişmez |
| Süre göstergesi pause'ta | Donar (UC-4 FR-4.1 uyumu — sayaç modelden okunur) |
| Fail modalında exit | Modal kapanır, DOM temizlenir; kayıt yayını YOK (fail'de skor yok — UC-4) |
| Mute + audio unlock sırası | Mute önceliklidir: unlock edilse de mute'ken ses YOK (game-fx FR-3.1) |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/game7/ui/atlas.ts` | Varlık manifest'i (tek kaynak — Purity 4) |
| `apps/games/src/game7/ui/hud.tsx` | HUD + modallar (DOM katmanı) |
| `apps/games/src/game7/ui/strings.ts` | TR metinler |
| `apps/games/src/game7/assets/**` | 29 balon PNG + arka plan (kullanıcı çizimi — K33) |

### 6.7 UC-7 — Bulmacanya Entegrasyonu (P-7)

**Status:** ✏️ Specified (onay bekliyor)

**Kapsam:**
- dahil: `Game7Module`'ün `IGameModule` uygulaması + durum makinesi (idle→initialized→running⇄paused→stopped); `Game7Options` (mode/tier/levelNo/hintHost — §4.3); registerGame/loadGame akışı; hub sayfası (3 mod kartı — HEPSİ AÇIK K35 — + tier checkpoint/kilitler + Uzman göstergesi); Home kartı + i18n anahtarları; checkpoint localStorage lib'i; tek ortak ders overlay + `tutorialDone` bayrağı (K36); geçici hintHost (her zaman onay — shortcut); exit sonrası kaynak serbestliği.
- hariç: coin/reklam EKONOMİSİ (FAZ-1 shell — modül yalnız hintRequested yayınlar); oyun seçim sayfası; backend skor senkronu; Uzman tier'da Dedektif (K15 — kategori kürasyonu gerektirir).

**Akış:**
1. App başlangıcında `registerGame("game7", () => import("@bulmacanya/games/game7"))`.
2. Home → HarfGüder kartı → hub sayfası.
3. Hub: 3 mod kartı (kilit YOK — K35); her modun tier ilerlemesi gösterilir; checkpoint okunur (bozuksa varsayılan: kolay, 0).
4. Mod seçimi → `new Game7Module({mode, tier, levelNo, hintHost})` → `init` → `start`.
5. `tutorialDone` yoksa ortak ders overlay'i (3 adım, atlanabilir) → bitince bayrak yazılır.
6. İpucu: modül `hintRequested {hintType}` yayınlar → shell onayı (geçici: her zaman) → `grant` → uygulama.
7. `saveRequested` → hub checkpoint'i localStorage'a yazar.
8. Çıkış → `exit()` → Stage destroy + listener temizliği → hub/Home'a dönüş.

**Gereksinimler (FR-7):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-7.1 | `id === "game7"`; yaşam döngüsü kontratla birebir (yanlış sıra → `GameModuleError`) | AK-7.1 |
| FR-7.2 | `Game7Options` ile mod/tier/levelNo seçimi; bilinmeyen mod → hata | AK-7.2 |
| FR-7.3 | İpucu akışı `hintRequested` + hintHost enjeksiyonu; kontrat GENİŞLEMEZ | AK-7.3 |
| FR-7.4 | Hub 3 mod kartı gösterir; modlar arası kilit YOK (K35); tier kilitleri + Uzman durumu görünür | AK-7.4 |
| FR-7.5 | Checkpoint payload `{mode, tier, levelNo, totalScore, completed}` localStorage'a yazılır/okunur | AK-7.5 |
| FR-7.6 | Tek ortak ders: 3 adım, atlanabilir, bir kez — `tutorialDone` bayrağı | AK-7.6 |
| FR-7.7 | `exit` sonrası event yayılmaz; kaynaklar serbest bırakılır | AK-7.7 |
| FR-7.8 | Modül ayrı lazy chunk'ta; yükleme hatasında TR mesaj (sessiz çökme YOK) | AK-7.8 |

**Kabul Senaryoları (GWT):**
1. **AK-7.1 — GIVEN** modül yüklü **WHEN** `id` okunur **THEN** `"game7"`; `idle` iken `start()` → `NOT_INITIALIZED`; çift `init` → `WRONG_STATE`
2. **AK-7.2 — GIVEN** `mode: "bilinmeyen"` **WHEN** init edilir **THEN** hata fırlar; `mode: "dedektif"` + `tier: "uzman"` kombinasyonu reddedilir (K15)
3. **AK-7.3 — GIVEN** kullanıcı ipucu ister **WHEN** modül çalışır **THEN** `hintRequested {hintType}` yayınlanır ve uygulama hintHost `grant` sonucuna göre olur; rette buton aktif kalır
4. **AK-7.4 — GIVEN** hub açılır **WHEN** incelenir **THEN** 3 mod kartı AÇIK görünür; kolay tamamlanmadıysa orta/zor tier KİLİTLİ etiketli
5. **AK-7.5 — GIVEN** bölüm geçilir **WHEN** event yayınlanır **THEN** localStorage checkpoint güncellenir; bozuk veride varsayılan döner
6. **AK-7.6 — GIVEN** ilk oyun **WHEN** açılır **THEN** 3 adımlı overlay görünür; "Geç" ile kapanır; sonraki oyunlarda GÖRÜNMEZ
7. **AK-7.7 — GIVEN** `exit()` edildi **WHEN** event tetiklenmeye çalışılır **THEN** dinleyicilere iletilmez (sessiz)
8. **AK-7.8 — GIVEN** build edilir **WHEN** bundle incelenir **THEN** game7 ayrı chunk'ta; yükleme hatasında TR mesaj

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-7.1 | id + durum makinesi | unit | ⬜ |
| AK-7.2 | seçenek doğrulaması | unit | ⬜ |
| AK-7.3 | ipucu akışı (onay-güdümlü) | unit + kod inceleme | ⬜ |
| AK-7.4 | hub kartları + kilitler | gözle + unit (lib) | ⬜ |
| AK-7.5 | checkpoint kalıcılığı | unit (lib) | ⬜ |
| AK-7.6 | ders overlay + bayrak | gözle | ⬜ |
| AK-7.7 | exit sessizliği | unit | ⬜ |
| AK-7.8 | lazy chunk + TR hata | e2e (build çıktısı) | ⬜ |

**T Görev Listesi:**
- [ ] T-22: `model/module-state.ts` — durum makinesi + event yayını (MockGame/ShapetrisModule deseni) + testler
- [ ] T-23: `index.ts` — `Game7Module` (IGameModule + Game7Options + hintHost) + testler
- [ ] T-24: `apps/app` — hub sayfası (3 mod kartı + checkpoint/kilit lib'i)
- [ ] T-25: Home kartı + i18n anahtarları + App.tsx `registerGame` kaydı
- [ ] T-26: ders overlay + `tutorialDone` bayrağı (ui/hud.tsx + hub lib)

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| Çift tıklama (hızlı başlatma) | Yükleme kilidi — ikinci tıklama yok sayılır |
| Bozuk localStorage | Varsayılan: kolay 0; kilitler kapalı |
| `exit` sonrası `start` | `WRONG_STATE` (stopped → dönüş YOK) |
| İpucu onayı sırasında pause | İstek iptal; sayaç artmaz |
| Oyun açıkken sayfa yenilenir | Modül yeniden yüklenir; bölüm baştan (checkpoint shell'de) |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/game7/index.ts` | Game7Module + Game7Options |
| `apps/games/src/game7/model/module-state.ts` | Durum makinesi + emit |
| `apps/app/src/pages/game7-hub/**` | Hub sayfası + checkpoint/tutorial lib'i |
| `apps/app/src/pages/home/ui/HomePage.tsx` | HarfGüder kartı |
| `apps/app/src/app/App.tsx` | registerGame + geçici hintHost |
| `apps/app/src/shared/lib/i18n.ts` | `home.playGame7` anahtarı |

---

## 7. Yaşam Döngüsü ve Hata Kategorileri

> UC'ler tamamlandı (UC-1..UC-7); aşağıdaki tablo kontrat eşlemesinin özetidir.

| Durum | Davranış |
| :---- | :------- |
| idle | Modül yüklü; kaynak ayrılmadı |
| initialized | `init` bitti: sahne + varlıklar yüklendi, hedef-set/havuz üretildi |
| running | Oynanabilir; balonlar süzülür, süre/sayaç işler |
| paused | Süzülme durur; yerleştirme/ipucu isteği reddedilir |
| stopped | `exit` sonrası: sahne destroy, listener temizliği; geri dönüş YOK |

**Modül-içi hata kategorileri (kontratınkine ek):**

| Kategori | Anlam |
| :------- | :---- |
| `ASSET_LOAD_FAILED` | Varlık (balon/atlas) yüklenemedi — `init` fırlatır |
| `LEVEL_DATA_EMPTY` | Mod için aday seti/desen üretilemedi (kategori+uzunluk kombinasyonu yok ya da desene uyan kelime yok) — seviye üretimi fırlatır (FR-3.7) |

**Yan etkiler:** `init` varlık+sahne ayırır; `exit` serbest bırakır (ZORUNLU — kontrat).

---

## 8. Başarı Kriterleri (SC-x)

| Kod | Kriter | Ölçüm |
| :-- | :---- | :---- |
| SC-1 | `model/` katmanı %100 saf (Pixi/DOM import'u 0) — purity lint | `bun run scripts/check-purity.ts` |
| SC-2 | B1 bug'ı kapalı: tekrarlı harfli kelime testi (SEVEN emsali) her seviyede oynanabilir | unit (UC-1) |
| SC-3 | `bun run check` yeşil: games paketi lint/typecheck/test gerçek testlerle | CI komutu |
| SC-4 | Modül ayrı lazy chunk'ta; ana bundle'a girmez | e2e (build çıktısı) |
| SC-5 | UI metinleri %100 Türkçe; kelime listesi TR | gözle + unit |
| SC-6 | Üç modun kazanç kuralı + desen üreteci + dedektif sinyali deterministik unit pimli (AK-3.1..3.8) | unit (UC-3) |
| SC-7 | Mod bazlı sınır/skor/kilit kuralları unit pimli (AK-4.1..4.8) | unit (UC-4) |
| SC-8 | Slot/balon/layout kuralları unit pimli (AK-2.1..2.9) | unit (UC-2) |
| SC-9 | Juice tamamı ui katmanında (model purity bozulmadan — SC-1); particle havuzu sızıntısız; sinyal renk eşlemesi unit pimli (AK-5.5/5.9) | unit + lint (UC-5) |
| SC-10 | HUD moda göre göstergeler + TR metinler + tek kaynak varlık manifest'i (AK-6.1/6.2/6.5/6.6) | unit + grep (UC-6) |
| SC-11 | IGameModule birebirliği + ayrı lazy chunk + TR hata mesajı (AK-7.1..7.8) | unit + e2e (build çıktısı) |

---

## 9. Aşama Eşlemesi (iş akışı)

| Aşama | Ürün |
| :---- | :---- |
| 1. SPEC | Bu doküman (parça parça: P-1..P-7) |
| 2. JSDoc | `model/words`, `model/letter-pool`, `model/patterns`, `model/word-check`, `model/slots`, `model/balloons`, `model/layout`, `model/scoring`, `model/progression`, `model/module-state` sözleşmeleri; `ui/atlas`, `ui/hud`, `ui/fx` davranış sözleşmeleri (game-fx tool sözleşmeleri: FAZ-GAME-FX-SPEC §9) |
| 3. TEST | KIRMIZI: `apps/games/src/game7/model/*.test.ts` (havuz/slot/kelime/skor/durum) |
| 4. IMPL | T görev listesi (UC'ler netleştikçe) |
| 5. KAPANIŞ | Bu dokümanın §A/§B güncellemesi (Doğrulama + Test Kapsamı) |

---

## 10. Açık Kararlar

| # | Konu | Durum |
| :-- | :---- | :---- |
| A1 | TR kelime listesi kaynağı | KAPANDI (2026-11-07) — K15: LibreOffice TR + kürasyonlu tier'lar + Uzman açılımı; filtre/etiketleme T görevlerinde (içerik görevi) |
| A2 | Kazan/kaybet mekanizması: süre mi, hayat mı, ikisi mi (K7)? | KAPANDI (2026-11-07) — K7: Klasik = süre; Dedektif = hak 3/3/2; Sabit = can 3/2/2. Sınır modun zorluk kaynağıyla eşleşir |
| A3 | Hata bedeli: puan düşüşü mü, hayat mı (K6)? | KAPANDI (2026-11-07) — K6: Klasik'te ek ceza yok (doğal süre kaybı); Dedektif/Sabit'te yanlış tam kelime = hak/can |
| A4 | Eski 26 PNG balon görselinin kaderi: yeniden çizim mi, programatik (pixi grafik) üretim mi? TR 29 harf gereksinimi K11 | KAPANDI (2026-11-07) — K33: 6 eksik harf (Ç,Ğ,İ,Ö,Ş,Ü) eski stile birebir uyumlu çizilir; 26 eski korunur; arka plan tek görsel; kart ikonu balondan türetilir |
| A5 | Ses efektleri (patlama/snap) v1'de var mı? Shapetris'te ertelenmişti (A8 emsali) | KAPANDI (2026-11-07) — K31: programatik WebAudio synth; gerçek assetler sonra aynı arayüze |
| A6 | Oyun adı ürünleşme adı "Kelime" mi kalacak, marka adı ayrı mı? (modül ID teknik ad — K1) | KAPANDI (2026-11-07) — marka adı "**HarfGüder**"; teknik modül ID `game7` (başka kelime oyunları geleceği için genel `kelime` adı KULLANILMAZ); README §2 "Kelime" satırı kategori/tür adı olarak kalır |

---

## 11. İleri İş (bu pakette YAPILMAZ — referans)

1. Oyun seçim sayfası + modül listesi UI — `apps/app` (shapetris K10 emsali)
2. Günlük puzzle takvimi + sosyal paylaşım — ileriki SPEC
3. Reklam SDK'sı (AdMob) shell tarafında (README §7.5); eski Cordova config'i (B8) TAŞINMAZ — bulmacanya Capacitor kullanır
4. Skill puanı/katsayı hesabı shell tarafında (README §4.3)
5. Cordova/Express altyapısı (index.js, cordova-config) bulmacanya'da YERİ YOKTUR — yalnız oyun mekaniği referans alınır
6. game-fx tool geliştirme paketi — [FAZ-GAME-FX-SPEC](docs/FAZ-GAME-FX-SPEC.md) (game7/HarfGüder IMPL fazının ilk iş paketi)
7. Sıralı kampanya (Klasik→Dedektif→Sabit mod kilitleri) + Sonsuz mod (sayaç tohumlu, shapetris K20 emsali) — 2026-11-07 kullanıcı kararı: v1'de modlar AÇIK (K35) + mod başına "Devam Et"; sıralı açılım ve Sonsuz ayrı ileri iş paketi

---

## 12. T Görev Özeti

| # | Görev | UC | Durum |
| :- | :---- | :- | :---- |
| T-1 | `model/words.ts` — TR kelime listeleri (tier'lı) + zorluk skalası | UC-1 | ⬜ |
| T-2 | `model/letter-pool.ts` — havuz üretimi (mode parametreli) + ağırlıklı çekim | UC-1 | ⬜ |
| T-3 | `model/letter-pool.test.ts` — AK-1.1..1.6 (RED) | UC-1 | ⬜ |
| T-4 | `model/patterns.ts` — desen üreteci (seed'li) + patternMatch | UC-3 | ⬜ |
| T-5 | `model/word-check.ts` — üç modun kazanç kuralı | UC-3 | ⬜ |
| T-6 | `model/words.ts#candidatesFor` + `wordsMatching` | UC-3 | ⬜ |
| T-7 | `model/word-check.test.ts` + `patterns.test.ts` (RED) | UC-3 | ⬜ |
| T-8 | `model/scoring.ts` — mod bazlı skor + ipucu kesintisi + toplam | UC-4 | ⬜ |
| T-9 | `model/progression.ts` — tier parametreleri + kilit/checkpoint | UC-4 | ⬜ |
| T-10 | `model/scoring.test.ts` + `progression.test.ts` (RED) | UC-4 | ⬜ |
| T-11 | `model/slots.ts` — SlotBoard + yerleştirme/çıkarma kuralları | UC-2 | ⬜ |
| T-12 | `model/balloons.ts` — durum makinesi + spawn/respawn + kapasite | UC-2 | ⬜ |
| T-13 | `model/layout.ts` — calculateLayout (K27) | UC-2 | ⬜ |
| T-14 | `model/slots.test.ts` + `balloons.test.ts` + `layout.test.ts` (RED) | UC-2 | ⬜ |
| T-15 | game-fx + game-fx-pixi kurulumu (bağımlılık + adapter/atlas/audio init) | UC-5 | ⬜ |
| T-16 | `ui/fx.ts` — efekt tetikleyici bağlama (E1-E7) | UC-5 | ⬜ |
| T-17 | `ui/fx.test.ts` — bağlama testleri (mock adapter) | UC-5 | ⬜ |
| T-18 | `ui/atlas.ts` — varlık manifest'i (29 balon + arka plan) | UC-6 | ⬜ |
| T-19 | `ui/hud.tsx` — HUD + modallar (moda göre) | UC-6 | ⬜ |
| T-20 | `ui/strings.ts` — TR UI metinleri | UC-6 | ⬜ |
| T-21 | `ui/hud.test.ts` — selector + buton pasiflik kuralları | UC-6 | ⬜ |
| T-22 | `model/module-state.ts` — durum makinesi + event yayını + testler | UC-7 | ⬜ |
| T-23 | `index.ts` — Game7Module (IGameModule + Game7Options + hintHost) + testler | UC-7 | ⬜ |
| T-24 | `apps/app` — hub sayfası (3 mod kartı + checkpoint/kilit lib'i) | UC-7 | ⬜ |
| T-25 | Home kartı + i18n + App.tsx registerGame kaydı | UC-7 | ⬜ |
| T-26 | Ders overlay + `tutorialDone` bayrağı | UC-7 | ⬜ |

**review_date:** 2026-11-07
