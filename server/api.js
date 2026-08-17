/**
 * The API half of the server: /api/* and /media.
 *
 * Extracted so the Vite dev server can mount it too. Without that, `npm run
 * dev` serves index.html for /api/admin/session, the JSON parse fails, and
 * /admin reports "Admin is not configured" - pointing at .env when the real
 * problem is that no API exists in dev at all.
 *
 * Static file serving deliberately stays out of here: in dev Vite owns those
 * routes, and in production Apache does.
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { createAuth } from './auth.js';
import { createAdminRouter } from './admin.js';
import { ensureDirs, ensureMediaLink, MEDIA_DIR } from './content.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT_DIR = join(ROOT, 'dist', 'client');

/**
 * Regenerates one page from the current content on disk.
 *
 * The SSR bundle is imported fresh each time rather than cached, because a
 * cached module would keep serving the content it read when first loaded -
 * which is exactly what a save needs to invalidate.
 */
async function regeneratePage(path) {
  const { loadServerBundle, renderPage } = await import('../scripts/prerender.mjs');
  const { readAssets } = await import('../scripts/assets.mjs');
  const bundle = await loadServerBundle();
  const assets = await readAssets();
  const file = await renderPage(path, bundle, assets);

  // The social card carries the headline, so it has to be rebuilt with the
  // page. A card failure must not fail the save - the content is already
  // written and correct at this point.
  try {
    const { generateOgImageForPath } = await import('../scripts/og.mjs');
    await generateOgImageForPath(path);
  } catch (err) {
    console.error('[regenerate] og card failed for', path, err);
  }

  return file.replace(ROOT, '');
}

/**
 * The built SSR bundle: route table and schemas.
 *
 * Imported fresh rather than cached so the admin always validates against the
 * schema the current renderer was compiled with, and sees the current routes.
 */
async function getBundle() {
  const { loadServerBundle } = await import('../scripts/prerender.mjs');
  return loadServerBundle();
}

/**
 * @param {object} [options]
 * @param {boolean} [options.linkMedia] Create the docroot media symlink.
 *        Production only - in dev Vite serves from the project, not dist/.
 */
export async function createApi({ linkMedia = true } = {}) {
  await ensureDirs();

  if (linkMedia) {
    const link = await ensureMediaLink(CLIENT_DIR);
    if (link instanceof Error) {
      console.warn('[media] could not link uploads into the document root:', link.message);
    }
  }

  const auth = createAuth({
    passwordHash: process.env.ADMIN_PASSWORD_HASH,
    sessionSecret: process.env.SESSION_SECRET,
    secureCookies: process.env.SECURE_COOKIES === '1',
  });

  // A full express() app, not a Router. Vite's server.middlewares is Connect,
  // which hands a bare Node response to a mounted Router - so res.json and
  // res.cookie are undefined and every route 500s. An app installs Express's
  // own request/response prototypes first, and still mounts as middleware.
  const api = express();
  api.disable('x-powered-by');
  api.use(cookieParser());
  api.use(express.json({ limit: '2mb' }));

  api.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      node: process.version,
      configured: auth.configured,
      prerendered: existsSync(join(CLIENT_DIR, 'index.html')),
    });
  });

  api.use('/api/admin', createAdminRouter({ auth, getBundle, regenerate: regeneratePage }));

  // Uploaded media. Served from the content directory, which persists across
  // deploys - this is why cPanel's real filesystem matters for this design.
  api.use(
    '/media',
    express.static(MEDIA_DIR, {
      index: false,
      redirect: false,
      setHeaders(res) {
        res.setHeader('Cache-Control', 'public, max-age=604800');
        // Uploads are user-supplied bytes on our own origin; never let a
        // browser sniff one into something executable.
        res.setHeader('X-Content-Type-Options', 'nosniff');
      },
    }),
  );

  return { api, auth };
}
