import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.disable('x-powered-by');

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  // In production the built React app lives at client/dist and is served
  // by this same process, so a single port hosts everything.
  const distDir = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    // SPA fallback: any non-API GET returns index.html so deep links like
    // /room/K7QM work when pasted into a fresh browser.
    app.get(/^\/(?!socket\.io).*/, (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  return app;
}
