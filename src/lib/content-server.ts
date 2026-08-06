import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PageContent } from '../content/schema';

/**
 * Reads page content from disk at render time.
 *
 * Deliberately fs rather than a JSON import: a bundled import would freeze the
 * content at build time, so a page regenerated after an edit would still serve
 * whatever was on disk when the bundle was built. This module is only ever
 * imported by entry-server, so node:fs never reaches the browser.
 */
const HERE = dirname(fileURLToPath(import.meta.url));

/** dist/server/entry-server.js in production, src/lib in dev. */
const CONTENT_DIR = existsSync(join(HERE, '..', '..', 'content'))
  ? resolve(HERE, '..', '..', 'content')
  : resolve(HERE, '..', '..', '..', 'content');

export function readPageContent(slug: string): PageContent | null {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug)) return null;

  const file = join(CONTENT_DIR, 'pages', `${slug}.json`);
  if (!existsSync(file)) return null;

  try {
    return JSON.parse(readFileSync(file, 'utf8')) as PageContent;
  } catch {
    // A corrupt file must not take the build down. The route falls back to
    // whatever it renders without content.
    return null;
  }
}
