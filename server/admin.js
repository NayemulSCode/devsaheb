/**
 * Admin API.
 *
 * Every mutating route is behind auth.require. The read route is too - page
 * drafts are not public information.
 */

import { Router } from 'express';
import multer from 'multer';
import { extname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { readPage, writePage, listVersions, MEDIA_DIR } from './content.js';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// An allowlist, not a blocklist. SVG is excluded deliberately: it is an XML
// document that can carry script, and these files are served from our origin.
const ALLOWED = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/avif', '.avif'],
  ['image/gif', '.gif'],
]);

const upload = multer({
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, MEDIA_DIR),
    filename: (_req, file, cb) => {
      // The client-supplied name is never used on disk. It is the easiest way
      // to smuggle a traversal sequence or a second extension.
      const ext = ALLOWED.get(file.mimetype) ?? extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      cb(new Error(`Unsupported type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

/**
 * @param auth       from createAuth()
 * @param schema     { pageSchema, slugSchema } from the built SSR bundle, so
 *                   saves are validated against exactly the schema the
 *                   renderer was compiled with
 * @param regenerate (path) => Promise<string>
 */
export function createAdminRouter({ auth, getSchema, regenerate }) {
  const router = Router();

  router.get('/session', (req, res) => {
    res.json({ ok: true, configured: auth.configured, signedIn: auth.isAuthenticated(req) });
  });

  router.post('/login', (req, res) => auth.login(req, res));
  router.post('/logout', (req, res) => auth.logout(req, res));

  router.get('/pages/:slug', auth.require, async (req, res) => {
    try {
      const { slugSchema } = await getSchema();
      const slug = slugSchema.parse(req.params.slug);
      const page = await readPage(slug);
      if (!page) return res.status(404).json({ ok: false, error: 'No such page.' });
      res.json({ ok: true, slug, data: page, versions: await listVersions(slug) });
    } catch (err) {
      res.status(400).json({ ok: false, error: messageFor(err) });
    }
  });

  router.put('/pages/:slug', auth.require, async (req, res) => {
    try {
      const { slugSchema, pageSchema } = await getSchema();
      const slug = slugSchema.parse(req.params.slug);

      // Validate before touching disk. A malformed save should be rejected at
      // the boundary, not discovered as a white screen in production.
      const saved = await writePage(slug, req.body?.data, (d) => pageSchema.parse(d));

      const path = typeof req.body?.path === 'string' ? req.body.path : null;
      let regenerated = null;
      if (path?.startsWith('/')) regenerated = await regenerate(path);

      res.json({ ok: true, slug, regenerated, blocks: saved.content.length });
    } catch (err) {
      res.status(400).json({ ok: false, error: messageFor(err) });
    }
  });

  router.post('/media', auth.require, (req, res) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        const tooBig = err.code === 'LIMIT_FILE_SIZE';
        return res.status(tooBig ? 413 : 400).json({
          ok: false,
          error: tooBig ? 'File exceeds 5 MB.' : err.message,
        });
      }
      if (!req.file) return res.status(400).json({ ok: false, error: 'No file received.' });
      res.json({ ok: true, url: `/media/${req.file.filename}`, bytes: req.file.size });
    });
  });

  return router;
}

export const MEDIA_ROUTE_DIR = MEDIA_DIR;
export const mediaPath = (name) => join(MEDIA_DIR, name);

/** zod errors carry useful field paths; anything else gets a generic message. */
function messageFor(err) {
  if (err?.issues?.length) {
    return err.issues
      .slice(0, 5)
      .map((i) => `${i.path.join('.') || 'value'}: ${i.message}`)
      .join('; ');
  }
  return err instanceof Error ? err.message : 'Request failed.';
}
