/**
 * Generates the two secrets the admin needs.
 *
 *   node scripts/hash-password.mjs "your password here"
 *
 * Prints lines to paste into .env. The plaintext password is never stored.
 */

import { hashPassword } from '../server/auth.js';
import { randomBytes } from 'node:crypto';

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "<password>"');
  process.exit(1);
}

if (password.length < 12) {
  console.error('Use at least 12 characters. This is the only thing guarding site content.');
  process.exit(1);
}

console.log(`ADMIN_PASSWORD_HASH=${hashPassword(password)}`);
console.log(`SESSION_SECRET=${randomBytes(32).toString('hex')}`);
