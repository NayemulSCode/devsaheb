/**
 * Stages exactly what cPanel needs into release/.
 *
 * Two folders, because they have different rules on redeploy:
 *
 *   release/app     - overwrite freely on every deploy
 *   release/content - FIRST DEPLOY ONLY. This is live content after that, and
 *                     copying it again would wipe everything edited through
 *                     /admin since launch. There is no database to restore from.
 *
 * node_modules is not included: it is installed on the server. src/ is not
 * included either - nothing at runtime reads it.
 *
 *   node scripts/package-release.mjs
 */

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'release');
const APP = join(OUT, 'app');
const CONTENT = join(OUT, 'content');

/** Everything the server needs at runtime, and nothing else. */
const APP_ITEMS = [
  'dist',            // prerendered HTML + client assets + SSR bundle
  'server',          // auth, admin routes, content store
  'scripts',         // prerender, og, assets - imported by server.js at runtime
  'assets/fonts',    // satori reads these TTFs to regenerate OG cards
  'brand/ds-mark.svg', // embedded into OG cards
  'server.js',
  'app.js',          // Passenger startup file
  'package.json',
  'package-lock.json',
];

if (!existsSync(join(ROOT, 'dist', 'client', 'index.html'))) {
  console.error('No build found. Run `npm run build` first.');
  process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(APP, { recursive: true });

for (const item of APP_ITEMS) {
  const from = join(ROOT, item);
  if (!existsSync(from)) {
    console.error(`Missing: ${item}`);
    process.exit(1);
  }
  const to = join(APP, item);
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
}

// .htaccess belongs in the document root, which is dist/client.
cpSync(join(ROOT, 'deploy', '.htaccess'), join(APP, 'dist', 'client', '.htaccess'));

cpSync(join(ROOT, 'content'), CONTENT, { recursive: true });

writeFileSync(
  join(OUT, 'DEPLOY.txt'),
  `DevSaheb release
================

app/      -> upload to the application root. Safe to overwrite every deploy.
content/  -> FIRST DEPLOY ONLY. After launch this is live content edited
             through /admin, and re-uploading it destroys those edits.
             There is no database and no backup other than content/.versions.

On the server, in the application root:

  1. npm install --omit=dev
  2. Create .env with ADMIN_PASSWORD_HASH and SESSION_SECRET
     (generate locally: node scripts/hash-password.mjs "a long password")
     Add SECURE_COOKIES=1 - the site is HTTPS, and without this the session
     cookie is sent without the Secure flag.
  3. Document root for the domain -> <app root>/dist/client
  4. cPanel > Setup Node.js App:
       Application root = <app root>
       Application URL  = /api
       Startup file     = app.js
       Node version     = 20 or higher   <-- verify this FIRST
  5. Ensure the app user can write to content/ and content/media/

Check after deploy:
  curl -sI https://www.devsaheb.com/            -> 200, text/html
  curl -s  https://www.devsaheb.com/api/health  -> {"ok":true,...}
  curl -sI https://www.devsaheb.com/services/   -> 301 to /services
`,
);

function sizeOf(dir) {
  let total = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    total += e.isDirectory() ? sizeOf(p) : statSync(p).size;
  }
  return total;
}

const mb = (b) => `${(b / 1024 / 1024).toFixed(1)} MB`;
console.log(`\nrelease/app      ${mb(sizeOf(APP))}`);
console.log(`release/content  ${mb(sizeOf(CONTENT))}   (first deploy only)`);
console.log(`\nSee release/DEPLOY.txt\n`);
