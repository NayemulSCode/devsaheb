# Deploying devsaheb.com from GitHub, building on the server

For the setup in your cPanel: user `devsaheb`, Node 22.23.2, `devsaheb.com` as a
second Node app alongside `thaitemptation.restaurant`.

This mounts the app at the **domain root**, so Passenger serves everything.
That is simpler than the split design and removes the `.htaccess` step that had
to be repeated after every deploy — the app now canonicalises the host and sets
its own cache headers instead.

The cost: every page request goes through Node rather than Apache serving a
static file, and Passenger stops an idle app, so the first request after a quiet
period pays a cold start of a second or two. On a marketing site with modest
traffic that is an acceptable trade; if it ever stops being one, the split
design in [RELEASE.md](../RELEASE.md) is the fix.

---

## One thing to test first

I have been telling you not to build on the server. That was a general
assumption about shared hosting, not a measurement of yours — so test it before
committing to this workflow. It takes two minutes and the answer is unambiguous.

SSH in with PuTTY (`server703.web-hosting.com`, port 21098 on Namecheap, user
`devsaheb`), then:

```bash
cd ~
git clone https://github.com/NayemulSCode/devsaheb.git devsaheb-app
cd devsaheb-app
source /home/devsaheb/nodevenv/devsaheb-app/22/bin/activate   # after step 3 below
npm install
npm run build
```

- **It completes** → this workflow is right for you. Continue below.
- **"Killed", or a JavaScript heap error** → the build does not fit. Build
  locally and upload `release/app/` instead, as in [RELEASE.md](../RELEASE.md).
  Everything else here still applies.

Building needs devDependencies (vite, satori, resvg), so `npm install` — not
`--omit=dev`. That is about 171 MB and 6,700 files, which counts against any
inode quota.

---

## 1. DNS

At your registrar, both records:

| Type | Name | Value |
|---|---|---|
| A | `@` | `198.177.120.114` |
| A | `www` | `198.177.120.114` |

Start this first. Nothing below can be verified until it resolves, and it is the
slowest step.

## 2. Add the domain

cPanel → **Domains → Create A Domain**

- Domain: `devsaheb.com`
- Document root: `/home/devsaheb/devsaheb.com` — cPanel's own suggestion, and
  **keep it separate from the application root**
- Uncheck "share document root with primary domain"

The document root and the application root are different directories, and that
is deliberate. Step 3 writes a Passenger `.htaccess` into the *document* root;
if that were also the git repository, the file would sit there permanently
untracked and `scripts/deploy.sh` would refuse to deploy every time. Keeping
them apart leaves the repository clean.

The document root ends up empty apart from that `.htaccess`. That is correct —
Apache finds nothing to serve, so every request falls through to Passenger,
which is the whole point of a root mount.

### The addon subdomain

cPanel also creates `devsaheb.com.thaitemptation.restaurant`. That is how the
addon-domain mechanism works — the addon is implemented as a subdomain of the
account's primary domain, with the real domain attached as an alias. It is not
where the site lives, and it cannot be deleted without removing the addon
domain and taking the site down with it.

For visitors and for search it is a non-issue: `CANONICAL_HOST` 301s it to
`www.devsaheb.com`, path preserved.

The residue is **Certificate Transparency**. AutoSSL puts that hostname in the
certificate, every certificate is published to public append-only CT logs, and
so anyone searching crt.sh for `thaitemptation.restaurant` learns that a client
site and this company share hosting.

To close that: cPanel → SSL/TLS Status → **Exclude from AutoSSL** on
`devsaheb.com.thaitemptation.restaurant`. No certificate covers it, so it never
reaches a log. HTTPS on that hostname then warns, which does not matter —
nothing should visit it and it redirects regardless.

Two structural fixes exist if the coupling ever matters more than that.
Making `devsaheb.com` the account's primary domain reverses the direction, so
the artifact becomes `thaitemptation.restaurant.devsaheb.com` — a software firm
hosting a client, rather than the reverse. It needs a Namecheap support request
and it disturbs a live client site, so it is not worth doing for cosmetics.
Separate cPanel accounts are the only complete separation, and cost a second
plan.

**Confirm `www.devsaheb.com` appears in the domain list afterwards.** cPanel
normally adds it as an alias. It is not optional here — `www` is the canonical
host, so every request 301s to it. If it is missing, add it as an alias
(Domains → Create A Domain → `www.devsaheb.com`, same document root) before
going further, or the site redirects to a host nothing answers on.

## 3. Create the Node app

cPanel → **Setup Node.js App → CREATE APPLICATION**

| Field | Value |
|---|---|
| Node version | **22.23.2** |
| Application mode | production |
| Application root | `devsaheb-app` |
| Application URL | `devsaheb.com` |
| Application startup file | `app.js` |

cPanel creates `/home/devsaheb/devsaheb-app` and a virtualenv under
`~/nodevenv/devsaheb-app/22/`. It also prints an `source ...activate` command —
copy it, you need it every SSH session before `npm` works.

## 4. Clone the repository

cPanel just created the directory, so clone into it rather than over it:

```bash
cd ~/devsaheb-app
git init
git remote add origin https://github.com/NayemulSCode/devsaheb.git
git fetch origin
git checkout -f master
```

If the repository is private, create a deploy key instead:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/devsaheb_deploy -N ""
cat ~/.ssh/devsaheb_deploy.pub
```

Add that key to GitHub → repo → Settings → Deploy keys (read-only is enough),
then use `git@github.com:NayemulSCode/devsaheb.git` as the remote and add to
`~/.ssh/config`:

```
Host github.com
  IdentityFile ~/.ssh/devsaheb_deploy
```

## 5. Environment

Generate the credentials **on your own machine** — the plaintext password is
never stored anywhere:

```bash
node scripts/hash-password.mjs 'a long password you choose'
```

Then on the server create `~/devsaheb-app/.env`:

```
ADMIN_PASSWORD_HASH=scrypt$...
SESSION_SECRET=...
SECURE_COOKIES=1
CANONICAL_HOST=www.devsaheb.com
```

`CANONICAL_HOST` is what 301s the apex to www now that no `.htaccess` does it.
Leave it out and the site answers on both hosts while every canonical tag points
at one.

**`SECURE_COOKIES=1` before SSL exists will lock you out of `/admin`** — the
session cookie becomes HTTPS-only. Add that line after step 7, or accept that
you cannot sign in until then.

## 6. Install and build

```bash
cd ~/devsaheb-app
source /home/devsaheb/nodevenv/devsaheb-app/22/bin/activate
npm install
npm run build
chmod -R 755 content
```

The build gates on typecheck, content validity, broken links, missing OG cards
and bundle size. If it fails, it will say why and nothing is deployed.

## 7. SSL, then restart

cPanel → **SSL/TLS Status** → run AutoSSL for `devsaheb.com` and
`www.devsaheb.com`. Only works once DNS resolves.

Then cPanel → Domains → **Force HTTPS Redirect** on.

Restart from the Node.js panel, or:

```bash
mkdir -p ~/devsaheb-app/tmp && touch ~/devsaheb-app/tmp/restart.txt
```

Passenger watches that file's mtime.

---

## Verify

```bash
curl -sI https://www.devsaheb.com/
curl -s  https://www.devsaheb.com/api/health
curl -sI https://devsaheb.com/
curl -sI https://www.devsaheb.com/services/
```

| Check | Expected |
|---|---|
| `/` | `200`, `text/html` |
| `/api/health` | `{"ok":true,"node":"v22...","prerendered":true}` |
| apex | `301` → `https://www.devsaheb.com/` |
| `/services/` | `301` → `/services` |

Then sign in at `/admin`, publish an edit, and confirm it appears on the live
page. Finally paste a page URL into LinkedIn's post box — if the card renders,
the prerender architecture has done its job.

---

## Every deploy after that

```bash
cd ~/devsaheb-app
source /home/devsaheb/nodevenv/devsaheb-app/22/bin/activate
./scripts/deploy.sh
```

That pulls, installs, builds, and restarts. It also sets aside any content
edited through `/admin` before pulling and restores it afterwards, so the
server's copy wins — it is the one people actually used. If the same file
changed on both sides it stops and tells you, rather than picking silently.

**Content and git.** `content/` is tracked, and it is also written by the
running app. That works while edits are occasional. Once you are editing
regularly, the cleaner arrangement is to stop tracking `content/` and treat the
server as its only home — say the word and I will make that change. Either way,
`content/.versions/` on the server keeps the last 20 versions of every document.

---

## If something breaks

**`npm: command not found`** — you skipped the `source ...activate` line. It is
needed in every new SSH session.

**Build killed, or heap error** — the build does not fit in the memory this
plan allows. Build locally and upload instead.

**"Refusing to deploy: uncommitted changes outside content/"** with an
`.htaccess` listed — the document root was pointed at the application root, so
cPanel wrote its Passenger config inside the repository. Move the domain's
document root to `/home/devsaheb/devsaheb.com` (Domains → Manage) rather than
deleting the file; Passenger needs it where it is.

**`/api/health` returns HTML** — the app is not running. Check the Node.js panel
and the app's stderr log.

**"The API is not responding" in the admin** — same cause.

**"out-of-date build"** — the process is holding a bundle older than the code.
Restart the app.

**Uploaded images 404** — the `dist/client/media` symlink is missing. Restarting
recreates it on boot.

**A page shows "This page is being written"** — it is published with no content
file. `npm run build` now fails on that, so it should not reach production.
