/**
 * Admin API.
 *
 * Every mutating route is behind auth.require. The read routes are too - page
 * drafts are not public information.
 *
 * Documents are addressed by content path ("pages/home",
 * "taxonomy/services/custom-software") rather than a bare slug, so the editor
 * reaches every content-backed page rather than just the home page.
 */

import { Router } from 'express';
import multer from 'multer';
import { extname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { readContent, writeContent, listVersions, MEDIA_DIR } from './content.js';

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

/** Which editor a document needs, and which schema validates it. */
function kindOf(contentPath) {
  return contentPath.startsWith('taxonomy/') ? 'taxonomy' : 'blocks';
}

/**
 * @param auth       from createAuth()
 * @param getBundle  () => the built SSR bundle (routes + schemas)
 * @param regenerate (path) => Promise<string>
 */
export function createAdminRouter({ auth, getBundle, regenerate }) {
  const router = Router();

  router.get('/session', (req, res) => {
    res.json({ ok: true, configured: auth.configured, signedIn: auth.isAuthenticated(req) });
  });

  router.post('/login', (req, res) => auth.login(req, res));
  router.post('/logout', (req, res) => auth.logout(req, res));

  /**
   * Everything the admin can edit, derived from the route table in the built
   * bundle. Deriving it means the list cannot drift from what actually
   * renders - a new route with a contentPath is editable the moment it ships,
   * with no second registry to keep in step.
   */
  router.get('/documents', auth.require, async (_req, res) => {
    try {
      const { routes } = await getBundle();
      const documents = routes
        .filter((r) => r.contentPath)
        .map((r) => ({
          contentPath: r.contentPath,
          route: r.path,
          title: r.meta.title,
          kind: kindOf(r.contentPath),
        }));
      res.json({ ok: true, documents });
    } catch (err) {
      res.status(500).json({ ok: false, error: messageFor(err) });
    }
  });

  router.get('/content', auth.require, async (req, res) => {
    try {
      const contentPath = String(req.query.path ?? '');
      const { route } = await locate(getBundle, contentPath);
      const data = await readContent(contentPath);
      if (!data) return res.status(404).json({ ok: false, error: 'No such document.' });

      res.json({
        ok: true,
        contentPath,
        route,
        kind: kindOf(contentPath),
        data,
        versions: await listVersions(contentPath),
      });
    } catch (err) {
      res.status(400).json({ ok: false, error: messageFor(err) });
    }
  });

  router.put('/content', auth.require, async (req, res) => {
    try {
      const contentPath = String(req.query.path ?? '');
      const { route, bundle } = await locate(getBundle, contentPath);

      // Validate before touching disk. A malformed save should be rejected at
      // the boundary, not discovered as a white screen in production.
      const kind = kindOf(contentPath);
      const schema = kind === 'taxonomy' ? bundle.taxonomyPageSchema : bundle.pageSchema;

      // A missing schema means the running process is holding a bundle older
      // than the code that needs it. Say so, rather than letting schema.parse
      // throw "Cannot read properties of undefined" and look like bad input.
      if (!schema?.parse) {
        throw new Error(
          `The server is running an out-of-date build (no ${kind} schema). ` +
            'Run npm run build, then restart the server.',
        );
      }

      const saved = await writeContent(contentPath, req.body?.data, (d) => schema.parse(d));
      const regenerated = await regenerate(route);

      res.json({ ok: true, contentPath, route, regenerated, saved: summarise(saved) });
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

/**
 * Maps a content path back to the route that renders it.
 *
 * Refusing an unknown path is the point: it means only documents the site
 * actually renders can be written, so the admin cannot create orphan files or
 * be pointed at something outside the route table.
 */
async function locate(getBundle, contentPath) {
  const bundle = await getBundle();
  const route = bundle.routes.find((r) => r.contentPath === contentPath);
  if (!route) throw new Error(`No route renders "${contentPath}".`);
  return { route: route.path, bundle };
}

function summarise(doc) {
  if (Array.isArray(doc?.content)) return `${doc.content.length} block(s)`;
  if (Array.isArray(doc?.sections)) {
    return `${doc.sections.length} section(s), ${doc.faq?.length ?? 0} FAQ`;
  }
  return 'saved';
}

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

export const mediaPath = (name) => join(MEDIA_DIR, name);
