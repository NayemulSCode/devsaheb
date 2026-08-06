# DEVSAHEB — Portfolio Website Plan

**Domain:** https://www.devsaheb.com
**Stack:** Vite 8 + React 19 + React Router 7 + Tailwind 4 + Express 5 + Puck + Tiptap + Framer Motion + Zustand
**Content:** JSON on disk (no database)
**Scope:** Full site — Home, Services, Work, About, Blog, Contact

---

## 0. Two findings from your existing assets

**The logo PNGs are unusable as-is.** Both `devsaheb_logo.png` and `devsaheb_logo_1.png` are 2048×2048, ~5 MB, and **fully opaque** — I sampled a 22×22 grid across each and every pixel has `alpha = 255`. The "transparency checkerboard" is painted into the image as literal grey squares (`#CBCBCB`). Dropping either on a navy header renders a grey checkerboard box.

**The hex codes on the color plate are garbled.** It prints `#De05a6e` (7 chars), `#F06e2d` (an orange, next to a gold swatch), and `RGB 803.0.0` — none of which are valid or match the swatches shown. I sampled the actual pixels instead. Everything below uses the sampled values.

---

## 1. Brand foundation

### Sampled palette

| Token | Hex | Source | Role |
|---|---|---|---|
| `--ink` | `#0B1020` | swatch 1 `#0C1124`, band `#101324` | Primary canvas, dark sections |
| `--ink-raised` | `#141A2E` | derived | Cards on ink, elevated surfaces |
| `--gold` | `#CCAA50` | swatch 2 | Accent — **dark backgrounds only** |
| `--gold-deep` | `#7A5F1E` | derived | Gold text on light backgrounds |
| `--silver` | `#929CA8` | swatch 3 | Body text on ink, muted UI |
| `--bone` | `#F7F0E6` | swatch 4 | Light section canvas |
| `--bone-raised` | `#FAF7F2` | sampled card bg | Cards on bone |

This is a navy/gold/cream palette — it reads as *craft and precision*, not as another purple-gradient SaaS site. That's a genuine advantage and the whole design should lean into it rather than dilute it.

### Contrast — computed, WCAG 2.1 relative luminance

| Pair | Ratio | Verdict |
|---|---|---|
| `--gold` on `--ink` | **9.22 : 1** | Passes AAA |
| `--silver` on `--ink` | **6.80 : 1** | Passes AA body text |
| **`--gold` on `--bone`** | **1.81 : 1** | **Fails everything** |
| `--gold-deep` on `--bone` | **5.33 : 1** | Passes AA body text |

**Hard rule:** gold is never text on a light background. On bone sections gold is decorative only — hairlines, rules, fills sitting behind dark text, icon strokes. For gold-toned *text* on light, use `--gold-deep`. Getting this wrong is the single most likely way this site ends up looking amateur, because 1.81:1 gold-on-cream looks fine to the designer who picked it and is illegible to everyone else.

Treat gold as gold leaf: scarce. Roughly one gold element per viewport. If everything is gold, nothing is.

### Typography

- **Display:** Space Grotesk — geometric, slightly technical, closest match to the heavy grotesque in your wordmark.
- **Body:** Inter — neutral, excellent at small sizes.
- **Mono:** JetBrains Mono — carries the `< >` motif into eyebrows, labels, and metrics.

Self-host all three via `@fontsource-variable/*`. No Google Fonts CDN — it adds a third-party connection, hurts LCP, and is a GDPR liability for EU visitors. Preload the display font only.

Type scale (1.250 major third, 8pt grid): 12 / 14 / 16 / 18 / 20 / 25 / 31 / 39 / 49 / 61 px.

### Brand motif

The logo gives you two ownable shapes: the **`< >` brackets** and the **node dots** at the diamond's four vertices. Carry them through the UI so the site feels designed rather than assembled:

- Mono eyebrows rendered as `<services>` above section headings
- Node-dot ticks at card corners
- Bracket marks that close in around links on hover
- A hairline diamond as the section divider

---

## 2. The critical architecture decision: SSR, not SPA

Your stack's default mode is a client-rendered SPA. **That is the weakest possible configuration for the "SEO friendly" goal**, for one reason that has no workaround:

**Social crawlers do not execute JavaScript.** LinkedIn, Facebook, WhatsApp, Slack, and X fetch raw HTML and read the `<meta>` tags in it. In an SPA the raw HTML is an empty `<div id="root">`, so every link anyone shares to devsaheb.com renders as a bare URL with no title, no description, no image. For a B2B dev agency where LinkedIn is the primary distribution channel, that alone is disqualifying.

Secondary costs: Googlebot renders JS but on a deferred second-pass queue, so indexing is slower and less reliable; Bing and DuckDuckGo are weaker at it still; and LCP suffers because the browser must download, parse, and execute JS before any content paints.

**The fix, entirely within your stack.** Express already sits in your dependencies with a `start:prod` script — the setup was clearly headed this way.

### Shaped for cPanel shared hosting

The deployment target is a Node app on cPanel shared hosting, which runs under
Phusion Passenger behind Apache or LiteSpeed. That changes the right answer.

**The good news closes a risk:** cPanel gives you a real persistent filesystem,
so the JSON-on-disk content model is safe. Content written by Puck survives
restarts and deploys. The ephemeral-disk problem that rules out Vercel does not
apply here.

**The constraint:** Passenger, capped memory, no root, and low concurrency make
server-side rendering *on every request* the wrong shape. A cold Passenger start
plus a per-request React render on shared hardware is exactly where response
times fall apart.

**So: prerender at build time, regenerate on write.**

1. `vite build` produces a client bundle and an SSR bundle.
2. A prerender step walks every route and writes real `.html` files to disk.
3. Apache serves those files directly — **Node is not in the request path** for
   any public page.
4. The Node app handles only `/admin` and the save API.
5. When Puck saves, the app rewrites the affected `.html` files.

You get static-file speed and perfect crawlability on hardware that could not
sustain per-request SSR, and you keep runtime editability. This is strictly
better than the SSR-plus-cache design for this host.

| Routes | Strategy |
|---|---|
| All marketing, service, technology, case study, blog routes | Prerendered `.html` on disk, served by Apache. Rewritten when Puck saves. |
| `/admin` (Puck + Tiptap), `/api/*` | Node app via Passenger. `noindex`, auth-gated. |

**Consequences to build around:**

- **No streaming.** Passenger buffers responses, so `renderToPipeableStream`
  buys nothing. Use `renderToString` in the prerender step — the output is a
  file, so streaming is irrelevant anyway.
- **Never build on the server.** `vite build` will exhaust shared-hosting memory.
  Build locally or in CI and upload `dist/` plus the prerendered HTML.
- **`.htaccess` routing** sends `/admin` and `/api` to the Node app and
  everything else to static files, with a fallback for unmatched routes.
- **Node version is the gating unknown.** cPanel's "Setup Node.js App" selector
  is often capped well below current. Vite 8, React 19, and TypeScript 6 need
  Node 20+. **Check this before any other work** — if the host tops out at 18,
  either the host or the stack versions have to change.

**Metadata:** React 19 hoists `<title>`, `<meta>`, and `<link>` to `<head>` natively from anywhere in the tree, and it works under SSR. Drop `react-helmet-async` — it's on `2.0.5` upstream and effectively unmaintained, and React 19 covers everything this site needs. One `<Seo>` component per route.

**Puck renders server-side** via its `<Render config data />` component in the SSR entry. (`@measured/puck/rsc` is the React Server Components path — that's Next-specific and not what we're using.) The `<Puck>` *editor* is client-only and stays in the admin chunk.

---

## 3. Content layer (JSON on disk)

```
/content
  site.json            nav, footer, contact, socials, SEO defaults
  pages/*.json         Puck page data
  projects/*.json      case studies
  posts/*.json         blog posts
  /media               uploads (multer)
  /.versions           timestamped snapshots on every write
```

Three things this needs to not lose your content:

1. **Atomic writes** — write to `file.tmp`, then `fs.rename()`. A crash mid-write otherwise truncates the file and 500s the page.
2. **Snapshot on write** — copy the previous version into `.versions/` before overwriting. This is your undo, and without a database it's the only one you get.
3. **Schema validation** — add `zod` and parse on read *and* write. A malformed Puck save should be rejected at the API boundary, not discovered as a white screen in production.

Add a single write lock (in-process mutex) — concurrent saves to the same JSON file will interleave and corrupt it.

---

## 4. Information architecture

### Primary navigation

| Item | Type | Contents |
|---|---|---|
| **Services** | Mega-menu | 20 service pages, grouped in 4 columns |
| **Technologies** | Mega-menu | 25 technology pages, grouped in 4 columns |
| **Work** | Link | Case study index |
| **Company** | Dropdown | About Us · Our Team · Our CEO · Partnership |
| **Careers** | Link | On-domain job listings |
| **Contact** | Gold CTA button | — |

Normalizations applied to the source structure: Careers and Contact appeared both as top-level items *and* inside the Company dropdown — duplicated nav entries split click signal and make the dropdown look padded, so they live at top level only. Partnership sat under `/services/partnership` while being a company-level concern; it moves to `/company/partnership`.

**Careers stays on-domain.** The reference site sends careers to an external HRM subdomain, which forfeits the whole SEO value: on-domain job posts carry `JobPosting` structured data and become eligible for the Google Jobs results panel. Link out to the external ATS only from the individual apply button.

### Route map

```
/                                    Home
/services                            Hub — all 20, grouped
/services/[slug]                     × 20
/technologies                        Hub — all 25, grouped
/technologies/[slug]                 × 25
/work                                Case study index (filter by industry / service / tech)
/work/[slug]                         Individual case study
/company/about                       About Us
/company/team                        Our Team
/company/ceo                         Our CEO
/company/partnership                 Partnership
/careers                             Job listings  (JobPosting schema)
/careers/[slug]                      Individual role
/blog                                Article index
/blog/[slug]                         Article
/contact                             Form + direct contact
/privacy, /terms
/admin                               Puck + Tiptap  (noindex, auth)
```

### Mega-menu grouping

Twenty alphabetical links in one column is a wall. Group by how buyers actually think:

**Services**

| Build | Platforms | Data & AI | Cloud & Operations |
|---|---|---|---|
| Custom Software | SaaS | AI Development | Cloud Application |
| Web Development | Ecommerce | Machine Learning | DevOps |
| Mobile App | CMS | Database | QA |
| iOS | CRM | | Legacy Modernization |
| Android | ERP | | Digital Transformation |
| Front End | | | |
| Back End | | | |

**Technologies**

| Frontend | Backend | Mobile | Cloud & AI |
|---|---|---|---|
| JavaScript | Node.js | Flutter | AWS |
| TypeScript | Python | React Native | Azure |
| React.js | Django | Kotlin | Google Cloud |
| Next.js | PHP | | Docker |
| Vue.js | Laravel | | AI |
| Angular | Java | | |
| Webflow | Spring Boot | | |
| | Golang | | |
| | C# | | |
| | .NET | | |

### Slug corrections

Four slugs in the source list are broken and would be permanent SEO damage if copied:

| Source | Problem | Use instead |
|---|---|---|
| `/technologies/c` | "C#" stripped to `c` — reads as the C language | `/technologies/csharp` |
| `/technologies/net` | ".NET" stripped to `net` — meaningless token | `/technologies/dotnet` |
| `/technologies/google-clouds` | Typo, plural | `/technologies/google-cloud` |
| `/technologies/angular-js` | **AngularJS is the 1.x line, EOL since January 2022.** Advertising it signals a decade-stale stack | `/technologies/angular` |

### Mega-menu implementation requirements

- Links must render as real `<a href>` in the **SSR HTML**, not injected on hover. This is how link equity reaches all 45 pages — a JS-only menu strands them.
- Triggers are `<button aria-expanded>`, not hover-only divs. Hover opens on desktop with a ~150ms intent delay so diagonal mouse travel doesn't flicker the panel shut.
- `Escape` closes and returns focus to the trigger; arrow keys move within the panel.
- Mobile: accordion, never hover.
- Panels are menus, not modals — no focus trap, but focus order must follow visual order.

### The 45-page decision — read this before committing

20 services + 25 technologies is **45 templated pages**. This is a programmatic-SEO play, and it cuts both ways.

**The upside is real.** Each page targets genuine commercial intent — "hire flutter developers", "laravel development company bangladesh". Individually low volume, collectively substantial, and the buyer searching a specific technology is far closer to purchase than one searching "software company".

**The downside is also real, and it is not a small one.** Google's own doorway-page guidance names *"multiple pages targeting variations of a keyword"* as a violation, and the helpful-content systems assess quality **sitewide**. Forty-five pages that are one template with a noun swapped is the textbook definition. If they get classified that way, the penalty is not confined to those pages — it drags the domain, including the home and case study pages you care most about.

The reference site is doing this. That it exists is not evidence that it's working.

**What separates the two outcomes is unique substance per page.** Minimum bar before any page ships:

- 600–900 words genuinely written for that topic, not spun from a master template
- At least one real case study or code example specific to *that* service or technology
- A unique 3–5 question FAQ block → `FAQPage` schema
- Named engineers who actually work in it
- An honest "when we'd recommend something else" section — a strong trust signal and effectively impossible to template

**Sequence it in tiers. Do not ship 45 at launch.**

| Tier | Count | When | Selection |
|---|---|---|---|
| 1 | ~8 | Launch | What you actually sell and have case studies for |
| 2 | ~12 | +30–60 days | Next by commercial priority |
| 3 | ~25 | As real content exists | Remainder — no deadline |

Eight excellent pages outrank forty-five thin ones, and the tiering is the brand argument too: a company whose entire positioning is *"we focus on perfection"* cannot launch with 45 template pages. The site would contradict its own headline.

**Before writing a word, build a keyword map** assigning one primary query per page. `/services/back-end`, `/services/custom-software`, and `/technologies/nodejs` will cannibalize each other by default — three pages competing for the same query means Google picks one and it's rarely the one you wanted.

**Cross-link the two hubs.** `/services/mobile-app` → Flutter, React Native, Kotlin; `/technologies/aws` → Cloud Application, DevOps. This builds a dense internal link graph that genuinely helps both users and crawlers, and it's the main structural payoff of having both taxonomies.

### Footer

Following the reference screenshot's structure. Asymmetric two-part layout — a wide contact block on the left, three link columns on the right.

```
┌──────────────────────────────────┬───────────┬───────────┬───────────┐
│  [DS] DEVSAHEB                   │ Company   │ Services  │ Resources │
│                                  │           │           │           │
│  ◇  Street, Area,                │ About Us  │ Tier-1    │ Blog      │
│     City, Bangladesh             │ Our Team  │ services  │ Case      │
│  ✉  hello@devsaheb.com           │ Our CEO   │ (6–8)     │ Studies   │
│  ☎  +880 ...                     │ Partner-  │           │ Open      │
│                                  │ ship      │ All       │ Source    │
│  ── Follow us                    │ Careers   │ services→ │ Techno-   │
│  in  gh  x  fb  ig  yt           │ Contact   │           │ logies →  │
│                                  │           │           │           │
│                    [BASIS]  [Google ★ 5.0 · N reviews]               │
├──────────────────────────────────────────────────────────────────────┤
│  © 2026 DevSaheb · Reg. No. ...            Privacy · Terms           │
└──────────────────────────────────────────────────────────────────────┘
```

**What to take from the reference:**

- **The 4-service footer.** Their footer lists four services and omits Technologies entirely, despite having 20 and 25 respectively in the nav. That's the correct instinct and it's the pattern to copy — sitewide links to all 45 pages flatten the internal link graph so nothing is signalled as important, and dense keyword-link footers are a recognised spam pattern. Link tier-1 plus the two hubs.
- **Trust badges.** BASIS membership and a Google review rating, bottom-right. This is the strongest credibility signal in the whole footer for the Bangladesh market, and it's cheap. Get BASIS membership listed if you have it, plus Google Business Profile rating and Clutch if applicable.
- **"Open Source Projects" as a footer link.** For a firm claiming perfection, public code is the most falsifiable proof available. Worth adopting.

**What to change:**

- **Background is `--ink` (`#0B1020`), not pure black.** Their `#000000` is flat; the navy carries the brand and is easier on the eye. Top border: a single gold hairline at 20% opacity.
- **Social icons need accessible names.** Bare SVGs announce as nothing to a screen reader. Each gets `aria-label`. Silver at rest, gold on hover, `:focus-visible` ring — six unlabelled icons is a common and very visible a11y failure.
- **Footer labels must match nav labels exactly.** Theirs don't — the footer says "Software Development" and "Staff Augmentation", neither of which appears in their services nav. Mismatched anchor text for the same destination confuses users and dilutes the anchor-text signal.
- **Real semantic markup.** Address in an `<address>` element, phone as `tel:`, email as `mailto:`, badges as `<img>` with explicit `width`/`height` so they don't shift layout on load.

**One caution on the review badge:** display it freely as an image and link, but do **not** emit `AggregateRating` JSON-LD on your own `Organization`. Google disallows self-serving review markup for rich results, and it's a manual-action risk for zero upside — the badge already does the persuasion work visually.

**Two observations, not recommendations:**

- Their footer has an **Industries** section — a third taxonomy (fintech, healthcare, logistics…). It's a legitimate SEO surface and pairs well with case studies, but it's a further content commitment on top of 45 pages. Flagging it, not proposing it.
- **Staff Augmentation** appears in their footer but not in the 20-service list you sent. It's a common high-margin agency offering. Add it if you sell it.

Bottom bar: logo mark, `© 2026 DevSaheb`, company registration number, Privacy · Terms.

---

## 5. Homepage — section by section

The brief is *"users get the vibe that we focus on perfection."* Perfection is not communicated by saying "we are perfectionists." It's communicated by **specificity** — showing standards concrete enough that only someone who actually meets them would publish them.

1. **Hero** — ink canvas. Mono bracket eyebrow, one sharp headline, one gold primary CTA + one ghost CTA. Background: a slow constellation of node-dots echoing the logo's vertices (canvas, pauses off-screen, disabled under `prefers-reduced-motion`). No stock illustration, no 3D blob.
   Headline should assert craft over speed — e.g. *"Software built to a standard, not a deadline."*
2. **Trust strip** — client logos, silver monochrome, no borders.
3. **Proof bar** — 3–4 hard numbers. Projects shipped, years, uptime, average Lighthouse score. Numbers outperform adjectives.
4. **Services** — 4 category cards (Build · Platforms · Data & AI · Cloud & Operations) with node-dot corner ticks and a gold hairline on hover, each listing its tier-1 services and linking to the hub. Four considered categories read as a firm that has thought about its offering; twenty raw links read as a firm that will take any job.
5. **Selected work** — 3 case studies, large imagery, **each card carrying its result metric** ("cut checkout time 41%"). Since you have real projects, this is the most persuasive block on the site — give it the most room.
6. **Process** — 5 steps: Discover → Architect → Build → Harden → Ship & Support. Name what actually happens at each: code review on every PR, CI gates, test coverage floor, accessibility audit, performance budget.
7. **Engineering standards** — the block almost no agency publishes, and therefore the most credible one. Your definition of done, stated as commitments: Lighthouse ≥ 95, WCAG 2.2 AA, typed end to end, CI green before merge, TTFB < 200ms.
8. **Testimonials** — real quotes with name, role, company, photo. One real testimonial beats six invented ones, and invented ones are obvious.
9. **CTA band** — ink, gold hairline, single action.
10. **Footer** — full sitemap, contact, LinkedIn/GitHub, logo mark.

### Case study template

Problem → Constraints → Approach → Architecture → Result (with numbers) → Stack → Testimonial. Consistent across all of them. Consistency *is* the perfection signal.

---

## 6. Motion rules (Framer Motion)

The line between "premium" and "cheap" is almost entirely restraint:

- Entrance animations only, fired once on scroll-in. Nothing loops.
- Travel ≤ 16px, duration 300–500ms, ease `cubic-bezier(0.16, 1, 0.3, 1)`.
- Stagger children 40–60ms.
- `transform` and `opacity` only — never animate layout properties.
- Global `<MotionConfig reducedMotion="user">` plus `useReducedMotion()` on the canvas background.
- No parallax on mobile.

---

## 7. SEO plan

**Technical**
- SSR HTML containing real content in the initial response
- React 19 native metadata per route; canonical on every page, self-referencing
- `/sitemap.xml` generated from the content JSON; `/robots.txt`
- JSON-LD: `Organization` (logo + sameAs), `WebSite`, `BreadcrumbList`, `Service` on service pages, `Article` on posts, `CreativeWork` on case studies
- **Per-page OG images** generated at build with `satori` + `resvg` from a branded template. Non-negotiable — crawlers can't run JS, so these must exist as real files.
- Trailing-slash normalization + 301s in Express; `compression` on; immutable cache headers on hashed assets
- Images: AVIF/WebP via `sharp`, explicit `width`/`height` on every `<img>` to hold CLS at zero, lazy below the fold, `fetchpriority="high"` on the LCP image

**On-page**
- One `<h1>` per page, no skipped heading levels
- Service pages written against real search intent, not internal jargon
- Case studies cross-linked to relevant service pages

**Local** — Google Business Profile, `Organization` schema with address, consistent NAP across directories.

**Budget, enforced in CI via Lighthouse CI:** LCP < 2.0s · INP < 200ms · CLS < 0.05 · Lighthouse ≥ 95 across all four categories.

---

## 8. Performance

**The biggest risk in this stack is bundle leakage.** Tiptap pulls ProseMirror (~150 KB+ gzipped) and Puck's editor is substantial. If either is imported from a module the marketing routes touch, every visitor downloads your CMS to read the homepage.

Mitigation: `/admin` behind `React.lazy()` at the route boundary, editor packages imported *only* from inside that subtree, and a `rollup-plugin-visualizer` check in CI that fails the build if the marketing entry exceeds **120 KB gzipped**.

---

## 9. Build phases

| Phase | Work |
|---|---|
| **0 — Foundations** | Scaffold repo. **Redraw the logo as SVG** (mark, horizontal lock-up, stacked lock-up, mono variants). Favicon set, `site.webmanifest`, OG template. |
| **1 — SSR spine** | Vite SSR + Express, streaming render, routing, HTML cache + invalidation, 404/500 pages. Prove a `curl` returns full HTML before anything else is built. |
| **2 — Design system** | Tailwind 4 `@theme` tokens from §1, type scale, spacing, Button/Card/Section/Container/Eyebrow primitives, motion presets. |
| **3 — Marketing pages** | Home, Work + case studies, Company (About/Team/CEO/Partnership), Careers, Contact, legal. Services and Technologies **hub** pages. Mega-menu + footer. |
| **3b — Taxonomy pages** | Keyword map first. Then tier-1 service and technology pages (~8) written to the substance bar in §4. Tiers 2–3 post-launch. |
| **4 — Content + admin** | JSON layer with atomic writes, snapshots, zod schemas. Puck config mapping every section component. Tiptap for post bodies. Auth on `/admin`. Media uploads. |
| **5 — SEO layer** | Metadata components, sitemap, robots, JSON-LD, OG image generation. |
| **6 — Hardening** | Lighthouse CI, axe pass, keyboard-nav audit, focus-visible states, 200%-zoom check, cross-browser. |
| **7 — Deploy** | Node host + nginx + PM2, TLS, `www` canonical redirect, Search Console, analytics. |

---

## 10. Risks and blockers

| # | Risk | Action |
|---|---|---|
| 1 | **Node 16.16.0 is what's on your PATH.** Vite 8, React 19, and TypeScript 6 all need Node 20+. | Install Node 22 LTS before Phase 0. Pin with `.nvmrc` + `engines`. |
| 2 | **Logo PNGs are opaque and unusable.** | Redraw as SVG in Phase 0. Blocks header, favicon, and OG images. |
| 3 | ~~File-based content requires a persistent disk~~ — **closed.** cPanel shared hosting has a real persistent filesystem, so the JSON content model is safe. | Confirm the app user has write permission on `/content` and `/content/media`. |
| 3b | **cPanel's Node version may be too old.** Vite 8, React 19, and TS 6 need Node 20+; the cPanel selector is frequently capped lower. | Check cPanel → Setup Node.js App → version dropdown **first**. Blocks everything. |
| 3c | Shared-hosting memory limits kill `vite build` | Build locally or in CI; upload `dist/` and prerendered HTML. Never build on the server. |
| 3d | Passenger buffers streamed responses | Prerender with `renderToString`; no streaming SSR in the request path. |
| 4 | Gold-on-cream fails contrast at 1.81:1 | `--gold-deep` token, enforced in the design system, not left to per-component judgement. |
| 5 | Editor bundles leaking into public routes | Route-level lazy loading + a CI bundle-size gate. |
| 6 | Concurrent JSON writes corrupting content | Atomic rename + write lock + versioned snapshots. |
| 7 | Case studies stall waiting on client approval | Start permission requests during Phase 0 — this is the usual reason agency sites sit unlaunched. |
| 8 | **45 thin taxonomy pages triggering doorway-page / helpful-content classification.** Penalty is sitewide, not page-level. | Tier the rollout (§4). Hard substance bar per page. No page ships without unique content. |
| 9 | Keyword cannibalization across `/services` and `/technologies` | Keyword map assigning one primary query per page, built before any page is written. |
| 10 | `AggregateRating` markup on own Organization | Display the review badge visually only — no self-serving review JSON-LD. |

---

## 11. Open items

- Client permission for named case studies + logo usage
- Real testimonials with attribution
- Team photos — consistent treatment, shot against a single background
- Company registration details, address, contact numbers for schema and footer
- Analytics choice (Plausible or Umami recommended over GA4 — no cookie banner needed, far lighter)
- **Tier-1 selection** — which 8 of the 45 service/technology pages launch first
- **Trust badges** — BASIS membership status, Google Business Profile, Clutch profile
- Social accounts to link (LinkedIn and GitHub matter most for B2B; drop any you won't maintain — a dead feed is worse than no link)
- Whether an **Industries** taxonomy is in scope
- Whether **Staff Augmentation** should join the services list
