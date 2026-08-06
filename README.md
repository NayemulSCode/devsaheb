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
node scripts/hash-password.mjs "a long password"   # prints two .env lines
npm run build && npm start                          # then visit /admin
```

Content lives in `content/pages/*.json`. The editor at `/admin` is Puck, behind
a password. Saving does three things in order: validate against the zod schema,
snapshot the previous version, then write atomically and regenerate that page's
HTML through the same SSR bundle the build uses. No rebuild, no restart.

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
| `GET /api/admin/pages/:slug` | yes | Current content plus version list |
| `PUT /api/admin/pages/:slug` | yes | Validate, snapshot, write, regenerate |
| `POST /api/admin/media` | yes | Upload. 5 MB cap, image types only |

Uploads live under `content/media` and are served from `/media`. SVG is
excluded from the allowlist deliberately: it is an XML document that can carry
script, and these files are served from our own origin.

## Adding a page

Add an entry to `routes` in [src/routes.tsx](src/routes.tsx). That is all — it
gets built, prerendered, given a `<head>`, and listed in `sitemap.xml`. Give it
a `contentSlug` to make it editable in the admin.

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
| `dev` | Vite dev server (SPA mode, HMR). |
| `build` | Client build → SSR build → prerender. |
| `prerender` | Regenerate HTML from an existing build. |
| `start` | Express. API, regeneration, and static files for local preview. |
| `preview` | `build` then `start`. |
| `typecheck` | `tsc --noEmit`. |

## Status

Phases 0-4 are complete: brand, render spine, design system, marketing pages,
and the content layer with the Puck admin. Next: Phase 3b - the service and
technology detail pages, behind a keyword map and shipped in tiers.
