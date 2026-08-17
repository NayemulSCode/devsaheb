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

/*
 * .htaccess is shipped OUTSIDE app/, deliberately.
 *
 * The document root is app/dist/client, and cPanel writes its Passenger block
 * into the .htaccess there when the Node app is created. But `vite build` sets
 * emptyOutDir, so dist/ is wiped and rebuilt every time - and an earlier
 * version of this script copied our .htaccess straight into dist/client.
 * Either one would delete cPanel's Passenger config on the next deploy, and
 * /api would stop routing with nothing obviously broken to point at.
 *
 * So it ships as a snippet to append once, by hand, and is never overwritten.
 */
cpSync(join(ROOT, 'deploy', '.htaccess'), join(OUT, 'htaccess-append-to-docroot.txt'));

cpSync(join(ROOT, 'content'), CONTENT, { recursive: true });

writeFileSync(
  join(OUT, 'DEPLOY.txt'),
  `DevSaheb release
================

WHAT IS IN HERE

  app/                            upload to the application root.
                                  Safe to overwrite on every deploy.

  content/                        FIRST DEPLOY ONLY. After launch this is live
                                  content edited through /admin, and
                                  re-uploading it destroys those edits. There
                                  is no database; the only other copy is
                                  content/.versions on the server.

  htaccess-append-to-docroot.txt  APPEND ONCE, by hand. See step 6.


LAYOUT (cPanel, devsaheb.com as an addon domain)

  /home/devsaheb/devsaheb-app/              <- application root, app/ goes here
  /home/devsaheb/devsaheb-app/dist/client/  <- document root for devsaheb.com

  The document root is INSIDE the application root. That is intentional: it is
  what keeps Node out of the request path for public pages.


STEPS

  1. cPanel > Domains > Create A Domain
       Domain:        devsaheb.com
       Document root: /home/devsaheb/devsaheb-app/dist/client
       (uncheck "share document root with primary domain")

  2. Upload app/ to /home/devsaheb/devsaheb-app/
     Upload content/ to /home/devsaheb/devsaheb-app/content/   (first time only)

  3. cPanel > Setup Node.js App > CREATE APPLICATION
       Node version:     22.23.2
       Application mode: production
       Application root: devsaheb-app
       Application URL:  devsaheb.com/api
       Startup file:     app.js

  4. In that app's panel, click "Run NPM Install"
     (or use its terminal command, then: npm install --omit=dev)

  5. Create /home/devsaheb/devsaheb-app/.env containing:
       ADMIN_PASSWORD_HASH=...     from: node scripts/hash-password.mjs "..."
       SESSION_SECRET=...          from the same command
       SECURE_COOKIES=1            required - the site is HTTPS

  6. Open /home/devsaheb/devsaheb-app/dist/client/.htaccess
     cPanel will have written a Passenger block into it in step 3.
     APPEND the contents of htaccess-append-to-docroot.txt BELOW that block.
     Do not replace the file and do not touch the Passenger lines.

  7. Ensure the app user can write to content/ and content/media/  (755 is fine)

  8. Restart the app from the Node.js panel.


REDEPLOY

  Re-upload app/ only. Do NOT re-upload content/.
  dist/ is rebuilt from scratch each build, which means dist/client/.htaccess
  is deleted with it - so after every redeploy, redo step 6.


CHECK

  curl -sI https://www.devsaheb.com/            -> 200, text/html
  curl -s  https://www.devsaheb.com/api/health  -> {"ok":true,"node":"v22...."}
  curl -sI https://www.devsaheb.com/services/   -> 301 to /services
  curl -s  https://www.devsaheb.com/robots.txt  -> lists the sitemap

  DNS must point devsaheb.com at 198.177.120.114 (or this host's nameservers)
  before any of the above will answer.
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
