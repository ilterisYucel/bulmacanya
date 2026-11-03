# Bulmacanya — Komple Ürün, Teknik, Skill, İçerik Açılımı ve Monetizasyon Dokümanı

> Sürüm: 0.5
> Kapsam: Ürün vizyonu, oyun portföyü, teknik mimari, skill sistemi, profil seviyesi ve içerik açılımı, achievement sistemi, monetizasyon, 5 yıllık sadakat modeli, yol haritası, riskler
> Değişiklik notu: Platformer kapsamdan çıkarıldı. Profil seviyesi + içerik açılımı + achievement getirildi. Monetizasyon 25 TL/ay, 250 TL/yıl (10 aylık bedel), abone günlük 15 ipucu, sadece ödüllü video, ücretsiz deneme eklendi. Coin yalnızca ipucu alımı için; aboneye coin indirimi kaldırıldı. Komisyon fiyata yansıtıldı. Aboneye her ay +5 coin bonus. İpucu maliyeti oyuna göre değişken.

---

## 1. Vizyon ve Konumlandırma

### 1.1 Vizyon

Bulmacanya, tek bir uygulama içinde farklı türde bulmaca oyunları sunan bir **bulmaca oyun platformudur**. Kullanıcı platformdaki oyunları oynayarak zeka, hafıza, dikkat, refleks, hesaplama gibi niteliklerini geliştirir; bu nitelikler **profil seviyesini** yükseltir ve yeni bölümler, günlük puzzle modları, yeni oyun türleri ve achievement'lar açar. Web ve mobil (iOS/Android) aynı kod tabanından yayınlanır.

### 1.2 Hedef Kitle

- Günlük kısa oturumlarla zihinsel egzersiz yapmak isteyen 15-45 yaş arası mobil/web kullanıcıları.
- Bulmaca koleksiyonu sevenler.
- İlerleme, içerik açılımı ve achievement döngüsünden motive olan oyuncular.

### 1.3 Değer Önerisi

- Tek uygulamada çok türlü bulmaca (görüntü oluşturma, hafıza, kelime, refleks, hesaplama, labirent, programlama).
- "Skill gelişimi → profil seviyesi → içerik açılımı" döngüsüyle klasik bulmaca koleksiyonlarından ayrışma.
- Web + mobil tek deneyim, ilerleme senkronizasyonu (abonelik avantajı).
- 5 yıllık uzun vadeli sadakat hedefi; "hit oyun" değil "sürekli büyüyen hizmet".

### 1.4 Farklılaşma

Rastgele bulmaca yığını değil, **nitelik temelli ilerleme sistemi** ve bunun **içerik açılımına** bağlanması.

---

## 2. Oyun Portföyü

| Tür | Amaç | Geliştirdiği Nitelik | Durum |
|-----|------|----------------------|-------|
| Görüntü oluşturma (Tetris tabanlı) | Parça yerleştirme / şekil tamamlama | Zeka, dikkat | Elde var (vanilla Pixi.js), modernize edilecek |
| Refleks | Hızlı tepki | Refleks, dikkat | Elde var (vanilla js), genişletilecek |
| Hesaplama | Sayısal/pratik işlem | Hesaplama, refleks | Elde var (vanilla js), genişletilecek |
| Hafıza | Eşleştirme / sıra hatırlama | Hafıza | Fikir aşamasında |
| Kelime | Kelime bulma/türetme | Zeka, hafıza | Fikir aşamasında |
| Labirent | Yol bulma | Dikkat, zeka, sezgi | Plan aşamasında |
| Programlama | Mantık/komut dizisi | Zeka, dikkat | Plan aşamasında |

> **Platformer oyunu kapsamdan çıkarıldı.** Geliştirme maliyeti yüksek, getirisi düşük. Yerine profil seviyesi + içerik açılımı + achievement sistemi getirildi.

### 2.1 Platform Özellikleri

- Oyun seçim ekranı (her oyun ayrı kart/oyun).
- Bölüm/level ilerlemesi ve kayıt.
- Nitelik (skill) paneli ve profil seviyesi.
- İçerik açılımı (bölüm paketleri, günlük puzzle modları, yeni oyun türleri).
- Achievement sistemi.
- İpucu sistemi (reklam izleyerek, coin ile veya abonelikle).
- Kullanıcı hesabı, ilerleme senkronizasyonu (web + mobil, aboneye özel).
- Reklam ve abonelik monetizasyonu.

### 2.2 Kapsam Dışı (İlk Sürüm)

- Platformer oyunu.
- Çok oyunculu / rekabet modu.
- Sosyal özellikler (arkadaş, liderlik tablosu) — ileri faz.
- Canlı etkinlikler / sezonluk içerik — ileri faz.

---

## 3. Teknik Mimari

### 3.1 Teknoloji Yığını

| Katman | Teknoloji | Not |
|--------|-----------|-----|
| Mobil uygulama | Ionic / React | Capacitor ile iOS/Android paketleme |
| Web uygulaması | Ionic / React (PWA) | Aynı kod tabanı |
| Oyun motoru | Pixi/React (`@pixi/react`) | Ana motor; Phaser yalnızca gerekirse |
| Backend runtime | Bun | Ems tecrübesiyle yönetilecek |
| Backend framework | Fastify | REST API |
| Veritabanı | PostgreSQL | Kullanıcı, ilerleme, ekonomi verileri |
| Kimlik doğrulama | JWT / oturum tabanlı | Backend ile birlikte tasarlanacak |
| Dağıtım | Web (statik hosting) + mobil mağaza | Capacitor build |

### 3.2 Mevcut Varlıkların Modernizasyonu

- **Tetris tabanlı Pixi.js oyunu**: vanilla JS + HTML → PixiReact bileşenine sarılacak, Ionic sayfa yaşam döngüsüne bağlanacak, skor/ilerleme backend'e bağlanacak.
- **Refleks ve hesaplama mini oyunları**: vanilla JS → konsept genişletme, PixiReact veya hafif canvas bileşenlerine dönüştürme, ortak oyun kabuğuna entegre.

### 3.3 Oyun Entegrasyon Mimarisi

- Ortak **oyun kabuğu (game shell)**: skor, bölüm geçme, ipucu, kayıt, reklam tetikleme tek yerden yönetilir.
- Her oyun kabuğa bağlanan bağımsız bir modül olarak paketlenir (lazy load).
- Nitelik güncellemesi: oyun sonucu → katsayı tablosu → skill artışı → profil seviyesi → içerik açılımı.

### 3.4 Veri Modeli (başlangıç)

| Tablo | İçerik |
|-------|--------|
| `users` | Kimlik, hesap bilgileri |
| `skills` | Kullanıcı skill seviyeleri |
| `profile` | Profil seviyesi, toplam puan |
| `progress` | Oyun/bölüm ilerlemesi, açılan içerikler |
| `sessions` | Oturum/oyun kayıtları (skor, süre) |
| `achievements` | Kazanılan achievement'lar, rozetler |
| `hints` | İpucu bakiyesi, tüketim kayıtları |
| `coins` | Coin bakiyesi, alım/tüketim kayıtları |
| `subscriptions` | Abonelik durumu, deneme, geçmişi |
| `daily_puzzle` | Günlük puzzle kayıtları, seri (streak) |

---

## 4. Skill Sistemi

### 4.1 Ana Nitelikler (5 aktif + 1 ileri faz)

| Skill | Tanım | Ana Kaynak Oyunlar |
|-------|-------|--------------------|
| **Zeka (Z)** | Mantık, problem çözme, strateji | Görüntü oluşturma, kelime, programlama, labirent |
| **Hafıza (H)** | Kısa/uzun vadeli hatırlama, eşleştirme | Hafıza, kelime |
| **Dikkat (D)** | Odaklanma, detay yakalama, süreklilik | Görüntü oluşturma, labirent, refleks |
| **Refleks (R)** | Tepki hızı, el-göz koordinasyonu | Refleks, hesaplama |
| **Hesaplama (HS)** | Sayısal/pratik işlem hızı ve doğruluğu | Hesaplama |
| Sezgi (S) | Örüntü tanıma, hızlı çıkarım (ileri faz) | Labirent, kelime, programlama |

> "Sezgi" ilk sürümde pasif tutulur; Faz 2-3'te aktifleştirilir.

### 4.2 Skill Alt Kırılımları (opsiyonel derinlik, ileri faz)

- **Zeka**: mantık (Z-m), planlama (Z-p)
- **Hafıza**: görsel (H-g), sözel (H-s), sıra (H-q)
- **Dikkat**: süreklilik (D-s), detay (D-d)
- **Refleks**: tepki süresi (R-t), isabet (R-i)
- **Hesaplama**: hız (HS-h), doğruluk (HS-d)

### 4.3 Oyun–Skill Katsayı Matrisi

| Oyun | Zeka | Hafıza | Dikkat | Refleks | Hesaplama | Sezgi |
|------|------|--------|--------|---------|-----------|-------|
| Görüntü oluşturma | 1.0 | 0.2 | 0.6 | 0.2 | 0.1 | 0.1 |
| Refleks | 0.2 | 0.1 | 0.6 | 1.0 | 0.3 | 0.1 |
| Hesaplama | 0.5 | 0.1 | 0.3 | 0.6 | 1.0 | 0.1 |
| Hafıza | 0.3 | 1.0 | 0.4 | 0.1 | 0.1 | 0.2 |
| Kelime | 0.8 | 0.6 | 0.3 | 0.1 | 0.1 | 0.4 |
| Labirent | 0.7 | 0.2 | 0.7 | 0.2 | 0.1 | 0.6 |
| Programlama | 1.0 | 0.3 | 0.5 | 0.1 | 0.4 | 0.3 |

> Katsayılar denge testleriyle ayarlanacak; tablo başlangıç değerleridir.

### 4.4 Skill Puanı Formülü

Formül aşağıdaki gibidir:

```text
skill_puanı = temel_puan × katsayı × başarı_çarpanı × zorluk_çarpanı
```

Formüldeki değişkenler:

- **temel_puan**: oyun türüne göre sabit (ör. 10)
- **başarı_çarpanı**: 0.5–1.5 (tamamlama, süre, hata)
- **zorluk_çarpanı**: 1.0–2.0 (bölüm zorluğu)

### 4.5 İlerleme Eğrisi

- Seviye eşiği: `eşik(n) = taban × n^1.5` (azalan getiri)
- Günlük kazanım tavanı: istismarı önlemek için skill başına günlük üst sınır
- Tekrar oynama: aynı bölümden azalan puan (ilk çözüm tam, tekrar %20)

---

## 5. Profil Seviyesi ve İçerik Açılımı

### 5.1 Profil Seviyesi

Profil seviyesi, tüm skill seviyelerinin ağırlıklı toplamından türetilir:

```text
profil_puanı = Σ (skill_seviyesi × skill_ağırlığı)
profil_seviyesi = eşik tablosuna göre eşleme
```

Eşik tablosu aşağıdadır:

| Profil Seviyesi | Gerekli Profil Puanı | Açılan İçerik |
|-----------------|---------------------|---------------|
| 1 | 0 | Başlangıç bölümleri |
| 5 | 100 | +20 yeni bölüm |
| 10 | 300 | Günlük puzzle "zor mod" |
| 15 | 600 | Yeni oyun türü erişimi (labirent) |
| 20 | 1.000 | Günlük puzzle "özel mod" |
| 30 | 2.000 | Sezgi skill'i aktifleşir |
| 40 | 3.500 | Yeni bölüm paketi + kozmetik |
| 50 | 5.000 | "Usta" rozeti + özel içerik |

> Eşik değerleri başlangıçtır; denge testleriyle ayarlanacak.

### 5.2 İçerik Açılım Türleri

| Tür | Tetikleyici | Örnek |
|-----|-------------|-------|
| Bölüm paketleri | Profil seviyesi | Sv. 5 → +20 bölüm |
| Günlük puzzle modları | Profil seviyesi + skill kombinasyonu | Sv. 10 → zor mod |
| Yeni oyun türü erişimi | Profil seviyesi | Sv. 15 → labirent |
| Kozmetik | Achievement | "Seri Avcısı" → özel tema |
| Özel etkinlikler | Sezonluk / achievement | Hafta sonu özel puzzle |

### 5.3 Günlük Puzzle

- Her gün otomatik generate edilen puzzle.
- Profil seviyesine göre **mod** açılır: normal → zor → özel.
- Seri (streak) ile bonus: 7 gün üst üste → ekstra ipucu; 30 gün → kozmetik.
- Abone, günlük puzzle'da **ekstra ilerleme puanı** alır (içerik kilidi değil, hız avantajı).

---

## 6. Achievement Sistemi

### 6.1 Achievement Kategorileri

| Kategori | Örnek | Ödül |
|----------|-------|------|
| İlerleme | "İlk Adım" (ilk bulmaca), "Bölüm Fatihi" (50 bölüm) | Rozet + profil puanı |
| Ustalık | "Hafıza Ustası" (Hafıza Sv. 10), "Zeka Devi" (Zeka Sv. 20) | Rozet + kozmetik |
| Sadakat | "Seri Avcısı" (30 gün streak), "Yıl Dönümü" (365 gün) | Rozet + özel içerik |
| Çeşitlilik | "Çok Yönlü" (her türden 10 bölüm) | Rozet + profil puanı |
| Keşif | "Gizli Bölüm" (gizli bölümü bul) | Rozet + ipucu |
| Yaratıcılık | "Kelime Koleksiyoncusu" (100 kelime) | Rozet + kozmetik |

### 6.2 Achievement → İçerik Bağlantısı

- Bazı achievement'lar **içerik kilidi açar** (ör. "Seri Avcısı" → günlük puzzle'da özel mod).
- Bazıları **sadece rozet/kozmetik** verir (grind değil, kutlama).
- Achievement'lar **profil puanına katkı** verir (dolaylı içerik açılımı).

### 6.3 Denge İlkeleri

- Achievement'lar **çeşitli** olmalı; "şu kadar çöz" tek başına baskın olmamalı.
- **Ulaşılabilir** olmalı; ilk achievement'lar ilk 10 dakikada kazanılmalı.
- **Pay to win değil**: Achievement kilidi açmak için abonelik gerekmez; abone sadece daha hızlı ilerler.

---

## 7. Monetizasyon Planı

### 7.1 Gelir Modeli Özeti

| Model | Fiyat | Rol | Kullanıcı Profili |
|-------|-------|-----|-------------------|
| Ödüllü video reklam | Ücretsiz (izle-kazan) | Kapı / acil ihtiyaç | İpucu lazım, para vermek istemez |
| Abonelik | **25 TL/ay**, **250 TL/yıl** | Ana gelir | Düzenli oynar, reklamsız + senkron ister |
| Oyun coini | 10 / 25 / 50 TL paketler | İkincil | İpucu lazım, reklam izlemek istemez |
| (Opsiyonel) Kozmetik | İleri faz | Ek gelir | Sadık, görünüm önemseyen |

> **Banner reklam yok. Geçiş reklamı yok. Sadece ödüllü video.**

### 7.2 Abonelik Sistemi

#### 7.2.1 Fiyatlandırma

| Plan | Fiyat | İçerik | Aylık eşdeğer |
|------|-------|--------|---------------|
| Aylık | **25 TL** | 1 ay | 25 TL |
| Yıllık | **250 TL** | 12 ay (10 aylık bedel) | ~20,8 TL |

**Net gelir hesabı (komisyon fiyata yansıtılmış):**

Fiyatlar, mağaza komisyonu ve stopaj sonrası hedeflenen net gelire göre belirlenmiştir. 25 TL brüt fiyat üzerinden:

- Google Play komisyonu %15 → 3,75 TL
- Gelir vergisi istisnası kapsamında %15 stopaj (kalan üzerinden)
- **Net ~18 TL/abone/ay** (aylık plan)
- Yıllık planda aylık eşdeğer net: **~15 TL**

> Not: Komisyon oranları ülke ve gelir bandına göre değişebilir; fiyatlar gerektiğinde yeniden değerlendirilir.

#### 7.2.2 Ücretsiz Deneme

- **7 günlük ücretsiz deneme** sunulur.
- Deneme başlatmak için geçerli ödeme yöntemi gerekir (Google Play standardı).
- Deneme süresi boyunca abone avantajlarının tamamı geçerlidir (reklamsız, günlük 15 ipucu, web senkron, günlük puzzle hız avantajı, aylık +5 coin).
- Deneme bitmeden 1-2 gün önce hatırlatma bildirimi gönderilir.
- Deneme içinde iptal edilirse ücret alınmaz; süre sonuna kadar avantajlar devam eder.
- **Dönüşüm izleme**: deneme başlatanların ücretli aboneye geçiş oranı takip edilir; %20 altındaysa süre veya kapsam gözden geçirilir.

#### 7.2.3 Abonelik Avantajları

| Özellik | Ücretsiz | Abone (25 TL/ay) |
|---------|----------|------------------|
| Günlük ücretsiz ipucu | 2 | **15** |
| Reklamla ek ipucu | +8 (günlük 8 reklam tavanı) | +8 (isteğe bağlı) |
| Günlük toplam ipucu tavanı | 10 (reklamla) + coin | **23** (reklamla) + coin |
| Reklam gösterimi | Var (ödüllü, isteğe bağlı) | **Yok** |
| Web–mobil senkron | **Yok** | **Var** |
| Günlük puzzle'da ekstra ilerleme puanı | Yok | **Var** |
| Aylık coin bonusu | Yok | **+5 coin/ay** |
| Coin satın alma | Var | Var (indirim yok) |

**Kritik kararlar**:
- Abonelik "sınırsız ipucu" değil, **"günlük 15 ipucu + reklamsız + web senkron + günlük puzzle hız avantajı + aylık +5 coin"**.
- **Aboneye coin indirimi yok.** Abonelik ve coin birbirinden bağımsız iki ayrı üründür; iç içe geçirilmez. Bu, hem ekonomi modelini hem iletişimi basitleştirir.
- **Aylık +5 coin bonusu**: aboneliğin sadakat teşvikidir; coin'i doğrudan satın almaya alternatif değil, ekstra bir avantajdır. Abone kalınan her ay için +5 coin eklenir.

#### 7.2.4 Web–Mobil Senkronizasyon (Aboneliğin Ana Teşviki)

- Web backend maliyeti aboneye yansıtılır.
- **Ücretsiz kullanıcı**: Sadece mobilde VEYA sadece web'de oynar; cihazlar arası geçiş yok.
- **Abone**: Mobil + web arasında ilerleme, skill, coin, ipucu, seri senkronize.
- Bu, aboneliğin **en somut kullanım değeri**; fiyat direncini kırar ve "ekosistem kilidi" yaratır.

#### 7.2.5 Adil Kullanım Maddesi

Abonelik şartlarına eklenecek: *"Günlük 15 ipucu hakkı makul kullanım içindir; otomasyon/bot tespitinde hak kısıtlanabilir."*

#### 7.2.6 Dönüşüm Hedefi

- Hedef dönüşüm: aktif kullanıcıların **%2-4'ü**.
- İlk 3 ay lansman: 25 TL sabit, ek indirim yok.
- Yıllık plan teşviki: "10 aylık bedelle 12 ay" vurgusu.

### 7.3 İpucu Ekonomisi

#### 7.3.1 Katmanlı Yapı

| Kullanıcı | Günlük ücretsiz | Reklamla ek | Coin ile | Günlük toplam tavan |
|-----------|----------------|-------------|----------|---------------------|
| Ücretsiz | 2 | +8 (8 reklam) | Sınırsız (coin varsa) | 10 (reklamla) + coin |
| Abone | **15** | +8 (isteğe bağlı) | Sınırsız (coin varsa) | **23** (reklamla) + coin |

#### 7.3.2 İpucu Maliyeti (Coin Cinsinden)

**1 ipucu = 1 coin** temel kuraldır. Ancak ipucu maliyeti **oyuna göre değişkendir**; zor ve karmaşık oyunlarda ipucu daha değerlidir.

| Oyun | İpucu maliyeti (coin) | Gerekçe |
|------|----------------------|---------|
| Görüntü oluşturma | 1 | Standart |
| Refleks | 1 | Standart |
| Hesaplama | 1 | Standart |
| Hafıza | 1 | Standart |
| Kelime | 1-2 | Kelime uzunluğuna göre |
| Labirent | 2 | Yol bulma daha değerli |
| Programlama | 2-3 | Mantık zinciri karmaşık |
| Günlük puzzle (zor/özel mod) | 2-3 | Sınırlı ve değerli içerik |

> Kesin maliyetler oyun tasarımıyla birlikte netleştirilecek. Temel ilke: **1 coin = 1 standart ipucu**; zor oyunlarda 2-3 coin.

#### 7.3.3 Neden Abone İçin 15?

- **Ücretsizle fark hissedilir**: 2 → 15 = 7,5 kat.
- **"Sınırsız" değil, "bol ama sınırlı"**: Çoğu kullanıcı günde 3-5 ipucu kullanır; 15 pratikte "sınırsız" gibi çalışır ama kağıt üzerinde sınırlıdır.
- **Coin'e alan bırakır**: Abone bile ekstra ihtiyaç durumunda reklam izleyebilir veya coin alabilir.
- **5 yıllık sadakat için yeterince cömert**: Ayda 450 ipucu potansiyeli.

#### 7.3.4 İpucu Tüketim Kuralları

- İpucu, takılma anında kullanılır; olmadan çözüm zor ama imkânsız değil.
- İpucu tüketimi oyun türüne göre farklı (yukarıdaki tablo).
- Günlük kota gece yarısı sıfırlanır (yerel saat).
- Kullanılmayan ücretsiz ipucu biriktirilmez (günlük kota mantığı).
- Coin ile alınan ipucu birikir (coin bakiyesi gibi).

### 7.4 Oyun Coini Fiyatlandırması

#### 7.4.1 Referans Mantığı

Coin'in tek işlevi: **reklam izlemeden ipucu almak**. Fiyat, "30 saniyelik reklamı satın almak" üzerinden kurgulanır. Coin, aboneliğe göre **dezavantajlı** tutulur ki abonelik daha cazip olsun. **Aboneye coin indirimi yoktur**; iki ürün birbirinden bağımsızdır.

#### 7.4.2 Coin Paketleri

| Paket | Fiyat | Coin | Birim fiyat | Aboneliğe oran | Konumlandırma |
|-------|-------|------|-------------|----------------|---------------|
| Küçük | **10 TL** | 6 coin | 1,67 TL/coin | 0,4× aylık | Deneme |
| Orta | **25 TL** | 18 coin | 1,39 TL/coin | 1,0× aylık | **En çok satan** |
| Büyük | **50 TL** | 40 coin | 1,25 TL/coin | 2,0× aylık | Değer |

> 1 coin = 1 standart ipucu. Zor oyunlarda ipucu 2-3 coin olduğu için, coin'in gerçek "ipucu karşılığı" oyuna göre değişir.

#### 7.4.3 Coin vs Abonelik Dengesi

- Orta paket (25 TL = 18 coin) ile abonelik (25 TL = günde 15 ipucu + reklamsız + senkron + aylık +5 coin) yan yana konunca **abonelik bariz daha avantajlı**.
- Coin, "küçük acil ihtiyaç" olarak konumlandırılır; aboneliği yemez.
- **Aboneye coin indirimi yok**; abonelik zaten coin bonusu içeriyor (+5 coin/ay).

### 7.5 Reklam Kurgusu

- **Sadece ödüllü video**: ipucu, ek can, tekrar deneme için.
- **Banner yok, geçiş reklamı yok.**
- **Günlük tavan**: 8 ödüllü reklam/gün (ücretsiz ve abone için aynı; abone zorunda değil).
- Kişi başı günlük ortalama hedef: 2-3 ödüllü reklam.
- Reklam teklifi yalnızca ipucu/ek can gibi **kullanıcının kendi talebi** üzerine gösterilir.

### 7.6 Monetizasyonun İçerik Açılımıyla Bağlantısı

- İçerik açılımı **oynanarak** elde edilir; abonelik **hızlandırıcıdır**, kilit değil.
- Abone avantajı: reklamsız + web senkron + günlük 15 ipucu + günlük puzzle'da ekstra ilerleme puanı + aylık +5 coin.
- "Pay to win" algısından kaçınmak için: abone olmayan kullanıcı da tüm içeriğe **zamanla** ulaşabilir.

---

## 8. 5 Yıllık Sadakat Modeli

### 8.1 Sadakati Besleyen Mekanizmalar

| Mekanizma | İşlev |
|-----------|-------|
| Günlük puzzle | Günlük ritüel; alışkanlık yaratır |
| Seri (streak) sayacı | Seriyi bozmamak için geri dönüş |
| Sınırsız bölüm | "Bitirdim, sildim" sendromunu engeller |
| Web–mobil senkron | Ekosistem kilidi; uygulamayı silmeyi zorlaştırır |
| Skill gelişimi + profil seviyesi | "Birikim hissi"; emeği çöpe atamama psikolojisi |
| Achievement'lar | Görünür başarı, koleksiyon hissi |
| Aylık +5 coin bonusu | Aboneliği sürdürme teşviki |
| Abonelik = destek hissi | "Bu platformun büyümesine katkı" iletişimi |

### 8.2 Gelir Projeksiyonu (5 Yıl)

Net gelir: ~18 TL/abone/ay (aylık plan), ~15 TL/abone/ay (yıllık plan ortalaması).

| Yıl | Abone | Aylık Net Gelir | Not |
|-----|-------|-----------------|-----|
| 1. yıl | 200-400 | 3.600-7.200 TL | Büyüme, içerik birikimi |
| 2. yıl | 500-700 | 9.000-12.600 TL | Sadakat oturuyor, ağızdan ağıza |
| 3. yıl | 800-1.000 | 14.400-18.000 TL | Asgari ücret bandı |
| 4. yıl | 1.000-1.300 | 18.000-23.400 TL | İçerik kütüphanesi büyük |
| 5. yıl | 1.300-1.600 | 23.400-28.800 TL | Hedef bant (2026 asgari ücret ~28.075 TL) |

> Not: Reklam ve coin geliri bu tabloya eklenir; tablo yalnızca abonelik gelirini gösterir.

### 8.3 Churn Yönetimi

- Aylık %2 churn: 1.000 aboneye ulaşmak için düşük yeni abone kazanımı yeterli.
- Aylık %5 churn: sürekli yeni abone kazanımı gerekir.
- **Hedef**: aylık churn <%3.
- Churn azaltıcı: seri mekanizması, skill birikimi, web senkron, yıllık plan teşviki, achievement koleksiyonu, aylık +5 coin bonusu.

### 8.4 İçerik Üretim Gereksinimi (Risk)

5 yıl boyunca tutmak için sürekli içerik gerekir:

- Günlük puzzle'lar **generate edilmeli** (prosedürel).
- Bölümler **prosedürel üretilmeli** (sınırsız bölüm vaadi ancak böyle tutulur).
- Yeni oyun türleri **yılda 1-2 kez** eklenmeli.

---

## 9. Gelir Projeksiyonu (Genel)

### 9.1 Gelir Kalemleri Dağılımı (ilk 6 ay hedefi)

| Gelir Kalemi | Pay | Not |
|--------------|-----|-----|
| Abonelik | **%50-60** | Ana gelir (sadakat modeli) |
| Ödüllü reklam | %25-35 | Kapı / acil ihtiyaç |
| Coin | %10-15 | İkincil |

### 9.2 Projeksiyon Tablosu (50 TL kur ile)

| Hedef | Gerekli Abone (net ~18 TL) | Veya DAU (reklam) | Ulaşma Süresi |
|-------|---------------------------|-------------------|---------------|
| Aylık 5.000 TL | ~280 | ~300-600 | 2-4 ay |
| Aylık 15.000 TL | ~830 | ~1.000-1.800 | 4-8 ay |
| Aylık 25-30.000 TL | ~1.400-1.650 | ~1.500-3.000 | 3-5 yıl (sadakat modeli) |

---

## 10. Ölçüm Metrikleri

- **Abonelik**: dönüşüm, deneme→ücretli geçiş oranı, churn, LTV, aylık→yıllık geçiş oranı, ortalama abonelik süresi.
- **Reklam**: gösterim, doluluk, eCPM, kişi başı gösterim, günlük tavan kullanımı.
- **Coin**: paket dağılımı, tekrar alım oranı, ipucu başına coin tüketimi (oyun bazlı).
- **İpucu**: kullanım oranı, reklam tetikleme oranı, coin ile alım oranı, abone/ücretsiz kota kullanım farkı.
- **Sadakat**: DAU/MAU, oturum süresi, seri (streak) ortalaması, 30/90/365 gün retention.
- **İçerik açılımı**: profil seviyesi dağılımı, açılan içerik kullanım oranı, achievement kazanım hızı.
- **Genel**: ARPDAU, ARPPU.

---

## 11. Yol Haritası

### Faz 0 — Hazırlık

- Marka/isim kesinleştirme (Bulmacanya), TÜRKPATENT ön kontrolü (9. ve 41. sınıf).
- Repo yapısı, Ionic/React + Capacitor iskeleti, backend iskeleti (Bun + Fastify + PostgreSQL).
- Ortak oyun kabuğu tasarımı.
- Veri modeli ve kimlik doğrulama tasarımı.

### Faz 1 — Çekirdek Platform + Mevcut Oyunların Entegrasyonu

- Kullanıcı hesabı, ilerleme kaydı, skill paneli, profil seviyesi.
- 5 ana skill tanımı ve katsayı matrisi (başlangıç).
- Tetris tabanlı oyunun PixiReact'e modernizasyonu ve entegrasyonu.
- Refleks ve hesaplama mini oyunlarının genişletilip entegrasyonu.
- Web + mobil build doğrulaması.

### Faz 2 — Yeni Oyunlar + İçerik Açılımı

- Hafıza ve kelime bulmacası konseptlerinin netleştirilmesi ve geliştirilmesi.
- Labirent oyunu ve sezgi skill'inin pasif devreye alınması.
- Profil seviyesi eşik tablosu ve içerik açılımı mekanizması.
- Günlük puzzle ve seri (streak) mekanizması.
- Achievement sistemi (ilk set).

### Faz 3 — Monetizasyon Altyapısı

- İpucu ekonomisi (2 ücretsiz / 15 abone / 8 reklam tavanı).
- İpucu maliyetlerinin oyun bazlı tanımlanması (1-3 coin).
- Ödüllü reklam entegrasyonu (banner yok).
- Abonelik altyapısı (25 TL/ay, 250 TL/yıl, 7 gün ücretsiz deneme).
- Aylık +5 coin bonusu mekanizması.
- Coin paketleri (10/25/50 TL).
- Web senkronizasyonunun aboneye kilitlenmesi.
- Adil kullanım maddesi.

### Faz 4 — Optimizasyon ve Derinleştirme

- Dönüşüm hunisi ölçümü ve ayar (deneme→ücretli geçiş dahil).
- Yıllık plan vurgusu.
- Achievement genişletme, kozmetik.
- Programlama oyunu, sezgi aktifleştirme.
- Churn azaltıcı denemeler.
- Mağaza yayını, PWA yayını, pazarlama.

---

## 12. Riskler ve Önlemler

| Risk | Önlem |
|------|-------|
| WebView oyun performansı (Ionic) | Hafif-orta 2D oyunlara odak; ağır fizik/animasyondan kaçınma |
| PixiReact + Phaser karışımı karmaşıklık | PixiReact ana motor; Phaser sadece gerektiğinde |
| Bun + Fastify uyumluluğu | Ems tecrübesiyle yönetim; izleme ve yük testi |
| Skill enflasyonu (hızlı tavan) | Günlük tavan, azalan getiri, katsayı ayarı |
| İçerik tükenmesi (5 yıl) | Günlük puzzle ve bölümler prosedürel; yılda 1-2 yeni oyun türü |
| İçerik açlığı ("açtım ama oynayacak yok") | Bölüm havuzu geniş tutulmalı; prosedürel üretim |
| Achievement grind riski | Çeşitli kategoriler; "şu kadar çöz" baskın olmamalı |
| İpucu ekonomisinin çökmesi | Sınırsız yerine günlük kota (15); "sınırsız" iletişimi yok |
| Reklam kannibalizasyonu | Günlük 8 reklam tavanı; abone için reklam isteğe bağlı |
| Coin'in aboneliği yemesi | Coin paketlerini aboneliğe göre dezavantajlı tut; aboneye coin indirimi yok |
| Ücretsiz deneme suiistimali | Ödeme yöntemi zorunlu; dönüşüm izlenir; düşükse süre/kapsam revize |
| Web backend maliyeti | Senkronu aboneye kilitle |
| Dönüşümün düşük kalması | 25 TL rekabetçi fiyat; web senkron + reklamsız değer vurgusu |
| Churn'ün yüksek olması | Seri, skill birikimi, web senkron, yıllık plan teşviki, aylık +5 coin |
| "Pay to win" algısı | İçerik açılımı oynanarak; abonelik hızlandırıcı, kilit değil |
| Mağaza komisyonu değişimi | Türkiye yeni sisteme 2027'de geçecek; fiyat ve net gelir yeniden değerlendirilmeli |

---

## 13. Açık Sorular

- Coin paketlerinin kesin coin miktarları ve fiyatları, oyun bazlı ipucu maliyetleriyle birlikte son dengeleme gerektiriyor mu?
- İpucu maliyetlerinin oyun bazlı kesin değerleri (1-3 coin aralığı) oyun tasarımıyla netleştirilecek.
- Achievement listesinin tam seti ve ödül dağılımı nasıl olacak?
- Profil seviyesi eşiklerinin denge simülasyonu nasıl yapılacak?
- Yıllık plana geçiş için ek teşvik (ör. 1 ay ekstra) gerekli mi, yoksa 10 aylık bedel yeterli mi?
- 7 günlük deneme dönüşüm oranı hedefi (%20) tutmazsa hangi revizyon uygulanacak?

---

