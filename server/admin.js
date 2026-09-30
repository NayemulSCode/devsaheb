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
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { readdir, stat, unlink, writeFile, rename } from 'node:fs/promises';
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

const EXTENSIONS = new Set(ALLOWED.values());

/**
 * What the bytes actually are.
 *
 * The multipart Content-Type is supplied by whoever made the request, so on its
 * own it decides nothing - a caller can label anything image/png. These are the
 * container signatures, checked against the real bytes before the file is
 * written, so the extension we hand back always matches the content.
 */
function sniff(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return '.jpg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return '.png';
  }
  const head = buf.subarray(0, 6).toString('latin1');
  if (head === 'GIF87a' || head === 'GIF89a') return '.gif';
  if (buf.length >= 12) {
    const riff = buf.subarray(0, 4).toString('latin1');
    const kind = buf.subarray(8, 12).toString('latin1');
    if (riff === 'RIFF' && kind === 'WEBP') return '.webp';
    // ISO-BMFF: size, then 'ftyp', then the brand.
    if (buf.subarray(4, 8).toString('latin1') === 'ftyp') {
      const brand = buf.subarray(8, 12).toString('latin1');
      if (brand === 'avif' || brand === 'avis') return '.avif';
    }
  }
  return null;
}

/**
 * Names this server generated, and nothing else.
 *
 * Delete and any other name-addressed route match against this rather than
 * sanitising what arrives, so a traversal sequence cannot be expressed in the
 * first place - there is no encoding of "../" that satisfies it.
 */
const GENERATED_NAME = /^\d{13}-[0-9a-f]{12}\.(jpg|png|webp|avif|gif)$/;

// Held in memory so the bytes can be checked before anything reaches the disk.
// Capped at 5 MB with one file per request, so the ceiling is bounded.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
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
          // Whether the page is linked from the navigation and listed in the
          // sitemap. Saving here never changes it - that is `published` in
          // src/content/taxonomy.ts, which is code rather than content - so
          // the admin has to show the state rather than let Publish imply it.
          draft: Boolean(r.meta.noindex),
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

  /** Everything already uploaded, newest first, for the editor's picker. */
  router.get('/media', auth.require, async (_req, res) => {
    try {
      const names = await readdir(MEDIA_DIR).catch(() => []);
      const files = [];

      for (const name of names) {
        if (!EXTENSIONS.has(name.slice(name.lastIndexOf('.')).toLowerCase())) continue;
        const info = await stat(join(MEDIA_DIR, name)).catch(() => null);
        if (!info?.isFile()) continue;
        files.push({ name, url: `/media/${name}`, bytes: info.size, modified: info.mtimeMs });
      }

      files.sort((a, b) => b.modified - a.modified);
      res.json({ ok: true, files });
    } catch (err) {
      res.status(500).json({ ok: false, error: messageFor(err) });
    }
  });

  router.post('/media', auth.require, (req, res) => {
    upload.single('file')(req, res, async (err) => {
      if (err) {
        const tooBig = err.code === 'LIMIT_FILE_SIZE';
        return res.status(tooBig ? 413 : 400).json({
          ok: false,
          error: tooBig ? 'File exceeds 5 MB.' : err.message,
        });
      }
      if (!req.file?.buffer?.length) {
        return res.status(400).json({ ok: false, error: 'No file received.' });
      }

      // The declared type only got it this far; the bytes decide the extension.
      const ext = sniff(req.file.buffer);
      if (!ext) {
        return res.status(400).json({
          ok: false,
          error: 'That file is not a JPEG, PNG, WebP, AVIF or GIF. SVG is not accepted.',
        });
      }

      try {
        const name = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
        const target = join(MEDIA_DIR, name);

        // Written to a neighbour and renamed, so a half-written file is never
        // reachable at its final URL - the same bargain content saves make.
        const temp = `${target}.tmp`;
        await writeFile(temp, req.file.buffer);
        await rename(temp, target);

        res.json({ ok: true, name, url: `/media/${name}`, bytes: req.file.size });
      } catch (writeErr) {
        res.status(500).json({ ok: false, error: messageFor(writeErr) });
      }
    });
  });

  router.delete('/media/:name', auth.require, async (req, res) => {
    const name = String(req.params.name ?? '');
    if (!GENERATED_NAME.test(name)) {
      return res.status(400).json({ ok: false, error: 'Not an uploaded file name.' });
    }

    try {
      await unlink(join(MEDIA_DIR, name));
      res.json({ ok: true, name });
    } catch (err) {
      if (err?.code === 'ENOENT') return res.status(404).json({ ok: false, error: 'Already gone.' });
      res.status(500).json({ ok: false, error: messageFor(err) });
    }
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
