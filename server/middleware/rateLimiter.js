// Sliding-window memory rate limiter
const requestCounts = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute per IP

// Periodic cleanup of stale records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of requestCounts.entries()) {
    const valid = timestamps.filter((t) => now - t < WINDOW_MS);
    if (valid.length === 0) {
      requestCounts.delete(key);
    } else {
      requestCounts.set(key, valid);
    }
  }
}, 5 * 60 * 1000);

export function rateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  const timestamps = requestCounts.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS) {
    res.setHeader('Retry-After', Math.ceil(WINDOW_MS / 1000));
    return res.status(429).json({
      error: 'Too many rewrite requests. Please wait a moment before trying again.',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  }

  validTimestamps.push(now);
  requestCounts.set(ip, validTimestamps);

  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - validTimestamps.length));
  res.setHeader('X-RateLimit-Reset', Math.ceil((now + WINDOW_MS) / 1000));

  next();
}
