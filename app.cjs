/**
 * Phusion Passenger / LiteSpeed entry point.
 *
 * cPanel's "Setup Node.js App" asks for a startup file; set it to app.cjs.
 * The real app lives in server.js.
 *
 * This file is CommonJS on purpose. LiteSpeed's launcher (lsnode.js) loads the
 * startup file with require(), and require() refuses an ESM graph that uses
 * top-level await - which server.js does. A .cjs file is always CommonJS
 * regardless of "type": "module", and import() has no such restriction.
 *
 * The launcher also runs plain `node`, not `npm start`, so the
 * --env-file-if-exists flag in package.json never applies. .env is loaded here
 * instead, before server.js reads the environment at module load.
 */
const { existsSync } = require('node:fs');
const { join } = require('node:path');

const envFile = join(__dirname, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

import('./server.js').catch((err) => {
  console.error(err);
  process.exit(1);
});
