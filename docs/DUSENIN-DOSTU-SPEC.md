---
status: active
space: games
tags: [oyun, dusenin-dostu, entegrasyon, faz-1, gdd, spec]
review_date: 2026-11-10
---

# DÜŞENİN-DOSTU — SPEC

> **İş akışı aşaması:** 4/4 — REVIEW tamam (AGENTS.md "Geliştirme İş Akışı"); §A/§B bu dokümanda.
> **Durum:** 🟡 **Koşullu doğrulama** — kapılar yeşil (`bun run check` 6/6, 84/84 modül testi); review sonrası **oynanış revizyonu 3** uygulandı (2026-11-10): K5 kullanıcı çarpışma kuralları · K30 hava sürtünmesi · K8 sandık dokunma bonusu · K29 çözülebilirlik garantisi. §A/§B yeniden review bekliyor.
> **İlişkili:** [SPEC-SABLONU](SPEC-SABLONU.md), [AGENTS.md](../AGENTS.md), [AGENTS-GAMES.md](../AGENTS-GAMES.md), [README §3.3 / §4.3 / §7.3.2](../README.md)
> **Referans (orijinal oyun):** `https://github.com/BIHENASO/js13ktry1` — js13kGames "404" girişi "Friend of the Fallen"; mekanik envanteri `game.js` üzerinden çıkarıldı, kodu TAŞINMAZ.

---

## 1. Amaç ve Bağlam

### 1.1 Oyun Kimliği (GDD özeti)

**Düşenin Dostu** (teknik modül ID: `dusenin-dostu`) — kırık bir kulede yukarı tırmanılan, ip atma + sarkaç fiziği üzerine kurulu dikey tırmanış oyunu. Oyuncu düşen sarı küpün ta kendisidir; dostu ise attığı iptir. Orijinal js13k oyununun çekirdeği (tırmanma, kutu etrafında sallanma, ipin engele çarpınca kopması, 404 esprisi) korunur; **"kutulara ip çizmek" mekaniği kaldırılır** — kutuya dokunulur, ip kendisi gider.

- **Tür:** Refleks + rota bulmacası (README §2 hibrit; "Dikkat + Refleks + Zeka" ekseni)
- **Hedef kitle:** 2-5 dakikalık kısa mobil oturum (web PWA + iOS/Android)
- **Oturum:** Sonsuz modda kat başına 10-30 sn; kampanya bölümü ~1-2 dk
- **Kontroller:** Yalnız dokunma — kutuya tap = ip at, boşluğa tap = ip bırak, dururken tap = zıpla. **Sürükleme YOK.**
- **Game feel:** İp atışında kanca animasyonu, kopmada ekran sarsıntısı + kıvılcım, inişte toz parçacıkları, coin'de parıltı, kat geçişinde konfeti; mağara → gökyüzü renk geçişi
- **Ton:** Sevimli-çizgi film; sarı küp kahraman atkılı, taş kule, dikenli tuzaklar
- **Jüri dersi (orijinal oyunun elenme nedeni):** Geri bildirim eksikliği —"ip nereye çarpıp kopacak, hangi açıda bırakınca nereye uçacağım" görünmüyordu. Bu SPEC'in kalbi **canlı yörünge önizlemesi**dir (K4).

### 1.2 Kapsam

| Katman | Dahil | Hariç |
| :----- | :---- | :---- |
| Oyun modülü | Tap-ip kontrolü, sarkaç+balistik fizik, kopma, kule üretimi, 4 kutu tipi, ip kotası, zincir, skor, 4 mod, 3 zorluk, ipuçları, ilk ders | Hareketli kutular, boss katları, oyun seçim sayfası, liderlik tablosu, reklam SDK'sı |
| Grafik | Yeni PNG asset seti (player, kutu tipleri, ip, hook, 3 parallax bg, HUD ikonları), game-fx efektleri | Orijinal repo grafikleri (renkli kare + Path2D okları) — KULLANILMAZ |
| Entegrasyon | `IGameModule` kontratı, `registerGame` lazy load, Home kartı + hub, `saveRequested` payload'ı, `HintHost` | Skill puanı hesaplama (shell), coin ekonomisi (shell), backend |
| Backend | Yok — modül yalnız event yayar; kalıcılık shell'in işi | Skor/ilerleme saklama, günlük kilit sunucu tarafı |

### 1.3 Nasıl Oynanır — Oynanış Rehberi

> Bu bölüm oyunun kullanıcı el kitabıdır; kod/kontrat bölümlerinden bağımsız okunabilir.

**Amaç.** Kırık kulede yukarı tırman. Ekranın üst üçte birine ulaşan her tırmanış **+1 kat** ve **+100 puan**; kat numarası sonsuza kadar artar (404. kat = paskalya yumurtası). Aşağı düşersen tur biter.

**Kontroller — yalnız dokunma, sürükleme yok:**

| Dokunma | Sonuç |
| :------ | :---- |
| Bir kutuya dokun | O kutuya **ip atılır** (menzil 6×step ≈ ekranın ~%30'u); tutununca kutu etrafında sallanmaya başlarsın |
| Boşluğa dokun (salınıyorken) | **İpi bırakırsın**; o anki teğet hızla fırlar, yerçekimiyle düşersin |
| Boşluğa dokun (kutuda dururken) | Küçük **zıplama** |
| Salınıyorken başka kutuya dokun | İp **yeniden atılır** (zincir +1, yere değmeden devam) |

**Sarkaç nasıl çalışır (2026-11-10 revizyonu):**

- **Rotor kutu (ok işaretli, kendi ekseninde döner):** motorludur. İp atar atmaz **anında tam hızda** dönmeye başlar; ok yönü sallanma yönüdür (mavi = saat yönü, yeşil = tersi).
- **Taş kutu (düz):** motorsuzdur ama **enerjini korur** — düşerken ip atarsan savrulmaya devam edersin (`ω₀ = teğet hız / ip uzunluğu`), sıfırdan başlamaz. Sönüm hafiftir; salınım uzun sürer.
- **Bırakma:** İpi bıraktığın **açı** her şeydir. Salınımın tepe noktalarında bırakırsan yukarı uçarsın; en alt noktada bırakırsan yatay fırlar, sonra düşersin. Ekrandaki **yeşil halka**, şu an bırakırsan ineceğin noktayı gösterir; **beyaz kesikli yay** yörüngendir.
- **Önizleme neden var:** Orijinal oyunun elenme nedeni "ne olacağı görünmüyor"du. Artık bırakma yörüngesi, iniş noktası ve **ipin kopacağı dikenler** (kırmızı halka) önceden çizilir.

**İp kuralları:**

- **Kota:** Her katta sınırlı ip vardır — Kolay 4, Orta 2, Zor 1; yeni kata geçince yenilenir. Kota bitip yerde kalırsan "İp bitti" ile tur biter (zıplamak ip istemez). **Sandık toplamak +1 ip verir.**
- **Kopma (2026-11-10 kuralı):** İp **herhangi bir katı kutuya** değince kopar; oyuncu serbest düşer. İstisna: **bedeninle** temas eden kutu — orada ip kopmaz.
- **Beden teması:** Kutuya **üstten** çarparsan üzerine inersin; **yandan** çarparsan ip kopmaz, sarkaç geri seker (yaylanma). Havada yana sürtünürsün, sekmezsin.
- **Atış reddedilir** (ekranda nedeni yazar): kutu menzil dışıysa · ip kotası 0 ise · atış anında ip **herhangi bir kutuya** değecekse · kırıcı/coin/sandığa ip atılmaya çalışılırsa.
- **Çözülebilirlik garantisi:** Her kat, kotan ile çıkılabilecek şekilde üretilir (BFS "en az ip" kontrolü + gerekirse yeniden üretim / çıkış merdiveni). Yani 4 ipinle geçilemeyecek bir ekran gelmez.

**Kutu tipleri:**

| Kutu | Görsel | Davranış |
| :--- | :----- | :------- |
| Taş | Gri blok | İp atılır, üstünde durulur; pasif sarkaç |
| Rotor (saat yönü / tersi) | Dişli + ok | İp atılır; motorlu, yön okludur |
| Kırıcı | Mor dikenli blok | İp değerse kopar; **beden değerse ölüm** |
| Sandık | Ahşap sandık | **Dokununca** (her taraftan) **+1 ip +1 coin** — üstüne inmek gerekmez |
| Coin | Altın yıldız | Dokununca toplanır, **+25 puan** (çarpışmasız, geniş toplama alanı) |

**Kat geçişi.** Oyuncu ekranın üst üçte birine ulaşınca dünya bir kat aşağı kayar: yeni kutular doğar, alttaki eski kutular temizlenir, ip kotası dolar. Yani asıl hedef her zaman "bir üst kata taşınmak"tır.

**Tur biter:** ekranın altına düşünce · dikenli kutuya bedenin değince · ip kotası bitip yerde kalınca · (Zamana Karşı'da) süre dolunca.

**Modlar:**

| Mod | Nasıl oynanır | Kazanma/bitiş |
| :-- | :----------- | :------------ |
| Sonsuz Tırmanış | Klasik döngü; her 20 katta zorluk bir kademe artar | Düşene kadar; skor = ulaşılan kat + coin + zincir |
| Rota Bulmacası | Kademe başına 30 bölüm; her bölüm **6 kata** ulaşmak | Bitirince 1-3 yıldız: ip ≤ par (10) → 3, ≤ 15 → 2, üstü → 1 |
| Zamana Karşı | 60 saniyede en çok kat | Süre dolunca biter |
| Günlük Kule | Tarih tohumlu kule; herkes aynı düzeni oynar | Günde bir deneme; sonuç shell'de saklanır |

**Zorluk kademeleri.** Kolay her zaman açık; Orta, Kolay'ın 30 bölümü bitince; Zor, Orta bitince açılır. Kolay'da rotor yoğunluğu yüksektir (her ~2 kutudan biri), kutular sık (2.5-3.5 adım), mıknatıs güçlü; Zor'da rotor seyrek, diken yoğun, ip 1.

**Pratik strateji:**

1. Düşerken boşluğa değil **kutuya** nişan al — taş bile olsa momentumun korunur, savrulursun.
2. Rotor kutuyu tercih et; ok yönünde sallanıp **tepe noktasında** bırak.
3. Bırakmadan önce yeşil iniş halkasına bak: bir üst kutuya denk geliyorsa zaman doğru.
4. Dikenli kutunun yanındaki taşa ip atma — önizleme kırmızı yay gösteriyorsa atış reddedilir.
5. Zincir kur: yere değmeden ikinci kutuya ip at; her halka +25 puan ve akışı korur.
6. Sandığı "bedava ip" olarak kullan; coin'ler riskli yayların üstünde durur.

---

## 2. Kararlar

> K1 kullanıcı kararıdır (2026-11-10). K2–K25 plan onayıyla önerilen varsayılanlardır; onay sırasında değiştirilebilir.

| Kod | Karar | Sonuç |
| :-- | :---- | :---- |
| K1 | **Çizerek tutunma KALDIRILIR**; kutuya dokununca ip atılır (kullanıcı kararı) | `dealPointerMove`/çizgi sürükleme kod yolu YOK; tap-only kontrol |
| K2 | Fiziksel sarkaç + **tutunma enerjisi** (Rev-1, 2026-11-10): rotor kutular motorlu — ip atar atmaz **ω₀ = ±ω_max**; taş kutular pasif ama **teğet momentum korunur** — ω₀ = v_teğet / L (tavan 0.8×ω_max); taş sönümü 0.15/0.12/0.10, rotor torku 10/14/20 | Sabit 1°/tick YOK; `model/physics.ts#initialSwingOmega` + `stepSwing` |
| K3 | **Her kutuya** ip atılabilir (orijinalde yalnız rotorlara çizgi çekiliyordu) | Rota seçenekleri artar = bulmaca derinliği |
| K4 | **Canlı yörünge önizlemesi:** salınırken teğet balistik yörünge + iniş işaretçisi; ipin süpüreceği yay üzerinde kopma noktaları kırmızı; anında kopacak atışlar yapılmaz (kırmızı yay + titreşim) | Jüri/anlaşılırlık sorununun çözümü |
| K5 | **Çarpışma kuralları (kullanıcı tanımı, 2026-11-10 — eski A11):** ① İp HERHANGİ katı kutuya değerse **ip kopar**, oyuncu serbest düşüşe geçer. ② Oyuncu kutuya **üstten** çarparsa **üzerine iner**. ③ Oyuncu **yandan** çarparsa **ip KOPMAZ**, sarkaç fiziksel geri seker (ω ters × 0.6). ④ Kırıcıya oyuncu teması ölüm. ⑤ Havada yan temas sürtünmedir: dikey hız korunur, sekme yok. ⑥ Coin/sandık çarpışmasız toplanır | `game.ts#swingStep` + `#collideAir` |
| K6 | **İp kotası** kat başına: Kolay **4** (Rev-3) / Orta 2 / Zor 1; her yeni katta yenilenir; kota bitip yerde kalırsan "İp bitti" oyun sonu | Zaman paniği yerine hamle ekonomisi |
| K7 | **Zincir:** havadayken başka kutuya ip = yeniden ip (yere değmeden); her halka +bonus, yere değince sıfırlanır | Akıcılık + skor derinliği (A1 onayına bağlı) |
| K8 | Bonus kutu **çarpışmasız**: dokununca **+1 ip +1 coin** (her taraftan, üstüne inmek gerekmez); RNG ışınlanma YOK | Kota esnetme bonusu (kullanıcı kuralı 2026-11-10) |
| K9 | Skor: ilk kez girilen kat +100, coin +25, zincir halkası +25×halka; saniye eksiği YALNIZ Zamana Karşı modunda | Skor formülü moda göre tek yerde (`model/scoring.ts`) |
| K10 | 404. kat **paskalya yumurtası**: "404 — Son Kat Bulunamadı" ekranı + rozet; sonsuz modda tırmanış devam eder | Orijinal espri korunur, oyunu bitirmez |
| K11 | Modül ID `dusenin-dostu`; kod `apps/games/src/dusenin-dostu/`; shell'e lazy load | `registerGame("dusenin-dostu", ...)` |
| K12 | **4 mod:** Sonsuz Tırmanış, Rota Bulmacası (kampanya), Zamana Karşı, Günlük Kule | Tek hub'dan erişim |
| K13 | Zorluk kademeleri kilitli: Kolay açık; Orta Kolay bitince; Zor Orta bitince; her kademenin ayrı checkpoint'i | TetroVizyon K19 deseni |
| K14 | Kampanya katları **seed'den üretilir**: `seed = hash(difficulty, levelNo)`; hazır JSON asset YOK | Deterministik + paylaşılabilir; içerik üretim borcu yok |
| K15 | Grafikler `assets/` altında ayrı PNG'ler (game7 atlas deseni); runtime'da **sanat amaçlı vektör çizim YOK**; ip bile doku sprite'ı | Orijinal canvas kare/ok çizimi tamamen düşer |
| K16 | `@bulmacanya/game-fx` + `game-fx-pixi` tüketilir (burst/shake/audio); yalnız `ui/` katmanında | Model katmanı saf kalır (FAZ-GAME-FX K10) |
| K17 | İpuçları: `dusenin-dostu.rota-goster` (1 coin — önerilen sonraki kutu 5 sn vurgulu) + `dusenin-dostu.yavas-zaman` (2 coin — 5 sn 0.5× hız, Orta/Zor) | Modül karar VERMEZ; `HintHost` enjeksiyonu (TetroVizyon A3 deseni) |
| K18 | Kontroller **tap-only**; dokunma hedef alanı ≥ 48px; sürükleme/drag eventi hiçbir yerde yok | SC-2 |
| K19 | Responsive: saf `calculateLayout(viewport) → LayoutMetrics`; `step = min(W,H)×0.05`; kutu = oyuncu = 1.5×step | Unit test edilebilir, Pixi bağımsız |
| K20 | Kalıcılık: `saveRequested` payload'ı shell'de; payload `{mode, difficulty, levelNo, floorNo, ropesUsed, chainBest, coins, totalScore, completed}` | TetroVizyon K21 deseni; backend FAZ-1'de aynı payload |
| K21 | İp menzili `6×step`; menzil dışı kutuya tap → atış YAPILMAZ, kırmızı ip uyarısı | Üretici erişilebilirlik garantisi bu sabitle hesaplanır |
| K22 | Ses: `FxAudio` sentez sesleri (pop/tık/arpej/boop) — ip atışı, kopma, coin, oyun sonu; müzik YOK | Asset dosyası gerekmez (FAZ-GAME-FX K6) |
| K23 | İlk ders: 3 adımlı, atlanabilir overlay (kutuya dokun → sallan → boşluğa dokun → uç); shell `tutorialDone` bayrağı | TetroVizyon K18 deseni |
| K24 | Determinizm: tüm rastgelelik seed'li PRNG (`mulberry32`) + sabit zaman adımı (60 Hz, `dt` clamp 50ms) | `Math.random` modelde YASAK — SC-3 |
| K25 | Görünür ad "Düşenin Dostu"; teknik ID değişmez | Home kartı + hub başlığı + i18n |
| K26 | **Atış reddi nedeni ekranda yazılır** (Rev-5, 2026-11-10): "Menzil dışı" · "İp kalmadı" · "İp hemen kopar" · "Geçersiz hedef" | Oyuncu "neden olmadı" sorusu ekranda cevaplanır (`STR.*` + ret toast) |
| K27 | **Rotor sprite'ı kendi ekseninde döner** (Rev-4): ok yönü canlı okunur; oyuncu yörüngesi motor yönüyle aynı | `DuseninDostuStage` rotor rotation |
| K28 | **İlerleme kolaylaştırma** (Rev-3): `rotorRatio` parametresi (Kolay 0.5 · Orta/Zor 0.33), Kolay gap 2.5–3.5, mıknatıs 1.2, zıplama −8 | `params.rotorRatio`, `tower.ts`, `HOP_VELOCITY` |
| K29 | **Çözülebilirlik garantisi** (2026-11-10): her kat, kota ile çözülebilir üretilir — `minRopesToGoal` BFS + ≤5 yeniden üretim + "çıkış merdiveni" fallback; kat yoğunluğu `floorSpawnCount` ile H/3'e ölçeklenir | `tower.ts#planFloor`; SC-9 testi (100 seed × 20 kat) |
| K30 | **Air çarpışma sadeleşti** (2026-11-10): iniş = düşerken merkez kutu merkezinin üstünde (çapraz giriş dahil); yan temas = sürtünme (dikey hız korunur, sekme yok); alt temas = kafa vuruşu | `game.ts#collideAir` — sekme döngüsü giderildi |

---

## 3. Mevcut Durum / Kök Nedenler

> Kaynak: orijinal js13k girişi (`js13ktry1/game.js`). Kod taşınmaz; bulgular tasarım girdisidir.

| Kod | Bulgu | Kanıt |
| :-- | :---- | :---- |
| B1 | Oyuncu kare yerçekimiyle düşer; üst 1/3'e ulaşınca ekran 1/3 kayar, +1 screen, +100 puan, 3 yeni kutu doğar | `game.js#ticker1`, `game.js#slideScreen` |
| B2 | Tutunma **sürükle-çizgi** ile: oyuncudan kutuya çizgi çekilir; ip sabit açısal hızla (1°/tick) döner | `game.js#dealPointerUp`, `game.js#itemLine` |
| B3 | İp başka kutuya çarpınca kopar — bulmacanın gerçek tohumu | `game.js#itemLine#colCheck` |
| B4 | Bonus kutu %14 olasılıkla 1 ekran yukarı ışınlar, yoksa yok olur (saf RNG) | `game.js#itemRect#checkBricks` |
| B5 | Skor saniyede −1 (zaman baskısı); hedef 404. ekran → "404 NOT FOUND" | `game.js#startGame(1)`, `game.js#stop(1)` |
| B6 | Çarpışma `calDist < width` mesafe testi + ışınlanma düzeltmesi — titrek/buggy | `game.js#itemRect#checkBricks` |
| B7 | Grafik: renkli kareler + Path2D okları + Courier metinler | `game.js#itemRect#update` |
| B8 | Giriş ekranı 10 satır İngilizce talimat; oynanış öğretici değil | `game.js#instr` |
| B9 | Bonus/rotor ayrımı yalnız renk+ok; kırıcı tehlike tipi YOK | `game.js#itemRect#update` |
| B10 | Başarısızlık = alt sınıra düşmek; başka ölüm/ekonomi yok | `game.js#ticker1` |

**Kök neden (jüri geri bildirimi):** Oyuncu "ne olacak"ı göremiyordu — ipin kopma noktası, bırakma yörüngesi, kutunun motorlu mu pasif mi olduğu önceden okunamıyordu. Çözüm K4 önizleme + K2 fizik + K5 kırıcı görsel dili.

---

## 4. Mimari

### 4.1 Modül yapısı (`apps/games`)

```
apps/games/src/dusenin-dostu/
├── index.ts                 # DuseninDostuModule (IGameModule) + DuseninDostuHintHost tipi
├── model/                   # SAF — Pixi/React/DOM/game-fx bağımlılığı YOK (unit test)
│   ├── types.ts             # Vec2, Brick, BrickKind, GameMode, PhysicsParams, LayoutMetrics
│   ├── physics.ts           # sarkaç (motorlu/pasif), balistik, ip-kutu süpürme testi
│   ├── game.ts              # saf durum makinesi: step(state, input, dt) → {state, events}
│   ├── tower.ts             # seed'li kule üretimi + erişilebilirlik garantisi (BFS)
│   ├── preview.ts           # teğet yörünge + iniş işaretçisi + kopma noktaları hesabı
│   ├── scoring.ts           # kat/coin/zincir skoru + yıldız derecelendirme
│   ├── layout.ts            # calculateLayout(viewport) → LayoutMetrics (K19)
│   ├── difficulty.ts        # 3 kademe parametre tablosu + sonsuz mod ölçekleme
│   └── module-state.ts      # GameModuleState makinesi + event yayını (MockGame deseni)
├── ui/                      # PIXI — yalnız sunum
│   ├── DuseninDostuStage.tsx # @pixi/react Stage + katmanlar + 60Hz ticker
│   ├── atlas.ts             # PNG yükleme — asset yollarının TEK kaynağı
│   ├── strings.ts           # TR oyun içi metinler
│   └── fx.ts                # game-fx bağlama: ParticleBurst, Shake, FxAudio
└── assets/                  # PNG'ler (player-*, brick-*, rotor-*, breaker, coin, chest, rope, hook, bg-*, hud-*)
```

### 4.2 Shell bağlantısı

```
App başlangıcı → registerGame("dusenin-dostu", loader)
Home kartı → hub (mod + zorluk seçimi) → loadGame("dusenin-dostu") → init → start
modül ──score/levelCompleted/hintRequested/saveRequested──► shell (GameEventMap)
shell ──HintHost.grant(hintType)──► modül (constructor enjeksiyonu; IGameModule DEĞİŞMEZ)
```

### 4.3 Simülasyon döngüsü (saf çekirdek)

```
input tap ──► game.ts#applyInput ──┐
                                   ├──► physics.ts (60Hz sabit adım, dt clamp)
ticker (ui) ──► game.ts#step ──────┘         │
                                             ▼
                          events: attach/release/land/ropeBreak/coin/floorUp/die
                                             │
ui: stage güncelle ◄── state ◄────────────────┘  (FX/audio yalnız burada tetiklenir)
```

`game.ts` durumu immutable tutar; `step` her çağrıda yeni state + olay listesi döner (unit test edilebilir; SC-3 determinizm).

### 4.4 Zorluk parametreleri (Rev-3 güncel — play-test'te ayarlanacak)

> Tüm mesafeler **step** birimindedir (mıknatıs dahil — 2026-11-10 revizyonu, eski px notu geçersiz).

| Parametre | Kolay | Orta | Zor |
| :-------- | :----: | :--: | :--: |
| Yerçekimi (step/s²) | 6 | 8 | 10 |
| Rotor ω_max (rad/s) | 2.2 | 3.0 | 4.0 |
| Rotor torku | 10 | 14 | 20 |
| Kırıcı oranı (%) | 0 | 12 | 22 |
| **Rotor oranı (%)** | **50** | 33 | 33 |
| İp kotası / kat | **4** | 2 | 1 |
| Kutular arası dikey aralık (step) | **2.5–3.5** | 4–5 | 5–6 |
| İniş mıknatısı (step) | **1.2** | 0.4 | 0 |
| Pasif sarkaç sönümü (1/s) | **0.15** | **0.12** | **0.10** |
| Zıplama itkisi (step/s) | −8 | −8 | −8 |

Tutunma enerjisi (K2): rotor → ω₀ = ±ω_max; taş → ω₀ = v_teğet / L (tavan 0.8×ω_max).

Sonsuz modda her 20 katta parametreler bir üst kademeye doğru `lerp` edilir (tavan: Zor).

### 4.5 Erişilebilirlik garantisi (üretici sözleşmesi)

`tower.ts` her katta bir "omurga" zinciri üretir: mevcut en yüksek kutudan başlayarak her adımda `|Δ| ≤ 6×step` (K21) ve dikey kazanç > 0 olacak şekilde sıradaki kutu yerleştirilir; süs kutuları (rotor/kırıcı/coin/sandık) omurga koridorunu kapatmayacak şekilde dağıtılır. `verifyReachable(tower)` BFS'i unit testle her seed için omurga varlığını doğrular.

---

## 5. Purity Kuralları

1. `model/` katmanı PIXI/React/DOM/`@bulmacanya/game-fx` import ETMEZ; yalnız relative import + `@bulmacanya/shared` (check-purity `GAMES` listesine `dusenin-dostu` eklenir).
2. Modül dış dünyaya yalnız `IGameModule` + `GameEventMap` ile konuşur; oyun-spesifik tip (`Brick`, `PhysicsParams`, `LayoutMetrics`) `packages/shared`'a KONULMAZ (tek-app tipi — AGENTS.md placement kuralı).
3. Asset yolları tek kaynak: `ui/atlas.ts`. Başka dosyada sabit asset yolu YOK.
4. İpucu kararı modülde ALINMAZ — `hintRequested` + `HintHost.grant` akışı (K17).
5. Determinizm: `Math.random` modelde YASAK; seed'li PRNG yalnız `tower.ts` içinde (K24).
6. Sanat amaçlı vektör çizim YASAK: tüm oyun nesneleri sprite (K15). İstisna: `preview.ts` çıktısını çizen önizleme katmanı + debug çizimleri Pixi `Graphics` kullanabilir.
7. FX/ses yalnız `ui/fx.ts` üzerinden; `model/` olay üretir, `ui/` tüketir.

---

## 6. Use Case'ler

### 6.1 UC-1 — Shell Kontratı: Yaşam Döngüsü ve Kayıt

**Status:** 🟡 Kısmi doğrulama — kanıt/boşluklar §A.3 ve §B.2'de

**Kapsam:**

- dahil: `DuseninDostuModule`'ün `IGameModule` uygulaması; `registerGame` kaydı; durum makinesi; event yayını; `exit` sonrası kaynak serbest bırakma.
- hariç: shell içi skor saklama; coin/reklam akışı; oyun seçim sayfası (hub UC-6'da).

**Akış:**

1. App başlangıcında `registerGame("dusenin-dostu", () => import("@bulmacanya/games/dusenin-dostu"))`.
2. `loadGame("dusenin-dostu")` → `init()` (atlas yüklenir, sahne kurulur).
3. `start()` → seçili mod/zorluk ile oyun başlar.
4. Arka plana geçiş → `pause()`, dönüş → `resume()`.
5. Çıkış → `exit()`: Stage destroy, listener'lar temizlenir; örnek yeniden kullanılamaz.

**Gereksinimler (FR-1):**

| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-1.1 | Modül `IGameModule`'ü uygular; `id === "dusenin-dostu"` döner | AK-1.1 |
| FR-1.2 | Yaşam döngüsü kontrat state machine ile birebir; yanlış sıra `GameModuleError` fırlatır | AK-1.2 |
| FR-1.3 | `exit` sonrası event yayılmaz; kaynaklar serbest bırakılır | AK-1.3 |
| FR-1.4 | `score`, `levelCompleted`, `hintRequested`, `saveRequested` olayları `GameEventMap` imzalarıyla yayınlanır | AK-1.4 |

**Kabul Senaryoları (GWT):**

1. **AK-1.1 — GIVEN** modül yüklü **WHEN** `id` okunur **THEN** `"dusenin-dostu"` döner
2. **AK-1.2 — GIVEN** modül `idle` **WHEN** `start()` çağrılır **THEN** `NOT_INITIALIZED` fırlar; ikinci `init()` → `WRONG_STATE`
3. **AK-1.3 — GIVEN** modül `exit()` edildi **WHEN** score tetiklenmeye çalışılır **THEN** dinleyicilere iletilmez
4. **AK-1.4 — GIVEN** oyun sürüyor **WHEN** kat tamamlanır **THEN** `levelCompleted {levelId: "dusenin-dostu.<mode>.<n>"}` yayınlanır

**Kabul Kriterleri:**

| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-1.1 | id sabiti | unit | ⬜ |
| AK-1.2 | state makinesi hataları | unit | ⬜ |
| AK-1.3 | exit sonrası sessizlik | unit | ⬜ |
| AK-1.4 | event payload şeması | unit | ⬜ |

**T Görev Listesi:**

- [ ] T-7: `model/module-state.ts` — durum makinesi + event yayını
- [ ] T-8: `index.ts` — `DuseninDostuModule`
- [ ] T-16: `apps/app` — registerGame kaydı

**Edge Cases:**

| Durum | Davranış |
|:------|:---------|
| `exit` sonrası `start` | `WRONG_STATE` (stopped → dönüş yok) |
| Event'e abone yok | Sessiz düşer (kontrat) |

**Involved Files:**

| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/dusenin-dostu/model/module-state.ts` | Durum makinesi + emit |
| `apps/games/src/dusenin-dostu/index.ts` | IGameModule uygulaması |
| `apps/app/src/app/App.tsx` | Kayıt çağrısı |

---

### 6.2 UC-2 — Fizik Çekirdeği: Sarkaç, Balistik, İp Kopma

**Status:** 🟢 Doğrulanmış — AK-2.1…2.5 tam test kanıtlı (§A.3)

**Kapsam:**

- dahil: motorlu/pasif sarkaç denklemleri; bırakma = teğet hız + balistik entegrasyon; ip-kutu süpürme testi (kopma); oyuncu-kutu AABB çarpışması (üst = iniş, yan = kayma); fixed timestep.
- hariç: görsel efektler (UC-8); UI önizleme çizimi (UC-3 hesabı bu UC'nin fonksiyonlarını kullanır).

**Akış:**

1. `game.ts#attach(brickId)` → ip uzunluğu `L = |player − brick|`; açı `θ0 = atan2`.
2. Her adımda `physics.ts#stepPendulum`: taş kutu → `θ'' = −(g/L)·sinθ − c·θ'`; rotor → üstüne yön yönünde `τ` torku, `|ω| ≤ ω_max`.
3. `preview.ts` aynı adım fonksiyonunu ileri sararak teğet yörünge + iniş noktası üretir (K4 verisi).
4. Bırakma → `v = ω×L` teğet; balistik entegrasyon; kutu üst yüzeyine iniş → otur; alt/yandan temas → kayma veya düşme.
5. İp süpürme testi her adımda: segment (oyuncu↔kutu merkezi) herhangi bir kırıcıya değerse → `ropeBreak` olayı.

**Gereksinimler (FR-2):**

| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-2.1 | Motorlu rotor sabit torkla hızlanır, hızı `ω_max` ile sınırlı; pasif kanca sönümle enerji kaybeder | AK-2.1 |
| FR-2.2 | İp her adımda kırıcı kutu kesişimi için test edilir; kesişimde kopar, oyuncu serbest düşer | AK-2.2 |
| FR-2.3 | Bırakma anında oyuncu teğet hızla fırlar; balistik yörünge yerçekimiyle entegre edilir | AK-2.3 |
| FR-2.4 | Kutu üst yüzeyine iniş oturur; yandan temas kaydırır; hız > eşik ise düşer | AK-2.4 |
| FR-2.5 | Simülasyon 60Hz sabit adımlıdır; aynı seed + aynı input dizisi aynı sonucu üretir | AK-2.5 |
| FR-2.6 | **Tutunma enerjisi** (Rev-1): rotor → ω₀ = ±ω_max; taş → ω₀ = v_teğet / L (tavan 0.8×ω_max); enerji sıfırlanmaz | AK-2.6 |
| FR-2.7 | **Salınım çarpışması (K5):** ip herhangi bir katı kutuya değerse kopar + serbest düşüş; oyuncu üstten çarparsa iner; yandan çarparsa ip kopmaz, ω ters ×0.6 geri sekme | AK-2.7 |
| FR-2.8 | **Havada yan sürtünme (K30):** iniş = merkez kutu merkezinin üstünde; yan temas dikey hızı sıfırlamaz (kayma), sekme döngüsü yok | AK-2.8 |

**Kabul Senaryoları (GWT):**

1. **AK-2.1 — GIVEN** rotor ω = ω_max **WHEN** 1 sn simüle edilir **THEN** ω artmaz (sınır korunur); pasif sarkaç aynı sürede genlik kaybeder
2. **AK-2.2 — GIVEN** ip süpürme yayında kırıcı **WHEN** segment kırıcıya değer **THEN** `ropeBreak` yayınlanır, oyuncu balistiğe geçer
3. **AK-2.3 — GIVEN** oyuncu salınıyor **WHEN** bırakılır **THEN** çıkış hızı `ω×L` teğet yönündedir
4. **AK-2.4 — GIVEN** oyuncu kutu üstüne düşüyor **WHEN** temas gerçekleşir **THEN** oyuncu kutunun üstüne oturur (y = kutu.üst − oyuncu.yarı)
5. **AK-2.5 — GIVEN** aynı seed + input dizisi **WHEN** simülasyon iki kez koşulur **THEN** state'ler bit-bit eşittir
6. **AK-2.6 — GIVEN** oyuncu düşerken (v_teğet > 0) taşa ip atar **WHEN** tutunur **THEN** ω₀ = v_teğet/L (sıfır değil, enerji korunur); rotorda ω₀ = ±ω_max
7. **AK-2.7 — GIVEN** salınım yolu bir kutuya değer **WHEN** kare işlenir **THEN** ip segmenti değdişse ip kopar (serbest düşüş); oyuncu bedeni yandan değdiyse ip KOPMAZ ve ω ters ×0.6 seker
8. **AK-2.8 — GIVEN** oyuncu havada kutu yanına sürtünüyor **WHEN** kare işlenir **THEN** dikey hız korunur (kayma), sekme yok; merkez kutu merkezinin üstündeyse iniş sayılır

**Kabul Kriterleri:**

| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-2.1 | motor/sönüm davranışı | unit | ⬜ |
| AK-2.2 | kopma tespiti | unit | ⬜ |
| AK-2.3 | teğet çıkış | unit | ⬜ |
| AK-2.4 | iniş/çarpışma çözümü | unit | ⬜ |
| AK-2.5 | determinizm | unit | ⬜ |
| AK-2.6 | tutunma enerjisi (Rev-1) | unit | ⬜ |
| AK-2.7 | salınım çarpışma kuralları (K5) | unit | ⬜ |
| AK-2.8 | hava sürtünmesi + çapraz iniş (K30) | unit | ⬜ |

**T Görev Listesi:**

- [ ] T-1: `model/types.ts` + `model/physics.ts` (testler ÖNCE — RED)
- [ ] T-2: `model/game.ts#step` — saf durum makinesi + olay listesi

**Edge Cases:**

| Durum | Davranış |
|:------|:---------|
| `L ≈ 0` (kutunun içindeyken atama) | Atama reddedilir, oyuncu düşer |
| Aynı karede iki kırıcıyla kesişim | Tek `ropeBreak` olayı |
| Bırakma sırasında dt büyük (kare atlama) | dt 50ms'ye clamp edilir; tünelleme için süpürme testi |
| Oyuncu kutunun alt yüzeyine çarpar | Kayar, yukarı itilmez (yön korunur) |

**Involved Files:**

| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/dusenin-dostu/model/physics.ts` | Sarkaç, balistik, süpürme |
| `apps/games/src/dusenin-dostu/model/game.ts` | Saf oyun durumu + olaylar |
| `apps/games/src/dusenin-dostu/model/types.ts` | Ortak tipler |

---

### 6.3 UC-3 — Tap Kontrolü ve Önizleme

**Status:** 🟡 Kısmi doğrulama — kanıt/boşluklar §A.3 ve §B.2'de

**Kapsam:**

- dahil: kutuya tap → ip atma; boşluğa tap → bırakma; yerdeyken tap → zıplama; menzil dışı/anında kopacak atış reddi; canlı balistik önizleme; salınırken yeniden ip (zincir); 48px hedef alanı.
- hariç: klavye kontrolü (mobil öncelik; ileri iş); gamepad.

**Akış:**

1. Sahnede `pointerdown` → `hitTest(point)`: kutu mu, boşluk mu?
2. Kutu + menzil içi + atış geçerli → `attach`; geçersizse kırmızı yay 300ms + titreşim, atış YOK (K4).
3. Boşluk + salınıyor → `release`; boşluk + yerde → `hop`.
4. Salınırken başka kutuya tap → `retarget` (K7): eski ip kopmadan yeni kutuya geçiş, zincir +1.
5. Her karede `preview.ts` çıktısı çizilir: teğet yörünge (kesikli), iniş işaretçisi (hedef halkası), ip yayında kırmızı kopma segmentleri.

**Gereksinimler (FR-3):**

| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-3.1 | Kutuya tap ip atar; hiçbir kontrol sürükleme gerektirmez | AK-3.1 |
| FR-3.2 | Boşluğa tap salınımı bitirir; oyuncu teğet yörüngeye girer | AK-3.2 |
| FR-3.3 | Yerdeyken tap küçük zıplama yapar | AK-3.3 |
| FR-3.4 | Menzil dışı veya anında kopacak atışta ip atılmaz; görsel uyarı + **neden etiketi** verilir (Rev-5, K26) | AK-3.4 |
| FR-3.5 | Salınırken canlı önizleme çizilir; işaretçi gerçek inişle ±1 kutu genişliğinde örtüşür | AK-3.5 |
| FR-3.6 | Havadayken başka kutuya tap yeniden ip atar ve zinciri artırır | AK-3.6 |

**Kabul Senaryoları (GWT):**

1. **AK-3.1 — GIVEN** oyuncu düşüyor **WHEN** menzildeki kutuya tek tap **THEN** ip atılır, sarkaç başlar (sürükleme yok)
2. **AK-3.2 — GIVEN** sarkaç sürüyor **WHEN** boşluğa tap **THEN** ip bırakılır, balistik başlar
3. **AK-3.3 — GIVEN** oyuncu kutuda duruyor **WHEN** tap **THEN** `hop` olayı + küçük dikey itiş
4. **AK-3.4 — GIVEN** hedef menzil dışı **WHEN** kutuya tap **THEN** atış yapılmaz, kırmızı uyarı oynar, ip kotası azalmaz
5. **AK-3.5 — GIVEN** sarkaç sürüyor **WHEN** bırakma **THEN** gerçek iniş noktası önizleme işaretçisinin ±1 kutu içindedir
6. **AK-3.6 — GIVEN** oyuncu havada salınıyor **WHEN** ikinci kutuya tap **THEN** ip yeniden atılır, zincir +1, yere değmeden devam eder

**Kabul Kriterleri:**

| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-3.1 | tap → attach | unit + e2e | ⬜ |
| AK-3.2 | tap → release | unit + e2e | ⬜ |
| AK-3.3 | hop | unit | ⬜ |
| AK-3.4 | geçersiz atış reddi | unit | ⬜ |
| AK-3.5 | önizleme doğruluğu | unit | ⬜ |
| AK-3.6 | retarget + zincir | unit | ⬜ |

**T Görev Listesi:**

- [ ] T-3: `model/preview.ts` — ileri sarma + iniş işaretçisi
- [ ] T-9: `ui` tap girişi + hit test + geçersiz atış uyarısı

**Edge Cases:**

| Durum | Davranış |
|:------|:---------|
| İki kutu üst üste binmiş | En yakın merkez kazanır |
| Tap sırasında kutu ekran dışına kaydı | Tap anındaki konumla hit test (yeniden test yok) |
| Aynı karede iki tap | İlki işlenir, ikincisi yok sayılır |
| Oyun duraklatılmışken tap | Girdi kuyruğa alınmaz, yok sayılır |

**Involved Files:**

| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/dusenin-dostu/model/preview.ts` | Yörünge/kopma önizleme hesabı |
| `apps/games/src/dusenin-dostu/ui/DuseninDostuStage.tsx` | Girdi bağlama |
| `apps/games/src/dusenin-dostu/ui/fx.ts` | Uyarı titreşimi |

---

### 6.4 UC-4 — Kule Üretimi, Kamera ve Zorluk

**Status:** 🟢 Doğrulanmış — AK-4.1…4.5 test kanıtlı (SC-7 örneklem sapması: §A.4 S2)

**Kapsam:**

- dahil: seed'li kule üretimi + erişilebilirlik BFS'i; kamera kaydırma (üst 1/3 → kat +1, ip yenileme, alt temizlik); zorluk parametre tablosu; sonsuz modda katla ölçekleme; responsive layout.
- hariç: hazır kampanya JSON'ları (K14 — seed'den üretilir); hareketli kutular (A4).

**Akış:**

1. `init` → `calculateLayout(viewport)` → `LayoutMetrics`.
2. `tower.ts#generateFloor(prevTower, params, rng)` → 3–5 kutu (omurga + süs).
3. Oyuncu üst 1/3'e ulaşınca kamera `H/3` kayar; `floorNo++`; ip kotası yenilenir; alt %33 dışındaki kutular silinir.
4. Her 20 katta sonsuz modda `difficulty.ts#scale(base, floorNo)` parametreleri günceller.

**Gereksinimler (FR-4):**

| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-4.1 | Kule seed'li PRNG ile üretilir; aynı seed aynı kuleyi verir | AK-4.1 |
| FR-4.2 | Ekran kaydırma orijinal davranışı korur: üst 1/3 tetikler, +1 kat, ip yenilenir | AK-4.2 |
| FR-4.3 | Zorluk parametreleri §4.4 tablosundan gelir; modül içinde sabit kodlanmaz | AK-4.3 |
| FR-4.4 | Sonsuz modda her 20 katta parametreler üst kademeye lerp edilir | AK-4.4 |
| FR-4.5 | Üretilen her katta omurga BFS ile doğrulanır: başlangıçtan tepeye erişilebilir rota vardır | AK-4.5 |

**Kabul Senaryoları (GWT):**

1. **AK-4.1 — GIVEN** seed=42 **WHEN** kule iki kez üretilir **THEN** kutu konumları birebir aynıdır
2. **AK-4.2 — GIVEN** oyuncu üst 1/3 sınırını geçti **WHEN** kare işlenir **THEN** kat +1, kamera H/3 kayar, kota dolar
3. **AK-4.3 — GIVEN** zorluk=Zor **WHEN** parametreler okunur **THEN** §4.4 Zor sütunu döner
4. **AK-4.4 — GIVEN** sonsuz modda kat=20 **WHEN** parametreler hesaplanır **THEN** Kolay tabanı Orta'ya doğru lerp edilmiştir
5. **AK-4.5 — GIVEN** herhangi bir seed **WHEN** `verifyReachable` koşulur **THEN** omurga yolu bulunur (1000 seed örneklem testi)

**Kabul Kriterleri:**

| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-4.1 | seed determinizmi | unit | ⬜ |
| AK-4.2 | kamera/kat geçişi | unit | ⬜ |
| AK-4.3 | parametre tablosu | unit | ⬜ |
| AK-4.4 | sonsuz ölçekleme | unit | ⬜ |
| AK-4.5 | erişilebilirlik garantisi | unit | ⬜ |

**T Görev Listesi:**

- [ ] T-4: `model/tower.ts` + `verifyReachable` (BFS)
- [ ] T-5: `model/difficulty.ts` — tablo + `scale`
- [ ] T-6: `model/layout.ts#calculateLayout` + viewport testleri

**Edge Cases:**

| Durum | Davranış |
|:------|:---------|
| Viewport 0×0 (gizli sekme) | `LAYOUT_INVALID` — sahne kurulmaz, `init` reddeder |
| Üst üste kutu üretimi | RNG reddeder, yeniden dener (max 10 deneme) |
| Kat 404 | Paskalya yumurtası ekranı; tırmanış sürer (K10) |
| Alt temizlikte oyuncunun durduğu kutu | Oyuncu o kutuyla birlikte düşer (orijinal davranış) |

**Involved Files:**

| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/dusenin-dostu/model/tower.ts` | Üretici + BFS |
| `apps/games/src/dusenin-dostu/model/difficulty.ts` | Parametre tablosu |
| `apps/games/src/dusenin-dostu/model/layout.ts` | Responsive metrics |

---

### 6.5 UC-5 — Kutu Tipleri, İp Kotası, Zincir ve Skor

**Status:** 🟡 Kısmi doğrulama — kanıt/boşluklar §A.3 ve §B.2'de

**Kapsam:**

- dahil: taş kutu, rotor (yön + hız sınıfı), kırıcı, coin, sandık davranışları; ip kotası; zincir; skor formülü; yıldız derecelendirme; `saveRequested` payload'ı.
- hariç: `Math.random` tabanlı bonus (K8); ikinci bonus tipi (A1).

**Akış:**

1. Kutu tipleri üretici tarafından atanır; görsel dil `ui/atlas.ts`'te eşlenir.
2. Atış → kota −1; kota 0 + yerde + atış imkânsız → "İp bitti" → oyun sonu.
3. Havada ikinci atış → zincir +1; kutuya iniş → zincir 0.
4. Skor olayları: kat +100, coin +25, zincir +25×halka; mod sonunda `saveRequested`.

**Gereksinimler (FR-5):**

| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-5.1 | Taş kutu pasif kanca + basılabilir zemin; rotor motorlu ve yön oku + hız rozeti taşır | AK-5.1 |
| FR-5.2 | Kırıcıya ip teması ipi koparır; oyuncu teması oyunu bitirir | AK-5.2 |
| FR-5.3 | Sandık temiz inişte +1 ip +1 coin verir; RNG yok | AK-5.3 |
| FR-5.4 | İp kotası kattan kata yenilenir; bittiğinde uygun durumda oyun sonu tetiklenir | AK-5.4 |
| FR-5.5 | Skor formülü (K9) tek fonksiyonda; zincir yere değince sıfırlanır | AK-5.5 |

**Kabul Senaryoları (GWT):**

1. **AK-5.1 — GIVEN** rotor kutusu **WHEN** üzerine ip atılır **THEN** motorlu sarkaç başlar; taş kutuda pasif sarkaç başlar
2. **AK-5.2 — GIVEN** oyuncu kırıcıya değiyor **WHEN** kare işlenir **THEN** oyun biter; ip temasında yalnız ip kopar
3. **AK-5.3 — GIVEN** sandığın üstüne iniş **WHEN** temas gerçekleşir **THEN** +1 ip +1 coin, sandık tükenir
4. **AK-5.4 — GIVEN** kota 0 ve oyuncu yerde **WHEN** atış imkânsız durum sürer **THEN** "İp bitti" bitişi tetiklenir
5. **AK-5.5 — GIVEN** zincir 3 **WHEN** yeni halka eklenir **THEN** skor +75; kutuya inince zincir 0

**Kabul Kriterleri:**

| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-5.1 | tip davranışları | unit | ⬜ |
| AK-5.2 | kırıcı ölüm/kopma | unit | ⬜ |
| AK-5.3 | sandık | unit | ⬜ |
| AK-5.4 | kota akışı | unit | ⬜ |
| AK-5.5 | skor/zincir | unit | ⬜ |

**T Görev Listesi:**

- [ ] T-5: `model/scoring.ts` + kota/zincir (UC-5 FR'leri)
- [ ] T-14: mod orkestrasyonunda skor/kota bağlama

**Edge Cases:**

| Durum | Davranış |
|:------|:---------|
| Sandığa ikinci iniş | Sandık tükenmişse normal taş kutu gibi davranır |
| Kota 0'da zıplama | Zıplama serbest (ip gerekmez); çıkış yoksa oyun sonu |
| Coin'e kutunun içinden geçiş | Coin toplanır (çarpışma yok) |
| Zincir sırasında ölüm | Skor korunur, zincir kaydedilmez |

**Involved Files:**

| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/dusenin-dostu/model/scoring.ts` | Skor + yıldız |
| `apps/games/src/dusenin-dostu/model/game.ts` | Kota/zincir durum alanları |

---

### 6.6 UC-6 — Modlar: Sonsuz, Kampanya, Zamana Karşı, Günlük

**Status:** 🟡 Kısmi doğrulama — kanıt/boşluklar §A.3 ve §B.2'de

**Kapsam:**

- dahil: hub (4 mod kartı + zorluk seçimi + devam et); Sonsuz Tırmanış; Rota Bulmacası kampanyası (30 kat/kademe, seed türetimi, checkpoint, yıldız); Zamana Karşı (60 sn); Günlük Kule (tarih tohumu, günde 1 deneme); kademe kilitleri.
- hariç: liderlik tablosu/sunucu paylaşımı (A2); oyun seçim sayfası; günlük seri ödülü.

**Akış:**

1. Hub → mod kartı → (kampanya ise kademe + devam) → `start()`.
2. Sonsuz: parametreler katla ölçeklenir; 404'te rozet.
3. Kampanya: `seed = hash(difficulty, levelNo)`; hedef: kata ulaş + `par` ip sınırı; bitince yıldız + `levelCompleted` + sonraki kat.
4. Zamana Karşı: 60 sn sayaç; kat/coin/zincir skoru; süre 0 → bitiş.
5. Günlük: `YYYY-MM-DD` seed; sonuç `saveRequested`; shell günlük kilidi tutar.

**Gereksinimler (FR-6):**

| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-6.1 | Hub 4 modu listeler; kampanya için kademe + checkpoint gösterir | AK-6.1 |
| FR-6.2 | Modlar aynı çekirdek simülasyonu kullanır; yalnız parametre/kural farkı vardır | AK-6.2 |
| FR-6.3 | Kampanya seed'i `hash(difficulty, levelNo)` ile türetilir; yıldız = `par` ip sınırına göre 1-3 | AK-6.3 |
| FR-6.4 | Zamana Karşı 60 sn'de biter; skor formülü K9 + süre bonusu yok | AK-6.4 |
| FR-6.5 | Günlük kule tarih tohumundan üretilir; aynı gün aynı kule | AK-6.5 |
| FR-6.6 | Kademe kilidi: Kolay açık, Orta Kolay bitince, Zor Orta bitince | AK-6.6 |

**Kabul Senaryoları (GWT):**

1. **AK-6.1 — GIVEN** hub açık **WHEN** render edilir **THEN** 4 mod kartı + kademe seçimi görünür
2. **AK-6.2 — GIVEN** herhangi bir mod **WHEN** oyun başlar **THEN** aynı `game.ts#step` çekirdeği kullanılır (mod yalnız parametre enjekte eder)
3. **AK-6.3 — GIVEN** kampanya Kolay 0 **WHEN** bitirilir **THEN** yıldız hesaplanır ve `levelCompleted` yayınlanır
4. **AK-6.4 — GIVEN** Zamana Karşı **WHEN** 60 sn dolar **THEN** oyun biter, `saveRequested` gider
5. **AK-6.5 — GIVEN** 2026-11-10 **WHEN** günlük mod başlar **THEN** seed `hash("2026-11-10")`'dir; ertesi gün farklı kule
6. **AK-6.6 — GIVEN** Kolay bitmemiş **WHEN** Orta seçilmek istenir **THEN** kilitli görünür ve seçilemez

**Kabul Kriterleri:**

| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-6.1 | hub içeriği | unit + gözle | ⬜ |
| AK-6.2 | tek çekirdek | kod inceleme | ⬜ |
| AK-6.3 | kampanya yıldız | unit | ⬜ |
| AK-6.4 | zaman bitişi | unit | ⬜ |
| AK-6.5 | günlük seed | unit | ⬜ |
| AK-6.6 | kademe kilidi | unit | ⬜ |

**T Görev Listesi:**

- [ ] T-4: `tower.ts` seed türetimi (kampanya/günlük)
- [ ] T-14: mod orkestrasyonu (4 mod)
- [ ] T-15: hub sayfası + kademe kilit/checkpoint lib'i

**Edge Cases:**

| Durum | Davranış |
|:------|:---------|
| Günlük aynı gün ikinci kez | Shell kaydı varsa giriş kilitli (modül yalnız oynatır, karar shell'de) |
| Kampanya son katı bitti | Kademe tamamlandı; sonraki kademe kilidi açılır |
| Zamana Karşı'da ölüm | Süre durmaz; yeniden doğuş yok — oyun biter |
| Saat dilimi değişimi | Tarih anahtarı yerel gün; değişimde yeni kule |

**Involved Files:**

| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/dusenin-dostu/index.ts` | Mod seçimi/orkestrasyon |
| `apps/app/src/pages/dusenin-dostu-hub/*` | Hub UI |
| `apps/games/src/dusenin-dostu/model/tower.ts` | Seed türetimi |

---

### 6.7 UC-7 — İpucu Entegrasyonu

**Status:** 🟡 Kısmi doğrulama — kanıt/boşluklar §A.3 ve §B.2'de

**Kapsam:**

- dahil: `DuseninDostuHintHost` constructor enjeksiyonu; `rota-goster`; `yavas-zaman`; `hintRequested` akışı.
- hariç: coin/reklam kararı (shell); ipucu UI ekonomisi.

**Akış:**

1. Kullanıcı ipucu butonuna dokunur → modül `hintRequested {hintType}` yayınlar.
2. Shell `HintHost.grant(hintType)` ile onay verir (coin/reklam kararı shell'de).
3. Onay → efekt: `rota-goster` omurga üzerindeki sonraki kutuyu 5 sn vurgular; `yavas-zaman` 5 sn `timeScale = 0.5`.

**Gereksinimler (FR-7):**

| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-7.1 | `IGameModule` kontratı DEĞİŞMEZ; ipucu onayı constructor'daki `HintHost` ile döner | AK-7.1 |
| FR-7.2 | Onay gelmeden ipucu efekti uygulanmaz; red durumunda sessiz dönülür | AK-7.2 |
| FR-7.3 | `yavas-zaman` zaman ölçeğini 0.5'e indirir, 5 sn sonra eski değere döner | AK-7.3 |

**Kabul Senaryoları (GWT):**

1. **AK-7.1 — GIVEN** modül `HintHost` ile kuruldu **WHEN** ipucu istenir **THEN** `hintRequested` yayınlanır, `false` dönerse efekt yok
2. **AK-7.2 — GIVEN** host `false` döndü **WHEN** ipucu istenir **THEN** görsel değişiklik olmaz, kota/skor etkilenmez
3. **AK-7.3 — GIVEN** `yavas-zaman` onaylandı **WHEN** 5 sn geçer **THEN** zaman ölçeği 1.0'a döner

**Kabul Kriterleri:**

| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-7.1 | hint akışı | unit | ⬜ |
| AK-7.2 | red sessizliği | unit | ⬜ |
| AK-7.3 | zaman ölçeği | unit | ⬜ |

**T Görev Listesi:**

- [ ] T-8: `HintHost` enjeksiyonu (index.ts)
- [ ] T-12: FX katmanında ipucu vurgusu

**Edge Cases:**

| Durum | Davranış |
|:------|:---------|
| Oyun duraklatılmışken ipucu | Reddedilir (ipucu yalnız `running`) |
| `yavas-zaman` üst üste | Süre yenilenir, çarpan 0.5'te kalır |
| Omurga dışı hedef | `rota-goster` her zaman omurga kutusunu seçer |

**Involved Files:**

| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/dusenin-dostu/index.ts` | HintHost alımı |
| `apps/games/src/dusenin-dostu/ui/fx.ts` | Vurgu efekti |
| `apps/app/src/app/App.tsx` | HintHost sağlama |

---

### 6.8 UC-8 — Görsel Katman, FX ve Ses

**Status:** 🟡 Kısmi doğrulama — kanıt/boşluklar §A.3 ve §B.2'de

**Kapsam:**

- dahil: PNG asset seti + `ui/atlas.ts`; sahne katmanları (parallax bg ×3, oyun alanı, önizleme overlay); game-fx tüketimi (burst/shake/audio); mağara→gökyüzü tint geçişi; HUD DOM overlay.
- hariç: müzik; sprite sheet dilimleme (ayrı PNG'ler — K15); tema sistemi.

**Akış:**

1. `init` → `atlas.ts#loadAtlas` tüm PNG'leri yükler; hata → `ASSET_LOAD_FAILED`.
2. Sahne: bg katmanları (`parallax` katsayılarıyla), kule katmanı, oyuncu/ip katmanı, önizleme katmanı.
3. `ui/fx.ts` olayları dinler: `land` → toz burst; `ropeBreak` → shard burst + shake; `coin` → sparkle; `floorUp` → konfeti; ölüm → shake + boop sesi.
4. Kat ilerledikçe bg tint değeri mağaradan gökyüzüne lerp edilir.
5. HUD (ip pips, coin, kat, zincir) DOM overlay'de; Pixi yalnız oyun alanı.

**Gereksinimler (FR-8):**

| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-8.1 | Tüm asset yolları `ui/atlas.ts`'te; eksik asset `ASSET_LOAD_FAILED` fırlatır | AK-8.1 |
| FR-8.2 | Oyun nesneleri PNG sprite; sanat amaçlı `Graphics` çizimi yok (önizleme overlay istisnası) | AK-8.2 |
| FR-8.3 | FX/ses yalnız `ui/fx.ts` üzerinden; `model/` hiçbir FX API'si import etmez | AK-8.3 |
| FR-8.4 | Parallax bg mağara→gökyüzü geçişi kat oranıyla tint'lenir | AK-8.4 |
| FR-8.5 | HUD DOM overlay'de; dokunma alanları oyun alanını %15'ten fazla örtmez | AK-8.5 |

**Kabul Senaryoları (GWT):**

1. **AK-8.1 — GIVEN** asset eksik **WHEN** `init` çağrılır **THEN** `ASSET_LOAD_FAILED` fırlar
2. **AK-8.2 — GIVEN** oyun sahnesi **WHEN** render edilir **THEN** tüm oyun nesneleri sprite'tır (kod inceleme + görsel kontrol)
3. **AK-8.3 — GIVEN** `model/` derlenir **WHEN** import grafiği incelenir **THEN** game-fx/pixi import'u yoktur
4. **AK-8.4 — GIVEN** kat 1 vs kat 100 **WHEN** bg render edilir **THEN** tint farklıdır (mağara→gökyüzü)
5. **AK-8.5 — GIVEN** 390×844 viewport **WHEN** HUD render edilir **THEN** oyun alanı dokunma alanı %85'ten az örtülmez

**Kabul Kriterleri:**

| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-8.1 | asset hata yolu | unit | ⬜ |
| AK-8.2 | sprite-only | kod inceleme + gözle | ⬜ |
| AK-8.3 | model purity | check-purity lint | ⬜ |
| AK-8.4 | tint geçişi | gözle | ⬜ |
| AK-8.5 | HUD örtüşmesi | gözle (6 viewport) | ⬜ |

**T Görev Listesi:**

- [ ] T-10: `ui/atlas.ts` + `assets/` PNG seti
- [ ] T-11: `ui/DuseninDostuStage.tsx` — katmanlar + ticker
- [ ] T-12: `ui/fx.ts` — burst/shake/audio bağlama
- [ ] T-13: HUD DOM overlay + `ui/strings.ts`
- [ ] T-20: asset üretimi (görsel promptları → PNG)

**Edge Cases:**

| Durum | Davranış |
|:------|:---------|
| Düşük bellek cihaz | Texture'lar tek sefer yüklenir; `exit`'te cache temizlenir |
| Arka plana geçiş | Ticker durur; FX kuyruğu temizlenir |
| Ses kapalı (kullanıcı) | `canPlay` false → sessiz; hata yok |

**Involved Files:**

| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/games/src/dusenin-dostu/ui/*` | Sahne, atlas, FX, HUD |
| `apps/games/src/dusenin-dostu/assets/*` | PNG'ler |
| `tools/generate-sprite.mjs` | fal.ai üretim pipeline'ı (nano-banana + BiRefNet + sharp normalizasyon) |
| `tools/sprites-spec.mjs` | Element bazlı canvas/frame boyutları |
| `tools/sprites-prompts/dusenin-dostu.mjs` | Stil kiti + element prompt'ları + palet |

---

### 6.9 UC-9 — App Entegrasyonu ve İlk Ders

**Status:** 🟡 Kısmi doğrulama — kanıt/boşluklar §A.3 ve §B.2'de

**Kapsam:**

- dahil: Home kartı + hub bağlantısı; `registerGame`; ilk ders overlay'i (3 adım, atlanabilir, `tutorialDone`); TR i18n; çıkışta temizlik; paket exports map.
- hariç: oyun seçim sayfası; tema; çoklu dil (TR tek dil, ileri iş).

**Akış:**

1. `App.tsx` → `registerGame("dusenin-dostu", ...)`; `view` union'ına `"dusenin-dostu-hub"` eklenir.
2. HomePage'e "Düşenin Dostu" kartı (`onPlayDuseninDostu` prop'u).
3. Hub → mod seç → ilk girişte ders overlay'i (3 adım: dokun-tutun, dokun-bırak, kat hedefi); "Atla" her zaman görünür.
4. Çıkış → `exit()`; App `loadGame` örneğini bırakır.

**Gereksinimler (FR-9):**

| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-9.1 | Home kartı + hub tek dokunuşla oyuna giriş sağlar; hub'dan geri dönüş var | AK-9.1 |
| FR-9.2 | Modül paket exports map'e eklenir; lazy import ana bundle'a sızmaz | AK-9.2 |
| FR-9.3 | İlk ders yalnız bir kez gösterilir; "Atla" kalıcı bayrak yazar | AK-9.3 |
| FR-9.4 | Tüm görünür metinler `ui/strings.ts` + app i18n üzerinden TR | AK-9.4 |
| FR-9.5 | `exit` sonrası Stage destroy; yeniden girişte yeni örnek | AK-9.5 |

**Kabul Senaryoları (GWT):**

1. **AK-9.1 — GIVEN** Home açık **WHEN** "Düşenin Dostu" kartına dokunulur **THEN** hub açılır; hub'dan geri Home'a döner
2. **AK-9.2 — GIVEN** build çıktısı **WHEN** ana chunk incelenir **THEN** `dusenin-dostu` kodu ana bundle'da yoktur
3. **AK-9.3 — GIVEN** ilk giriş **WHEN** oyun başlar **THEN** ders overlay'i görünür; "Atla" sonrası bir daha görünmez
4. **AK-9.4 — GIVEN** oyun içi metinler **WHEN** render edilir **THEN** TR'dir (i18n anahtarları üzerinden)
5. **AK-9.5 — GIVEN** oyundan çıkıldı **WHEN** tekrar girilir **THEN** yeni modül örneği başlar, eski kaynak kalmaz

**Kabul Kriterleri:**

| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-9.1 | Home→hub→oyun akışı | e2e | ⬜ |
| AK-9.2 | lazy chunk | e2e (build) | ⬜ |
| AK-9.3 | ders bayrağı | unit + e2e | ⬜ |
| AK-9.4 | TR metinler | e2e | ⬜ |
| AK-9.5 | exit temizliği | unit + e2e | ⬜ |

**T Görev Listesi:**

- [ ] T-16: Home kartı + hub + i18n + registerGame
- [ ] T-17: İlk ders overlay'i
- [ ] T-21: e2e mutlu yol

**Edge Cases:**

| Durum | Davranış |
|:------|:---------|
| Hub'da zorluk kilitli | Kart disabled + kilit ikonu (K13) |
| İlk ders sırasında arka plana geçiş | Overlay korunur; `resume` sonrası devam |
| Store'da anahtar yok | `tutorialDone` false kabul edilir |

**Involved Files:**

| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/app/src/app/App.tsx` | Kayıt + view union |
| `apps/app/src/pages/home/HomePage.tsx` | Kart + prop |
| `apps/app/src/pages/dusenin-dostu-hub/*` | Hub sayfası |
| `apps/app/src/shared/lib/i18n.ts` | Anahtarlar |
| `apps/games/package.json` | `./dusenin-dostu` export |

---

## 7. Yaşam Döngüsü ve Hata Kategorileri

| Durum | Davranış |
| :---- | :------- |
| idle | Modül yüklü; kaynak ayrılmadı |
| initialized | `init` bitti: atlas + sahne kuruldu |
| running | Oynanabilir; simülasyon 60Hz |
| paused | Ticker durur; tap yok sayılır; ipucu reddedilir |
| stopped | `exit` sonrası: Stage destroy, listener temizliği; geri dönüş YOK |

**Modül-içi hata kategorileri (kontratınkine ek):**

| Kategori | Anlam |
| :------- | :---- |
| `ASSET_LOAD_FAILED` | PNG/atlas yüklenemedi — `init` fırlatır |
| `LAYOUT_INVALID` | Viewport ölçülemedi / sıfır boyut — sahne kurulmaz |
| `SEED_NOT_FOUND` | Kampanya/günlük seed türetilemedi (geçersiz kademe/kat) |

**Yan etkiler:** `init` atlas + sahne ayırır; `exit` bunları serbest bırakır (ZORUNLU — kontrat).
**Limitler:** Tek modül örneği; aynı anda tek shell; simülasyon adımı 60Hz sabit; `dt` clamp 50ms.

---

## 8. Başarı Kriterleri (SC-x)

| Kod | Kriter | Ölçüm |
| :-- | :---- | :---- |
| SC-1 | `model/` katmanı %100 saf (Pixi/DOM/game-fx import'u 0) | check-purity lint (`GAMES` listesine ekli) |
| SC-2 | Tap-only: kod tabanında sürükleme/drag eventi yok | kod inceleme + e2e |
| SC-3 | Determinizm: aynı seed + input dizisi → aynı state | unit |
| SC-4 | Önizleme doğruluğu: işaretçi ↔ gerçek iniş ±1 kutu | unit |
| SC-5 | Responsive: 6 referans viewport'ta (390×844, 844×390, 1024×1024, 360×640, 768×1024, 1280×720) taşma/negatif koordinat yok | unit |
| SC-6 | `bun run check` yeşil (contracts + lint + typecheck + test) | CI komutu |
| SC-7 | Erişilebilirlik: 1000 seed örnekleminde her kat omurgası BFS ile ulaşılabilir | unit |
| SC-8 | Lazy chunk: ana bundle `dusenin-dostu` kodu içermez | e2e (build çıktısı) |
| SC-9 | Çözülebilirlik: Kolay kademesinde 100 seed × 20 kat üretiminde her kat `minRopesToGoal ≤ 4` (K29) | unit (`tower.test.ts`) |

---

## 9. Aşama Eşlemesi (iş akışı)

| Aşama | Ürün |
| :---- | :---- |
| 1. SPEC | Bu doküman |
| 2. SÖZLEŞME + TEST | `model/*` JSDoc sözleşmeleri (physics, game, tower, preview, scoring, layout, difficulty, module-state) + KIRMIZI testler (`*.test.ts` GWT'den türetilir) |
| 3. IMPL | T-1 … T-21 (Bakınız §12) |
| 4. REVIEW | Bu dokümanın §A/§B güncellemesi (Doğrulama + Test Kapsamı) — ayrı KAPANIŞ dokümanı YOK |

---

## 10. Açık Kararlar

| # | Konu | Durum |
| :-- | :--- | :---- |
| A1 | K7 zinciri (havadayken retarget) onayı | Öneri: evet — onay sırasında kesinleşir; hayır ise K7 düşer, UC-3 FR-3.6/AK-3.6 kapsamdan çıkar |
| A2 | Kırıcıya oyuncu temasında ölüm | Öneri: evet — onay sırasında kesinleşir |
| A3 | K8 sandık davranışı (deterministik +1 ip +1 coin) | Öneri: evet — orijinal RNG kaldırılır |
| A4 | Hareketli kutular (Zor üstü) | İleri iş — ayrı paket |
| A5 | Boss katları | İleri iş — ayrı paket |
| A6 | Liderlik tablosu + sunucu paylaşımı | Shell/backend işi — bu pakette YOK |
| A7 | README §4.3 skill katsayı satırı (`Düşenin Dostu`) | Öneri: Zeka 0.8 / Hafıza 0.1 / Dikkat 0.6 / Refleks 0.7 / Hesaplama 0.1 / Sezgi 0.3 — ürün onayı + README güncellemesi (shell işi) |
| A8 | Oyun içi IP menzili 6×step | Kalibrasyon T-1 prototipinde ayarlanır |
| A9 | Günlük kilit denetimi | Shell kaydına bağlı; modül yalnız oynatır |
| A10 | Hareket azaltma (reduced motion) | İleri iş — erişilebilirlik turu |

---

## 11. İleri İş (bu pakette YAPILMAZ — referans)

1. Liderlik tablosu ve günlük paylaşım (A6) — shell/backend
2. Hareketli kutular + boss katları (A4, A5)
3. Müzik/atmosfer sesleri (yalnız sentez SFX var — K22)
4. Reduced-motion ve erişilebilirlik turu (A10)
5. Oyun seçim sayfası (tüm oyunlar için ortak)
6. Reklam SDK'sı (AdMob) — shell tarafı (README §7.5)

---

## 12. T Görev Özeti

| # | Görev | UC |
| :- | :---- | :- |
| T-1 | `model/types.ts` + `model/physics.ts` — sarkaç/balistik/süpürme (testler ÖNCE) | UC-2 |
| T-2 | `model/game.ts#step` — saf durum makinesi + olaylar | UC-2 |
| T-3 | `model/preview.ts` — ileri sarma + iniş işaretçisi | UC-3 |
| T-4 | `model/tower.ts` — seed'li üretici + `verifyReachable` BFS + seed türetimi | UC-4, UC-6 |
| T-5 | `model/difficulty.ts` — parametre tablosu + sonsuz ölçekleme | UC-4 |
| T-6 | `model/layout.ts#calculateLayout` + viewport testleri | UC-4 |
| T-7 | `model/module-state.ts` — durum makinesi + event yayını | UC-1 |
| T-8 | `index.ts` — `DuseninDostuModule` + `DuseninDostuHintHost` + mod orkestrasyonu | UC-1, UC-6, UC-7 |
| T-9 | `ui` tap girişi + hit test + geçersiz atış uyarısı | UC-3 |
| T-10 | `ui/atlas.ts` + `assets/` PNG seti yerleşimi | UC-8 |
| T-11 | `ui/DuseninDostuStage.tsx` — katmanlar + ticker + kamera | UC-8 |
| T-12 | `ui/fx.ts` — burst/shake/audio + ipucu vurgusu | UC-8, UC-7 |
| T-13 | HUD DOM overlay + `ui/strings.ts` | UC-8 |
| T-14 | `model/scoring.ts` + kota/zincir + 4 mod orkestrasyonu | UC-5, UC-6 |
| T-15 | Hub sayfası + kademe kilit/checkpoint lib'i | UC-6 |
| T-16 | Home kartı + hub bağlantısı + i18n + `registerGame` + paket export | UC-9 |
| T-17 | İlk ders overlay'i (3 adım, atlanabilir) | UC-9 |
| T-18 | check-purity `GAMES` listesine `dusenin-dostu` + SC testleri | UC-1…9 |
| T-19 | Responsive layout testleri (6 viewport) | UC-4 |
| T-20 | Asset üretimi: `tools/generate-sprite.mjs` ile `FAL_KEY=... bun run sprites dusenin-dostu --all` (nano-banana + BiRefNet + sharp; prompt'lar `tools/sprites-prompts/dusenin-dostu.mjs`) — **16/16 asset üretildi (2026-11-10)** | UC-8 |
| T-21 | e2e mutlu yol (Home → hub → oyna → çık) | UC-9 |

**İş sırası (bağımlılık):** T-1 → T-2 → T-3/T-4/T-5/T-6 (paralel, testler ÖNCE) → T-7 → T-8 → T-9/T-10/T-11/T-12/T-13/T-14/T-15 (paralel) → T-16 → T-17 → T-18/T-19 → T-20 (görsel üretim T-10 ile paralel yürür) → T-21. Review: `bun run check` yeşil + bu dokümanın §A/§B güncellemesi.

---

## A. DOĞRULAMA (§A)

> Reviewer: Qwen3.8 Flash (review tab) · 2026-11-10 · diff worktree'de untracked/modified; kod değişikliği YAPILMADI, yalnız rapor.

### A.1 Değişiklik Matrisi

| # | Dosya | Değişiklik | Neden (SPEC ref) |
| :-- | :------ | :----------- | :----------------- |
| 1 | `apps/games/src/dusenin-dostu/model/types.ts` | Yeni — `Vec2/Brick/PhysicsParams/LayoutMetrics/GameState/Input/GameEvent` + sabitler (`BRICK_SIZE`, `ROPE_RANGE`, `FIXED_DT`) | UC-2, K19/K21/K24 |
| 2 | `...model/physics.ts` (+`physics.test.ts`) | Yeni — `mulberry32`, `segIntersectsAabb` (Liang-Barsky), `stepSwing` (motorlu/pasif), `ropePosition`, `releaseVelocity`, `integrateAir` | UC-2, K2/K24, FR-2.1-2.5 |
| 3 | `...model/game.ts` (+`game.test.ts`) | Yeni — `createGame` + immutable `step` (tap→attach/release/hop, çarpışma, kota, kat geçişi, ölüm) | UC-2/3/5/6, K1/K5/K6/K7/K8/K9/K10 |
| 4 | `...model/tower.ts` (+`tower.test.ts`) | Yeni — `spawnBricks` omurga+süs, `verifyReachable` BFS | UC-4, K14, FR-4.1/4.5, SC-7 |
| 5 | `...model/preview.ts` (+`preview.test.ts`) | Yeni — `attachRejection` (4 ret nedeni), `previewLanding`, `sweepBreaks` | UC-3, K4/K21, FR-3.4/3.5 |
| 6 | `...model/difficulty.ts` (+`difficulty.test.ts`) | Yeni — `DIFFICULTY_PARAMS` tablosu + `paramsFor` sonsuz lerp (ayrık alanlar `Math.round`) | UC-4, K12/K13, FR-4.3/4.4 |
| 7 | `...model/scoring.ts` (+`scoring.test.ts`) | Yeni — kat/coin/zincir puanı + `starsFor` | UC-5/6, K9 |
| 8 | `...model/layout.ts` (+`layout.test.ts`) | Yeni — `calculateLayout` (6 referans viewport testi, `LAYOUT_INVALID`) | UC-4, K19, SC-5 |
| 9 | `...model/module-state.ts` (+`.test.ts`) | Yeni — ORTAK `ModuleLifecycle` re-export + kontrat testleri | UC-1, AK-1.1-1.3 |
| 10 | `...index.ts` | Yeni — `DuseninDostuModule` (rAF + 60Hz sabit adım, 4 mod, `HintHost`, victory/gameover, `saveRequested`) | UC-1/6/7, K11/K17/K20 |
| 11 | `...ui/DuseninDostuStage.tsx` | Yeni — Pixi sahne (bg/kutu/oyuncu/ip+kanca), önizleme overlay, HUD DOM, modallar, 3 adımlı ders; **tek `onPointerDown`** | UC-3/8/9, K1/K4/K15/K23, FR-3.1 |
| 12 | `...ui/atlas.ts` · `...ui/fx.ts` · `...ui/strings.ts` | Yeni — 16 PNG tek yol kaynağı; game-fx burst/shake/ses; TR metinler | UC-8/9, K15/K16/K22 |
| 13 | `...assets/*.png` (16) | Yeni — fal.ai üretimi (nano-banana + BiRefNet + sharp) | UC-8, K15, T-20 |
| 14 | `apps/games/package.json` · `apps/games/scripts/check-purity.ts` | Değişti — `./dusenin-dostu` export + purity `GAMES` listesi | UC-9 FR-9.2, §5/1 |
| 15 | `apps/app/src/app/App.tsx` · `pages/home/ui/HomePage.tsx` · `shared/lib/i18n.ts` | Değişti — `registerGame("dusenin-dostu")`, Home kartı, TR anahtar | UC-9, K11/K25 |
| 16 | `apps/app/src/pages/dusenin-dostu-hub/{ui,lib,index}` | Yeni — 4 mod kartı, kademe seçimi/kilidi, checkpoint, günlük kilit, ders bayrağı | UC-6/9, K12/K13/K20 |
| 17 | `tools/generate-sprite.mjs` · `tools/sprites-spec.mjs` · `tools/sprites-prompts/dusenin-dostu.mjs` · `package.json` · `.gitignore` | Yeni/Değişti — sprite üretim pipeline'ı + `@fal-ai/client`/`sharp` devDep + `.env` yok sayma | UC-8, T-20 |
| 18 | `docs/DUSENIN-DOSTU-SPEC.md` | Yeni + §A/§B güncellemesi | İş akışı 1/4 + 4/4 |

**Kapsam dışı diff gürültüsü (bu SPEC'in ürünü değil):** `AGENTS.md` (4 aşamalı iş akışı + kapılar), `.opencode/opencode.json` + `.opencode/agents/reviewer.md` (review tab altyapısı), `docs/FAZ-GAME7-ENTEGRASYONU-SPEC.md` status düzeltmesi (2026-11-07 kalanı), `bun.lock`.

### A.2 Test Kanıtları

| Kapsam | Komut | Sonuç |
| :------- | :------ | :------ |
| Kontrat kapısı | `bun run check:contracts` | ✅ 7/7 pass — "check-contracts: temiz (contracts: 2 dosya, scope: 4 dosya)" |
| Repo geneli kapı | `bun run check` | ✅ lint 6/6 · typecheck 6/6 · test 6/6 succeeded (nx) |
| `apps/games` testleri | `bun test` (build turunda koşum) | ✅ 168 pass / 0 fail — bunların **59'u** `src/dusenin-dostu` (54 test tanımı; `test.each` 6 viewport'a açılıyor) |
| Model purity (SC-1) | `bun run lint` → `scripts/check-purity.ts` | ✅ "purity: 50 dosya temiz (shapetris, game7, dusenin-dostu)" |
| Belge lint (kural 11) | `bun run spec:check docs/DUSENIN-DOSTU-SPEC.md` | ⚠️ KOŞULAMADI — script repoda tanımlı değil (S7) |
| E2E / build çıktısı | — | ❣️ YAPILMADI — T-21 ve SC-8 açık (S6) |

### A.3 Kabul Kriteri Kanıtları

Özet + işaretçi (kanonik AK tanımları §6'da). 🟢 = test kanıtı · 🟡 = kısmi (yalnız kod inceleme/tek ayak) · ⬜ = kanıtsız.

| AK | Özet | Kanıt | Durum |
| :---- | :-------------------- | :------------------- | :------ |
| 1.1–1.3 | id / state makinesi / exit sessizliği | `model/module-state.test.ts` (`id sabit`, `init öncesi start…`, `çift init…`) | 🟢 |
| 1.4 | event payload şeması | `index.ts#applyStep`/`#completeLevel` (kod); test yok | 🟡 |
| 2.1 | motorlu tork + ω_max / pasif sönüm | `physics.test.ts` (3 test) | 🟢 |
| 2.2 | ip-kırıcı kopması | `physics.test.ts` (`segIntersectsAabb`), `game.test.ts` (`ip kırıcıdan geçerse kopar`) | 🟢 |
| 2.3 | teğet çıkış hızı | `physics.test.ts` (`teğet çıkış hızı ω×L`) | 🟢 |
| 2.4 | üst yüzey inişi / yan çözümleme | `game.test.ts` (`kutu üstüne iniş…`) | 🟢 |
| 2.5 / SC-3 | determinizm | `game.test.ts` (`aynı state + input…`), `physics.test.ts` (PRNG) | 🟢 |
| 3.1 | tap → attach | `game.test.ts` (`menzildeki kutuya tap ip atar`) | 🟢 |
| 3.2 | tap → release | `game.test.ts` (`boşluğa tap salınımı bitirir`) | 🟢 |
| 3.3 | yerde hop | `game.test.ts` (`yerde boşluğa tap zıplatır`) | 🟢 |
| 3.4 | geçersiz atış reddi + kota korunur | `preview.test.ts` (range/no-rope/invalid/immediate-break), `game.test.ts` (`menzil dışı… yok sayılır`) | 🟢 |
| 3.5 / SC-4 | önizleme ↔ gerçek iniş örtüşmesi | `preview.test.ts` yay üretiyor; **örtüşme doğrulanmadı** | ⬜ |
| 3.6 | retarget + zincir | `index`/`game.ts#applyInput` kod yolu; test yok | ⬜ |
| 4.1 | seed determinizmi | `tower.test.ts` (`aynı seed + floor…`) | 🟢 |
| 4.2 | kamera/kat geçişi | `game.test.ts` (`üst bölgeye çıkınca kat +1…`) | 🟢 |
| 4.3 | zorluk tablosu | `difficulty.test.ts` (5 test) | 🟢 |
| 4.4 | sonsuz ölçekleme | `difficulty.test.ts` (`floor 20 = üst kademe`, lerp, tavan) | 🟢 |
| 4.5 / SC-7 | erişilebilirlik garantisi | `tower.test.ts` (`30 kat… erişilebilir`, kopuk kule negatifi) — örneklem 20 seed | 🟢 (S2) |
| 5.1 | taş=pasif / rotor=motorlu attach | `physics.test.ts` + `game.test.ts` (attach) | 🟢 |
| 5.2 | kırıcı: ip kopar / oyuncu ölür | `game.test.ts` (2 test) | 🟢 |
| 5.3 | sandık +1 ip +1 coin | `game.test.ts` (`sandık temiz inişte…`) — edge case sapması S1 | 🟡 |
| 5.4 | kota bitişi → "İp bitti" | `game.test.ts` (`kota bitip yerde kalınca…`) | 🟢 |
| 5.5 | skor/zincir sıfırlama | `scoring.test.ts` (`chainBonus`), `game.test.ts` (reset) — artırım ucu test yok | 🟡 |
| 6.1 | hub 4 mod + kademe | `DuseninDostuHub.tsx` (kod) | 🟡 |
| 6.2 | tek çekirdek, mod farkı parametre | `index.ts#newGame` (kod inceleme) | 🟢 |
| 6.3 | kampanya yıldızı | `scoring.test.ts` (`starsFor`) — victory akışı test yok | 🟡 |
| 6.4 | Zamana Karşı bitişi | `game.test.ts` (`zamana karşı süre bitince`) — süre kurulumu `index` | 🟢 |
| 6.5 | günlük seed tutarlılığı | `index.ts#computeSeed`/`#dateKey` — test yok | ⬜ |
| 6.6 | kademe kilitleri | `lib/checkpoint.ts#isDifficultyUnlocked` — test yok | ⬜ |
| 7.1–7.3 | ipucu akışı / red / yavaş zaman | `index.ts#requestHint`, `#advance` scale (kod) — test yok | ⬜ |
| 8.1 | `ASSET_LOAD_FAILED` | `index.ts#init` try/catch (kod) — test yok | 🟡 |
| 8.2 | sprite-only (vektör yasak) | grep: `Graphics` yalnız overlay'de (`DuseninDostuStage.tsx#draw`) | 🟢 |
| 8.3 | model purity | `check-purity.ts` ✅ | 🟢 |
| 8.4 | bg kademe geçişi | `DuseninDostuStage.tsx` (`floor < 15 / < 60`) — gözle yok | 🟡 |
| 8.5 | HUD örtüşme ≤ %15 | ölçülmedi | ⬜ |
| 9.1 | Home → hub → oyun | `App.tsx` + `HomePage` (kod) — e2e yok | 🟡 |
| 9.2 | lazy chunk | `registerGame` dinamik import (kod) — build kanıtı yok | 🟡 |
| 9.3 | ders bayrağı bir kez | `checkpoint.ts#tutorialDone/setTutorialDone` + Stage — test yok | ⬜ |
| 9.4 | TR metinler | `ui/strings.ts`, `i18n.ts` (kod) | 🟢 |
| 9.5 | exit temizliği | `index.ts#exit` (stopLoop+unmount+remove) — test yok | 🟡 |

### A.4 Sapmalar

| # | Sapma | Açıklama | Etki |
| :-- | :------ | :--------- | :----- |
| S1 | **Kullanılmış sandık zemin değil** | SPEC edge case "ikinci inişte taş kutu gibi" der; `game.ts#collideAir` `b.used` kutuları tamamen atlıyor → sandık kullanıldıktan sonra **içinden düşülüyor**; ayrıca `preview.ts#attachRejection` kullanılmış sandığa atışı engellemiyor | Düşük/orta — oyuncu beklentisi bozulur; SPEC'e uyum için `used` sandığın `stone` gibi çözülmesi gerekir |
| S2 | SC-7 örneklemi 1000 seed yerine **20 seed** | `tower.test.ts` döngü sınırı düşürüldü (koşum süresi) | Düşük — garanti zayıfladı; CI turunda artırılabilir |
| S3 | §4.4 "İniş mıknatısı (px) 18/8/0" → **step birimi 0.9/0.4/0** | Birim değişimi model safiyeti için bilinçli; SPEC tablosu px yazıyor | Düşük — §4.4 birim notu eklenmeli (SPEC Revizyon Önerisi) |
| S4 | AK-3.5/SC-4 örtüşme doğrulanmadı | `previewLanding` var; gerçek inişle karşılaştıran test yok | **Orta** — K4 "anlaşılırlık" iddiasının kanıtı eksik |
| S5 | Zincir/retarget (AK-3.6) + UC-6 mod akışları + UC-7 ipuçları + 6.5/6.6 testsiz | Modül katmanı DOM/pixi gerektirdiği için unit test yazılmadı (emsal: game7 de modül seviyesinde testsiz) | **Orta** — kampanya yıldızı, günlük kilit, ipucu onayı yalnız kod inceleme kanıtlı |
| S6 | **T-21 e2e ve SC-8 lazy chunk yapılmadı** | Build/run kanıtı yok; AK-9.1/9.2 kısmi | **Yüksek** — kapanış iddiası için Playwright/build kanıtı gerekir |
| S7 | `spec:check` aracı repoda yok | AGENTS kural 11 + SPEC kural 11 kapısı koşamadı; §A/§B şablon uyumu elle denetlendi | Düşük — araç işi ayrı paket |
| S8 | K24'te anılan `rngCursor` alanı modelden çıkarıldı | Determinizm seed+floor fonksiyonu ile sağlanıyor; SPEC §4.3 metni alan adı taşımıyor, davranış aynı | Önemsiz — doküman-kod tutarlılığı için not |
| S9 | Sonsuz/Zamana Karşı seed'i `Math.random` (modül katmanı) | SC-3 "aynı seed" garantisi yalnız seed dışarıdan verilirse; UI'da seed gösterimi yok → aynı tur tekrarlanamaz | Düşük — paylaşılabilirlik/tekrar oynama için seed UI'a taşınmalı |
| S10 | `resume()` oyun bittikten sonra rAF'ı boşuna başlatıyor | `advance()` erken dönüyor; sadece boş kare maliyeti | Önemsiz |

**SPEC Revizyon Önerisi (karar developer'da):** (a) §4.4 mıknatıs biriminin "step" olarak yazılması (S3); (b) sandık edge case'in netleştirilmesi — taş mı, yok mu (S1); (c) SC-7 örneklem sayısının gerçek CI bütçesine çekilmesi (S2).

### A.5 Gözle Kontrol Maddeleri

- [x] 16 asset üretim sırasında gözle denetlendi (karakter tutarlı, nesneler yüzsüz, bg'ler sahne); `brick`'in ilk üretimde yüz alması prompt ile giderildi
- [x] Model katmanında Pixi/DOM/game-fx import'u yok (grep + purity lint)
- [x] Sahne girişi tek `onPointerDown` — sürükleme eventi yok (FR-3.1/SC-2)
- [ ] **Oyunun kendisi oynanmadı** — zıplama/sarkaç hissi, ip menzili 6×step, mıknatıs değerleri, rotor torku kalibrasyonu kullanıcıda (T-4 sonrası tune turu)
- [ ] HUD örtüşme oranı 6 viewport'ta ölçülmedi (AK-8.5)
- [ ] 404 banner, victory yıldızları, modal TR metinleri runtime'da görülmedi
- [ ] bg kademe geçişi (mağara→gökyüzü) runtime'da görülmedi (AK-8.4)

### A.6 Genel Durum Özeti

Kapı yeşil: `bun run check` (contracts + lint + typecheck + test) 6/6, `apps/games` 168/168 test — 59'u bu modüle ait; purity 50 dosya temiz. Model çekirdeği (UC-2 fizik, UC-4 kule/zorluk) ve tap-ip girdisinin ana kolları (AK-3.1–3.4) **tam test kanıtlı**; 16/16 asset üretildi ve SPEC'in K1 (çizme → tap) ile K4 (canlı önizleme) kararları koda işlendi. Kapanış **koşullu**: dört başlık kanıtsız — önizleme örtüşmesi (AK-3.5/SC-4), zincir/retarget (AK-3.6), modül katmanı akışları (UC-6/UC-7, kampanya yıldızı · günlük kilit · ipucu onayı) ve **e2e + lazy chunk (T-21/SC-8)**; ayrıca S1 sandık edge-case'i SPEC ile kod arasında davranış farkı. Bu boşluklar §B.2'de; developer kararına kadar modül 🟡 konumunda bırakıldı. `review_date:` **2026-11-10** · reviewer önerir, karar vermez.

---

## B. TEST KAPSAMI (§B)

### B.1 Kapsam Matrisi (durum → koşul → beklenen → test ref'i)

| Durum | Koşul | Beklenen (THEN) | Test ref'i |
| :------ | :------ | :---------------- | :----------- |
| air | menzildeki kutuya tap | attach + kota −1 + phase swing | `menzildeki kutuya tap ip atar` (`game.ts` → `game.test.ts`) |
| air | menzil dışı kutuya tap | atış yok, kota azalmaz | `menzil dışı kutuya tap yok sayılır` (`game.test.ts`) + `attachRejection=range` (`preview.test.ts`) |
| swing | boşluğa tap | release + teğet hızla air | `boşluğa tap salınımı bitirir…` (`game.test.ts`) |
| ground | boşluğa tap | hop (vy < 0) | `yerde boşluğa tap zıplatır` (`game.test.ts`) |
| swing | ip süpürmesi kırıcıya değer | ropeBreak + air | `ip kırıcıdan geçerse kopar…` (`game.test.ts`) |
| swing/air | oyuncu kırıcıya değer | over(breaker) | `kırıcıya oyuncu teması oyunu bitirir` (`game.test.ts`) |
| air | üst yüzey çarpması | land + zincir 0 + snap y | `kutu üstüne iniş…` (`game.test.ts`) |
| air | coin üstüne gelir | coin +25 puan, used | `coin toplanır, skor artar` (`game.test.ts`) |
| air | sandık üstüne iniş | +1 ip +1 coin | `sandık temiz inişte +1 ip +1 coin` (`game.test.ts`) |
| ground | ropesLeft 0 | over(out-of-rope) | `kota bitip yerde kalınca…` (`game.test.ts`) |
| air | player.y < H/3 | floorUp + skor +100 + kota dolar | `üst bölgeye çıkınca kat +1…` (`game.test.ts`) |
| air | floor 403→404 | egg404 bir kez | `404. katta paskalya yumurtası…` (`game.test.ts`) |
| air | player.y > H+2 | over(fall) | `ekran altına düşmek oyunu bitirir` (`game.test.ts`) |
| time | timeLeft ≤ 0 | over(time) | `zamana karşı süre bitince biter` (`game.test.ts`) |
| over | her girdi/adım | state aynı, olay yok | `over durumunda step değişiklik üretmez` (`game.test.ts`) |
| herhangi | aynı seed + input dizisi | bit-bit state | `aynı state + input dizisi…` (`game.test.ts`) |
| rotor-cw/ccw | 600/60 adım | ω>0 & ≤ω_max / ω<0 | `physics.test.ts` (2 test) |
| stone | 30 sn pasif | ω→0, θ→π/2 | `pasif sarkaç sönümlenir…` (`physics.test.ts`) |
| tower | seed tekrarı | aynı kutular | `aynı seed + floor aynı kuleyi üretir` (`tower.test.ts`) |
| tower | 20 seed × 30 kat | BFS rota var | `30 kat üretiminde omurga her zaman erişilebilir` (`tower.test.ts`) |
| tower | kopuk kutular | BFS false | `menzil dışı kopuk kule erişilemez` (`tower.test.ts`) |
| difficulty | mod ≠ endless | taban sabit | `kampanya/zaman/günlük modlarda taban sabit` (`difficulty.test.ts`) |
| difficulty | floor 20 / 10 / 500 | üst kademe / lerp / tavan | `difficulty.test.ts` (3 test) |
| layout | 6 referans viewport | geçerli ölçü; 0/NaN → LAYOUT_INVALID | `layout.test.ts` |
| scoring | par / 1.5×par / üstü | 3 / 2 / 1 yıldız | `scoring.test.ts` |
| lifecycle | init/start/pause/resume/exit | kontrat hataları + exit sessizliği | `module-state.test.ts` |
| **KAPSANMAYAN** | swing sırasında ikinci kutuya tap | zincir +1, kopma yok | ⬜ (G2) |
| **KAPSANMAYAN** | önizleme ↔ gerçek iniş | ±1 kutu örtüşme | ⬜ (G1) |
| **KAPSANMAYAN** | kampanya 6. kat | victory + yıldız + save payload | ⬜ (G3) |
| **KAPSANMAYAN** | günlük aynı tarih | aynı kule, tek deneme | ⬜ (G3) |
| **KAPSANMAYAN** | ipucu onay/red akışı | grant=false → efekt yok | ⬜ (G4) |
| **KAPSANMAYAN** | Home→hub→oyun→çık | akış + lazy chunk | ⬜ (G5) |

### B.2 KAPSANMAYAN Boşluklar

| # | Boşluk | Risk | İleri iş |
| :-- | :------- | :----- | :--------- |
| G1 | AK-3.5/SC-4: önizleme işaretçisi ile gerçekleşen inişin örtüşmesi ölçülmüyor | Orta — K4'ün "anlaşılırlık" iddiası kanıtsız | `game.test.ts`e deterministik senaryo ekle: `previewLanding(state).landing` ≈ 120 adımlık gerçek iniş konumu (±0.75 kutu) |
| G2 | AK-3.6 zincir/retarget (havadayken ikinci ip) uçtan uca test edilmiyor | Orta — skor derinliği (K7) regressyona açık | `game.test.ts`: swing → tap(brick2) → `attach.chain===1` + kota 2 azalma + `land` sonrası zincir 0 |
| G3 | UC-6 mod katmanı: kampanya victory/yıldız payload, günlük seed tekliği, kademe kilitleri testsiz | Orta — ilerleme/ kayıt hatası oyuncuyu etkiler | `index.ts` saf yardımcıları (`computeSeed`, `dateKey`, `hashString`) model altına alınıp unit test; hub kilidi için `lib/checkpoint.ts` test (localStorage mock) |
| G4 | UC-7 ipucu akışı (`requestHint` grant/red, `yavas-zaman` ölçeği) testsiz | Düşük/orta — coin kaybı/yanlış efekt riski | `DuseninDostuModule`'e DOM'suz erişilebilir `hintFlow` ayrıştır + test; veya Playwright smoke |
| G5 | T-21 e2e (Home→hub→oyna→çık) + SC-8 lazy chunk + AK-9.5 exit temizliği runtime'da doğrulanmadı | **Yüksek** — oyun hiç çalıştırılmadı; sahne/HUD/animasyon hataları görünmez | Playwright akışı + `nx run app:build` çıktı kontrolü; ilk çalıştırmada 6 viewport görsel turu (AK-8.5/8.4) |
| G6 | S1 sandık edge-case davranış farkı (used sandık geçirimli) | Düşük/orta | Ya kod edge case'e çekilir ya SPEC revize edilir (developer kararı) |
| G7 | Oynanış kalibrasyonu (ağırlık/tork/menzil/mıknatıs) ve §4.4 px→step birim notu (S3), SC-7 örneklem (S2) | Orta — "el çabukluğu" hissi ayarsız çıkabilir | Play-test turu + SPEC §4.4 birim/örneklem düzeltmesi |

**review_date:** 2026-11-10
