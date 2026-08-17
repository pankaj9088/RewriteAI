/**
 * CORS Middleware for RewriteAI Backend
 *
 * Configured specifically for:
 * 1. Chrome Extension origins (chrome-extension://<EXTENSION_ID>)
 * 2. Local development environments (localhost, 127.0.0.1)
 * 3. Configured production domains via ALLOWED_ORIGINS environment variable
 * 4. Direct server-to-server / curl / background requests (no Origin header)
 */
export function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  const envOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  let isAllowed = false;

  // 1. Direct requests without an Origin header (e.g., service workers, curl, internal calls)
  if (!origin) {
    isAllowed = true;
  }
  // 2. Chrome Extension origins
  else if (origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://')) {
    isAllowed = true;
  }
  // 3. Localhost origins (Development)
  else if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    isAllowed = true;
  }
  // 4. Custom domain list from ALLOWED_ORIGINS environment variable
  else if (envOrigins.includes(origin)) {
    isAllowed = true;
  }

  if (isAllowed) {
    // Dynamically reflect the verified origin (avoids wildcard '*' when credentials or specific origins are used)
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    if (isAllowed) {
      return res.status(204).end();
    } else {
      return res.status(403).json({ error: 'CORS origin not permitted', code: 'CORS_FORBIDDEN' });
    }
  }

  if (!isAllowed) {
    return res.status(403).json({ error: 'CORS origin not permitted', code: 'CORS_FORBIDDEN' });
  }

  next();
}

