/**
 * Express app for cPanel / Phusion Passenger.
 *
 * Two deployments are supported and they differ in who serves public pages:
 *
 *   Root mount (docs/deploy-git.md) - Application URL is the bare domain, so
 *   Passenger sees every request and the static handling below IS production.
 *   Nothing else canonicalises the host or sets cache headers, which is why
 *   both live in here rather than in an .htaccess.
 *
 *   Split (RELEASE.md) - Application URL is <domain>/api, the document root
 *   points at dist/client, and Apache serves the prerendered HTML directly via
 *   deploy/.htaccess. Node never enters the request path for a public page.
 *
 * Either way this process owns /api/* - the content save endpoints and health
 * checks - and regeneration, re-rendering the affected page to disk after a
 * save. The API lives in server/api.js so the Vite dev server can mount the
 * same routes.
 */

import express from 'express';
import compression from 'compression';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { createApi } from './server/api.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const CLIENT_DIR = join(ROOT, 'dist', 'client');
const PORT = Number(process.env.PORT) || 3000;

const { api } = await createApi({ linkMedia: true });

const app = express();
app.disable('x-powered-by');
// Passenger sits behind Apache, so the client IP arrives in X-Forwarded-For.
// Without this the login rate limiter would key every attempt to the proxy.
app.set('trust proxy', 1);
app.use(compression());

/**
 * Canonical host.
 *
 * Opt-in through CANONICAL_HOST so local preview is untouched; set it in .env
 * on the server. When the app is mounted at the domain root rather than behind
 * a document-root .htaccess, this is the only thing redirecting the apex to
 * www - and every canonical tag, sitemap entry and og:url in the build points
 * at www, so without it the site answers on two hosts.
 */
const CANONICAL_HOST = process.env.CANONICAL_HOST?.trim();

app.use((req, res, next) => {
  if (!CANONICAL_HOST) return next();

  const host = req.headers.host;
  if (!host || host === CANONICAL_HOST) return next();

  // Apache terminates TLS, so the scheme arrives in X-Forwarded-Proto.
  const proto = req.get('x-forwarded-proto') ?? req.protocol;
  return res.redirect(301, `${proto}://${CANONICAL_HOST}${req.originalUrl}`);
});

// --- Canonical path ----------------------------------------------------------
// Trailing-slash duplicates split ranking signals, so normalise with a 301
// rather than serving the same page at several URLs. /api and /media are
// exempt - the same exemption deploy/.htaccess makes.
app.use((req, res, next) => {
  const url = req.originalUrl.split('?')[0];
  if (/^\/(api|media)(\/|$)/.test(url)) return next();
  if (url.length > 1 && url.endsWith('/')) {
    const query = req.originalUrl.slice(url.length);
    return res.redirect(301, url.replace(/\/+$/, '') + query);
  }
  next();
});

app.use(api);

// --- Static ------------------------------------------------------------------
//
// Live under a root mount; local preview only under the split design.
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
      res.setHeader('X-Content-Type-Options', 'nosniff');

      if (/[\\/]assets[\\/]/.test(filePath)) {
        // Hashed by the build, so a change means a new URL.
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('.html')) {
        // Must revalidate, or a page edited through the admin stays invisible.
        res.setHeader('Cache-Control', 'no-cache');
      } else if (/\.(png|svg|ico|jpe?g|webp|avif|woff2?)$/.test(filePath)) {
        // Unhashed root assets: favicons, OG cards. Long enough to help, short
        // enough that a brand change is not stuck in caches for a year.
        res.setHeader('Cache-Control', 'public, max-age=604800');
      } else if (/_data[\\/].*\.json$/.test(filePath)) {
        // Route content fetched on client-side navigation. Revalidates for the
        // same reason HTML does.
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
