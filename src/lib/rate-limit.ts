type Bucket = { count: number; expiresAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 2000;

function sweepExpiredBuckets(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.expiresAt < now) buckets.delete(key);
  }
}

export function checkRateLimit(key: string, limit = 6, windowMs = 60_000) {
  const now = Date.now();
  sweepExpiredBuckets(now);
  const existing = buckets.get(key);
  if (!existing || existing.expiresAt < now) {
    buckets.set(key, { count: 1, expiresAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  if (existing.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.max(1, Math.ceil((existing.expiresAt - now) / 1000)) };
  }
  existing.count += 1;
  buckets.set(key, existing);
  return { ok: true, remaining: limit - existing.count, retryAfter: 0 };
}

export function requestIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "anonymous";
}
