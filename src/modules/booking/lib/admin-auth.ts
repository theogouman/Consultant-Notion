/**
 * Authentification admin sans Supabase Auth (§8, §10) :
 *   - mot de passe en variable d'environnement (ADMIN_PASSWORD),
 *   - session = cookie signé HMAC (ADMIN_SESSION_SECRET), HttpOnly.
 *
 * Implémenté avec la Web Crypto API pour être compatible Edge (middleware)
 * ET Node (route handlers / server actions).
 */

export const ADMIN_COOKIE = "nc_admin";
const DEFAULT_TTL_MS = 7 * 24 * 3600 * 1000; // 7 jours

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

/** Comparaison à temps constant. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Crée un jeton de session signé (payload {exp} + HMAC). */
export async function createSessionToken(
  secret: string,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<string> {
  const payload = JSON.stringify({ exp: Date.now() + ttlMs });
  const payloadB64 = toBase64Url(new TextEncoder().encode(payload));
  const sig = await hmac(secret, payloadB64);
  return `${payloadB64}.${toBase64Url(sig)}`;
}

/** Vérifie un jeton de session : signature valide + non expiré. */
export async function verifySessionToken(
  secret: string,
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return false;

  const expected = await hmac(secret, payloadB64);
  let provided: Uint8Array;
  try {
    provided = fromBase64Url(sigB64);
  } catch {
    return false;
  }
  if (!timingSafeEqual(expected, provided)) return false;

  try {
    const { exp } = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)));
    return typeof exp === "number" && Date.now() < exp;
  } catch {
    return false;
  }
}

/** Comparaison à temps constant de deux chaînes (mot de passe). */
export async function safeCompareString(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  // On hache les deux pour égaliser les longueurs avant comparaison.
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  return timingSafeEqual(new Uint8Array(ha), new Uint8Array(hb));
}
