/**
 * Auth kontrat tipleri — Faz 0'da tasarım sözleşmesidir; endpoint implementasyonu Faz 1'de.
 * Akış tasarımı: `docs/architecture/auth-akisi.md` (README §3.1: JWT / oturum tabanlı).
 *
 * ## Limitler
 *
 * - Token yenileme (refresh) stratejisi Faz 1'de kararlaştırılacak — burada YOK.
 * - Şifreler hiçbir tipte düz metin taşınmaz; `passwordHash` yalnızca sunucuda üretilir.
 */

/** Kayıt isteği (Faz 1'de kullanılacak). */
export interface RegisterRequest {
  email: string;
  /** Düz metin şifre — yalnızca kayıt isteğinde taşınır; hiçbir yerde saklanmaz. */
  password: string;
}

/** Giriş isteği. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** JWT payload sözleşmesi. */
export interface TokenPayload {
  /** Kullanıcı ID'si (subject). */
  sub: string;
  /** Veriliş zamanı (Unix saniye). */
  iat: number;
  /** Son geçerlilik (Unix saniye); geçmişse doğrulama REDDEDİLİR. */
  exp: number;
}

/** Geçerli bir oturumun istemciye dönen temsili. */
export interface AuthSession {
  userId: string;
  accessToken: string;
  expiresAt: number;
}
