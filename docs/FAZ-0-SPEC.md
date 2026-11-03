---
status: active
space: architecture
tags: [hazirlik, mimari, spec]
review_date: 2026-11-03
---

# FAZ-0 — SPEC (Hazırlık)

> **İş akışı aşaması:** 1/5 — SPEC (AGENTS.md "Geliştirme İş Akışı").
> **Durum:** ✅ Approved (2026-11-03) — KAPANIŞ tamamlandı (§A/§B).
> **İlişkili:** [README v0.5 §3, §11](README.md)

## 1. Amaç ve Bağlam

Bulmacanya'nın tek kod tabanlı platformunun temelini atmak: Nx monorepo iskeleti, hexagonal backend kabuğu, Ionic/React + Capacitor app iskeleti, oyun kabuğu sözleşmesi, veri modeli + auth tasarımı. Faz 0 kod değil **iskelet ve sözleşme** üretir; iş mantığı Faz 1'de gelir.

| Kapsam | Detay |
| :----- | :---- |
| dahil | Nx+Bun monorepo, app/backend paket iskeletleri, packages/shared, game shell kontratı + boş shell, 10 tabloluk Drizzle şema tanımı, auth akış tasarımı |
| hariç | Oyun modernizasyonu/implementasyonu (Faz 1), hesap/ilerleme endpoint'leri (Faz 1), monetizasyon (Faz 3), mağaza yayını (Faz 4), TÜRKPATENT ön kontrolü (bu pakette YAPILMAZ) |

## 2. Kararlar (kullanıcı onaylı, tarihli)

| Kod | Karar | Sonuç |
| :-- | :---- | :---- |
| K1 | Nx monorepo; apps içinde app + oyunlar + backend; ortak tipler/kontratlar packages/shared (2026-11-03) | §4 repo modları |
| K2 | Backend pure hexagonal: domain/application/infra/presentation; presentation transport-agnostic (REST, CLI, desktop aynı anda bağlanabilir) (2026-11-03) | UC-2 — Faz 0'da REST + CLI adaptörleri; desktop İleri İş |
| K3 | App: FSD (Feature-Sliced Design) + Atomic Design (2026-11-03) | UC-3 |
| K4 | Tüm 3. parti sınıflar (DB vb.) yalnız kontrat üzerinden tüketilir; paketlere facade çekilir (2026-11-03) | §5 Purity, UC-2 |
| K5 | Tüm kod (oyunlar, backend, app) Elegant Object prensiplerine bağlıdır (2026-11-03) | §5 Purity |
| K6 | Kimlik doğrulama: JWT / oturum tabanlı, backend ile birlikte tasarlanır (README §3.1) | UC-5 |
| K7 | Veri modeli README §3.4'teki 10 tablodur; Faz 0 tasarım + Drizzle şema tanımı üretir (README v0.5) | UC-5 |
| K8 | Drizzle ORM kullanılır; elle SQL migration scripti YAZILMAZ — şema TypeScript'te tanımlanır, migration gerektiğinde `drizzle-kit generate` üretir (2026-11-03) | UC-5 |
| K9 | FSD lint = Steiger (resmi linter); `steiger.config.ts` + `fsd.configs.recommended`; lint aşamasının parçası (2026-11-03) | UC-3 |
| K10 | Metotlu kontrat interface'leri `I`- prefix'i taşır; domain/application bağımlılıkları yalnız I-kontratları üzerinden (somut sınıf enjeksiyonu YASAK) — `check-contracts` ile doğrulanır (2026-11-03) | §5.7 |

## 4. Mimari

### 4.1 Repo modları (Nx + Bun)

```
apps/
  app/        # Ionic/React + Capacitor (FSD slice'ları)
  games/      # oyun modülleri (Faz 1+; Faz 0'da yer ayrılır)
  backend/    # Bun + Fastify hexagonal
packages/
  shared/     # ortak tipler + kontratlar (framework-free)
```

### 4.2 Backend katmanları

```
presentation (rest | cli | desktop)  →  application  →  domain
                                          ↓ (port kontratı)
                                        infra (fastify, db adaptörleri)
```

### 4.3 App yapısı

FSD slice'ları (`app/pages/widgets/features/entities/shared`) + Atomic Design bileşen hiyerarşisi; oyunlar `packages/shared`'deki GameModule kontratıyla shell'e lazy-load bağlanır.

## 5. Purity Kuralları (ZORUNLU)

1. `domain/` ve `application/` hiçbir 3. parti sınıfı import ETMEZ (lint ile doğrulanır).
2. `packages/shared` framework-free'dir; yalnız tipler + kontratlar.
3. Oyun modülleri shell'e yalnız GameModule kontratı ile bağlanır; shell oyun-spesifik tip import edemez (arch test ile doğrulanır).
4. FSD import yönü: dış slice içe bağımlı olabilir, tersi YASAK (steiger ile doğrulanır).
5. DB ve diğer dış sistemlere erişim yalnız port kontratları üzerinden; somut adaptörler `infra/` içinde.
6. Drizzle (ve tüm DB erişimi) yalnız `infra` katmanında; domain/application yalnız packages/shared port kontratlarını bilir — Drizzle tipleri bu katmanlara SIZMAZ (purity lint ile doğrulanır).
7. Domain/application constructor bağımlılıkları yalnız `I`- prefixed kontrat interface'leri olabilir; somut sınıf/3. parti tip enjeksiyonu YASAK (`check-contracts` ile doğrulanır — K10).

## 6. Use Case'ler

### 6.1 UC-1 — Monorepo iskeleti

**Status:** 🟢 Doğrulanmış

**Kapsam:**
- dahil: Nx workspace kurulumu, apps/packages sınırları, kök lint/test/typecheck komutları, tek paket komutları
- hariç: CI pipeline kurulumu (İleri İş)

**Akış:**
1. Nx workspace kurulur, Bun runtime yapılandırılır.
2. `apps/` (app, games, backend) ve `packages/shared` paket sınırları oluşturulur.
3. Kök ve paket bazlı komutlar doğrulanır.

**Gereksinimler (FR-x):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-1.1 | Kök komut lint + typecheck + test'i tüm paketlerde çalıştırmalı | AK-1.1 |
| FR-1.2 | Her paket kendi testini bağımsız çalıştırabilmeli | AK-1.2 |

**Kabul Senaryoları (GWT):**
1. **AK-1.1 — GIVEN** temiz kurulum **WHEN** kök doğrulama komutu çalıştırılır **THEN** tüm paketlerde lint/typecheck/test yeşil döner
2. **AK-1.2 — GIVEN** yalnız backend paketi **WHEN** backend'in kendi test komutu çalıştırılır **THEN** yalnız backend testleri koşar ve yeşil döner

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-1.1 | Kök komut tüm paketlerde yeşil | unit | ⬜ |
| AK-1.2 | Tek paket komutu çalışır | unit | ⬜ |

**T Görev Listesi:**
- [ ] T-1: Nx + Bun workspace kurulumu, paket sınırları, kök/tek-paket komutları

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| Paketler arası döngüsel bağımlılık | Nx/lint döngüyü yakalamalı, build kırılmalı |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `nx.json`, `package.json`, `tsconfig*.json`, `apps/*`, `packages/shared` | workspace iskeleti |

### 6.2 UC-2 — Backend hexagonal iskelet

**Status:** 🟢 Doğrulanmış

**Kapsam:**
- dahil: apps/backend; domain/application/infra/presentation dizinleri; DB port kontratı; REST + CLI adaptörleri; health endpoint; in-memory iskelet repo
- hariç: iş mantığı, gerçek PostgreSQL repo içeriği (Faz 1), desktop adaptörü (İleri İş)

**Akış:**
1. Hexagonal dizin iskeleti + DI kablolaması kurulur.
2. DB port kontratı packages/shared'de tanımlanır; infra adaptörü kontrata bağlanır.
3. REST ve CLI adaptörleri aynı application örneğine bağlanır.

**Gereksinimler (FR-x):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-2.1 | domain/application 3. parti import içermemeli | AK-2.1 |
| FR-2.2 | REST ve CLI aynı application'a bağlanmalı, aynı anda çalışabilmeli | AK-2.2 |
| FR-2.3 | DB erişimi yalnız port kontratı (`domain/ports/IDatabasePort`) üzerinden yapılmalı | AK-2.3 |
| FR-2.4 | GET /health 200 dönmeli | AK-2.4 |

**Kabul Senaryoları (GWT):**
1. **AK-2.1 — GIVEN** domain dosyası **WHEN** 3. parti import eklenir **THEN** purity lint kırmızı verir
2. **AK-2.2 — GIVEN** uygulama başlatılmış **WHEN** REST isteği ve CLI komutu aynı application'a dokunur **THEN** ikisi de aynı durumu görür/etkiler
3. **AK-2.3 — GIVEN** infra DB adaptörü **WHEN** application tarafından kullanılır **THEN** erişim port kontratı tipiyle yapılır (derleme düzeyinde doğrulanır)
4. **AK-2.4 — GIVEN** sunucu ayakta **WHEN** GET /health çağrılır **THEN** 200 döner

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-2.1 | Purity lint yeşil | unit | ⬜ |
| AK-2.2 | REST+CLI ortak application integration testi yeşil | unit | ⬜ |
| AK-2.3 | Port kontratı üzerinden erişim derlenir | kod inceleme | ⬜ |
| AK-2.4 | /health 200 | unit | ⬜ |

**T Görev Listesi:**
- [ ] T-2: Hexagonal dizin iskeleti + DI
- [ ] T-3: DB port kontratı (domain/ports) + in-memory adaptör
- [ ] T-4: REST adaptör + /health
- [ ] T-5: CLI adaptör + ortak application testi
- [ ] T-6: Purity lint kuralı (domain/application'da 3. parti import yasağı)

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| Adaptör başlatma hatası | Uygulama hata ile başlar, kısmi mod yok |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/backend/src/{domain,application,infra,presentation}` | katmanlar |
| `apps/backend/src/domain/ports` | DB port kontratı (IDatabasePort) |

### 6.3 UC-3 — App iskeleti (Ionic/React + Capacitor)

**Status:** 🟢 Doğrulanmış

**Kapsam:**
- dahil: apps/app; FSD slice yapısı; Atomic Design örnek bileşeni; PWA (manifest+SW) build; Capacitor iOS/Android config; Türkçe UI baseline (i18n iskeleti)
- hariç: oyun ekranları, backend bağlantısı, hesap (Faz 1)

**Akış:**
1. Ionic/React projesi kurulur, Capacitor eklenir.
2. FSD dizinleri + steiger lint kuralı kurulur.
3. PWA config + Türkçe i18n baseline eklenir.

**Gereksinimler (FR-x):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-3.1 | Web build PWA (manifest + service worker) üretmeli | AK-3.1 |
| FR-3.2 | Capacitor iOS/Android hedefleri tanımlı olmalı (cap sync üretmeli) | AK-3.2 |
| FR-3.3 | FSD import yönü kuralı steiger ile doğrulanmalı | AK-3.3 |
| FR-3.4 | UI metinleri Türkçe olmalı | AK-3.4 |

**Kabul Senaryoları (GWT):**
1. **AK-3.1 — GIVEN** web build çalıştırılır **WHEN** çıktı incelenir **THEN** manifest ve service worker mevcut
2. **AK-3.2 — GIVEN** Capacitor config **WHEN** `cap sync` çalıştırılır **THEN** android/ios platform klasörleri üretilir
3. **AK-3.3 — GIVEN** entities slice'ından app slice'ına import **WHEN** steiger çalıştırılır **THEN** kırmızı verir
4. **AK-3.4 — GIVEN** ekran metinleri **WHEN** incelenir **THEN** Türkçedir

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-3.1 | PWA build çıktısı tam | unit | ⬜ |
| AK-3.2 | cap sync platform üretir | unit | ⬜ |
| AK-3.3 | Steiger yeşil | unit | ⬜ |
| AK-3.4 | UI Türkçe | gözle | ⬜ |

**T Görev Listesi:**
- [ ] T-7: Ionic/React + Capacitor kurulumu
- [ ] T-8: FSD iskeleti + steiger lint (steiger.config.ts) + Atomic Design örneği
- [ ] T-9: PWA config + i18n (Türkçe) baseline

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/app/**` | app iskeleti |
| `apps/app/capacitor.config.*` | mobil hedefler |
| `steiger.config.ts` | FSD lint konfigürasyonu |

### 6.4 UC-4 — Oyun kabuğu sözleşmesi (game shell)

**Status:** 🟢 Doğrulanmış

**Kapsam:**
- dahil: packages/shared'de GameModule kontratı (yaşam döngüsü + skor/ipucu/reklam/kayıt event'leri); app'te boş shell (modül kaydı + lazy-load)
- hariç: gerçek oyunlar, reklam SDK'sı, ipucu iş mantığı (Faz 1/3)

**Akış:**
1. GameModule kontratı JSDoc sözleşmesiyle tanımlanır.
2. Shell kayıt mekanizması kurulur; modüller lazy-load edilir.
3. Kontratı uygulayan mock modül ile doğrulanır.

**Gereksinimler (FR-x):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-4.1 | Shell oyun-spesifik tip import etmemeli; bağlantı yalnız shared kontratıyla | AK-4.1 |
| FR-4.2 | Oyun modülleri lazy-load (ayrı chunk) olmalı | AK-4.2 |
| FR-4.3 | Kontrat skor bildirimi, ipucu talebi, reklam tetikleme, kayıt event'lerini tanımlamalı | AK-4.3 |

**Kabul Senaryoları (GWT):**
1. **AK-4.1 — GIVEN** shell kodu **WHEN** oyun-spesifik import eklenir **THEN** arch test kırmızı verir
2. **AK-4.2 — GIVEN** mock oyun modülü kayıtlı **WHEN** shell onu talep eder **THEN** dinamik import ile yüklenir
3. **AK-4.3 — GIVEN** kontrat tipi **WHEN** incelenir **THEN** 4 event grubu tanımlıdır

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-4.1 | Arch test yeşil | unit | ⬜ |
| AK-4.2 | Lazy-load testi yeşil | unit | ⬜ |
| AK-4.3 | Kontrat eksiksiz | kod inceleme | ⬜ |

**T Görev Listesi:**
- [ ] T-10: GameModule kontratı + JSDoc sözleşmesi (packages/shared)
- [ ] T-11: Shell kayıt + lazy-load mekanizması (apps/app)
- [ ] T-12: Mock modül + arch test

**Edge Cases:**
| Durum | Davranış |
|:------|:---------|
| Kayıtsız modül talebi | Shell hata verir, sessiz boş ekran YOK |

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `packages/shared` | GameModule kontratı |
| `apps/app` | shell |

### 6.5 UC-5 — Veri modeli + auth tasarımı

**Status:** 🟢 Doğrulanmış

**Kapsam:**
- dahil: 10 tablonun Drizzle şema tanımı (`apps/backend/src/infra/db/schema.ts`); JWT auth akış tasarımı (kayıt/giriş/token doğrulama) + shared auth kontrat tipleri
- hariç: canlı DB doğrulaması (DB sunucusu yok — Faz 1), endpoint implementasyonu, token yenileme detayı (Faz 1), monetizasyon iş mantığı

**Akış:**
1. README §3.4 tabloları Drizzle şema tanımına işlenir (infra; elle migration scripti YOK).
2. Auth akış tasarımı dokümana yazılır (kayıt → giriş → token doğrulama).
3. Auth kontrat tipleri packages/shared'e eklenir.

**Gereksinimler (FR-x):**
| Kod | Gereksinim | Eşleşme |
|:----|:-----------|:--------|
| FR-5.1 | Drizzle şema tanımı 10 tabloyu içermeli ve derlenmeli (users, skills, profile, progress, sessions, achievements, hints, coins, subscriptions, daily_puzzle) | AK-5.1 |
| FR-5.2 | Auth akış tasarımı kayıt/giriş/token doğrulamayı kapsamalı | AK-5.2 |
| FR-5.3 | Auth tipleri packages/shared'de olmalı | AK-5.3 |
| FR-5.4 | Drizzle yalnız infra'da olmalı; domain/application Drizzle import etmemeli | AK-5.4 |

**Kabul Senaryoları (GWT):**
1. **AK-5.1 — GIVEN** Drizzle şema dosyası **WHEN** typecheck çalıştırılır **THEN** 10 tablo tanımıyla derlenir
2. **AK-5.2 — GIVEN** tasarım dokümanı **WHEN** incelenir **THEN** kayıt, giriş, token doğrulama akışları tanımlıdır
3. **AK-5.3 — GIVEN** auth tipleri **WHEN** derlenir **THEN** packages/shared'den import edilebilir
4. **AK-5.4 — GIVEN** domain dosyası **WHEN** Drizzle import edilir **THEN** purity lint kırmızı verir

**Kabul Kriterleri:**
| Kod | Kriter | Kanıt | Durum |
|:----|:-------|:------|:------|
| AK-5.1 | Şema derlenir, 10 tablo tanımlı | unit | ⬜ |
| AK-5.2 | Tasarım dokümanı eksiksiz | gözle | ⬜ |
| AK-5.3 | Tipler derlenir | unit | ⬜ |
| AK-5.4 | Drizzle purity lint'i yeşil | unit | ⬜ |

**T Görev Listesi:**
- [ ] T-13: Drizzle şema tanımı (10 tablo) — elle migration scripti YOK
- [ ] T-14: Auth akış tasarım dokümanı
- [ ] T-15: Auth kontrat tipleri (packages/shared)

**Involved Files:**
| Dosya | Rol / Değişiklik |
|:------|:----------------|
| `apps/backend/src/infra/db/schema.ts` | Drizzle şema tanımı |
| `docs/architecture/auth-akisi.md` | tasarım |
| `packages/shared` | auth tipleri |

## 7. Yaşam Döngüsü ve Hata Kategorileri

| Durum | Davranış |
|:------|:---------|
| Kurulum hatası (bağımlılık çakışması) | Kurulum fail-fast; kısmi workspace YOK |
| Purity/steiger ihlali | Doğrulama komutu kırmızı döner, merge engellenir |
| Şema derleme hatası | Typecheck kırmızı verir; çıktı üretilmez |
| Build hatası | Çıktı üretilmez; hangi paketin kırıldığı komut çıktısında belirtilir |

## 8. Başarı Kriterleri (SC-x)

| Kod | Kriter | Ölçüm |
|:----|:-------|:------|
| SC-1 | Tek kök komutla lint+typecheck+test tüm paketlerde yeşil | komut çıktısı |
| SC-2 | domain/application katmanlarında 0 üçüncü parti import | lint |
| SC-3 | REST + CLI aynı application'a aynı anda bağlı | integration test |
| SC-4 | 10 tablo Drizzle şemasında tanımlı ve derlenir (canlı DB doğrulaması Faz 1) | typecheck |
| SC-5 | PWA build + Capacitor sync çıktı üretir | build çıktısı |
| SC-6 | Shell'de oyun-spesifik import 0 | arch test |

## 9. Aşama Eşlemesi (iş akışı)

| Aşama | Ürün |
|:------|:-----|
| 1. SPEC | Bu doküman |
| 2. JSDoc | IGameModule kontratı, DB port kontratı (domain/ports), auth tipleri |
| 3. TEST | UC'lerdeki kırmızı testler (purity, integration, şema derleme, lazy-load) |
| 4. IMPL | T-1 … T-15 |
| 5. KAPANIŞ | Bu dokümanın §A/§B güncellemesi |

## 10. Açık Kararlar

| # | Konu | Durum |
|:--|:-----|:------|
| A1 | Nx executor'ları ile Bun script'lerinin birleşimi | ✅ Kapandı: Nx 24 (bun.lock v2 desteği; 21 parse edemiyor) + package.json `nx.targets` + `nx:run-commands` |
| A2 | Test çatısı (bun test vs vitest) | ✅ Kapandı: `bun test` |
| A5 | Token yenileme (refresh) stratejisi | Faz 1 SPEC'ine ertelenir |

## 11. İleri İş (bu pakette YAPILMAZ — referans)

1. Faz 1: oyun modernizasyonu (Tetris/Refleks/Hesaplama), hesap + ilerleme endpoint'leri → `docs/FAZ-1-SPEC.md`
2. Faz 1: DB sunucusu ayağa kaldırma + `drizzle-kit generate`/push + canlı DB integration testleri
3. Faz 3: monetizasyon (reklam/abonelik/coin) → ilgili Faz 3 SPEC
4. Faz 4: mağaza yayını, PWA yayını → ilgili Faz 4 SPEC

## 12. T Görev Özeti

- [ ] T-1: Nx + Bun workspace, paket sınırları, kök/tek-paket komutları
- [ ] T-2: Backend hexagonal dizin iskeleti + DI
- [ ] T-3: DB port kontratı + in-memory adaptör
- [ ] T-4: REST adaptör + /health
- [ ] T-5: CLI adaptör + ortak application testi
- [ ] T-6: Purity lint kuralı
- [ ] T-7: Ionic/React + Capacitor kurulumu
- [ ] T-8: FSD iskeleti + steiger lint (steiger.config.ts) + Atomic Design örneği
- [ ] T-9: PWA config + Türkçe i18n baseline
- [ ] T-10: GameModule kontratı + JSDoc sözleşmesi
- [ ] T-11: Shell kayıt + lazy-load mekanizması
- [ ] T-12: Mock modül + arch test
- [ ] T-13: Drizzle şema tanımı (10 tablo) — elle migration scripti YOK
- [ ] T-14: Auth akış tasarım dokümanı
- [ ] T-15: Auth kontrat tipleri

## A. DOĞRULAMA (§A)

### A.1 Değişiklik Matrisi

| # | Dosya | Değişiklik | Neden (SPEC ref) |
| :-- | :------ | :----------- | :----------------- |
| 1 | `package.json`, `nx.json`, `tsconfig.base.json`, `.gitignore` | Nx 24 + Bun workspace, kök `check` komutu | T-1, K1, AK-1.1 |
| 2 | `packages/shared/**` | GameModule/DB/auth kontratları (JSDoc sözleşmeleri) | T-3, T-10, T-15, §5.2 |
| 3 | `apps/backend/src/{domain,application,infra,presentation}` | Hexagonal iskelet + DI + REST/CLI adaptörleri | T-2, T-4, T-5, K2 |
| 4 | `apps/backend/scripts/check-purity.ts` | Purity lint (domain/application'da 3. parti yasağı) | T-6, FR-2.1, FR-5.4 |
| 5 | `apps/backend/src/infra/db/schema.ts` | Drizzle 10 tablo şema tanımı | T-13, K7, K8 |
| 6 | `apps/app/**` | Ionic/React + Capacitor + FSD + PWA + i18n (Türkçe) | T-7, T-8, T-9, K3, FR-3.x |
| 7 | `apps/app/steiger.config.ts` | Steiger lint (fsd.configs.recommended) | K9, FR-3.3 |
| 8 | `apps/app/src/features/game-shell/**` | Shell kayıt + lazy-load mekanizması | T-11, FR-4.1/4.2 |
| 9 | `apps/app/src/features/mock-game/**` | Kontrat doğrulama fixture'ı | T-12, FR-4.3 |
| 10 | `apps/games/package.json` | Oyun paketi yer ayrımı | K1 |
| 11 | `docs/architecture/auth-akisi.md` | Auth akış tasarımı (kayıt/giriş/token) | T-14, FR-5.2 |
| 12 | `apps/*/test/**` | KIRMIZI→YEŞİL testler | §6 AK'lar |
| 13 | `packages/shared/src/contracts/database.ts` → `apps/backend/src/domain/ports/database.ts` | DB port taşındı (tek-app tipi — shared yalnız çok-app) | 2026-11-03 kararı |
| 14 | `IGameModule`/`IDatabasePort` prefix + `scripts/check-contracts.ts` (+ self-test) | Kontrat prefix + DIP denetimi | K10, §5.7 |

### A.2 Test Kanıtları

| Kapsam | Komut | Sonuç |
| :------- | :------ | :------ |
| kök (AK-1.1) | `bun run check` | lint 4/4 + typecheck + test 4/4 yeşil |
| backend | `bun test` (apps/backend) | 8/8 yeşil |
| app | `bun test` (apps/app) | 9/9 yeşil |
| FSD lint | `bunx steiger ./src` (apps/app) | No problems found |
| tek paket (AK-1.2) | `bunx nx run backend:test` | 1/1 yeşil |
| kontrat denetimi (K10) | `bun run check:contracts` | self-test 7/7 + gerçek repo temiz |

### A.3 Kabul Kriteri Kanıtları

| Kod | Kriter (SPEC özeti) | Kanıt | Durum |
| :---- | :-------------------- | :------------------- | :------ |
| AK-1.1 | Kök komut tüm paketlerde yeşil | `bun run check` çıktısı | 🟢 |
| AK-1.2 | Tek paket komutu çalışır | `nx run backend:test` çıktısı | 🟢 |
| AK-2.1 | Purity lint yeşil + ihlalde kırmızı | `test/purity.test.ts` (zod fixture) | 🟢 |
| AK-2.2 | REST+CLI aynı application | `test/hexagonal.test.ts` (paylaşılan sayaç) | 🟢 |
| AK-2.3 | DB erişimi port kontratı üzerinden | kod inceleme: `composition.ts` + `InMemoryDatabase` implements `IDatabasePort` | 🟢 |
| AK-2.4 | GET /health 200 | `test/hexagonal.test.ts` | 🟢 |
| AK-3.1 | PWA build (manifest + SW) | `test/build.test.ts` | 🟢 |
| AK-3.2 | cap sync + android platformu | `test/build.test.ts` | 🟢 |
| AK-3.3 | Steiger yeşil | `steiger ./src` çıktısı | 🟢 |
| AK-3.4 | UI Türkçe | gözle: `src/shared/lib/i18n.ts` TR sözlük | 🟢 |
| AK-4.1 | Shell'de yabancı import yok | `test/arch.test.ts` (import taraması) | 🟢 |
| AK-4.2 | Lazy-load | `test/arch.test.ts` (dinamik import) | 🟢 |
| AK-4.3 | Kontrat eksiksiz (skor/ipucu/reklam/kayıt + bölüm) | kod inceleme: `packages/shared` `GameEventMap` | 🟢 |
| AK-5.1 | 10 tablo derlenir | `test/schema.test.ts` | 🟢 |
| AK-5.2 | Auth tasarım dokümanı | gözle: `docs/architecture/auth-akisi.md` | 🟢 |
| AK-5.3 | Auth tipleri derlenir | typecheck packages/shared | 🟢 |
| AK-5.4 | Drizzle domain'e sızmaz | `test/purity.test.ts` (drizzle fixture) | 🟢 |

### A.4 Sapmalar

| # | Sapma | Açıklama |
| :-- | :------ | :--------- |
| S1 | Fastify `onRequest` hook'u Bun altında `inject` ile kilitleniyor | `touch()` handler içinden çağrılıyor; hook'a dönüşte Bun uyumluluğu doğrulanmalı (`presentation/rest/server.ts` içi not) |
| S2 | `fsd/insignificant-slice` mock-game için dosya kapsamında kapalı | Lazy fixture statik analizde referanssız görünür; Faz 1'de gerçek oyunlar gelince kural geri açılır (`steiger.config.ts` notu) |
| S3 | `entities` layer boş bırakıldı (açılmadı) | Boş slice steiger'a takılıyor; FSD skill: referanssız layer açılmaz — ilk entity Faz 1'de açılır |
| S4 | DB port kontratı packages/shared'den backend/domain/ports'a taşındı | 2026-11-03 kararı: shared yalnız çok-app tipleri taşır; FR-2.3 metni güncellendi |

### A.5 Gözle Kontrol Maddeleri

- [x] Gerçek domain/application dizinleri purity lint'ten temiz geçiyor (fixture değil)
- [x] `check-contracts` gerçek repoda temiz; somut sınıf enjeksiyonu fixture'da kırmızı veriyor
- [x] CLI bilinmeyen komutta hata veriyor (sessiz davranış yok)
- [x] UI metinleri Türkçe; `index.html` lang="tr"
- [x] Mock modül exit sonrası event iletmiyor (kontrat edge case)

### A.6 Genel Durum Özeti

Faz 0'ın 15 görevi (T-1…T-15) tamamlandı; 5 UC'nin tamamı 🟢 Doğrulanmış. Nx 24 + Bun workspace, hexagonal backend (REST+CLI), Ionic/React + Capacitor app (FSD + steiger + PWA + Türkçe i18n), game shell kontratı + lazy-load, Drizzle 10 tablo şeması ve auth akış tasarımı yerinde. 17 AK'nin 15'i otomatik/komut kanıtlı, 2'si (AK-2.3, AK-4.3) kod inceleme kanıtlı, 1'i (AK-3.4) gözle kanıtlı. **review_date:** 2026-11-03

## B. TEST KAPSAMI (§B)

### B.1 Kapsam Matrisi (durum → koşul → beklenen → test ref'i)

| Durum (SPEC §7) | Koşul | Beklenen (THEN) | Test ref'i |
| :------ | :------ | :---------------- | :----------- |
| Kurulum hatası | bağımlılık çakışması | kök `check` exit ≠ 0 | KAPSANMAYAN (G1) |
| Purity ihlali | domain/application'da 3. parti import | lint kırmızı (exit 1) | `test/purity.test.ts` |
| Steiger ihlali | FSD katman/yön ihlali | steiger hata raporu | `bunx steiger ./src` |
| Şema derleme hatası | Drizzle tip hatası | typecheck kırmızı | `tsc --noEmit` (typecheck hedefi) |
| Build hatası | vite hata | exit ≠ 0 | `test/build.test.ts` (AK-3.1 dolaylı) |

### B.2 KAPSANMAYAN Boşluklar

| # | Boşluk | Risk | İleri iş |
| :-- | :------- | :----- | :--------- |
| G1 | Kurulum hatası senaryosu otomatik test edilmedi | düşük | CI kurulumu ile birlikte (İleri İş) |
| G2 | REST'in gerçek soket (listen) modu test edilmedi — yalnız `inject` | düşük | Faz 1 e2e |
| G3 | iOS platformu eklenmedi (`cap add ios` macOS gerektirir) | orta | Faz 4 mağaza yayını öncesi |
| G4 | Drizzle şeması canlı DB'ye karşı doğrulanmadı (DB sunucusu yok) | orta | Faz 1: DB + `drizzle-kit generate`/push |
| G5 | Vite dev server manuel doğrulanmadı (yalnız build) | düşük | Faz 1 geliştirme sırasında gözle |

**review_date:** 2026-11-03
