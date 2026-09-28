export function rateLimit({ limit = 100, windowMs = 60_000, now = () => Date.now() } = {}) {
  const hits = new Map();

  return function limiter(req, res, next) {
    const key = req.ip;
    const t = now();
    let entry = hits.get(key);
    if (!entry || t - entry.start >= windowMs) {
      entry = { count: 0, start: t };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > limit + 1) {
      return res.status(429).json({ error: "rate limit exceeded" });
    }
    res.set("X-RateLimit-Remaining", String(Math.max(0, limit - entry.count)));
    return next();
  };
}
