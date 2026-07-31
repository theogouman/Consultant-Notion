/**
 * Rate-limit léger en mémoire (par IP), anti-bot / anti-abus.
 *
 * Suffisant pour le volume attendu d'un site de consultant (usage mono-host).
 * Note : la mémoire est par instance serverless ; ce n'est pas un compteur
 * distribué, mais il freine efficacement les rafales depuis une même IP.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * @param key       clé (généralement l'IP)
 * @param limit     nombre d'actions autorisées par fenêtre
 * @param windowMs  durée de la fenêtre en ms
 * @returns         true si autorisé, false si la limite est dépassée
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;

}

/** Extrait une IP raisonnable des en-têtes (proxy Vercel). */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
