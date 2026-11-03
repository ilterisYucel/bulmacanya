# Auth Akış Tasarımı (FAZ-0 · T-14)

> **Kaynak:** FAZ-0 SPEC UC-5 · README §3.1 (JWT / oturum tabanlı) · kontrat tipleri: `packages/shared/src/contracts/auth.ts`
> **Durum:** tasarım — endpoint implementasyonu Faz 1'de.
> **review_date:** 2026-11-03

## 1. Kararlar

| Kod | Karar |
| :-- | :---- |
| K6 | JWT / oturum tabanlı auth; token payload sözleşmesi shared'de (`TokenPayload`) |
| T1 | Şifreler yalnız hash'lenmiş saklanır (`users.password_hash`); düz metin hiçbir katmanda dolaşmaz |
| T2 | Token yenileme (refresh) stratejisi Faz 1'de kararlaştırılır — Faz 0 kapsamı DIŞI |

## 2. Akışlar

### 2.1 Kayıt

```
istemci → POST /auth/register (RegisterRequest)
       → users tablosuna kayıt (email unique, password → hash)
       → 201 + AuthSession
```

- Hata kategorileri: `EMAIL_TAKEN` (409), `VALIDATION` (400).
- Aynı email tekrar kaydı: REDDEDİLİR (unique constraint).

### 2.2 Giriş

```
istemci → POST /auth/login (LoginRequest)
       → email + hash doğrulama
       → 200 + AuthSession | 401 UNAUTHORIZED
```

- Doğrulama hatası DETAY VERMEZ (kullanıcı var/yok sızıntısı yok): her iki durumda da 401.

### 2.3 Token doğrulama (korunan rotalar)

```
istemci → Authorization: Bearer <accessToken>
       → imza doğrulama + exp kontrolü (geçmişse RED: 401)
       → sub (userId) istek bağlamına (request context) bağlanır
```

- `exp` geçmiş token: REDDEDİLİR, yenileme YOKTUR (Faz 1 refresh ile gelecek).

## 3. Sözleşme (packages/shared)

- `RegisterRequest`, `LoginRequest`, `TokenPayload`, `AuthSession` — bkz. `packages/shared/src/contracts/auth.ts` (JSDoc: limitler).

## 4. Faz 1'de kapanacaklar

- Refresh token / oturum sonlandırma stratejisi (A5 — Faz 1 SPEC).
- JWT imzalama anahtarı yönetimi (env, rotasyon).
- Oran sınırlama (brute-force koruması).
