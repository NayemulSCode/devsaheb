/**
 * Express app for cPanel / Phusion Passenger.
 *
 * Public pages are NOT served from here in production - Apache serves the
 * prerendered HTML in dist/client directly, via deploy/.htaccess. This process
 * exists for two jobs only:
 *
 *   1. /api/*  - the content save endpoints (Phase 4) and health checks
 *   2. regeneration - after a save, re-render the affected page to disk
 *
 * The static handler below is a convenience for local production testing
 * (`npm run preview`). On the real host Apache never reaches it.
 */

import express from 'express';
import compression from 'compression';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const CLIENT_DIR = join(ROOT, 'dist', 'client');
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.disable('x-powered-by');
app.use(compression());
app.use(express.json({ limit: '2mb' }));

// --- Canonical host and path -------------------------------------------------
// Trailing-slash and case duplicates split ranking signals, so normalise with a
// 301 rather than serving the same page at several URLs.
app.use((req, res, next) => {
  const url = req.originalUrl.split('?')[0];
  if (url.length > 1 && url.endsWith('/')) {
    const query = req.originalUrl.slice(url.length);
    return res.redirect(301, url.replace(/\/+$/, '') + query);
  }
  next();
});

// --- API ---------------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    node: process.version,
    prerendered: existsSync(join(CLIENT_DIR, 'index.html')),
  });
});

/**
 * Regenerates one page from the current content on disk.
 *
 * Phase 4 calls this from the Puck save handler. It loads the same SSR bundle
 * the build uses, so a regenerated page is identical to a freshly built one.
 */
app.post('/api/regenerate', async (req, res) => {
  const path = typeof req.body?.path === 'string' ? req.body.path : null;
  if (!path || !path.startsWith('/')) {
    return res.status(400).json({ ok: false, error: 'Expected a leading-slash path.' });
  }

  try {
    const { loadServerBundle, renderPage } = await import('./scripts/prerender.mjs');
    const { readAssets } = await import('./scripts/assets.mjs');
    const bundle = await loadServerBundle();
    const assets = await readAssets();
    const file = await renderPage(path, bundle, assets);
    res.json({ ok: true, path, file: file.replace(ROOT, '') });
  } catch (err) {
    console.error('[regenerate]', err);
    res.status(500).json({ ok: false, error: 'Regeneration failed.' });
  }
});

// --- Static (local preview only) ---------------------------------------------
//
// Serve /services from /services/index.html directly, mirroring the
// mod_rewrite rule in deploy/.htaccess.
//
// serve-static would instead 301 a directory request to add a trailing slash,
// which the canonicaliser above strips straight back off - an infinite loop
// between /services and /services/. Sending the file ourselves is explicit and
// does not depend on serve-static's directory handling at all.
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const pathname = req.path;
  if (pathname.startsWith('/api') || extname(pathname)) return next();

  const candidate = join(CLIENT_DIR, pathname, 'index.html');
  if (!existsSync(candidate)) return next();

  res.setHeader('Cache-Control', 'no-cache');
  return res.sendFile(candidate);
});

app.use(
  express.static(CLIENT_DIR, {
    redirect: false,
    index: false,
    setHeaders(res, filePath) {
      // Hashed assets are immutable; HTML must always revalidate or edits
      // made through the admin would stay invisible behind a cache.
      if (/[\\/]assets[\\/]/.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }),
);

app.use((_req, res) => {
  res.status(404).sendFile(join(CLIENT_DIR, '404.html'), (err) => {
    if (err) res.status(404).type('txt').send('Not found');
  });
});

app.use((err, _req, res, _next) => {
  console.error('[server]', err);
  res.status(500).type('txt').send('Internal server error');
});

app.listen(PORT, () => {
  console.log(`devsaheb listening on http://localhost:${PORT}`);
});

export default app;
