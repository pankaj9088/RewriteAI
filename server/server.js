import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import rewriteRouter from './routes/rewrite.js';
import { corsMiddleware } from './middleware/corsMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Trust proxy for reverse proxies (Render, Cloudflare, AWS, Nginx)
app.set('trust proxy', 1);

// Security & Parsing Middlewares
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve extension directory static files if present
app.use('/extension', express.static(path.join(process.cwd(), 'extension')));

// Standard health check endpoint required for cloud hosting (Render, AWS, GCP, K8s)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Detailed API health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'RewriteAI Backend',
    version: '1.0.0',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Main rewrite route
app.use('/api/rewrite', rewriteRouter);

// Fallback 404 handler for unknown routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint not found', code: 'NOT_FOUND' });
  }
  next();
});

// Centralized error handler
app.use(errorHandler);

// Standalone execution entry point (e.g., when launched directly via `node server.js` on Render)
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[RewriteAI Backend] Server listening on port ${PORT}`);
  });
}

export default app;

