# DevSaheb

Marketing site for DevSaheb — https://www.devsaheb.com

Vite · React 19 · React Router 7 · Tailwind 4 · Express 5 · no database.

See [PLAN.md](PLAN.md) for the full build plan and [brand/README.md](brand/README.md)
for logo and asset usage.

## Quick start

```bash
npm install
npm run dev
```

Production build and local preview:

```bash
npm run preview
```

## How rendering works

**Public pages are static HTML files. Node is never in the request path for them.**

That is the whole architecture, and it is shaped by the deployment target —
a Node app on cPanel shared hosting, behind Phusion Passenger.

```
npm run build
  ├─ vite build                    → dist/client   (browser bundle + manifest)
  ├─ vite build --ssr              → dist/server   (render function)
  └─ node scripts/prerender.mjs    → dist/client/**/index.html
```

The prerender walks the route table in [src/routes.tsx](src/routes.tsx), renders
each route with `renderToString`, and writes a complete HTML document with a real
`<head>`. Apache serves those files; Passenger only ever sees `/api`.

An SPA would have been the default for this stack and would have failed the brief.
Social crawlers — LinkedIn, WhatsApp, Slack, Facebook — do not execute JavaScript.
They read raw HTML. In an SPA that is an empty `<div id="root">`, so every shared
link previews as a bare URL with no title, description, or image.

### Metadata is data, not JSX

React 19 can hoist `<title>` and `<meta>` into `<head>`, but only reliably when
React renders the entire document. We render a subtree into `#root`, so React
would emit those tags *inline in the body* — precisely where crawlers do not look.

So routes declare metadata as plain objects. The prerender writes it into a real
`<head>`; [HeadSync](src/components/HeadSync.tsx) applies the same resolved values
imperatively during client-side navigation. It renders `null` on first paint, so
it cannot cause a hydration mismatch. One source of truth, real tags for crawlers.

## Editing content

```bash
node scripts/hash-password.mjs "a long password"   # prints two .env lines, paste into .env
npm run build                                       # once, so the save schema exists
npm run dev                                         # then visit /admin
```

`npm run dev` mounts the real API inside the Vite dev server, so /admin works
without a second process. It reads `.env` directly. The one build is needed
because saves validate against the schema exported from the built SSR bundle.

The editor at `/admin` is behind a password and can edit **every content-backed
page** — pick one from the dropdown. Saving validates against the zod schema,
snapshots the previous version, then writes atomically and regenerates that
page's HTML through the same SSR bundle the build uses. No rebuild, no restart.

Two editors, because the content has two shapes:

| Shape | Where | Editor |
|---|---|---|
| Block list | `content/pages/*.json` | Puck canvas |
| Structured record | `content/taxonomy/**/*.json` | Form |

Taxonomy pages are deliberately not Puck documents. Their `faq` drives FAQPage
schema and `related` drives the internal link graph between the two taxonomies;
flattening them into a free-form block list would lose both, and that
structured data is most of why those pages are worth publishing.

The document list is derived from the route table in the built bundle, so a new
content-backed route becomes editable the moment it ships — there is no second
registry to keep in step. A path that no route renders is refused, which is
also what stops the admin writing outside the content tree.

**Puck never reaches the public bundle.** Public pages render through our own
registry in [src/components/blocks](src/components/blocks) rather than Puck's
`<Render>`, and the editor sits behind `React.lazy` in its own chunk. Imported
eagerly it would add ~84 kB gzipped to every marketing page.

### Why the content layer looks like this

There is no database, so three properties have to be enforced by hand:

| Property | Why |
|---|---|
| Atomic write (temp + rename) | A crash mid-write truncates the file and 500s the page it backs. |
| Snapshot before overwrite | Without a database this is the only undo that exists. Last 20 kept. |
| Per-file write lock | Two concurrent saves interleave and corrupt the file. |

Saves are validated against the schema exported from the **built SSR bundle**,
so the validator is always the one the renderer was compiled against. Block
components derive their props from that same schema
([blocks/types.ts](src/components/blocks/types.ts)) rather than restating them —
a schema change becomes a compile error rather than a field the renderer
silently ignores.

### Admin API

| Route | Auth | Does |
|---|---|---|
| `GET /api/admin/session` | — | Whether admin is configured and signed in |
| `POST /api/admin/login` | — | Password → session cookie. Rate limited, 5 per 15 min per IP |
| `POST /api/admin/logout` | — | Clears the cookie |
| `GET /api/admin/documents` | yes | Every editable page, derived from the route table |
| `GET /api/admin/content?path=` | yes | Current content plus version list |
| `PUT /api/admin/content?path=` | yes | Validate, snapshot, write, regenerate |
| `POST /api/admin/media` | yes | Upload. 5 MB cap, image types only |

Uploads live under `content/media` and are served from `/media`. SVG is
excluded from the allowlist deliberately: it is an XML document that can carry
script, and these files are served from our own origin.

## Social cards

Every indexable page gets its own 1200×630 card, generated at build time into
`dist/client/og/` and rebuilt for a single page when its content is saved.

These must be real image files. LinkedIn, WhatsApp and Slack read raw HTML and
never execute JavaScript — the same constraint that shaped the render
architecture. A card rendered in the browser would never be seen.

Built with **satori + resvg**, not headless Chrome: no browser to install, the
same output on a CI runner as on Windows, and deterministic for a given title.
satori needs TTF (not WOFF2), so `assets/fonts/` carries two Geist weights for
build use only — they are never served to a browser. Geist is SIL OFL; the
licence sits alongside them.

The card headline comes from the page's own `h1` (taxonomy pages) or its Hero
block (editable pages), falling back to `meta.title`. That is deliberate:
`meta.title` is written for a search result, but the card is seen by a human
deciding whether to click.

`npm run check:links` verifies every `og:image` resolves to a file on disk. A
missing card breaks nothing on the site — it just silently fails to appear when
someone shares the link, which is the worst kind of bug to ship.

## Audits

The home page publishes LCP < 2.0s, CLS < 0.05, WCAG 2.2 AA and a Lighthouse
floor as contractual commitments. These scripts are what make that true rather
than copy. Run against a live server (`npm start`):

```bash
npm run audit          # bundle, then accessibility, then performance
```

| Script | Gates on |
|---|---|
| `audit:bundle` | Entry ≤ 120 kB gzipped, and Puck/zod absent from it |
| `audit:a11y` | axe-core WCAG 2.2 AA on every page, reflow at 320/640px, skip link is the first tab stop |
| `audit:perf` | Lighthouse ≥ 95 in all four categories, LCP, CLS, TBT |

**Read the performance numbers with a caveat.** They run against localhost on
developer hardware. Lighthouse's desktop preset throttles CPU and network, but
real users will be slower. Treat them as a regression gate; field data comes
from CrUX once the site has traffic.

INP is not gated because it cannot be measured in a lab run — it needs real
interactions. Total Blocking Time is the accepted lab proxy and is gated at
200 ms in its place.

Both `check-links` and `audit-bundle` were verified by deliberately breaking
them: deleting an OG card, and importing Puck into a shared module. The bundle
check's original needle (`@measured/puck`) did not survive minification and
reported a clean result on a bundle that had genuinely leaked — it now matches
on identifiers that do.

## Adding a page

Add an entry to `routes` in [src/routes.tsx](src/routes.tsx). That is all — it
gets built, prerendered, given a `<head>`, and listed in `sitemap.xml`. Give it
a `contentPath` to make it editable in the admin.

## Deploying to cPanel

1. **Check the Node version first.** cPanel → Setup Node.js App → version
   dropdown. This project needs **Node 20+**. If the selector caps lower, stop
   here — the stack will not run.
2. **Build locally or in CI, never on the server.** `vite build` will exhaust
   shared-hosting memory limits.
3. Upload the repo, then `npm install --omit=dev` on the server.
4. Point the **domain's document root** at `dist/client`.
5. Copy [deploy/.htaccess](deploy/.htaccess) into that document root.
6. Create the Node app: application root = repo directory, **application URL =
   `/api`**, startup file = `app.js`. Passenger then handles only API traffic.
7. Confirm the app user can write to `content/` and `content/media/`.

### Why this shape

| Constraint | Consequence |
|---|---|
| Passenger buffers streamed responses | No streaming SSR. Prerender with `renderToString`. |
| Shared hosting caps memory | Never build on the server. |
| Low concurrency | No per-request rendering. Static files absorb all public traffic. |
| Persistent disk **is** available | JSON-on-disk content is safe here, unlike on serverless hosts. |

## Scripts

| Script | Does |
|---|---|
| `dev` | Vite dev server with the real API mounted (SPA mode, HMR). |
| `build` | Client build → SSR build → prerender → OG cards → link check. |
| `og` | Regenerate social cards from an existing build. |
| `check:links` | Fail on any broken internal link or missing og:image. |
| `verify` | `typecheck` then `build`. |
| `prerender` | Regenerate HTML from an existing build. |
| `start` | Express. API, regeneration, and static files for local preview. |
| `preview` | `build` then `start`. |
| `typecheck` | `tsc --noEmit`. |
| `audit` | Bundle, accessibility, and performance gates. Needs a running server. |

## Status

All planned phases are complete: brand, render spine, design system, marketing
pages, the content layer with the Puck admin, taxonomy detail pages, the SEO
layer, and the audit gates.

Outstanding before launch: real case studies and named engineers on the taxonomy
pages, real social profile URLs for `sameAs`, drafted legal pages, and the
cPanel Node version check in the deploy section above.
