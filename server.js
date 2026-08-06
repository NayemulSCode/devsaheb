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
import cookieParser from 'cookie-parser';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { createAuth } from './server/auth.js';
import { createAdminRouter } from './server/admin.js';
import { ensureDirs, MEDIA_DIR } from './server/content.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const CLIENT_DIR = join(ROOT, 'dist', 'client');
const PORT = Number(process.env.PORT) || 3000;

await ensureDirs();

const auth = createAuth({
  passwordHash: process.env.ADMIN_PASSWORD_HASH,
  sessionSecret: process.env.SESSION_SECRET,
  secureCookies: process.env.SECURE_COOKIES === '1',
});

const app = express();
app.disable('x-powered-by');
// Passenger sits behind Apache, so the client IP arrives in X-Forwarded-For.
// Without this the login rate limiter would key every attempt to the proxy.
app.set('trust proxy', 1);
app.use(compression());
app.use(cookieParser());
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
 * The SSR bundle is imported fresh each time rather than cached, because a
 * cached module would keep serving the content it read when first loaded -
 * which is exactly what a save needs to invalidate.
 */
async function regeneratePage(path) {
  const { loadServerBundle, renderPage } = await import('./scripts/prerender.mjs');
  const { readAssets } = await import('./scripts/assets.mjs');
  const bundle = await loadServerBundle();
  const assets = await readAssets();
  const file = await renderPage(path, bundle, assets);

  // The social card carries the headline, so it has to be rebuilt with the
  // page. A card failure must not fail the save - the content is already
  // written and correct at this point.
  try {
    const { generateOgImageForPath } = await import('./scripts/og.mjs');
    await generateOgImageForPath(path);
  } catch (err) {
    console.error('[regenerate] og card failed for', path, err);
  }

  return file.replace(ROOT, '');
}

/** Schema comes from the built SSR bundle so it cannot drift from the renderer. */
async function getSchema() {
  const { loadServerBundle } = await import('./scripts/prerender.mjs');
  const { pageSchema, slugSchema } = await loadServerBundle();
  return { pageSchema, slugSchema };
}

app.use('/api/admin', createAdminRouter({ auth, getSchema, regenerate: regeneratePage }));

// Uploaded media. Served from the content directory, which persists across
// deploys - this is why cPanel's real filesystem matters for this design.
app.use(
  '/media',
  express.static(MEDIA_DIR, {
    index: false,
    redirect: false,
    setHeaders(res) {
      res.setHeader('Cache-Control', 'public, max-age=604800');
      // Uploads are user-supplied bytes on our own origin; never let a browser
      // sniff one into something executable.
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  }),
);

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
