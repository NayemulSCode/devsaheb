/**
 * Phusion Passenger entry point.
 *
 * cPanel's "Setup Node.js App" asks for a startup file and defaults to app.js.
 * The real app lives in server.js; this only exists so the cPanel field can be
 * left at its default.
 *
 * Passenger runs this file with plain `node`, not `npm start`, so the
 * --env-file-if-exists flag in package.json never applies here. .env is loaded
 * explicitly instead, before server.js is imported - a static import would be
 * hoisted and evaluated before this runs, and server.js reads the environment
 * at module load.
 *
 * If Passenger on your host cannot load ESM, set the startup file to server.js
 * directly, or ask support which Node version the selector is pinned to -
 * Passenger needs Node 20+ for this project regardless.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const envFile = fileURLToPath(new URL('./.env', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

await import('./server.js');
