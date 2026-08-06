import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Reads content from disk at render time.
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

/**
 * @param relPath e.g. "pages/home" or "taxonomy/services/custom-software"
 */
export function readContentFile<T>(relPath: string): T | null {
  // Every segment must be a safe slug. Backstops the route table against ever
  // resolving a path outside the content directory.
  if (!relPath.split('/').every((seg) => /^[a-z0-9][a-z0-9-]{0,63}$/.test(seg))) {
    return null;
  }

  const file = join(CONTENT_DIR, `${relPath}.json`);
  if (!existsSync(file)) return null;

  try {
    return JSON.parse(readFileSync(file, 'utf8')) as T;
  } catch {
    // A corrupt file must not take the build down. The route falls back to
    // whatever it renders without content.
    return null;
  }
}
