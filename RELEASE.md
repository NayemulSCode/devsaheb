# Releasing devsaheb.com

Target: **https://www.devsaheb.com** on cPanel (`devsaheb@server703`, shared IP
`198.177.120.114`), as an addon domain beside `thaitemptation.restaurant`.

`www` is the canonical host. Every canonical tag, sitemap entry and `og:url`
points at it, and `deploy/.htaccess` 301s the apex to it. Changing that later
means re-issuing every one of those, so it is settled here.

---

## Before you start

Two things run in parallel and one of them is slow. **Start DNS first** — it can
take hours to propagate, and nothing else can be verified until it does.

### 1. DNS

At your registrar, point both hosts at the server:

| Type | Name | Value |
|---|---|---|
| A | `@` | `198.177.120.114` |
| A (or CNAME) | `www` | `198.177.120.114` (or `devsaheb.com`) |

Both are needed: `www` because it serves the site, the apex because it has to
resolve in order to redirect.

Check with `nslookup www.devsaheb.com` until it returns that IP.

### 2. Fill in what is still placeholder

These ship as-is if you forget, and they are visible on every page.

In [content/site.json](content/site.json):

- `contact.email` — currently `hello@devsaheb.com`
- `contact.careersEmail` — currently `careers@devsaheb.com`
- `registrationNumber` — currently `0000000`
- `social[].href` — all empty, so the "Follow us" block is hidden

The address and phone are real. Nothing else on the site invents a fact —
the Work, Team, CEO and legal pages say plainly that they are being written.

### 3. Prove the build is clean

```bash
npm run verify
npm run audit
```

`verify` gates on typecheck, content schema, broken links, missing OG cards and
the bundle budget. `audit` needs a running server (`npm start` in another
terminal) and gates on accessibility and Lighthouse.

---

## First deploy

### 4. Build the release

```bash
npm run release
```

Produces `release/` with three things:

| | |
|---|---|
| `app/` | Upload to the application root. Safe to overwrite every deploy. |
| `content/` | **First deploy only.** After launch this is live content edited through `/admin`. Re-uploading it destroys those edits, and there is no database to restore from. |
| `htaccess-append-to-docroot.txt` | Appended by hand in step 9. |

**Never build on the server.** `vite build` will exhaust shared-hosting memory.

### 5. Create the addon domain

cPanel → **Domains → Create A Domain**

- Domain: `devsaheb.com`
- Document root: `/home/devsaheb/devsaheb-app/dist/client`
- Uncheck "share document root with primary domain"

The document root sits *inside* the application root deliberately. That is what
keeps Node out of the request path for public pages.

### 6. Upload

```
/home/devsaheb/devsaheb-app/          ← contents of release/app/
/home/devsaheb/devsaheb-app/content/  ← contents of release/content/
```

File Manager or SFTP both work. Uploading a zip and extracting on the server is
faster than thousands of small files.

### 7. Install dependencies

In cPanel → Setup Node.js App → your app → **Run NPM Install**, or from the
app's terminal:

```bash
npm install --omit=dev
```

### 8. Create the Node app and `.env`

cPanel → **Setup Node.js App → Create Application**

| Field | Value |
|---|---|
| Node version | **22.23.2** |
| Application mode | production |
| Application root | `devsaheb-app` |
| Application URL | `devsaheb.com/api` |
| Startup file | `app.js` |

Then create `/home/devsaheb/devsaheb-app/.env`. Generate the credentials
**locally** and paste the output — the plaintext password is never stored:

```bash
node scripts/hash-password.mjs 'a long password you choose'
```

```
ADMIN_PASSWORD_HASH=scrypt$...
SESSION_SECRET=...
SECURE_COOKIES=1
```

Use a password you have not used elsewhere. The one from development is in your
chat history and should be considered public.

### 9. Append the `.htaccess`

Step 5 made cPanel write a Passenger block into
`/home/devsaheb/devsaheb-app/dist/client/.htaccess`. Open that file and **append**
the contents of `release/htaccess-append-to-docroot.txt` **below** it.

Do not replace the file. Do not touch the Passenger lines. Without them `/api`
stops routing and the admin dies, while public pages keep working — so it fails
quietly.

### 10. Permissions

The app user must be able to write to content:

```bash
chmod -R 755 /home/devsaheb/devsaheb-app/content
```

### 11. SSL

cPanel → **SSL/TLS Status** → run AutoSSL for `devsaheb.com` and
`www.devsaheb.com`. It only succeeds once DNS resolves.

**Order matters.** `SECURE_COOKIES=1` means the session cookie is only sent over
HTTPS, so you cannot sign in to `/admin` until the certificate is live. If you
need to get in before then, leave that line out and add it immediately after.

Then cPanel → Domains → toggle **Force HTTPS Redirect** for the domain. Use the
toggle rather than adding a rule to `.htaccess`, or you get two redirects
fighting.

### 12. Restart

Restart the app from the Node.js panel. It recreates the `dist/client/media`
symlink on boot, which is how uploaded images become reachable.

---

## Verify

```bash
curl -sI https://www.devsaheb.com/
curl -s  https://www.devsaheb.com/api/health
curl -sI https://devsaheb.com/
curl -sI https://www.devsaheb.com/services/
curl -s  https://www.devsaheb.com/robots.txt
```

| Check | Expected |
|---|---|
| `/` | `200`, `text/html` |
| `/api/health` | `{"ok":true,"node":"v22...","prerendered":true}` |
| apex | `301` → `https://www.devsaheb.com/` |
| `/services/` | `301` → `/services` |
| `robots.txt` | lists the sitemap |

If `/api/health` returns HTML instead of JSON, step 9 is the cause — the
Passenger block is missing or sits below our rules.

Then open `https://www.devsaheb.com/admin`, sign in, edit a page, publish, and
confirm the change appears on the live page.

Finally, paste a page URL into LinkedIn's post box. If the card renders with the
title and image, the whole prerender-and-OG argument has paid off.

---

## Redeploying

```bash
npm run release
```

Upload **`app/` only**. Never `content/` — that is live content now.

Then, every time:

1. **Re-append the `.htaccess`.** `dist/` is rebuilt from scratch, so the
   document root's `.htaccess` is deleted with it, taking cPanel's Passenger
   block with it.
2. Restart the Node app.

If a deploy needs new dependencies, run NPM Install again first.

---

## If something breaks

**Public pages fine, `/admin` and `/api` dead** — the `.htaccess` Passenger
block is missing. Step 9.

**Admin says "The API is not responding"** — same cause, or the app is stopped.

**Admin says "out-of-date build"** — the server is holding a bundle older than
the code. Restart the app.

**Uploaded images 404** — the `dist/client/media` symlink is missing. Restart
the app; it recreates it on boot.

**Content edit lost** — check `content/.versions/`. The last 20 versions of
every document are kept there.

---

## After launch

- **Google Search Console** — add `www.devsaheb.com`, submit
  `https://www.devsaheb.com/sitemap.xml`
- **Google Business Profile** — the `PostalAddress` in the Organization schema
  and a GBP listing reinforce each other for local queries
- **Analytics** — Plausible or Umami rather than GA4: lighter, and no cookie
  banner required
- **Real profile URLs** in `site.json`, which also fills `sameAs` in the schema

The four published service and technology pages still need a real case study
and named engineers to clear the substance bar in
[docs/keyword-map.md](docs/keyword-map.md). Publish the rest in tiers as that
content exists — not all at once.
