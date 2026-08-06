/**
 * Admin authentication.
 *
 * A single operator password, verified against a scrypt hash held in the
 * environment, exchanged for an HMAC-signed session cookie. No database, no
 * session store - the cookie carries its own expiry and is verified on every
 * request.
 *
 * Generate the hash with:  node scripts/hash-password.mjs
 */

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SESSION_COOKIE = 'ds_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

const SCRYPT_KEYLEN = 64;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

/** Login attempts per IP. In-memory: a restart clears it, which is acceptable. */
const attempts = new Map();
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

export function hashPassword(password) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, SCRYPT_KEYLEN, SCRYPT_PARAMS);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

function verifyPassword(password, stored) {
  const [scheme, saltHex, keyHex] = String(stored).split('$');
  if (scheme !== 'scrypt' || !saltHex || !keyHex) return false;

  const expected = Buffer.from(keyHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, SCRYPT_PARAMS);
  return timingSafeEqual(expected, actual);
}

function sign(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function issueToken(secret) {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + SESSION_TTL_MS }),
  ).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

function readToken(token, secret) {
  if (typeof token !== 'string') return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(signature);
  // Compare lengths first: timingSafeEqual throws on a mismatch.
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof exp === 'number' && exp > Date.now() ? { exp } : null;
  } catch {
    return null;
  }
}

function rateLimited(ip) {
  const now = Date.now();
  const record = attempts.get(ip);
  if (!record || now > record.resetAt) return false;
  return record.count >= MAX_ATTEMPTS;
}

function recordFailure(ip) {
  const now = Date.now();
  const record = attempts.get(ip);
  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
  } else {
    record.count += 1;
  }
}

export function createAuth({ passwordHash, sessionSecret, secureCookies }) {
  const configured = Boolean(passwordHash && sessionSecret);

  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies,
    path: '/',
    maxAge: SESSION_TTL_MS,
  };

  return {
    configured,

    login(req, res) {
      if (!configured) {
        return res.status(503).json({
          ok: false,
          error: 'Admin is not configured. Set ADMIN_PASSWORD_HASH and SESSION_SECRET.',
        });
      }

      const ip = req.ip ?? 'unknown';
      if (rateLimited(ip)) {
        return res.status(429).json({ ok: false, error: 'Too many attempts. Try again later.' });
      }

      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      if (!password || !verifyPassword(password, passwordHash)) {
        recordFailure(ip);
        // Same message either way - never reveal whether a field was the problem.
        return res.status(401).json({ ok: false, error: 'Incorrect password.' });
      }

      attempts.delete(ip);
      res.cookie(SESSION_COOKIE, issueToken(sessionSecret), cookieOptions);
      return res.json({ ok: true });
    },

    logout(_req, res) {
      res.clearCookie(SESSION_COOKIE, { ...cookieOptions, maxAge: undefined });
      return res.json({ ok: true });
    },

    isAuthenticated(req) {
      if (!configured) return false;
      return Boolean(readToken(req.cookies?.[SESSION_COOKIE], sessionSecret));
    },

    /** Express middleware. Applied to every mutating admin route. */
    require(req, res, next) {
      if (!configured) {
        return res.status(503).json({ ok: false, error: 'Admin is not configured.' });
      }
      if (!readToken(req.cookies?.[SESSION_COOKIE], sessionSecret)) {
        return res.status(401).json({ ok: false, error: 'Not signed in.' });
      }
      return next();
    },
  };
}
