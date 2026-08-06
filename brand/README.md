# DevSaheb — brand assets

Every SVG here is generated from one geometry definition in `build-brand.ps1`.
**Do not hand-edit the SVGs.** Change the geometry in the script and re-run:

```bash
powershell -ExecutionPolicy Bypass -File build-brand.ps1
```

Raster assets are a second, separate step (needs Chrome or Edge):

```bash
powershell -ExecutionPolicy Bypass -File build-icons.ps1
```

## Files

| File | Use |
|---|---|
| `ds-mark.svg` | Primary mark. Gold, works on ink or bone. |
| `ds-mark-current.svg` | Inline embedding — inherits CSS `color`. |
| `ds-mark-ink.svg` | One-colour ink. Light grounds, print. |
| `ds-mark-bone.svg` | One-colour bone. Dark grounds. |
| `ds-lockup-h.svg` | Horizontal lockup for light grounds. **Default for the site header.** |
| `ds-lockup-h-dark.svg` | Horizontal lockup for dark grounds. |
| `ds-lockup-h-ink.svg` | Horizontal lockup, one colour. Print, stamps, fax-grade reproduction. |
| `ds-lockup-stacked.svg` | Stacked lockup, light grounds. Square-ish placements. |
| `ds-lockup-stacked-dark.svg` | Stacked lockup, dark grounds. |
| `favicon.svg` | Browser tab. Ink tile + gold mark, letters dropped. |
| `favicon-bare.svg` | Transparent-ground variant. Needs a dark backdrop. |
| `og-default.html` | Open Graph card template, 1200×630. |
| `raster/` | Generated PNGs, `favicon.ico`, `og-default.png`, `site.webmanifest`. |
| `_proof.html`, `_icon.html` | Proof sheet and icon render harness. Not shipped. |

## The wordmark

`DEV` is Geist Black at −2% tracking; `SAHEB` is Geist Medium at +6%. Each line
was normalised so its **ink** width — not its advance width — is exactly 300
units, which is what makes the two lines lock into a justified block. DEV's cap
height lands at 1.64× SAHEB's, matching the original colour plate.

The outlines are **baked into `build-brand.ps1` as static path data**. Rebuilding
needs no font file and no font tooling. Geist is SIL OFL; the outlines are
derived from v1.7.2.

Because the wordmark is outlined, it renders identically everywhere. Never
substitute a live `<text>` element for it — that renders in whatever font the
viewing machine happens to have, which is not a logo.

## Construction

Canvas is `120 × 120`. Diamond vertices inset to 9 / 111 so the r6.5 node dots
stay inside the viewBox.

- **D** — filled path. Stem `x42–49` (7 wide). Outer bowl is an elliptical arc
  `rx11 ry17` spanning `y44–78`; the counter is `rx5 ry10` spanning `y51–71`,
  cut with `fill-rule="evenodd"`.
- **S** — stroked path at weight 7, matching the D stem. Built from two tangent
  circles, `C1 (69,54) r7` and `C2 (69,68) r7`, meeting exactly at `(69,61)`.
  Endpoints sit at −40° on C1 and 140° on C2.
- **Interlock** — a mask strokes the S path at width 12 in black, carving a
  2.5-unit gap out of the D where the S crosses. This works on any background,
  unlike a background-coloured knockout stroke.
- Brackets and letters sit in a group scaled to `0.94` about centre, which is
  what gives the composition air inside the diamond.

Everything is arcs, lines and circles — no hand-tuned béziers — so the geometry
is reproducible and can be re-derived rather than traced.

### Inlining more than one instance

`ds-mark-current.svg` carries a mask with a fixed id. If you inline it more than
once on a page, **rename the mask id per instance** — duplicate ids collide and
the knockout misapplies to the wrong element.

## Colour rules

| Token | Hex |
|---|---|
| Ink | `#0B1020` |
| Gold | `#CCAA50` |
| Gold deep | `#7A5F1E` |
| Silver | `#929CA8` |
| Bone | `#F7F0E6` |

Gold on ink measures **9.22:1** and is the primary pairing. Gold on bone measures
**1.81:1** and fails every WCAG threshold — the mark is still fine there because
a logo is not body text, but **never set gold type on bone**. Use `--gold-deep`
(5.33:1) for that.

## Clear space and minimum size

- **Clear space** — one node-dot diameter (13 units at native scale, ≈11% of the
  mark's width) on all four sides. Nothing crosses it.
- **Minimum size, full mark** — 40px. It holds to 28px; below that the counter
  in the D closes up and the interlock turns to mud.
- **Below 40px** — use `favicon.svg`, which drops the letters entirely.

## Don't

- Don't recolour outside the tokens above.
- Don't rotate the diamond to a square — the 45° orientation *is* the mark.
- Don't add effects. No shadows, bevels, gradients, or outlines.
- Don't stretch. Scale uniformly.
- Don't place the gold mark on a mid-tone background; it needs ink or bone.
- Don't reconstruct it from the original PNGs in `../images/` — those are opaque
  raster mockups with a painted-on checkerboard, not usable assets.

## Wiring it up

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="/icon-180.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#0B1020">
```

Ship `favicon.svg` first — modern browsers prefer it and it stays crisp at every
density. `favicon.ico` is the legacy fallback and packs 16/32/48 as PNG-in-ICO.

## Still outstanding

- **`og-default.html` headline uses a system font.** Once Geist is self-hosted
  in Phase 2, point the template's `@font-face` at the local file and re-run
  `build-icons.ps1`. Until then the card ships with a fallback face.
- **Per-page OG cards** — Phase 5 generates these from the same composition.
