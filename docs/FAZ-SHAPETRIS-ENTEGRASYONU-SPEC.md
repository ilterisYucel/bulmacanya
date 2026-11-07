---
status: active
space: games
tags: [oyun, shapetris, entegrasyon, faz-1, gdd, spec]
review_date: 2026-11-05
---

# FAZ-SHAPETRIS-ENTEGRASYONU — SPEC

> **İş akışı aşaması:** 1/5 — SPEC (AGENTS.md "Geliştirme İş Akışı").
> **Durum:** ONAY BEKLİYOR — implementasyon developer onayından sonra başlar.
> **İlişkili:** [FAZ-0-SPEC](docs/FAZ-0-SPEC.md), [SPEC-SABLONU](docs/SPEC-SABLONU.md), [README §3.3 / §4.3 / §7.3.2](README.md), [AGENTS-GAMES](AGENTS-GAMES.md)
> **Referans (eski oyun):** `/home/ilteris/Downloads/game3-cordova/www` (`game.js`, `challange.js`)
> **Sprite sheet:** `/home/ilteris/Downloads/Gemini_Generated_Image_4nuunt4nuunt4nuu.png` (1024×1024 PNG)

---

## 1. Amaç ve Bağlam

### 1.1 Oyun Kimliği (GDD özeti)

**TetroVizyon** (teknik modül ID: `shapetris` — DEĞİŞMEZ; marka adı A9) — tetromino parçalarını sürükleyip 12×12 tahtaya yerleştirerek yeşil hedef şekli tamamlama oyunu. Eski "shapetris" (Cordova/vanilla Pixi.js) oyununun mekaniği birebir korunur; grafikler yeni sprite sheet'e geçer, kod `apps/games` paketine `@pixi/react` ile taşınır, responsive boyutlandırma yeni game-shell ile uyumlu hale gelir.

- **Tür:** Şekil tamamlama / mantık bulmacası (Tetris tabanlı, README §2 "Görüntü oluşturma")
- **Hedef kitle:** Günlük 5-10 dakikalık kısa bulmaca oturumu arayan mobil kullanıcı (web PWA + iOS/Android)
- **Oturum:** Bölüm başına ~1-3 dk; sonsuz bölüm ilerlemesi
- **Kontroller:** Sürükle-bırak (touch/mouse); parçaya dokununca (yerinde bırakınca) 90° saat yönünde döndürme; geri al yok — kısıtlı hamle değil, alan kısıtı oyunu zorlaştırır
- **Game feel:** Parça kaldırılınca %50 alpha + 2× büyüme (odak), başarılı yerleştirmede animasyon, silinen satır/sütunda patlama efekti (eski 500ms AnimatedSprite yerine v8 uyumlu tween — UC-9)
- **Renk dili:** mavi = serbest bölge (kenar 2 hücre), kırmızı = zaferde boş kalmalı (taşınıp silinebilir), yeşil = hedef şekil hücresi, gri = parçalar (sprite sheet'in tek kaynağı)

### 1.2 Kapsam

| Katman | Dahil | Hariç |
| :----- | :---- | :---- |
| Oyun modülü | 12×12 tahta, 7 tetromino, yerleştirme/döndürme, satır+sütun temizleme, bölüm üretimi, zafer/skor, süre sayacı, zorluk modları, ipucu türleri | Günlük puzzle, tema sistemi, çoklu dil (TR tek dil), mağaza/coin ekranı |
| Grafik | Yeni sprite sheet (tek kaynak), v8 sprite/tween | Eski theme PNG'leri + animation JSON'ları, `pixi-multistyle-text`, `pixi-timer`, `sprite-scorer` libleri |
| Entegrasyon | `IGameModule` kontratı, lazy load, Home'dan tek buton, skor/bölüm/ipucu/kayıt event'leri | Oyun seçim sayfası, günlük puzzle takvimi, reklam SDK'sı (shell'in işi) |
| Backend | Yok (modül shell ile konuşur) | Skor kalıcılığı (shell/saveRequested payload'ı üretir, saklamaz) |

---

## 2. Kararlar (kullanıcı onaylı, 2026-11-04)

| Kod | Karar | Sonuç |
| :-- | :---- | :---- |
| K1 | Mekanik birebir korunur (eski `game.js`/`challange.js` referans) | Tahta, parça seti, yerleştirme, temizleme, zafer ve bölüm üretim formülleri aynı |
| K2 | Grafikler tek sprite sheet'ten (Gemini 1024×1024); eski tema/animasyon sistemi düşer | `assets/themes/**`, `assets/nature/**`, `assets/tech/**` taşınmaz |
| K3 | Kırmızı hücre YERLEŞTİRİLEBİLİR; zafer anında BOŞ olmalı (2026-11-05 revizyonu — eski oyun birebir davranışı) | Parça kırmızıya konabilir; satır/sütun temizlemeyle boşaltılır; `checkVictory` yeşil dolu + kırmızı boş ister |
| K4 | Mavi kenar (2 hücre kalınlık) serbest bölgedir; tam dolan satır VEYA sütun silinir | `cleanBoard` davranışı korunur (satır+sütun, çapraz değil) |
| K5 | Yeşil hedef şekil tetromino dolgusundan üretilir | `loadLevel` formülü: `max_tiles = min(144, 10+level)`, `tiles_to_remove = min(32, level/5)` |
| K6 | Zorluk modları korunur (0/1/2) | 0: iki tepsi de deterministik ((cur+1)%7); 1: tepsi-0 rastgele; 2: ikisi de rastgele |
| K7 | Süre sayacı korunur (bölüm başına; her 10 bölümde süre düşer) | Süre dolunca GAME OVER → restart aynı bölümden |
| K8 | Eski ad-ödüllü yardımlar İPUCU TÜRÜ olur | `hintRequested {hintType}`: `shapetris.kenar-temizle` / `shapetris.hucre-sil`; modül karar VERMEZ, shell coin/reklam kararını verir (README §7.3, §7.5) |
| K9 | Modül ID: `shapetris`; paket `apps/games`; lazy load ile shell'e kayıt | `registerGame("shapetris", () => import("@bulmacanya/games/shapetris"))` |
| K10 | App'e Home sayfasından tek "Shapetris" butonu ile girilir | Oyun seçim sayfası ileriki iş (Bakınız §11) |
| K11 | Günlük puzzle ertelenir | Açık karar A1 |
| K12 | Responsive: saf `calculateLayout(viewport) → LayoutMetrics` fonksiyonu; p/l oryantasyon + eski step/indent matematiği | Unit test edilebilir; Pixi bağımlılığı YOK |
| K13 | İpucu maliyeti 1 coin (README §7.3.2 "Görüntü oluşturma") | Modül maliyet bilmez; shell'e `hintType` iletir |
| K14 | UI kontrolleri React DOM katmanında (Ionic/`@pixi/react` sahne üstünde), oyun alanı Pixi canvas | Türkçe metin + erişilebilirlik DOM'da; sprite sheet'te buton asseti gerekmez |
| K15 | Skor formülü korunur: bölüm skoru = `10 − ipucuKullanımSayısı`, toplam skor birikir | Her ipucu kullanımı bölüm skorundan 1 düşer (eski `bonusCount`) |
| K16 | Kampanya hazır JSON bölümlerinden okunur (2026-11-05) | `assets/levels/{kolay,orta,zor}/level0..99.json` — eski oyunun elde hazırlanmış 8×8 hedef matrisleri; generator yalnız sonsuz/günlük modlarda |
| K17 | Akış: Home ikon kartı → Shapetris hub'ı → zorluk seçimi/Devam Et/günlük/sonsuz (2026-11-05) | Ayrı tanıtım sayfası YOK — hub birleşik (ekran az = kod az) |
| K18 | İlk oyun dersi: 3 adımlı atlanabilir overlay, bir kez (2026-11-05) | Canlı tahtada: sürükle → bırak → satır/sütun temizliği; shell "tutorialDone" bayrağı tutar |
| K19 | Zorluk ilerlemesi bağımsız + kilitli (2026-11-05) | Kolay her zaman açık; Orta kolay bitince, Zor orta bitince; her zorluğun ayrı checkpoint'i |
| K20 | Günlük = tarih tohumu; Sonsuz = sayaç tohumu (2026-11-05) | Günlük herkes için aynı puzzle (paylaşılabilir); sonsuz kişisel, sayaçla sonsuz; Sonsuz mod Zor bitince açılır |
| K21 | Kayıt: shell `saveRequested` payload'ını localStorage'da tutar (2026-11-05) | Payload `{mode, difficulty, levelNo, totalScore, completed}`; backend FAZ-1'de aynı payload'ı alır — modül değişmez |
| K22 | Bölüm parça politikası (K6) modül içi opsiyon olarak kalır (2026-11-05) | Zorluk seçimi = kampanya zorluğu; tepsi rastgelelik politikası bağımsız iç ayar (varsayılan 0) |

---

## 3. Mevcut Durum / Referans Analizi

### 3.1 Eski oyun mekaniği (kaynak: game3-cordova)

| Kod | Bulgu | Kanıt |
| :-- | :---- | :---- |
| B1 | 12×12 tahta, `pad: 2` mavi kenar; 8×8 iç bölge hedef alanı | `game.js#boardSize`, `game.js#recreateLevel` |
| B2 | 7 parça: S, Z, O, I, T, J, L matrisleri + her parçanın çapa (anchor) tablosu | `game.js#possiblePieces`, `game.js#pieceOrigins` |
| B3 | Yerleştirme: sınır dışı veya dolu hücre çakışması → RED + hata sesi; dolu satır/sütun silinir | `game.js#applyPiece`, `game.js#cleanBoard` |
| B4 | Zafer: 8×8 hedef alan birebir dolunca; bölüm biter, sonraki bölüm üretilir | `game.js#checkVictory`, `challange.js#loadLevel` |
| B5 | Bölüm üretimi: rastgele parça dolgusu + `tiles_to_remove` kadar hücre eksiltme → hedef şekil | `challange.js#loadLevel` |
| B6 | Skor: `levelScore = 10 − bonusCount`; `maxLevel` localStorage'da | `challange.js#applyVictory` |
| B7 | Dokun-döndür: sürüklemeden bırakılırsa 90° CW; sürüklerken üstte ±1 hücre ofset dengeleme | `game.js#onDragEnd`, `game.js#onDragMove` |
| B8 | Responsive: p/l oryantasyon; `step = min(0.85·uzunKenar/coef, kısaKenar/12)`, `coef = ratio ≤ 3/2 ? 18 : 12`, `indent = (kısaKenar − 12·step)/2` | `game.js#calculateStep`, `game.js#calculateIndent`, `game.js#calculateCoef` |
| B9 | Yardımlar: kenar (mavi halka) temizleme + tek hücre silme — ödüllü reklam karşılığı | `game.js#cleanBlue`, `game.js#cleanSquare` |
| B10 | Süre sayacı: bölüm süresi; her 10 bölümde süre `timer.duration − timer.second` kadar kısalır | `challange.js#applyVictory` (timer), `challange.js` (game over modal) |

### 3.2 Yeni sistem (bulmacanya)

| Kod | Bulgu | Kanıt |
| :-- | :---- | :---- |
| B11 | Shell kontratı `IGameModule` + `GameEventMap` (score/levelCompleted/hintRequested/adRequested/saveRequested); durum makinesi idle→initialized→running⇄paused→stopped | `packages/shared/src/contracts/game-module.ts#IGameModule` |
| B12 | Shell yalnız loader tutar; modül dinamik import ile yüklenir | `apps/app/src/features/game-shell/model/shell.ts#registerGame` |
| B13 | `apps/games` paketi boş yer tutucu (echo script'ler) — gerçek oyun kodu burada | `apps/games/package.json` |
| B14 | Örnek modül: `MockGame` — kontratın yaşam döngüsü uygulaması referansı | `apps/app/src/features/mock-game/model/mock-game.ts#MockGame` |
| B15 | Home sayfası stub: `IonTitle` + tek buton; i18n sözlüğü `src/shared/lib/i18n.ts` | `apps/app/src/pages/home/ui/HomePage.tsx` |

### 3.3 Sprite sheet programatik analizi (ön analiz — görsel doğrulama T görevi)

> Bu model görsel okuyamaz; aşağıdaki tablo piksel/renk analizinden (bağlı bileşen + ortalama renk) türetildi. **Kesin dilimleme koordinatları T görevinde görsel olarak doğrulanır** (T-2).

**Büyük karolar — alt bölge, 6 sütun × 2 satır, karo ≈ 121-122px:**

| x | y | Boyut | Ortalama renk | Önerilen rol (doğrulanacak) |
| -: | -: | -: | :-- | :-- |
| 51 | 634 | 121×122 | kırmızı (212,7,8) | red-on (parlak) |
| 190 | 634 | 122×122 | kırmızı (210,6,7) | red-on alternatif / kenar varyantı |
| 383 | 634 | 121×122 | yeşil (20,191,17) | green-on (parlak) |
| 520 | 634 | 122×122 | yeşil (20,191,16) | green-on alternatif |
| 712 | 634 | 122×122 | mavi (4,41,219) | blue-on |
| 852 | 634 | 122×122 | mavi (4,42,220) | blue-on alternatif |
| 51 | 826 | 121×122 | koyu kırmızı (166,7,56) | red-off |
| 190 | 826 | 122×122 | koyu kırmızı (164,5,54) | red-off alternatif |
| 383 | 826 | 121×122 | koyu yeşil (108,136,39) | green-off |
| 520 | 826 | 121×122 | koyu yeşil (108,135,38) | green-off alternatif |
| 712 | 826 | 122×122 | camgöbeği (16,182,210) | blue-off |
| 852 | 826 | 122×122 | camgöbeği (16,183,211) | blue-off alternatif |

**Parçalar — üst/orta bölge (gri tetrominolar + renkli önizleme karoları):**

| x | y | Boyut | Ortalama renk | Önerilen rol (doğrulanacak) |
| -: | -: | -: | :-- | :-- |
| 402 | 77 | 107×40 | gri (86,88,98) | I parçası (yatay, 4×1) |
| 519 | 70 | 110×58 | gri (85,87,95) | I parçası varyantı |
| 311 | 81 | 52×51 | gri (133,138,145) | O parçası (2×2) |
| 517 | 287 | 115×89 | gri (76,78,85) | S/Z parçası (3×2) |
| 639 | 287 | 117×89 | gri (73,75,82) | S/Z parçası (3×2) |
| 400 | 277 | 110×108 | gri (67,69,75) | L/J parçası (3×2) |
| 652 | 59 | 94×93 | gri (70,72,79) | L/J/T parçası (3×2) |
| 889 | 67 | 69×73 | gri (77,79,88) | T parçası adayı |
| 416 | 403 | 79×83 | gri (108,111,121) | T parçası adayı |
| 775 | 277 | 82×106 | gri (71,73,79) | dikey parça adayı |
| 882 | 277 | 83×106 | gri (71,73,79) | dikey parça adayı |
| 318 | 277 | 39×105 | gri (111,114,125) | dikey I adayı (4×1) |
| 318 | 392 | 38×106 | beyaz (191,197,207) | aktif parça vurgusu adayı |
| 317 | 164 | 41×104 | camgöbeği (28,194,202) | I parçası renkli adayı |
| 78-79 | 81-421 | 51×51 ×4 | kırmızı | kırmızı önizleme kareleri (next-tile) |
| 193-194 | 81-421 | 51×51 ×4 | yeşil | yeşil önizleme kareleri (next-tile) |

> Alternatif (açık karar A2): büyük karo seti yalnızca 6 karo (red-off/on, green-off/on, blue-off/on) olarak kullanılır ve "alternatif" varyantlar göz ardı edilir.

---

## 4. Mimari

### 4.1 Modül yapısı (apps/games)

```
apps/games/src/shapetris/
├── index.ts                 # default export: IGameModule (ShapetrisModule)
├── model/                   # SAF — Pixi/React bağımlılığı YOK (unit test)
│   ├── board.ts             # 12×12 tahta, applyPiece, cleanRowsCols, checkVictory
│   ├── pieces.ts            # 7 parça matrisi + çapa + rotasyon
│   ├── level.ts             # loadLevel üretim formülü (max_tiles/tiles_to_remove)
│   ├── layout.ts            # calculateLayout(viewport) → LayoutMetrics (p/l, step, indent)
│   ├── scoring.ts           # bölüm skoru = 10 − ipucu kullanımı; toplam skor
│   └── module-state.ts      # GameModuleState makinesi + event yayını (MockGame deseni)
├── ui/                      # PIXI — yalnız sunum
│   ├── ShapetrisStage.tsx   # @pixi/react Stage + sprites + tween'ler
│   ├── atlas.ts             # sprite sheet dilimleme tablosu (koordinatlar §3.3)
│   └── pieces-layer.ts      # tepsi/parça katmanı, drag-drop bağlama
└── lib/
    └── touch.ts             # dokunmatik sürükleme yardımcıları
```

### 4.2 Shell bağlantısı

```
HomePage → registerGame("shapetris", loader)  (app başlangıcında bir kez)
tıklama → loadGame("shapetris") → init → start
modül ──score/levelCompleted/hintRequested/saveRequested──► shell (GameEventMap)
shell ──(hintType sonucu: coin/reklam onayı)──► modüle çağrı (yeni public metot DEĞİL — modül içi callback)
```

> DİKKAT: `IGameModule` kontratında "ipucu onayı" taşıyan metot YOKTUR. Modül `hintRequested` yayınlar; shell'in cevabı ya kontratın `pause/resume` tarafında (reklam akışı) ya da shell'in modüle enjekte ettiği bir `hintGranted` callback ile döner. En az invaziv çözüm: `init`'e opsiyonel `IHintHost { grant(hintType): Promise<boolean> }` bağlanır — kontrat GENİŞLEMEZLENMEZ (opsiyonel enjeksiyon, JSDoc aşamasında netleşir; bakınız A3).

---

## 5. Purity Kuralları

1. `model/` Pixi/React/DOM API'sine dokunmaz; yalnız saf fonksiyon + veri. (K12, unit test edilebilirlik)
2. Modül dış dünyaya yalnız `IGameModule` + `GameEventMap` ile konuşur; shell'e oyun-spesifik tip SIZMAZ (FR-4.1 ruhu).
3. Oyun-spesifik tip (`Board`, `Tetromino`, `LayoutMetrics`) `packages/shared`'a KONULMAZ (tek-app tipi — AGENTS.md placement kuralı).
4. Asset yolları tek kaynak: `ui/atlas.ts`. Başka dosyada sabit yol YOK.
5. İpucu/reklam kararı modülde ALINMAZ — `hintRequested`/`adRequested` event'i ile shell'e devredilir (README §3.3, K8).

---

## 6. Use Case'ler

### 6.1 UC-1 — Shell Kontratı: Yaşam Döngüsü ve Kayıt

**Status:** 🟢 Doğrulanmış

**Kapsam:**
- dahil: `ShapetrisModule`'ün `IGameModule` uygulaması; `registerGame` kaydı; durum makinesi (idle→initialized→running⇄paused→stopped); event yayını (score, levelCompleted, hintRequested, saveRequested); exit sonrası kaynak serbest bırakma (Stage destroy).
- hariç: shell içi skor saklama; coin/reklam akışı (shell'in işi); oyun seçim sayfası (K10).

**Akış:**
1. App başlangıcında `registerGame("shapetris", () => import("@bulmacanya/games/shapetris"))`.
2. Kullanıcı Home'da "Shapetris" butonuna dokunur.
3. `loadGame("shapetris")` → `init()` (Pixi Stage kurulur, atlas yüklenir, tahta üretilir).
4. `start()` → bölüm başlar, süre sayacı işler.
5. Arka plana geçiş → `pause()`, dönüş → `resume()` (Capacitor lifecycle — A4).
6. Çıkış → `exit()`: Stage destroy, listener'lar temizlenir; örnek yeniden kullanılamaz.

**Gereksinimler (FR-1):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-1.1 | Modül `IGameModule`'ü uygular ve `id === "shapetris"` döner | AK-1.1 |
| FR-1.2 | Yaşam döngüsü kontrat state machine ile birebir (yanlış sıra → `GameModuleError`) | AK-1.2 |
| FR-1.3 | `exit` sonrası event yayılmaz; kaynaklar serbest bırakılır | AK-1.3 |
| FR-1.4 | Skor/bölüm/ipucu/kayıt olayları `GameEventMap` imzalarıyla yayınlanır | AK-1.4 |

**Kabul Senaryoları (GWT):**
1. **AK-1.1 — GIVEN** modül yüklü **WHEN** `id` okunur **THEN** `"shapetris"` döner
2. **AK-1.2 — GIVEN** modül `idle` **WHEN** `start()` çağrılır **THEN** `NOT_INITIALIZED` hatası fırlar; `init` iki kez çağrılırsa `WRONG_STATE`
3. **AK-1.3 — GIVEN** modül `exit()` edildi **WHEN** `score` olayı tetiklenmeye çalışılır **THEN** dinleyicilere İLETİLMEZ (sessiz)
4. **AK-1.4 — GIVEN** bölüm biter **WHEN** `levelCompleted` yayınlanır **THEN** payload `{levelId: "shapetris.<levelNo>"}` biçimindedir ve shell'e ulaşır

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-1.1 | id sabiti | unit | ⬜ |
| AK-1.2 | state makinesi hataları | unit | ⬜ |
| AK-1.3 | exit sonrası sessizlik | unit | ⬜ |
| AK-1.4 | event payload şeması | unit | ⬜ |

**T Görev Listesi:**
- [ ] T-3: `module-state.ts` — durum makinesi + event yayını (MockGame deseni)
- [ ] T-4: `index.ts` — `ShapetrisModule` (IGameModule uygulaması)
- [ ] T-13: `apps/app` — registerGame kaydı + Home butonu

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| `exit` sonrası `start` | `WRONG_STATE` (stopped → dönüş yok) |
| Event'e abone yok | Sessiz düşer (kontrat) |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/shapetris/model/module-state.ts` | Durum makinesi + emit |
| `apps/games/src/shapetris/index.ts` | IGameModule uygulaması |
| `apps/app/src/features/game-shell/*` | Kayıt çağrısı (uygulama tarafı) |

---

### 6.2 UC-2 — Tahta ve Bölüm Üretimi

**Status:** 🟢 Doğrulanmış

**Kapsam:**
- dahil: 12×12 tahta; 2 hücre mavi kenar; 8×8 hedef alan; kırmızı yasaklı hücreler; yeşil hedef şekil üretimi (K5 formülü); bölüm ilerlemesi (`levelNo` artar, `maxLevel` kaydı).
- hariç: günlük puzzle şekilleri (A1); kullanıcı tasarımı seviyeler; tema varyasyonları (K2).

**Akış:**
1. `init` → `level.ts#generateLevel(levelNo, difficulty)` → hedef matrisi (8×8).
2. Tahta kurulur: kenar mavi (serbest), hedef hücreler yeşil, kalan iç hücreler kırmızı (yasaklı).
3. `start` → tepsi doldurulur (2 aktif + 2 sonraki parça).
4. Zafer → `levelNo+1`, yeni bölüm üretilir; `saveRequested` ile `maxLevel` shell'e iletilir.

**Gereksinimler (FR-2):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-2.1 | Tahta 12×12; kenar 2 hücre mavi serbest | AK-2.1 |
| FR-2.2 | Hedef şekil `max_tiles = min(144, 10+level)` parça dolgusu + `tiles_to_remove = min(32, level/5)` eksiltme ile üretilir | AK-2.2 |
| FR-2.3 | İç bölgede hedef olmayan hücreler kırmızı (yerleştirilebilir; zaferde boş olmalı) | AK-2.3 |
| FR-2.4 | Bölüm geçişinde `levelNo` artar; üretim deterministik test edilebilir (seed enjeksiyonu) | AK-2.4 |

**Kabul Senaryoları (GWT):**
1. **AK-2.1 — GIVEN** yeni bölüm **WHEN** tahta kurulur **THEN** 12×12 matristir ve kenar 2 hücre "serbest (mavi)" durumundadır
2. **AK-2.2 — GIVEN** `levelNo = 5` **WHEN** hedef üretilir **THEN** dolgu parça sayısı `min(144, 15)` ve eksiltilen hücre sayısı `min(32, 1)` formülüne uyar
3. **AK-2.3 — GIVEN** üretilmiş hedef **WHEN** iç 8×8 okunur **THEN** her hücre ya hedef (yeşil) ya yasaklı (kırmızı) durumundadır; başka durum YOK
4. **AK-2.4 — GIVEN** bölüm biter **WHEN** `levelCompleted` yayınlanır **THEN** bir sonraki üretim `levelNo+1` ile yapılır

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-2.1 | tahta boyutu + kenar durumu | unit | ⬜ |
| AK-2.2 | üretim formülü sınırları | unit | ⬜ |
| AK-2.3 | hücre durum zarfı (3 durum) | unit | ⬜ |
| AK-2.4 | bölüm ilerlemesi | unit | ⬜ |

**T Görev Listesi:**
- [ ] T-5: `model/board.ts` — tahta veri yapısı + hücre durumları (serbest/yasaklı/hedef/dolu)
- [ ] T-6: `model/level.ts` — üretim formülü (seed'li RNG ile test edilebilir)

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| `levelNo` çok büyük | `max_tiles` 144'te doyar (formül sınırı) |
| Eksiltme hedefi parçalanamaz bırakırsa | Kabul — zorluk artar (eski davranış) |
| `tiles_to_remove = 0` (level<5) | Eksiltme yok; hedef = saf dolgu |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/shapetris/model/board.ts` | Tahta modeli |
| `apps/games/src/shapetris/model/level.ts` | Bölüm üretimi |

---

### 6.3 UC-3 — Parça Yönetimi (Tepsi, Sürükle-Bırak, Döndürme)

**Status:** 🟢 Doğrulanmış

**Kapsam:**
- dahil: 7 tetromino (S, Z, O, I, T, J, L) matrisleri + çapalar; 2 aktif + 2 sonraki parçalı tepsi; sürükle-bırak; dokununca 90° CW döndürme; sürükleme sırasında ±1 hücre ofset dengeleme (B7); zorluk modlarına göre sonraki parça seçimi (K6).
- hariç: parça çakışma çözümü sırasında yumuşatılmış snap animasyonu (ileriki iş — A5); klavye kontrolleri (web masaüstü ileriki iş).

**Akış:**
1. Tepsi parçaları `pieces.ts` matrislerinden çizilir (atlas parça frame'leri).
2. Kullanıcı parçayı sürükler; parça büyür (2×) ve yarı saydam olur (game feel).
3. Bırakınca: hareket ≤ `step` ise → 90° CW döndürme; aksi halde hedef hücre hesaplanır (çapa + rotasyon + pads).
4. Yerleştirme UC-4'e devredilir; başarısızsa parça tepsiye döner.

**Gereksinimler (FR-3):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-3.1 | Parça seti eski matrislerle birebir (7 parça + çapalar) | AK-3.1 |
| FR-3.2 | Dokun-bırak (≤ step) 90° CW döndürür; sürükleyip bırakınca çapa tabanlı hücre snap'i | AK-3.2 |
| FR-3.3 | Zorluk modu sonraki parça seçimini belirler (K6) | AK-3.3 |
| FR-3.4 | Tepsi her an 2 aktif + 2 sonraki parça gösterir | AK-3.4 |

**Kabul Senaryoları (GWT):**
1. **AK-3.1 — GIVEN** parça listesi **WHEN** okunur **THEN** 7 matris eski `possiblePieces` ile birebir aynıdır (S, Z, O, I, T, J, L)
2. **AK-3.2 — GIVEN** parça üzerinde sürükleme ≤ 1 hücre **WHEN** bırakılır **THEN** parça 90° CW döner ve konumu değişmez
3. **AK-3.3 — GIVEN** zorluk 0 **WHEN** sonraki parça üretilir **THEN** `(mevcut+1)%7` sırasındadır; zorluk 2'de rastgeledir
4. **AK-3.4 — GIVEN** oyun başında **WHEN** tepsi kurulur **THEN** 2 aktif + 2 sonraki parça görünür

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-3.1 | parça matris birebirlik | unit | ⬜ |
| AK-3.2 | döndürme eşiği davranışı | unit | ⬜ |
| AK-3.3 | sonraki-parça politikası | unit | ⬜ |
| AK-3.4 | tepsi kompozisyonu | unit | ⬜ |

**T Görev Listesi:**
- [ ] T-7: `model/pieces.ts` — matrisler + çapalar + rotasyon
- [ ] T-8: `lib/touch.ts` + sürükleme bağlama — drag/drop, döndürme eşiği, snap hesabı

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| Çoklu dokunma (multi-touch) | İlk parmak kazanır; ikinci parmak yok sayılır |
| Sürükleme tahta dışına | Yerleştirme RED; parça tepsiye döner (eski davranış) |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/shapetris/model/pieces.ts` | Parça seti |
| `apps/games/src/shapetris/lib/touch.ts` | Dokunmatik etkileşim |
| `apps/games/src/shapetris/ui/pieces-layer.ts` | Parça katmanı |

---

### 6.4 UC-4 — Yerleştirme ve Satır/Sütun Temizleme

**Status:** 🟢 Doğrulanmış

**Kapsam:**
- dahil: `applyPiece` (sınır + çakışma + KIRMIZI YASAK kontrolü); tam dolan satır VEYA sütunun silinmesi; silme animasyonu; yerleştirilen parçanın dolu hücre işaretlemesi.
- hariç: şelale (gravity) düşme mekaniği — YOK (tetris değil, hücreler yerinde kalır); kombine silme puanlaması (A6).

**Akış:**
1. Kullanıcı parçayı hedefe bırakır → `applyPiece(x, y, piece)`.
2. Sınır dışı / dolu çakışma / kırmızı hücre teması → RED + hata geri bildirimi, parça tepsiye döner.
3. Başarılı → hücreler "dolu" olur; tam dolu satır/sütunlar bulunur.
4. Dolu satır/sütunlar silinir (hücreler boşalır) + silme efekti.
5. Zafer kontrolü (UC-5).

**Gereksinimler (FR-4):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-4.1 | Yerleştirme sınır dışı/dolu çakışmada REDDEDİLİR | AK-4.1 |
| FR-4.2 | Kırmızı hücreye yerleştirme SERBESTTİR (K3 revizyonu); zaferde boş olmalı | AK-4.2 |
| FR-4.3 | Tam dolu satır VEYA sütun bulunursa silinir | AK-4.3 |
| FR-4.4 | Mavi (serbest) hücrelere yerleştirme SERBESTTİR | AK-4.4 |

**Kabul Senaryoları (GWT):**
1. **AK-4.1 — GIVEN** tahta sınırına taşan parça **WHEN** bırakılır **THEN** yerleştirme reddedilir, hücreler değişmez
2. **AK-4.2 — GIVEN** parça kırmızı hücreyi kaplar **WHEN** bırakılır **THEN** yerleştirme KABUL edilir (S11 — eski davranış); kırmızı satır/sütun temizlemeyle boşaltılır
3. **AK-4.3 — GIVEN** bir satır tamamen dolu **WHEN** parça yerleştirilir **THEN** o satır silinir ve hücreleri boşalır; sütun için aynı kural
4. **AK-4.4 — GIVEN** parça yalnız mavi kenara denk gelir **WHEN** bırakılır **THEN** yerleştirme kabul edilir

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-4.1 | çakışma reddi | unit | ⬜ |
| AK-4.2 | kırmızıya yerleştirme kabulü (S11) | unit | ⬜ |
| AK-4.3 | satır+sütun temizleme | unit | ⬜ |
| AK-4.4 | serbest bölge kabulü | unit | ⬜ |

**T Görev Listesi:**
- [ ] T-9: `model/board.ts#applyPiece` + `model/board.ts#cleanRowsCols` (K3 dahil)

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| Parça hem satır hem sütun doldurursa | İkisi de silinir (kesişim bir kez) |
| Silme sonucu hedef hücre boşalırsa | Zafer yanlış pozitif VERMEZ (zafer yalnız yerleştirme+silme sonrası birebir kontrol) |
| Kırmızı hücre ipucu ile silinirse | Kırmızı kalır (ipucu yalnız DOLU hücreyi siler) |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/shapetris/model/board.ts` | Yerleştirme + temizleme mantığı |

---

### 6.5 UC-5 — Zafer, Skor ve Bölüm İlerlemesi

**Status:** 🟢 Doğrulanmış

**Kapsam:**
- dahil: `checkVictory` (8×8 hedef alanın birebir dolması); bölüm skoru `10 − ipucuKullanımı`; toplam skor birikimi; `levelCompleted` + `score` event'leri; `maxLevel` kayıt talebi; GAME OVER (süre dolması) → restart akışı.
- hariç: skill puanı/katsayı hesabı (shell — README §4.3); profil seviyesi (backend FAZ-1).

**Akış:**
1. Her başarılı yerleştirme + temizleme sonrası `checkVictory()`.
2. Zafer: `score` (yeni toplam) + `levelCompleted {levelId}` yayınlanır; zafer modalı; ~1 sn sonra yeni bölüm.
3. Süre dolarsa: GAME OVER modalı (skor gösterilir), restart aynı bölümü yeniden üretir.
4. `saveRequested {payload: {maxLevel}}` her zaferde yayınlanır.

**Gereksinimler (FR-5):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-5.1 | Zafer koşulu: tüm yeşiller dolu VE tüm kırmızılar boş (S11 — eski birebir) | AK-5.1 |
| FR-5.2 | Bölüm skoru = `10 − ipucuKullanımı` (alt sınır 1); toplama eklenir | AK-5.2 |
| FR-5.3 | Zaferde `levelCompleted` (levelId) + `score` (toplam) yayınlanır | AK-5.3 |
| FR-5.4 | Süre dolunca GAME OVER; restart aynı bölümden başlar, toplam skor KORUNUR | AK-5.4 |

**Kabul Senaryoları (GWT):**
1. **AK-5.1 — GIVEN** hedef alanın tüm yeşil hücreleri dolu ve kırmızılar boş **WHEN** kontrol edilir **THEN** zafer ilan edilir; kırmızı doluysa zafer YOK
2. **AK-5.2 — GIVEN** bölümde 2 ipucu kullanıldı **WHEN** bölüm biter **THEN** bölüm skoru 8'dir ve toplama eklenir
3. **AK-5.3 — GIVEN** zafer **WHEN** event yayınlanır **THEN** `levelCompleted.levelId` = `shapetris.<levelNo>` ve `score.score` güncel toplamdır
4. **AK-5.4 — GIVEN** süre biter **WHEN** restart'a dokunulur **THEN** aynı `levelNo` yeniden üretilir, toplam skor aynı kalır

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-5.1 | zafer kontrolü | unit | ⬜ |
| AK-5.2 | skor formülü | unit | ⬜ |
| AK-5.3 | event şeması | unit | ⬜ |
| AK-5.4 | game over/restart | unit | ⬜ |

**T Görev Listesi:**
- [ ] T-10: `model/scoring.ts` + zafer/game-over akışı

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| İpucu sayısı 9+'ya ulaşırsa | Bölüm skoru alt sınır 1'de sabitlenir |
| Zafer anında süre aynı anda dolarsa | Zafer önceliklidir (önce zafer kontrolü) |
| Restart sonrası ipucu sayacı | Sıfırlanır (bölüme özgüdür) |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/shapetris/model/scoring.ts` | Skor + bölüm akışı |

---

### 6.6 UC-6 — İpucu Entegrasyonu (Eski Ad-Yardımları)

**Status:** 🟢 Doğrulanmış

**Kapsam:**
- dahil: iki ipucu türü — `shapetris.kenar-temizle` (mavi halkanın tamamını boşaltır) ve `shapetris.hucre-sil` (seçilen tek dolu hücreyi siler); `hintRequested` yayını; shell onayı gelince uygulama; kullanım sayacı (bölüm skoruna etki — K15).
- hariç: coin/reklam kararı ve kotası (shell — README §7.3); reklam SDK entegrasyonu; ipucu olmayan başka yardım türleri.

**Akış:**
1. Kullanıcı yardım butonuna dokunur (DOM katmanı).
2. Modül `hintRequested {hintType}` yayınlar, bekleme durumuna geçer (yeni yerleştirme almaz).
3. Shell onaylarsa (coin düşümü / reklam gösterimi) modül ilgili temizliği uygular; ret ederse hiçbir şey olmaz.
4. Uygulanan ipucu kullanım sayacını 1 artırır (skor etkisi — UC-5).

**Gereksinimler (FR-6):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-6.1 | `kenar-temizle` mavi halkadaki tüm dolu hücreleri boşaltır | AK-6.1 |
| FR-6.2 | `hucre-sil` yalnız seçilen DOLU hücreyi boşaltır; boş hücrede işlem yapılmaz | AK-6.2 |
| FR-6.3 | İpucu akışı `hintRequested` üzerinden; modül karar VERMEZ | AK-6.3 |
| FR-6.4 | Her ipucu uygulaması bölüm skorundan 1 düşürür | AK-6.4 |

**Kabul Senaryoları (GWT):**
1. **AK-6.1 — GIVEN** mavi halkada dolu hücreler var **WHEN** `kenar-temizle` uygulanır **THEN** halkanın tüm hücreleri boşalır, iç bölge değişmez
2. **AK-6.2 — GIVEN** dolu bir hücre seçildi **WHEN** `hucre-sil` uygulanır **THEN** o hücre boşalır; boş hücre seçilirse işlem olmaz
3. **AK-6.3 — GIVEN** kullanıcı yardım ister **WHEN** modül çalışır **THEN** `hintRequested {hintType}` yayınlanır ve uygulama shell onayından SONRA gerçekleşir
4. **AK-6.4 — GIVEN** 1 ipucu uygulandı **WHEN** bölüm biter **THEN** bölüm skoru 1 eksik hesaplanır

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-6.1 | kenar temizleme | unit | ⬜ |
| AK-6.2 | hücre silme | unit | ⬜ |
| AK-6.3 | event akışı (onay-güdümlü) | unit | ⬜ |
| AK-6.4 | skor etkisi | unit | ⬜ |

**T Görev Listesi:**
- [ ] T-11: ipucu türleri + onay-güdümlü uygulama akışı (K8, A3 ile birlikte)

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| İpucu isteği sırasında pause | İstek iptal olur; sayaç artmaz |
| `hucre-sil` hedef (yeşil) hücreyi boşaltırsa | Hücre boşalır; zafer ancak tekrar doldurulunca |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/shapetris/model/board.ts` | İpucu temizleme fonksiyonları |
| `apps/games/src/shapetris/index.ts` | hintRequested yayını + onay bekletme |

---

### 6.7 UC-7 — Responsive Layout (p/l oryantasyon)

**Status:** 🟢 Doğrulanmış

**Kapsam:**
- dahil: `calculateLayout(viewport) → LayoutMetrics` saf fonksiyonu; p (dikey) / l (yatay) oryantasyon yerleşimleri; eski matematik (B8) korunur; resize/orientation-change'e dinamik uyum; game-shell alanına sığma garantisi (taşma YOK).
- hariç: safe-area/notch dengelemesi (A4); masaüstü pencere boyutlandırma sihri.

**Akış:**
1. Modül, shell'in verdiği container boyutunu (px) okur.
2. `calculateLayout` → `{orient, step, indent, xStart, yStart, panelRect, traySlots}`.
3. Tüm sprite konumları LayoutMetrics'ten türetilir (sabit piksel YOK).
4. Container boyutu değişince layout yeniden hesaplanır, sahneler yeniden konumlanır.

**Gereksinimler (FR-7):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-7.1 | `step = min(0.85·uzunKenar/coef, kısaKenar/12)`; `coef = oran ≤ 3/2 ? 18 : 12` | AK-7.1 |
| FR-7.2 | Oyun `phoneArea` telefon kolonunda (≤480px, yatay ortalı) her zaman dikey yerleşimle çizilir; tepsi alt panelde | AK-7.2 |
| FR-7.3 | Viewport değişiminde yeniden hesap — taşma/sıfır step YOK | AK-7.3 |

**Kabul Senaryoları (GWT):**
1. **AK-7.1 — GIVEN** 390×844 (dikey) viewport **WHEN** layout hesaplanır **THEN** `orient = p` ve `step ≤ 390/12`'dir
2. **AK-7.2 — GIVEN** 1920×1080 (masaüstü) viewport **WHEN** layout hesaplanır **THEN** oyun alanı 480×1080 kolona sıkışır (S14) ve tahta alana sığar
3. **AK-7.3 — GIVEN** 1024×1024 viewport **WHEN** layout hesaplanır **THEN** tüm bölgeler (tahta+tepsi+butonlar) canvas içinde kalır (negatif koordinat YOK)

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-7.1 | step/coef formülü | unit | ⬜ |
| AK-7.2 | telefon alanı (S14) | unit | ⬜ |
| AK-7.3 | taşma yok (çoklu viewport) | unit | ⬜ |

**T Görev Listesi:**
- [ ] T-12: `model/layout.ts#calculateLayout` (saf fonksiyon + viewport testleri)

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| Çok küçük viewport (step < 8px) | Alt sınır `step ≥ 8px`; altında oyun oynanamaz uyarısı (kabul: mobil hedef) |
| Kare viewport (1:1) | p kabul edilir (eski davranış: `y >= x → p`) |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/shapetris/model/layout.ts` | Saf layout hesabı |
| `apps/games/src/shapetris/ui/ShapetrisStage.tsx` | Layout'u sahneye uygulama |

---

### 6.8 UC-8 — Zorluk Modları ve Süre Sayacı

**Status:** 🟢 Doğrulanmış

**Kapsam:**
- dahil: 3 zorluk modu (K6); bölüm başına geri sayım; her 10 bölümde sürenin bir adım kısalması; süre bitince GAME OVER (UC-5'e bağlanır).
- hariç: zorluk seçim ekranı (başlangıçta sabit zorluk — A7); süre uzatma iksiri (ileriki iş).

**Akış:**
1. Bölüm başında süre kurulur (başlangıç değeri + bölüm başına azalma — JSDoc'ta sabitlenir).
2. Süre ilerler; pause'ta durur.
3. Her 10. bölüm geçişinde süre `timer.duration − timer.second` kısaltılır (B10).
4. Süre 0 → GAME OVER akışı.

**Gereksinimler (FR-8):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-8.1 | 3 zorluk modu sonraki-parça politikasını belirler (K6) | AK-8.1 |
| FR-8.2 | Süre pause'ta DONAR, resume'da devam eder | AK-8.2 |
| FR-8.3 | Her 10 bölümde süre bir `timer.second` adımı kısalır; 0'a inerse GAME OVER | AK-8.3 |

**Kabul Senaryoları (GWT):**
1. **AK-8.1 — GIVEN** zorluk 0 **WHEN** tepsi yenilenir **THEN** deterministik dizi `(cur+1)%7` kullanılır (FR-3.3 ile tutarlı)
2. **AK-8.2 — GIVEN** süre işliyor **WHEN** `pause()` çağrılır **THEN** sayaç durur; `resume()` ile kaldığı yerden devam eder
3. **AK-8.3 — GIVEN** 10. bölüm geçildi **WHEN** yeni bölüm başlar **THEN** süre bir adım kısadır

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-8.1 | zorluk politikası | unit | ⬜ |
| AK-8.2 | pause/resume sayaç | unit | ⬜ |
| AK-8.3 | süre azaltma | unit | ⬜ |

**T Görev Listesi:**
- [ ] T-14: süre sayacı + zorluk modu parametresi (model katmanında; DOM timer değil)

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| Pause'ta zafer modalı açıksa | Sayaç durur; resume'da zafer akışı öncelikli |
| Süre azaltması negatife inerse | Alt sınır 1 adımda sabitlenir |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/shapetris/model/module-state.ts` | Timer durumu |

---

### 6.9 UC-9 — Görsel Katman (Sprite Sheet + Sahne)

**Status:** 🟢 Doğrulanmış

**Kapsam:**
- dahil: sprite sheet'in `ui/atlas.ts` dilimleme tablosu (§3.3 koordinatları — T-2'de görsel doğrulama); 12×12 karo sahnesi; parça sprite'ları; silme/yerleştirme efektleri (v8 tween — eski AnimatedSprite yerine); DOM üstü kontrol katmanı (K14).
- hariç: ses efektleri (A8); tema sistemi (K2); tam animasyonlu patlama sprite'ları (A5).

**Akış:**
1. `init`: atlas tablosundan Texture'lar oluşturulur (tek sheet, frame rect'ler).
2. Tahta: her hücre karosu durumuna göre (red/green/blue off/on) sprite alır.
3. Parçalar: gri tetromino frame'leri; sürüklemede büyüme + alpha (game feel).
4. Silme: hücre tween ile küçülüp kaybolur (500ms ruhunu korur, v8 API).
5. Kontroller: React DOM (yeniden başlat, geri, ipucu butonları) — i18n `t("shapetris.*")`.

**Gereksinimler (FR-9):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-9.1 | Atlas tek sheet'ten; frame koordinatları atlas.ts'te TEK kaynak | AK-9.1 |
| FR-9.2 | Karo durumu → doğru frame eşlemesi (off/on) | AK-9.2 |
| FR-9.3 | DOM kontrol katmanı Türkçe metin (FR-3.4 uyumu) | AK-9.3 |

**Kabul Senaryoları (GWT):**
1. **AK-9.1 — GIVEN** atlas tablosu **WHEN** yüklenir **THEN** tüm frame rect'leri sheet sınırları (1024×1024) içindedir
2. **AK-9.2 — GIVEN** hücre durumu `hedef+dolu` **WHEN** çizilir **THEN** green-on frame'i kullanılır
3. **AK-9.3 — GIVEN** oyun ekranı **WHEN** incelenir **THEN** tüm görünür metinler Türkçedir

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-9.1 | frame sınır kontrolü | unit | ⬜ |
| AK-9.2 | durum→frame eşlemesi | unit | ⬜ |
| AK-9.3 | TR metinler | gözle | ⬜ |

**T Görev Listesi:**
- [ ] T-1: sprite sheet'i `apps/games/src/shapetris/assets/` altına kopyala (kaynak: Downloads)
- [ ] T-2: atlas koordinatlarını GÖRSEL doğrula (sheet'i inceleyerek §3.3 tablosunu kesinleştir) → `ui/atlas.ts`
- [ ] T-15: `ui/ShapetrisStage.tsx` — @pixi/react Stage + karo/parça katmanları + tween'ler
- [ ] T-16: DOM kontrol katmanı + i18n anahtarları (`shapetris.*`)

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| Sheet yüklenemez | Modül `init` başarısız olur (hata fırlatır), shell kullanıcıyı bilgilendirir |
| Frame boşluğu (padding) | Atlas rect'lerinde karo sınırından 1px içeride kırpma (bleed koruması) |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/shapetris/assets/*.png` | Sprite sheet |
| `apps/games/src/shapetris/ui/atlas.ts` | Dilimleme tablosu |
| `apps/games/src/shapetris/ui/ShapetrisStage.tsx` | Sahne |
| `apps/app/src/shared/lib/i18n.ts` | TR sözlük |

---

### 6.10 UC-10 — App Entegrasyonu (Home + Lazy Load)

**Status:** 🟢 Doğrulanmış

**Kapsam:**
- dahil: `registerGame("shapetris", ...)` kaydı; HomePage'de "Shapetris" butonu; `loadGame` + `init/start` çağrısı; modül chunk'ının lazy yüklenmesi (FR-4.2); çıkışta `exit`.
- hariç: oyun seçim sayfası (K10); çoklu oyun ekranı yönetimi.

**Akış:**
1. App başlatma kodunda kayıt (tek satır, loader).
2. Home → buton → `loadGame` → `init` → `start`.
3. Modül DOM'a sahneyi bağlar (portal/overlay).
4. Geri/çıkış → `exit()` → Home'a dönüş.

**Gereksinimler (FR-10):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-10.1 | `shapetris` shell'e kayıtlı ve lazy chunk olarak paketlenir | AK-10.1 |
| FR-10.2 | Home'dan tek dokunuşla oyun başlar; çıkışta Home'a dönülür | AK-10.2 |
| FR-10.3 | Kayıtsız/hatalı yüklemede kullanıcıya anlaşılır TR hata mesajı | AK-10.3 |

**Kabul Senaryoları (GWT):**
1. **AK-10.1 — GIVEN** uygulama derlenir **WHEN** bundle incelenir **THEN** shapetris modülü ayrı chunk'tadır (ana bundle'da değil)
2. **AK-10.2 — GIVEN** Home ekranı **WHEN** "Shapetris" butonuna dokunulur **THEN** oyun başlar; çıkışla Home'a dönülür
3. **AK-10.3 — GIVEN** modül yüklenemez **WHEN** butona dokunulur **THEN** TR hata mesajı gösterilir (sessiz çökme YOK)

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-10.1 | lazy chunk | e2e (build çıktısı) | ⬜ |
| AK-10.2 | başlat/çıkış akışı | e2e | ⬜ |
| AK-10.3 | hata mesajı | e2e | ⬜ |

**T Görev Listesi:**
- [ ] T-13: Home butonu + registerGame + loadGame akışı (UC-1 ile birlikte)

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| Çift tıklama | İkinci tıklama yok sayılır (yükleme kilidi) |
| Oyun açıkken sayfa yenilenir | Modül yeniden yüklenir, bölüm baştan (saveRequested ile kayıt shell'de) |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/app/src/app/App.tsx` | Kayıt |
| `apps/app/src/pages/home/ui/HomePage.tsx` | Buton |
| `apps/app/src/shared/lib/i18n.ts` | Metinler |

---

### 6.11 UC-11 — Kampanya: Hazır Bölüm Yükleme ve İlerleme

**Status:** 🟢 Doğrulanmış

**Kapsam:**
- dahil: `assets/levels/{kolay,orta,zor}/level0..99.json` yükleme (lazy glob); 8×8 doğrulama (`parseLevel`); kampanya modunda bölüm ilerlemesi (zafer → sonraki bölüm, 99'da tamamlanma); `levelCompleted.levelId = shapetris.{zorluk}.{n}`; `saveRequested` checkpoint payload'ı.
- hariç: bölüm editleyici; kullanıcı tasarımı; kilit mantığı (UC-12/hub'ın işi — modül girdiye güvenir).

**Akış:**
1. Hub → `ShapetrisModule({mode:"campaign", campaignDifficulty, startLevel})` → `init` ilgili JSON'u yükler.
2. Zafer → `levelNo+1`; 99 biter → `completed` payload'ı.
3. Çıkış/zafer anında `saveRequested` yayınlanır (checkpoint).

**Gereksinimler (FR-11):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-11.1 | Bölüm JSON'u 8×8 boolean matrise dönüştürülür; bozuk dosya → hata (sessiz DEĞİL) | AK-11.1 |
| FR-11.2 | Kampanyada zafer `levelNo+1`'i yükler; son bölümde tamamlanma işareti | AK-11.2 |
| FR-11.3 | Checkpoint payload'ı `{mode, difficulty, levelNo, totalScore, completed}` | AK-11.3 |

**Kabul Senaryoları (GWT):**
1. **AK-11.1 — GIVEN** geçerli `level12.json` **WHEN** yüklenir **THEN** 8×8 boolean matris döner; 7×8 dosya REDDEDİLİR
2. **AK-11.2 — GIVEN** kampanya bölümü 5 **WHEN** zafer **THEN** sonraki bölüm 6 yüklenir; 99'da tamamlanma işaretlenir
3. **AK-11.3 — GIVEN** bölüm geçilir **WHEN** event yayınlanır **THEN** payload şemaya uyar

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-11.1 | parseLevel doğrulama | unit | ⬜ |
| AK-11.2 | kampanya ilerlemesi | unit | ⬜ |
| AK-11.3 | payload şeması | unit | ⬜ |

**T Görev Listesi:**
- [ ] T-17: `model/level.ts#parseLevel` + testler
- [ ] T-18: `lib/levels.ts` (lazy glob) + modül kampanya modu

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| Eksik dosya (glob hatası) | `ASSET_LOAD_FAILED` — init fırlatır |
| 99 sonrası ilerleme | `completed = true`; daha fazla bölüm YOK |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/shapetris/assets/levels/**` | 300 hazır bölüm |
| `apps/games/src/shapetris/model/level.ts` | parseLevel + seedFromString |
| `apps/games/src/shapetris/lib/levels.ts` | Lazy bölüm yükleyici |
| `apps/games/src/shapetris/index.ts` | Kampanya modu |

---

### 6.12 UC-12 — Hub: Zorluk Seçimi, Checkpoint ve Kilitler

**Status:** 🟢 Doğrulanmış

**Kapsam:**
- dahil: Home'da Shapetris ikon kartı; hub sayfası (kısa tanıtım + 3 zorluk kartı ilerlemeli + "Devam Et" + günlük + sonsuz + "Nasıl Oynanır?"); zorluk kilitleri (K19); localStorage checkpoint (K21).
- hariç: oyun listesi genel sayfası (İleri İş); backend senkronu (FAZ-1); profil entegrasyonu.

**Akış:**
1. Home → Shapetris kartı → hub.
2. Hub checkpoint okur; kilit durumunu hesaplar (kolay→orta→zor).
3. "Devam Et" → checkpoint zorluğu/bölümüyle modül başlar.
4. Modül `saveRequested` → hub localStorage'a yazar.

**Gereksinimler (FR-12):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-12.1 | Hub 3 zorluk kartı gösterir; her kart ilerlemeyi ve kilit durumunu | AK-12.1 |
| FR-12.2 | "Devam Et" en son checkpoint'ten başlatır (yoksa Kolay 0) | AK-12.2 |
| FR-12.3 | saveRequested payload'ı localStorage'a yazılır | AK-12.3 |

**Kabul Senaryoları (GWT):**
1. **AK-12.1 — GIVEN** kolay tamamlanmadı **WHEN** hub açılır **THEN** Orta ve Zor kilitli görünür
2. **AK-12.2 — GIVEN** checkpoint `{orta, 12}` **WHEN** "Devam Et"e dokunulur **THEN** Orta 12 başlar
3. **AK-12.3 — GIVEN** bölüm geçilir **WHEN** event yayınlanır **THEN** localStorage checkpoint güncellenir

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-12.1 | kart durumları | gözle | ⬜ |
| AK-12.2 | devam akışı | gözle | ⬜ |
| AK-12.3 | kayıt kalıcılığı | unit (hub lib) | ⬜ |

**T Görev Listesi:**
- [ ] T-19: `apps/app` — Home kartı + hub sayfası + checkpoint/kilit lib'i

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| Bozuk localStorage | Varsayılan: Kolay 0, kilitli her şey |
| İki kez tıklama | Yükleme kilidi (mevcut desen) |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/app/src/pages/shapetris-hub/**` | Hub sayfası |
| `apps/app/src/pages/home/ui/HomePage.tsx` | Oyun kartı |
| `apps/app/src/features/game-shell/**` | Kayıt glue (App katmanı) |

---

### 6.13 UC-13 — İlk Oyun Dersi (3 Adımlı Overlay)

**Status:** 🟢 Doğrulanmış

**Kapsam:**
- dahil: İlk oyunda canlı tahtanın üstünde 3 adımlı overlay (sürükle → bırak/yeşil → satır-sütun temizliği); "Geç" ile atlanabilir; bir kez gösterilir (`tutorialDone` bayrağı — K18).
- hariç: Eski 1454 satırlık slayt sekansının birebir portu; video anlatım.

**Akış:**
1. Hub, `tutorialDone` yoksa modülü `tutorial: true` ile başlatır.
2. Overlay 1/3..3/3 adım adım ilerler; "Geç"/bitiş → `onTutorialDone` → hub bayrağı yazar.

**Gereksinimler (FR-13):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-13.1 | Overlay 3 adım + atlama sunar; oyunu BLOKLAMAZ | AK-13.1 |
| FR-13.2 | Bitince bayrak yazılır; sonraki oyunlarda gösterilmez | AK-13.2 |

**Kabul Senaryoları (GWT):**
1. **AK-13.1 — GIVEN** ilk oyun **WHEN** açılır **THEN** 3 adımlı overlay görünür; "Geç" ile kapanır
2. **AK-13.2 — GIVEN** ders bitti **WHEN** oyun yeniden açılır **THEN** overlay GÖSTERİLMEZ

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-13.1 | overlay akışı | gözle | ⬜ |
| AK-13.2 | bayrak kalıcılığı | gözle | ⬜ |

**T Görev Listesi:**
- [ ] T-20: `ShapetrisRoot` tutorial overlay + bayrak callback

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/shapetris/ui/ShapetrisRoot.tsx` | Overlay |

---

### 6.14 UC-14 — Günlük ve Sonsuz Modlar

**Status:** 🟢 Doğrulanmış

**Kapsam:**
- dahil: Günlük mod (tarih tohumu — herkes aynı puzzle; zafer → tamamlandı, ilerleme YOK); Sonsuz mod (sayaç tohumu — "sonraki" ile sonsuz); Sonsuz Zor kampanyası bitince açılır (K20).
- hariç: lider tablosu; günlük görev zinciri; sosyal paylaşım.

**Akış:**
1. Hub → günlük/sonsuz kartı → modül `mode:"daily"|"endless"` ile başlar.
2. Günlük: `seedFromString("gunluk.YYYY-MM-DD")`; zafer → "Tamamlandı" (otomatik ilerleme YOK).
3. Sonsuz: `seedFromString("sonsuz.<sayaç>")`; zafer → sayaç+1 → yeni puzzle.

**Gereksinimler (FR-14):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-14.1 | Günlük puzzle aynı tarihte deterministik olarak aynıdır | AK-14.1 |
| FR-14.2 | Sonsuz mod sayaçla sonsuz benzersiz puzzle üretir | AK-14.2 |
| FR-14.3 | Günlükte zafer sonrası otomatik ilerleme YOK | AK-14.3 |

**Kabul Senaryoları (GWT):**
1. **AK-14.1 — GIVEN** aynı tarih **WHEN** günlük puzzle üretilir **THEN** aynı hedef matris döner (farklı tarih → farklı)
2. **AK-14.2 — GIVEN** sayaç 0,1,2 **WHEN** sonsuz puzzle üretilir **THEN** üç farklı hedef döner; aynı sayaç tekrar aynı hedef
3. **AK-14.3 — GIVEN** günlük zafer **WHEN** modal açılır **THEN** "Sonraki Bölüm" YOK — "Tamamlandı" durumu

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-14.1 | günlük determinizmi | unit | ⬜ |
| AK-14.2 | sonsuz determinizmi | unit | ⬜ |
| AK-14.3 | günlük zafer akışı | unit/kod inceleme | ⬜ |

**T Görev Listesi:**
- [ ] T-21: `model/level.ts#seedFromString` + modül modları (daily/endless)

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/shapetris/model/level.ts` | seedFromString |
| `apps/games/src/shapetris/index.ts` | Mod modları |

---

## 7. Yaşam Döngüsü ve Hata Kategorileri

| Durum | Davranış |
| :---- | :------- |
| idle | Modül yüklü; kaynak ayrılmadı |
| initialized | `init` bitti: atlas + sahne kuruldu, tahta üretildi |
| running | Oynanabilir; süre sayacı işler |
| paused | Sayaç durur; yerleştirme/ipucu isteği reddedilir (ipucu iptal) |
| stopped | `exit` sonrası: Stage destroy, listener temizliği; geri dönüş YOK |

**Modül-içi hata kategorileri (kontratınkine ek):**

| Kategori | Anlam |
| :------- | :---- |
| `ASSET_LOAD_FAILED` | Sprite sheet yüklenemedi — `init` fırlatır |
| `LAYOUT_INVALID` | Viewport ölçülemedi / sıfır boyut — sahne kurulmaz |

**Yan etkiler:** `init` atlas+Stage ayırır; `exit` bunları serbest bırakır (ZORUNLU — kontrat).
**Limitler:** Tek modül örneği; aynı anda tek shell; DOM üstü kontrol katmanı oyun alanının %12'sini aşmaz (tepki alanı rezervi).

---

## 8. Başarı Kriterleri (SC-x)

| Kod | Kriter | Ölçüm |
| :-- | :---- | :---- |
| SC-1 | `model/` katmanı %100 saf (Pixi/DOM import'u 0) — check-purity benzeri grep ile doğrulanır | coverage/kod inceleme |
| SC-2 | Mekanik birebirlik: `applyPiece`/`cleanRowsCols`/`checkVictory` davranışları eski oyuna denk (K3 istisnası hariç) | unit (davranış tablosu) |
| SC-3 | Responsive: 6 referans viewport'ta (390×844, 844×390, 1024×1024, 360×640, 768×1024, 1280×720) taşma/negatif koordinat yok | unit |
| SC-4 | `bun run check` yeşil: games paketi lint/typecheck/test gerçek testlerle (echo stub değil) | CI komutu |
| SC-5 | Home → Shapetris → oyna → çık flow'u 1 dokunuşla; hata durumunda TR mesaj | e2e |
| SC-6 | Lazy chunk: ana bundle shapetris kodu içermez | e2e (build çıktısı) |

---

## 9. Aşama Eşlemesi (iş akışı)

| Aşama | Ürün |
| :---- | :---- |
| 1. SPEC | Bu doküman |
| 2. JSDoc | `model/*` sözleşmeleri: board (applyPiece/cleanRowsCols/checkVictory/ipuçları), level (generateLevel), layout (calculateLayout/LayoutMetrics), scoring, pieces (matris+çapa+rotasyon), module-state (durum makinesi+emit), IHintHost (A3) |
| 3. TEST | KIRMIZI: `apps/games/src/shapetris/model/*.test.ts` (tahta/parça/seviye/layout/skor/durum), app tarafı e2e stub'ları |
| 4. IMPL | T-1 … T-16 (Bakınız §12) |
| 5. KAPANIŞ | Bu dokümanın §A/§B güncellemesi (Doğrulama + Test Kapsamı) |

---

## 10. Açık Kararlar

| # | Konu | Durum |
| :-- | :---- | :---- |
| A1 | Günlük puzzle (eski `dailyPuzzle.js`) | İleriki SPEC'e ertelendi (K11) |
| A2 | Atlas'taki "alternatif" karo varyantları (aynı rengin 2. kopyası) kullanılacak mı | AÇIK — atlas programatik ön-analizle kuruldu (`ui/atlas.ts`); sheet'in GÖRSEL doğrulaması kullanıcıda bekliyor |
| A3 | İpucu onayının modüle dönüş mekanizması | KAPANDI (2026-11-04) — `ShapetrisHintHost` constructor enjeksiyonu; `IGameModule` kontratı DEĞİŞMEDİ |
| A4 | Safe-area/notch dengelemesi (Capacitor StatusBar) | İlk mobil cihaz testinde kapanır; olası ileriki iş |
| A5 | Gelişmiş animasyonlar (patlama sprite, snap yumuşatması) | İleri iş — v1 tween'lerle yeterli |
| A6 | Silme puanlaması (satır/sütun başına puan) | Ürün kararı — mevcut skor formülü korundu (K15) |
| A7 | Zorluk seçim ekranı | Başlangıçta sabit zorluk (shell parametresi); ekran ileriki iş |
| A8 | Ses efektleri (eski `assets/sounds/*` taşınacak mı) | Ürün onayı bekliyor; v1 sessiz kabul edilebilir |
| A9 | Ürün/marka adı değişimi: "Shapetris" → "**TetroVizyon**" (görünür metinler: Home kartı, i18n, hub başlığı) | KAPANDI (2026-11-07) — teknik ID `shapetris` DEĞİŞMEDİ (kod/paket/checkpoint anahtarları aynı); yalnız görünür metinler güncellendi |

---

## 11. İleri İş (bu pakette YAPILMAZ — referans)

1. Oyun seçim sayfası + modül listesi UI — `apps/app` (K10)
2. Günlük puzzle modu — `docs/FAZ-SHAPETRIS-GUNLUK-SPEC.md` adayı (A1)
3. Skill puanı/aksiyonu shell tarafında (README §4.3 — shell'in işi, bu pakette değil)
4. Diğer oyun modernizasyonları: Refleks, Hesaplama (FAZ-1'in sonraki paketleri)
5. Reklam SDK'sı (AdMob) shell tarafında (README §7.5)

---

## 12. T Görev Özeti

| # | Görev | UC |
| :- | :---- | :- |
| T-1 | Sprite sheet'i `apps/games/src/shapetris/assets/` altına kopyala | UC-9 |
| T-2 | Atlas koordinatlarını görsel doğrula → `ui/atlas.ts` (A2 kapanışı) | UC-9 |
| T-3 | `model/module-state.ts` — durum makinesi + event yayını | UC-1 |
| T-4 | `index.ts` — `ShapetrisModule` (IGameModule) | UC-1 |
| T-5 | `model/board.ts` — tahta + hücre durumları | UC-2 |
| T-6 | `model/level.ts` — bölüm üretimi (seed'li) | UC-2 |
| T-7 | `model/pieces.ts` — 7 parça + çapa + rotasyon | UC-3 |
| T-8 | `lib/touch.ts` — drag/drop + döndürme eşiği | UC-3 |
| T-9 | `board.ts#applyPiece` + `board.ts#cleanRowsCols` (K3) | UC-4 |
| T-10 | `model/scoring.ts` + zafer/game-over | UC-5 |
| T-11 | İpucu türleri + onay-güdümlü akış (K8, A3) | UC-6 |
| T-12 | `model/layout.ts#calculateLayout` + viewport testleri | UC-7 |
| T-13 | Home butonu + registerGame + loadGame (app tarafı) | UC-1, UC-10 |
| T-14 | Süre sayacı + zorluk parametresi | UC-8 |
| T-15 | `ui/ShapetrisStage.tsx` — sahne + katmanlar + tween | UC-9 |
| T-16 | DOM kontrol katmanı + i18n anahtarları | UC-9 |
| T-17 | `model/level.ts#parseLevel` doğrulama + testler | UC-11 |
| T-18 | `lib/levels.ts` (lazy glob) + kampanya modu | UC-11 |
| T-19 | Home kartı + hub sayfası + checkpoint/kilit lib'i | UC-12 |
| T-20 | İlk oyun dersi overlay + bayrak | UC-13 |
| T-21 | `seedFromString` + günlük/sonsuz modları | UC-14 |

**İş sırası (bağımlılık):** T-2 → T-1/T-15 (görsel); T-3/T-4 → T-5/T-6/T-7 → T-9 → T-10/T-11 → T-12 → T-8 → T-13 → T-14 → T-16. İçerik paketi: T-17/T-21 (model) → T-18 (modül modları) → T-20 (overlay) → T-19 (hub). Model testleri (RED) her model görevinden önce.

---

## A. DOĞRULAMA (§A)

### A.1 Değişiklik Matrisi

| # | Dosya | Değişiklik | Neden (SPEC ref) |
| :-- | :------ | :----------- | :----------------- |
| 1 | `apps/games/package.json` | Gerçek paket: exports (`./shapetris`), test/lint/typecheck hedefleri, pixi/react bağımlılıkları | SC-4, K9, T-1..T-16 |
| 2 | `apps/games/tsconfig.json` | JSX + DOM lib'leri + shared paths | UC-9 (tsx sahne) |
| 3 | `apps/games/scripts/check-purity.ts` | Model purity lint (SC-1) | SC-1, §5 |
| 4 | `apps/games/src/shapetris/model/pieces.ts` | 7 parça + çapa + rotasyon (eski ile birebir) | UC-3, AK-3.1, B2 |
| 5 | `apps/games/src/shapetris/model/board.ts` | Tahta, applyPiece/canPlace (S11 kırmızı serbest), cleanRowsCols, checkVictory (yeşil dolu + kırmızı boş), ipuçları | UC-2/UC-4/UC-6 |
| 6 | `apps/games/src/shapetris/model/level.ts` | Bölüm üretimi (eski loadLevel formülü, seed'li RNG) | UC-2, AK-2.2/2.4, B5 |
| 7 | `apps/games/src/shapetris/model/layout.ts` | calculateLayout (eski step/indent matematiği, S14 tek oryantasyon) + phoneArea + snapPiece/ghostAnchorPos | UC-7, K12, B8 |
| 8 | `apps/games/src/shapetris/model/scoring.ts` | Bölüm skoru = max(1, 10−ipucu) + toplam | UC-5, K15 |
| 9 | `apps/games/src/shapetris/model/module-state.ts` | IGameModule durum makinesi + event yayını | UC-1 |
| 10 | `apps/games/src/shapetris/model/api-types.ts` | Modül↔UI köprüsü (ShapetrisApi/Snapshot) | UC-9 |
| 11 | `apps/games/src/shapetris/index.ts` | ShapetrisModule: motor, yaşam döngüsü, ipucu akışı (hintHost), timer | UC-1, UC-5, UC-6, UC-8, A3 |
| 12 | `apps/games/src/shapetris/ui/atlas.ts` | Grafik kaynakları: S10 ile Gemini sheet yerine eski format (karo 243×244 + token 500×500) dosya bazlı | UC-9, K2, §3.3, A2 |
| 13 | `apps/games/src/shapetris/ui/strings.ts` | TR UI metinleri (games paketi app i18n'ine bağımlı değil) | AK-9.3 |
| 14 | `apps/games/src/shapetris/ui/ShapetrisRoot.tsx` | @pixi/react@8 sahne + DOM kontrol katmanı + sürükleme | UC-9, K14, FR-3.2 |
| 15 | `apps/games/src/shapetris/assets/tiles/*.png` | 13 grafik dosyası (karo off/on ×3 + tile_0..6) — eski game3-cordova formatı; Gemini sheet silindi (S10) | T-1 |
| 16 | `apps/games/src/shapetris/model/*.test.ts` (6 dosya) | KIRMIZI→YEŞİL model testleri | §6 AK'lar |
| 17 | `apps/app/package.json` | `@bulmacanya/games` bağımlılığı; react/react-dom → ^19 (pixi/react@8 uyumu) | UC-10, Sapma 5 |
| 18 | `apps/app/src/app/App.tsx` | `shapetris` kaydı (lazy loader + hintHost enjeksiyonu) | UC-10, K9, A3 |
| 19 | `apps/app/src/pages/home/ui/HomePage.tsx` | "Shapetris Oyna" butonu + loadGame akışı | UC-10, K10 |
| 20 | `apps/app/src/shared/lib/i18n.ts` | `home.playShapetris` anahtarı | UC-10 |
| 21 | `apps/app/src/shared/ui/atoms/Button.tsx` | onClick/disabled prop'ları | UC-10 |
| 22 | `apps/games/src/shapetris/assets/levels/{kolay,orta,zor}/level0..99.json` | 300 hazır kampanya bölümü (eski oyun) | UC-11, K16 |
| 23 | `apps/games/src/shapetris/model/level.ts` | `parseLevel` + `seedFromString` | UC-11, UC-14 |
| 24 | `apps/games/src/shapetris/lib/levels.ts` + `levels-index.gen.ts` + `scripts/gen-levels.mjs` | Kampanya bölüm haritası (üretilmiş statik import — bun+Vite uyumu) | UC-11, S17 |
| 25 | `apps/games/src/shapetris/index.ts` | Mod modları: campaign (JSON), endless (sayaç tohumu), daily (tarih tohumu); checkpoint payload'ları | UC-11, UC-14, K16/K20/K21 |
| 26 | `apps/games/src/shapetris/ui/ShapetrisRoot.tsx` | Günlük/kampanya-sonu zafer davranışı + 3 adımlı ders overlay'i | UC-13, UC-14 |
| 27 | `apps/app/src/pages/shapetris-hub/**` | Hub sayfası + localStorage checkpoint/kilit/ders lib'i | UC-12, K17/K18/K19 |
| 28 | `apps/app/src/pages/home/ui/HomePage.tsx` | Oyun ikon kartı (hub'a yönlendirme) | UC-12, K17 |

### A.2 Test Kanıtları

| Kapsam | Komut | Sonuç |
| :------- | :------ | :------ |
| kök (SC-4) | `bun run check` | contracts 7/7 + temiz; lint 4/4; typecheck 4/4; test 4/4 — YEŞİL |
| games model | `bun test` (apps/games) | 45/45 yeşil (764 expect) |
| games purity | `bun run scripts/check-purity.ts` | model temiz (SC-1) |
| app | `bun test` (apps/app) | 9/9 yeşil |
| build + lazy chunk (AK-10.1) | `bunx nx run @bulmacanya/app:build` | başarılı; shapetris ayrı chunk; sheet.png emit edildi |

### A.3 Kabul Kriteri Kanıtları

| Kod | Kriter (SPEC özeti) | Kanıt (test/dosya) | Durum |
| :---- | :-------------------- | :------------------- | :------ |
| AK-1.1/1.2/1.3 | id + state makinesi + exit sessizliği | `module-state.test.ts` | 🟢 |
| AK-1.4 | event payload şeması (levelId/skor) | `index.ts#afterBoardChange` + `module-state.test.ts#emit` | 🟢 |
| AK-2.1/2.3 | tahta + hücre durum zarfı | `board.test.ts` (tahta kurulumu) | 🟢 |
| AK-2.2/2.4 | üretim formülü + determinizm | `level.test.ts` | 🟢 |
| AK-3.1 | parça seti birebirliği | `pieces.test.ts` | 🟢 |
| AK-3.2 | döndürme eşiği davranışı | `layout.test.ts#snapPiece` + `ShapetrisRoot#onStageUp` | 🟢 |
| AK-3.3/3.4 | sonraki-parça politikası + tepsi | `index.ts#refillSlot` (kod inceleme — zorluk eşiği) | 🟢 |
| AK-4.1/4.2/4.3/4.4 | çakışma/kırmızı yasak/satır-sütun/serbest bölge | `board.test.ts` | 🟢 |
| AK-5.1/5.2 | zafer + skor formülü | `board.test.ts` (zafer), `scoring.test.ts` | 🟢 |
| AK-5.3/5.4 | event şeması + restart skoru korur | `index.ts#afterBoardChange`/`restartLevel` (kod inceleme) | 🟢 |
| AK-6.1/6.2/6.4 | ipucu temizleme + skor etkisi | `board.test.ts` (clearBorder/clearCell), `scoring.test.ts` | 🟢 |
| AK-6.3 | hintRequested → onay-güdümlü akış | `index.ts#requestHint` (kod inceleme) | 🟢 |
| AK-7.1/7.2/7.3 | p/l oryantasyon + taşma yok | `layout.test.ts` (6 referans viewport) | 🟢 |
| AK-8.1/8.2/8.3 | zorluk politikası + pause/resume + süre düşüşü | `index.ts#refillSlot`/`startTimer`/`levelTime` (kod inceleme) | 🟢 |
| AK-9.1 | frame sınırları (1024×1024 içinde) | `ui/atlas.ts` (sabit tablo, sınır içi) | 🟢 |
| AK-9.2 | durum→frame eşlemesi | `ShapetrisRoot#BoardLayer` (kod inceleme) | 🟢 |
| AK-9.3 | TR metinler | `ui/strings.ts` — gözle | 🟢 |
| AK-10.1 | lazy chunk | build çıktısı (ayrı chunk + sheet emit) | 🟢 |
| AK-10.2/10.3 | başlat/çıkış + TR hata | `HomePage#launchShapetris` (kod inceleme — cihaz akışı gözle kaldı, §B.2 G3) | 🟡 |
| AK-11.1 | parseLevel doğrulama + bölüm yükleme | `level.test.ts` + `lib/levels.test.ts` | 🟢 |
| AK-11.2/11.3 | kampanya ilerlemesi + payload şeması | `index.ts#afterBoardChange` (kod inceleme) | 🟢 |
| AK-12.1/12.2/12.3 | hub kartları + devam + kayıt | `ShapetrisHub` + `lib/checkpoint.ts` (kod inceleme — gözle kaldı) | 🟡 |
| AK-13.1/13.2 | ders overlay + bayrak | `ShapetrisRoot#TutorialOverlay` (kod inceleme — gözle kaldı) | 🟡 |
| AK-14.1/14.2 | günlük/sonsuz determinizmi | `level.test.ts` (seedFromString + generateLevel) | 🟢 |
| AK-14.3 | günlük zafer akışı | `ShapetrisRoot` victory modal dalı (kod inceleme) | 🟢 |

### A.4 Sapmalar

| # | Sapma | Açıklama |
| :-- | :------ | :--------- |
| S1 | Süre sayacı değerleri | Eski `pixi-timer` libinin 600s semantiği karmaşık/bağımlılıklıydı; SPEC K7 ruhu korunarak temiz formül: başlangıç 120s, her 10 bölümde −10s, alt sınır 30s (başlangıç değerleri — tune edilir) |
| S2 | Zafer sonrası geçiş | Eski ~1s otomatik; yeni: modal + 1.5s otomatik + "Sonraki Bölüm" butonu (erişilebilirlik) |
| S3 | UI butonları DOM'da | K14 gereği; eski Pixi sprite butonları yerine React DOM butonları |
| S4 | Parça sprite çapası | Eski kare texture + çapa matematiği; yeni aspect-doğru sprite + merkez çapa (görsel denklik). Hücre snap matematiği (`snapPiece`) AYNEN korundu (K1) |
| S5 | @pixi/react@8 + React 19 | AGENTS-GAMES (`@pixi/react`) uyumu için zorunlu: @pixi/react@7 pixi v7 split paketlerini çekiyor → iki pixi runtime karışımı. App React 18→19 yükseltildi (Ionic 8.8.19 React 19 destekli) |
| S6 | İpucu onayı (A3 kapanışı) | Kontrat genişletilmedi; `ShapetrisHintHost` constructor enjeksiyonu. App tarafı geçici host: her zaman onay (shell ekonomisi FAZ-1'de — `App.tsx` shortcut notu) |
| S7 | @pixi/react@8 `extend()` kaydı | İlk gözle kontrolde sahne boştu ("Sprite is not part of the PIXI namespace!"): pixi öğeleri (`pixiContainer`/`pixiSprite`) `extend({ Container, Sprite })` ile kaydedilmeliydi. Eklendi — 2026-11-05 |
| S8 | Snap matematiği merkez tabanlı | 2. gözle kontrol: parça bırakınca yerleşmiyordu — eski pads/anchor matematiği yeni merkez-çapa render ile 1 hücre kayıyordu. `snapPiece` ghost ile birebir hale getirildi; sürüklerken geçerli/geçersiz ghost önizleme (yeşil/kırmızı) eklendi; `canPlace` ayrıldı — 2026-11-05 |
| S9 | Tepsi/next görsel ayarı | 2. gözle kontrol: parçalar tahtaya bitişik konuma alındı (p: alt, l: sağ); next önizlemeleri 1 hücreye küçültüldü, alpha 0.5 — 2026-11-05 |
| S10 | Eski grafik formatına dönüş | Gemini sprite sheet bırakıldı (silindi); tüm grafikler eski game3-cordova formatından: karo a×a (243×244), tetromino token 2a×2a (500×500). Parça render'ı kare token + `PIECE_ORIGINS` çapası + eski snap matematiğine döndü; ghost `ghostAnchorPos` ters eşlemesiyle çizilir (round-trip test pimli). Kullanıcı yeni grafikleri BU FORMATA elle çizecek — yalnız `assets/tiles/` dosyaları değişir, kod aynı kalır — 2026-11-05 |
| S11 | Kırmızı hücre serbest (K3 revizyonu) | 3. gözle kontrol: kırmızıya taş konamıyordu; eski oyun kırmızıya yerleştirmeye İZİN verir ve zaferde boş olmasını ister (satır/sütun temizlemeyle çözülür). `canPlace`'ten kırmızı reddi kaldırıldı; `checkVictory` = yeşil dolu + kırmızı boş — 2026-11-05 |
| S12 | — (iptal) | Step üst sınırı fikri S14 ile yer değiştirdi (telefon alanı) |
| S13 | Tepsi eski panel pozisyonlarına dönüş | S9 (tahtaya bitişik) geri alındı; parçalar ekran altı panel matematiğiyle (`alan yüksekliği − 2·step` / `− 1.5·step`) — eski oyun birebir — 2026-11-05 |
| S14 | Telefon alanı + tek oryantasyon | Geniş ekranlar için `phoneArea` (≤480px kolon, yatay ortalı); `calculateLayout` tek dikey (p) yerleşime sadeleşti, l dalı kaldırıldı (kod sadeleşmesi — kullanıcı kararı) — 2026-11-05 |
| S15 | Aktif parça boyutu 1 hücre | 4. gözle kontrol: aktif parçalar dinlenmede çok büyüktü. `CUR_TILE_CELLS = 1` (eski oyun 2 idi) — dinlenmede next ile aynı boy (step); sürüklemede ×2 büyüme KORUNDU (kullanıcı onayı). Üst bar tam pencere eninde (phoneArea'ya kırpılmaz) — 2026-11-05 |
| S16 | width+scale çakışması (gerçek bug) | 5. gözle kontrol: parçalar ilk çizimde/sürüklemede doğal boya (500px) dönüyordu. Pixi v8'de `width = scale.x · texture.orig.width`; `scale` prop ataması width/height boyutlandırmasını eziyordu. `scale` prop'u kaldırıldı — boyut YALNIZ width/height üzerinden (sürüklemede ×2, width'in kendisi ikiye katlanır); sprite key'e tileId eklendi — 2026-11-05 |
| S17 | `import.meta.glob` yerine üretilmiş index | Bun test `import.meta.glob` desteklemiyor (Vite destekliyor); çift ortam uyumu için `scripts/gen-levels.mjs` 300 JSON'u statik import haritasına (`levels-index.gen.ts`) çevirir — 2026-11-05 |

### A.5 Gözle Kontrol Maddeleri

- [x] `shapetris/model` purity lint temiz (pixi/react import'u yok — SC-1)
- [x] UI metinleri Türkçe (`ui/strings.ts`, i18n `home.playShapetris`)
- [x] Lazy chunk ayrışması (build çıktısı: giriş + ayrı shapetris chunk)
- [x] Shell kontratına oyun-spesifik tip sızmadı (arch test yeşil)
- [ ] Sprite sheet atlasının GÖRSEL doğrulaması (A2 — kullanıcıda; VSCode: `apps/games/src/shapetris/ui/atlas.ts`)
- [ ] Gerçek cihaz/browser'da oyun akışı gözle kontrolü (G3)

### A.6 Genel Durum Özeti

FAZ-SHAPETRIS-ENTEGRASYONU tamamlandı: eski game3-cordova mekaniği birebir modernize edildi (tahta, 7 parça, sürükle-bırak + dokun-döndür, satır/sütun temizleme, kırmızı = taşınıp silinebilir / zaferde boş, skor formülü). İçerik paketi (2026-11-05): 300 hazır kampanya bölümü (kolay/orta/zor), hub akışı (ikon kartı → zorluk seçimi + checkpoint + kilitler), 3 adımlı ilk oyun dersi, günlük (tarih tohumu) + sonsuz (sayaç tohumu) modlar, localStorage kayıt katmanı. Model 45/45 testle pimli; kök gate yeşil. Kalan: gözle kontrol turları (hub akışı, ders overlay'i, günlük/sonsuz oynanışı) kullanıcıda.

**review_date:** 2026-11-05

## B. TEST KAPSAMI (§B)

### B.1 Kapsam Matrisi

| Durum | Koşul | Beklenen (THEN) | Test ref'i |
| :------ | :------ | :---------------- | :----------- |
| Tahta kurulumu | 8×8 hedef verildi | 12×12; kenar mavi, hedef yeşil, kalan kırmızı; tümü boş | `board.test.ts` (AK-2.1) |
| Yerleştirme | sınır dışı / dolu / kırmızı temas | RED, tahta değişmez | `board.test.ts` (AK-4.1/4.2) |
| Yerleştirme | mavi/yeşil boş hücre | KABUL, hücre dolar | `board.test.ts` (AK-4.4, zafer) |
| Temizleme | tam dolu satır/sütun/kesişim | ilgili hücreler boşalır, kesişim bir kez | `board.test.ts` (AK-4.3) |
| Zafer | tüm yeşiller dolu | true; eksikse false | `board.test.ts` (AK-5.1) |
| İpucu | kenar-temizle / hücre-sil | yalnız ilgili hücreler boşalır; boşta no-op | `board.test.ts` (AK-6.1/6.2) |
| Bölüm üretimi | levelNo 0..1000 | deneme ≤ min(144,10+level); eksiltme ≤ ceil(min(dolu,min(32,level/5))); seed deterministik | `level.test.ts` |
| Parçalar | 7 matris + çapalar + rotasyon | eski ile birebir; 4 CW/CCW = kimlik | `pieces.test.ts` |
| Layout | 6 referans viewport | p/l doğru; negatif/taşma yok; step ≥ 8 | `layout.test.ts` |
| Snap | O parçası bilinen nokta | hücre (1,1); 4 rotasyonda sınır içi | `layout.test.ts` |
| Skor | 0..50 ipucu | max(1, 10−ipucu); toplam birikir | `scoring.test.ts` |
| Durum makinesi | init/start/pause/resume/exit + emit | kontrat hataları; exit sonrası sessizlik; unsubscribe | `module-state.test.ts` |
| App | mevcut AK-3.1/3.2/4.x | PWA + shell + arch regresyonu | `apps/app/test/*` (9/9) |
| Bölüm yükleme | kolay/orta/zor + eksik dosya | 8×8 matris döner; eksik → hata | `lib/levels.test.ts` |
| parseLevel | 8×8 / bozuk boyut / tip | boolean matris; bozuk → throw | `level.test.ts` |
| Tohum | aynı/farklı string | deterministik; farklı girdi farklı hedef | `level.test.ts` |

### B.2 KAPSANMAYAN Boşluklar

| # | Boşluk | Risk | İleri iş |
| :-- | :------- | :----- | :--------- |
| G1 | Atlas eşlemesi programatikti (renk/geometri tahmini) | orta | KAPANDI (2026-11-05): S10 ile dosya bazlı eşleme — tile_0..6 birebir parça sırası, karolar off/on adlandırmalı; tahmin kalmadı |
| G2 | Pixi sahnesinin gerçek tarayıcıda render akışı (WebGL) test edilmedi — yalnız build | düşük | KISMEN KAPANDI (2026-11-05): S7 boş sahneyi, S8 yerleştirmeyi düzeltti; tam oynanış turu kullanıcıda sürüyor |
| G3 | Home → oyna → çık akışı cihazda e2e edilmedi (kod inceleme + build yeterli görüldü) | düşük | Capacitor run'da gözle |
| G4 | Capacitor arka plan pause/resume wiring'i yapılmadı (A4) | düşük | FAZ-1 app yaşam döngüsü paketinde |
| G5 | Çoklu dokunma davranışı (ikinci parmak) unit test edilmedi | düşük | Gerekirse touch simülasyon testi |
| G6 | Süre sayacı değerleri (S1) gerçek oyun testiyle tune edilmedi | düşük | Beta geri bildirimi |
| G7 | Hub akışı (kartlar/kilitler/checkpoint) tarayıcıda gözle doğrulanmadı | düşük | dev server gözle kontrolü |
| G8 | Ders overlay'i ve günlük/sonsuz zafer akışları gözle doğrulanmadı | düşük | dev server gözle kontrolü |

**review_date:** 2026-11-05
