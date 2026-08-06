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

### Regeneration

Content will be edited at runtime through Puck (Phase 4). `POST /api/regenerate`
re-renders a single page to disk using the same SSR bundle the build uses, so a
regenerated page is identical to a freshly built one. No full rebuild, no
per-request rendering.

```bash
curl -X POST localhost:3000/api/regenerate -H 'content-type: application/json' -d '{"path":"/"}'
```

## Adding a page

Add an entry to `routes` in [src/routes.tsx](src/routes.tsx). That is all — it
gets built, prerendered, given a `<head>`, and listed in `sitemap.xml`.

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

Phase 0 (brand) and Phase 1 (render spine) are complete. Next: Phase 2 —
self-host Geist and JetBrains Mono, then build out the design system.
