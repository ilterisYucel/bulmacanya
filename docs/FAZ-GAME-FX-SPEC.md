---
status: active
space: games
tags: [oyun, tool, particles, audio, fx, spec, paket]
review_date: 2026-11-07
---

# FAZ-GAME-FX — SPEC

> **İş akışı aşaması:** 1/5 — SPEC (AGENTS.md "Geliştirme İş Akışı").
> **Durum:** ONAY BEKLİYOR — implementasyon HarfGüder (game7) oyununun IMPL fazının ilk iş paketi olarak girer.
> **İlişkili:** [SPEC-SABLONU](docs/SPEC-SABLONU.md), [AGENTS.md](AGENTS.md), tüketici: [FAZ-GAME7-ENTEGRASYONU-SPEC](docs/FAZ-GAME7-ENTEGRASYONU-SPEC.md), retrofit adayı: [FAZ-SHAPETRIS-ENTEGRASYONU-SPEC](docs/FAZ-SHAPETRIS-ENTEGRASYONU-SPEC.md), paket deseni: `packages/shared`
> **Referans (mimari):** `proton-engine` (renderer-bağımsız çekirdek + CustomRenderer deseni — kütüphane DEĞİL); pixi v8 particle ekosistemi araştırması (2026-11-07)

---

## 1. Amaç ve Bağlam

### 1.1 Kimlik

**game-fx** — bulmacanya oyun modüllerinin ORTAK efekt tool paketleri: particle burst, programatik efekt atlası, WebAudio sentez sesleri, ekran sarsıntısı. Oyunlar bu tool'ları YAZMAZ, TÜKETİR.

- **İlk tüketici:** HarfGüder (v1 — FAZ-GAME7 UC-5)
- **Retrofit adayı:** TetroVizyon/shapetris (ertelenmiş A5 animasyonları — ileri iş)
- **Gelecek:** Refleks, Hesaplama modernizasyonları; fikir aşamasındaki oyunlar

### 1.2 Kapsam

| Katman | Dahil | Hariç |
| :----- | :---- | :---- |
| game-fx (core) | IRenderAdapter kontratı, saf parçacık simi + havuz, saf efekt geometrisi, audio durum makinesi + ses eşleme, shake; sıfır bağımlılık | pixi/react/DOM import'u; ticker sahipliği; tam emitter motor (zone/field/emitter — proton kapsamı) |
| game-fx-pixi | pixi v8 adapter (ISprite/ILayer/ITexture), Graphics ile atlas üretimi, tint/blendMode passthrough | canvas/DOM adapter'ları (A2); pixi v9 ön-hazırlığı |
| Entegrasyon | Oyunların ui katmanında tüketim; init/destroy yaşam döngüsü | Oyun model/ katmanına giriş (YASAK — §5) |

---

## 2. Kararlar (kullanıcı onaylı — 2026-11-07)

| Kod | Karar | Sonuç |
| :-- | :---- | :---- |
| K1 | İKİ paket: `@bulmacanya/game-fx` (zero-dep çekirdek + IRenderAdapter kontratları) + `@bulmacanya/game-fx-pixi` (pixi adapter; `pixi.js` peerDependency ^8). Tam renderer kopuşu; gelecekte canvas/DOM adapter'ı eklenebilir | `packages/game-fx/` + `packages/game-fx-pixi/` |
| K2 | Core paket ZERO-DEP: pixi/react/DOM import'u YOK; paket hiçbir bağımlılık bildirmez (pixi yalnız adapter paketinde peer) | §5 Purity 1 |
| K3 | Parçacık çekirdeği ticker SAHİBİ değil: oyun ticker'ı `update(dt)` çağırır; motor kendi döngüsünü kurmaz | `ParticleBurst#update(dt)` |
| K4 | IRenderAdapter MİNİMAL yüzey: `ILayer` (add/remove/destroy), `ISprite` (x,y,rotation,scale,alpha,visible,texture,destroy), `ITexture` (opak handle); opsiyonel `color`/`blendMode` passthrough — bilmeyen adapter yoksayar. Pixi API'sini modellemek YASAK | `contracts/render-adapter.ts` |
| K5 | Saf çekirdek + ince runtime ayrımı: kinematik/ömür/havuz, efekt geometrisi, audio durum makinesi + ses eşleme, shake hesabı → pure (bun unit test); pixi/WebAudio çağrıları yalnız adapter/runtime'da | SC-1/SC-2 |
| K6 | Audio engine-free: WebAudio native; injectable `AudioContext` fabrikası (DI — headless test); asset dosyası YOK | `audio.ts#FxAudio` |
| K7 | Shake jenerik: `{x,y}` sahibi nesneye sarsıntı; adapter gerektirmez | `shake.ts` |
| K8 | proton-engine: MİMARİ REFERANS (renderer-bağımsız çekirdek + renderer adapter deseni), kütüphane DEĞİL — pixi v8 adapteri yok (eski v4/v5), 2 yıl bakımsız, tam motor kapsamı fazlası | §3 B2 |
| K9 | Yaşam döngüsü: her tool init/destroy; oyun modülünün init/exit'ine bağlanır; destroy sonrası kullanım = sessiz no-op | §7 |
| K10 | Purity: oyun `model/` katmanı game-fx import ETMEZ (ui-only tool); games check-purity kuralına ek madde | §5 Purity 2 |
| K11 | HarfGüder (game7) = ilk tüketici (v1); shapetris retrofit = ileri iş; game7 SPEC K28-K31 bu pakete işaret eder | FAZ-GAME7 revizyonu |
| K12 | Paket yapısı `packages/shared` deseni: exports map, tsconfig, nx targets (test/lint/typecheck), bun test | §6 UC-6 |
| K13 | v1 mini kapsam: havuzlu burst, 5 primitif geometri (dot/ring/sparkle/shard/confetti), 4 sentez ses (pop/tık/arpej/boop), shake — tam emitter motor DEĞİL; büyük/uzun ömürlü efekt ihtiyacında `pixi-v8-particles` değerlendirilir (A1) | §6 |

---

## 3. Mevcut Durum / Referans Analizi

| Kod | Bulgu | Kanıt |
| :-- | :---- | :---- |
| B1 | pixi.js v8'de built-in particle YOK; resmi `@pixi/particle-emitter` v8 desteklemiyor; ekosistem genç/parçalı fork'lar (`pixi-v8-particles` en olgun görünen) | web araştırması 2026-11-07 |
| B2 | proton-engine v7.1.5 (2 yıl önce, MIT, 0 bağımlılık): renderer-bağımsız çekirdek + Canvas/Dom/WebGL/Pixel/Easel/Pixi/Custom renderer'lar — desenin kanıtı; PixiRenderer eski pixi (v4/v5), v8 YOK | npmjs.com/package/proton-engine |
| B3 | bun headless'te pixi texture üretilemiyor → particles/fx-atlas yalnız "gözle" test edilebilirdi; IRenderAdapter + mock ile GERÇEK unit test mümkün | game7 SPEC UC-5 öncesi taslak |
| B4 | game7 SPEC UC-5 T-15..T-17 modül-lokal tool yazımı planlıyordu → bu SPEC ile paket TÜKETİMİNE dönüşür (K11) | docs/FAZ-GAME7-ENTEGRASYONU-SPEC.md |
| B5 | `packages/shared` yalnız çok-app'lı TİPLER taşır (AGENTS placement kuralı) — pixi runtime kodu shared'e GİRMEZ | AGENTS.md |
| B6 | TetroVizyon (shapetris) A5 (gelişmiş animasyonlar) v1'de ertelendi — retrofit adayı; oyunda tween-only desen var | docs/FAZ-SHAPETRIS-ENTEGRASYONU-SPEC.md §10 |

---

## 4. Mimari

### 4.1 Paket düzeni

```
packages/game-fx/                    @bulmacanya/game-fx — ZERO-DEP
├── src/contracts/render-adapter.ts  IRenderAdapter / ILayer / ISprite / ITexture (K4)
├── src/particles/particle-sim.ts    pure: kinematik + ömür + havuz sayaçları
├── src/particles/burst.ts           ParticleBurst — update(dt), config, onComplete
├── src/fx/geometry.ts               pure: starPoints/circleStops/shard/confetti
├── src/audio/audio-state.ts         pure: mute/unlock durum makinesi + ses→oscilatör eşleme
├── src/audio/fx-audio.ts            FxAudio — ince runtime (AudioContext fabrikası DI)
├── src/shake.ts                     shake(target, {px, ms}) — jenerik {x,y}
└── src/index.ts                     exports: ./particles, ./fx-geometry, ./audio, ./shake

packages/game-fx-pixi/               @bulmacanya/game-fx-pixi — pixi.js peer ^8
├── src/pixi-adapter.ts              PixiRenderAdapter: ISprite/ILayer sarmalayıcıları
├── src/pixi-fx-atlas.ts             Graphics → generateTexture (geometri core'dan)
└── src/index.ts
```

### 4.2 Bağımlılık yönü ve veri akışı

```
apps/games (game7, shapetris…) ──► @bulmacanya/game-fx (zero-dep)
                                      └─ IRenderAdapter ◄── @bulmacanya/game-fx-pixi (peer pixi ^8)

oyun ticker'ı ──► burst.update(dt) ──► sim core (pure) ──► adapter üzerinden sprite güncellemeleri
oyun init/exit ──► FxAudio.unlock/destroy, atlas üretimi/imhası
```

---

## 5. Purity Kuralları

1. `packages/game-fx/src` pixi/react/DOM API'sine dokunmaz; paket hiçbir bağımlılık bildirmez (K2 — build-time grep ile doğrulanır).
2. Oyun `model/` katmanı game-fx import ETMEZ — game-fx yalnız oyun `ui/` katmanında kullanılır (K10; games check-purity kuralına eklenir).
3. `FxAudio` WebAudio'dan başka platform çağrısı yapmaz; `AudioContext` fabrikası constructor'da injectable (DI — bun testi).
4. `IRenderAdapter` yalnız parçacık/efekt ihtiyacını taşır; pixi API sızıntısı YASAK — `color`/`blendMode` passthrough istisnadır (K4).
5. Shake hesabı saf fonksiyondur (zaman enjeksiyonlu) — test edilebilir çekirdek (K5).

---

## 6. Use Case'ler

### 6.1 UC-1 — ParticleBurst (havuz + sim)

**Status:** ✏️ Specified (onay bekliyor)

**Kapsam:**
- dahil: burst config (count, hız, açı aralığı, yerçekimi, sönüm, ömür, scale/fade eğrileri, `color` passthrough); parçacık havuzu (tavan, geri dönüş); `update(dt)`; `onComplete`; `destroy()`.
- hariç: texture üretimi (UC-2/oyunun işi); ticker sahipliği (K3); emitter/zone/field (tam motor — K13).

**Akış:**
1. Oyun `new ParticleBurst(adapter, cfg)` kurar; adapter layer'ı hazırdır.
2. `fire()` → havuzdan N parçacık spawn edilir (texture oyunun verdiği `ITexture`).
3. Oyun ticker'ı her frame `update(dt)` çağırır → sim core konum/alfa/ölçek hesaplar → adapter sprite günceller.
4. Ömür biten parçacık havuza döner; hepsi bitince `onComplete`.
5. `destroy()` → havuz + layer serbest bırakılır; sonraki çağrılar no-op.

**Gereksinimler (FR-1):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-1.1 | Havuz sızıntısız: burst bittiğinde aktif parçacık sayısı 0'a döner | AK-1.1 |
| FR-1.2 | Tavan aşılmaz; aşımda en eski parçacık geri dönüşür | AK-1.2 |
| FR-1.3 | Sim deterministiktir: aynı cfg + aynı dt dizisi → aynı konum/alfa | AK-1.3 |
| FR-1.4 | `destroy()` sonrası `update`/`fire` sessiz no-op | AK-1.4 |
| FR-1.5 | Mock `IRenderAdapter` ile pixi'siz tam unit test | AK-1.5 |

**Kabul Senaryoları (GWT):**
1. **AK-1.1 — GIVEN** 10 parçacıklı burst **WHEN** ömürler biter **THEN** `onComplete` çağrılır ve aktif sayısı 0'dır
2. **AK-1.2 — GIVEN** tavan 150, 200 istenir **WHEN** fire edilir **THEN** 150 spawn, en eski 50 geri dönüşür
3. **AK-1.3 — GIVEN** aynı cfg+dt dizisi **WHEN** iki kez sim edilir **THEN** parçacık konumları birebir aynıdır
4. **AK-1.4 — GIVEN** destroy edilmiş burst **WHEN** `update(dt)` çağrılır **THEN** hiçbir sprite değişmez, hata yok
5. **AK-1.5 — GIVEN** mock adapter **WHEN** burst koşturulur **THEN** sprite alan güncellemeleri (x/y/alpha/visible/destroy) doğru sırayla kaydedilir

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-1.1 | sızıntısızlık + onComplete | unit | ⬜ |
| AK-1.2 | tavan davranışı | unit | ⬜ |
| AK-1.3 | determinizm | unit | ⬜ |
| AK-1.4 | destroy no-op | unit | ⬜ |
| AK-1.5 | mock adapter kayıtları | unit | ⬜ |

**T Görev Listesi:**
- [ ] T-2: `particles/particle-sim.ts` + `particles/burst.ts`
- [ ] T-3: `particles/particle-sim.test.ts` (mock adapter — RED → GREEN)

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| `dt` negatif/0 | no-op (sim ilerlemez) |
| cfg count 0 | fire no-op; onComplete ÇAĞRILMAZ |
| Aynı burst iki kez fire | İkinci fire öncekini tamamlar (parçacıklar birikmez — havuz tavanı korunur) |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `packages/game-fx/src/contracts/render-adapter.ts` | Kontrat |
| `packages/game-fx/src/particles/particle-sim.ts` | Saf sim |
| `packages/game-fx/src/particles/burst.ts` | Burst yaşam döngüsü |

### 6.2 UC-2 — FxGeometri + FxAtlas (programatik efekt dokuları)

**Status:** ✏️ Specified (onay bekliyor)

**Kapsam:**
- dahil: saf geometri üreteçleri — `starPoints`, `circleStops` (radial durma noktaları), shard poligonları, confetti dikdörtgeni; adapter tarafında rasterize (pixi: `Graphics → generateTexture`, TEK TextureSource atlas); `destroy()`.
- hariç: elle çizilmiş particle PNG'leri (A3 — sonradan aynı slotlara takılabilir); UI buton/panel dokuları (DOM katmanı — game7 K9).

**Akış:**
1. Oyun init'te `createFxAtlas(pixiAdapter)` çağırır → 5 primitif texture tek atlas'ta.
2. Burst config'leri atlas texture'larını referans alır.
3. Exit'te `destroy()` → texture'lar serbest bırakılır.

**Gereksinimler (FR-2):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-2.1 | Geometri saf fonksiyon — renderer'sız test edilebilir (nokta listeleri + durma noktaları) | AK-2.1 |
| FR-2.2 | Atlas TEK TextureSource (pixi v8 ParticleContainer kısıtı — game7 K30) | AK-2.2 |
| FR-2.3 | 5 primitif: dot 32×32, ring 128×128, sparkle 96×96, shard 64×64, confetti 32×8 | AK-2.3 |

**Kabul Senaryoları (GWT):**
1. **AK-2.1 — GIVEN** `starPoints(4)` **WHEN** hesaplanır **THEN** 9 nokta döner (merkez + 4 iç + 4 dış), tümü çember yarıçap sınırları içinde
2. **AK-2.2 — GIVEN** pixi adapter ile atlas üretilir **WHEN** incelenir **THEN** tüm texture'lar aynı TextureSource'tan (gözle/kod inceleme)
3. **AK-2.3 — GIVEN** atlas **WHEN** slotları okunur **THEN** 5 primitif belirtilen boyutlardadır

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-2.1 | geometri saflığı | unit | ⬜ |
| AK-2.2 | tek TextureSource | gözle/kod inceleme | ⬜ |
| AK-2.3 | primitif seti + boyutlar | unit (meta) | ⬜ |

**T Görev Listesi:**
- [ ] T-4: `fx/geometry.ts` (5 primitif)
- [ ] T-5: `fx/geometry.test.ts` (RED → GREEN)

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `packages/game-fx/src/fx/geometry.ts` | Saf geometri |
| `packages/game-fx-pixi/src/pixi-fx-atlas.ts` | Rasterize + atlas |

### 6.3 UC-3 — FxAudio (WebAudio sentez sesleri)

**Status:** ✏️ Specified (onay bekliyor)

**Kapsam:**
- dahil: 4 sentez ses (pop/tık/arpej/boop); `unlock()` (ilk kullanıcı dokunuşu — mobil); mute; injectable `AudioContext` fabrikası (DI).
- hariç: ses asset dosyaları (ileride gerçek dosyalar aynı arayüze — §11); müzik/ambiyans loop (A4).

**Akış:**
1. Oyun init'te `new FxAudio(audioContextFactory)` kurar; context yoksa `AUDIO_CONTEXT_FAILED` → tüm çağrılar sessiz no-op.
2. İlk dokunuşta oyun `unlock()` çağırır; öncesinde tüm sesler sessiz no-op (FR-3.2).
3. `pop()`/`tick()`/`arpeggio()`/`boop()` — eşleme tablosundan osilatör config'i alınır, kısa zarfla çalınır.
4. `setMuted(true)` → no-op; görsel efektler etkilenmez.

**Gereksinimler (FR-3):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-3.1 | Mute açıkken tüm ses çağrıları no-op | AK-3.1 |
| FR-3.2 | `unlock()` öncesi sesler no-op; unlock sonrası çalar | AK-3.2 |
| FR-3.3 | Ses→oscilatör eşleme tablosu saf veri (4 ses, frekans/zarf) | AK-3.3 |
| FR-3.4 | `AudioContext` injectable — headless test (mock context kayıtları) | AK-3.4 |
| FR-3.5 | Context yok/red → `AUDIO_CONTEXT_FAILED`, sessiz düşer (çökme YOK) | AK-3.5 |

**Kabul Senaryoları (GWT):**
1. **AK-3.1 — GIVEN** muted **WHEN** `pop()` çağrılır **THEN** context'e hiçbir çağrı gitmez
2. **AK-3.2 — GIVEN** unlock edilmemiş **WHEN** `tick()` çağrılır **THEN** sessiz no-op; unlock sonrası aynı çağrı osilatör başlatır
3. **AK-3.3 — GIVEN** eşleme tablosu **WHEN** okunur **THEN** 4 ses tanımlıdır ve her biri frekans+zarf taşır
4. **AK-3.4 — GIVEN** mock context **WHEN** `boop()` çalınır **THEN** osilatör oluşturma/zarf sırası kayıtlara birebir yansır
5. **AK-3.5 — GIVEN** fabrika null döner **WHEN** ses çağrılır **THEN** hata YOK, sessiz no-op

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-3.1 | mute no-op | unit | ⬜ |
| AK-3.2 | unlock kapısı | unit | ⬜ |
| AK-3.3 | eşleme tablosu | unit | ⬜ |
| AK-3.4 | DI + kayıt sırası | unit | ⬜ |
| AK-3.5 | context yokluğu | unit | ⬜ |

**T Görev Listesi:**
- [ ] T-6: `audio/audio-state.ts` + `audio/fx-audio.ts`
- [ ] T-7: `audio/audio-state.test.ts` + `fx-audio.test.ts` (RED → GREEN)

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `packages/game-fx/src/audio/audio-state.ts` | Saf durum makinesi + eşleme |
| `packages/game-fx/src/audio/fx-audio.ts` | Runtime (DI) |

### 6.4 UC-4 — Shake (ekran sarsıntısı)

**Status:** ✏️ Specified (onay bekliyor)

**Kapsam:**
- dahil: `shake(target, {px, ms})` — `{x,y}` sahibi herhangi nesne (Container, DOM wrapper); süre sonunda ORİJİNAL konuma dönüş; üst üste gelen shake'lerde son gelen kazanır.
- hariç: adapter; pixi bağımlılığı (jenerik); güç eğrisi çeşitleri (v1 tek doğrusal sönüm).

**Gereksinimler (FR-4):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-4.1 | Süre bitince hedef orijinal konumuna döner (kalıntı ofset YOK) | AK-4.1 |
| FR-4.2 | `px`/`ms` parametrik; hesap saf (zaman enjeksiyonlu) | AK-4.2 |
| FR-4.3 | Çakışan shake'lerde sonuncusu öncekini ezer (çift sarsıntı birikimi YOK) | AK-4.3 |

**Kabul Senaryoları (GWT):**
1. **AK-4.1 — GIVEN** hedef (10,20), shake 3px/150ms **WHEN** süre biter **THEN** hedef (10,20)'dedir
2. **AK-4.2 — GIVEN** zaman enjekte edilir **WHEN** hesap çağrılır **THEN** ofset px sınırı içinde ve deterministiktir
3. **AK-4.3 — GIVEN** aktif shake varken yenisi başlar **WHEN** hesap sürer **THEN** yalnız son shake'in ofseti uygulanır

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-4.1 | konum geri dönüşü | unit | ⬜ |
| AK-4.2 | parametrik + determinizm | unit | ⬜ |
| AK-4.3 | çakışma politikası | unit | ⬜ |

**T Görev Listesi:**
- [ ] T-8: `shake.ts` + `shake.test.ts`

### 6.5 UC-5 — PixiRenderAdapter (game-fx-pixi)

**Status:** ✏️ Specified (onay bekliyor)

**Kapsam:**
- dahil: `ISprite` sarmalayıcısı (x/y/rotation/scale/alpha/visible/destroy → pixi Sprite), `ILayer` (Container/ParticleContainer), `ITexture` handle; `color`→tint, `blendMode` passthrough; `createFxAtlas` (UC-2'nin pixi rasterize tarafı).
- hariç: canvas/DOM adapter'ları (A2); pixi dışı sarmalamalar.

**Gereksinimler (FR-5):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-5.1 | ISprite alan güncellemeleri pixi sprite'a birebir yansır | AK-5.1 |
| FR-5.2 | pixi `peerDependency` (^8); core paket pixi BİLMEZ (K2) | AK-5.2 |
| FR-5.3 | Tek TextureSource atlas üretimi (FR-2.2 mekanik yanı) | AK-5.3 |

**Kabul Senaryoları (GWT):**
1. **AK-5.1 — GIVEN** sprite sarmalayıcı **WHEN** x/alpha/blendMode yazılır **THEN** alttaki pixi sprite'ı aynı değerdedir (tarayıcı gözle/kod inceleme)
2. **AK-5.2 — GIVEN** core paket build edilir **WHEN** bağımlılıkları okunur **THEN** boştur; adapter paketi pixi ^8 peer bildirir
3. **AK-5.3 — GIVEN** atlas **WHEN** üretilir **THEN** tüm slotlar aynı base texture'dan

**T Görev Listesi:**
- [ ] T-9: `game-fx-pixi` paketi — `pixi-adapter.ts` + `pixi-fx-atlas.ts` + exports

### 6.6 UC-6 — Paket Kurulumu ve Gate Uyumu

**Status:** ✏️ Specified (onay bekliyor)

**Kapsam:**
- dahil: iki paketin package.json exports/peerDeps, tsconfig, nx targets (test/lint/typecheck); `bun run check` gate'ine katılım; games check-purity kuralına K10 maddesi; kök tsconfig paths.
- hariç: npm publish (private monorepo paketi).

**Gereksinimler (FR-6):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-6.1 | İki paket lint/typecheck/test yeşil | AK-6.1 |
| FR-6.2 | Core paket `dependencies` listesi BOŞ (K2) | AK-6.2 |
| FR-6.3 | `@bulmacanya/game-fx` workspace bağımlılığı olarak çözülür (link-workspace-packages) | AK-6.3 |

**Kabul Senaryoları (GWT):**
1. **AK-6.1 — GIVEN** kök **WHEN** `bun run check` koşar **THEN** iki paket de yeşildir
2. **AK-6.2 — GIVEN** core package.json **WHEN** okunur **THEN** dependencies boş, devDependencies yalnız test tipleri
3. **AK-6.3 — GIVEN** game7 modülü import eder **WHEN** typecheck koşar **THEN** `@bulmacanya/game-fx` çözülür (çözülemez → hata)

**T Görev Listesi:**
- [ ] T-1: paket iskeletleri (iki package.json + tsconfig + nx + paths)
- [ ] T-10: kök gate + check-purity kural güncellemesi

---

## 7. Yaşam Döngüsü ve Hata Kategorileri

| Durum | Davranış |
| :---- | :------- |
| idle | Tool kurulu; kaynak ayrılmadı |
| initialized | Atlas üretildi, audio hazır (context varsa), havuz kuruldu |
| running | Burst'ler `update(dt)` ile ilerler; sesler çalınır |
| destroyed | `destroy` sonrası tüm çağrılar sessiz no-op; geri dönüş YOK |

**Hata kategorileri:**
| Kategori | Anlam |
| :------- | :---- |
| `ADAPTER_NOT_INITIALIZED` | Burst, layer/adapter'sız kullanıldı — no-op |
| `AUDIO_CONTEXT_FAILED` | WebAudio context yok/red — tüm sesler sessiz no-op (çökme YOK) |

**Yan etkiler:** atlas/audio context/havuz kaynakları `destroy` ile serbest bırakılır (ZORUNLU — K9).
**Limitler:** v1 tavan 150 eşzamanlı parçacık; 4 sentez ses; 5 primitif.

---

## 8. Başarı Kriterleri (SC-x)

| Kod | Kriter | Ölçüm |
| :-- | :---- | :---- |
| SC-1 | `game-fx/src` %100 pure — pixi/react/DOM import'u 0, bağımlılık listesi boş | grep/build check |
| SC-2 | particles/geometry/audio-state/shake bun unit testleri yeşil ("gözle" yalnız görsel katman — adapter) | `bun test` |
| SC-3 | Oyun model purity korunur (game-fx yalnız ui'da) | games check-purity |
| SC-4 | İki paket lint/typecheck/test yeşil — `bun run check` | CI komutu |
| SC-5 | HarfGüder (game7) UC-5 kendi tool dosyası İÇERMEZ — yalnız paket tüketimi | kod inceleme |

---

## 9. Aşama Eşlemesi (iş akışı)

| Aşama | Ürün |
| :---- | :---- |
| 1. SPEC | Bu doküman |
| 2. JSDoc | `contracts/render-adapter`, `particle-sim`, `burst`, `fx/geometry`, `audio-state`, `fx-audio`, `shake` sözleşmeleri |
| 3. TEST | KIRMIZI: `packages/game-fx/src/**/*.test.ts` (mock adapter/context ile) |
| 4. IMPL | T-1..T-10 — HarfGüder (game7) IMPL fazının İLK iş paketi |
| 5. KAPANIŞ | Bu dokümanın §A/§B güncellemesi (Doğrulama + Test Kapsamı) |

---

## 10. Açık Kararlar

| # | Konu | Durum |
| :-- | :---- | :---- |
| A1 | Tam emitter motor ihtiyacı (`pixi-v8-particles` değerlendirmesi) | İlk büyük/uzun ömürlü efekt ihtiyacında kapanır (K13) |
| A2 | canvas/DOM render adapter'ı | WebGL'siz ortam/fallback ihtiyacında kapanır |
| A3 | Elle çizilmiş particle PNG'leri | İstenirse aynı atlas slotlarına konur — kod DEĞİŞMEZ (game7 K30 ruhu) |
| A4 | Müzik/ambiyans loop | İleri iş |

---

## 11. İleri İş (bu pakette YAPILMAZ — referans)

1. TetroVizyon (shapetris) juice retrofit'i (A5 emsali — ayrı paket)
2. Gerçek ses asset'leri — FxAudio arayüzüne takılır (game7 K31)
3. Refleks/Hesaplama modernizasyonlarında tüketim
4. pixi-v8-particles değerlendirmesi (A1)

---

## 12. T Görev Özeti

| # | Görev | UC |
| :- | :---- | :- |
| T-1 | İki paketin iskeleti (package.json + tsconfig + nx + paths) | UC-6 |
| T-2 | `particles/particle-sim.ts` + `particles/burst.ts` | UC-1 |
| T-3 | `particles/*.test.ts` (mock adapter — RED → GREEN) | UC-1 |
| T-4 | `fx/geometry.ts` (5 primitif) | UC-2 |
| T-5 | `fx/geometry.test.ts` | UC-2 |
| T-6 | `audio/audio-state.ts` + `audio/fx-audio.ts` | UC-3 |
| T-7 | `audio/*.test.ts` | UC-3 |
| T-8 | `shake.ts` + test | UC-4 |
| T-9 | `game-fx-pixi` — `pixi-adapter.ts` + `pixi-fx-atlas.ts` | UC-5 |
| T-10 | Kök gate + check-purity kural güncellemesi | UC-6 |

**İş sırası (bağımlılık):** T-1 → T-2/T-3 (sim) → T-4/T-5 (geometri) → T-6/T-7 (audio) → T-8 (shake) → T-9 (adapter) → T-10 (gate). Model testleri (RED) her görevden önce. game7 IMPL fazı: game-fx paketi → game7 model/ (UC-1..UC-4) → game7 ui/ (game-fx tüketimi).

**review_date:** 2026-11-07
