/**
 * Generates a per-page Open Graph card.
 *
 * Every page sharing one default card wastes the most valuable real estate in
 * a shared link. These have to be real image files, not rendered in the
 * browser: LinkedIn, WhatsApp and Slack read raw HTML and never run JavaScript,
 * which is the same constraint that shaped the whole render architecture.
 *
 * satori + resvg rather than headless Chrome. No browser to install, runs the
 * same on a CI runner as on Windows, and is deterministic - the card for a
 * given title is byte-identical every build.
 *
 *   node scripts/og.mjs
 */

import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT_DIR = join(ROOT, 'dist', 'client');
const OUT_DIR = join(CLIENT_DIR, 'og');
const FONT_DIR = join(ROOT, 'assets', 'fonts');
const SERVER_ENTRY = join(ROOT, 'dist', 'server', 'entry-server.js');

const WIDTH = 1200;
const HEIGHT = 630;

const INK = '#0B1020';
const GOLD = '#CCAA50';
const BONE = '#F7F0E6';
const SILVER = '#929CA8';

/** Card filename for a route. "/" is home; nested paths flatten with dashes. */
export function ogFileName(routePath) {
  if (routePath === '/') return 'home.png';
  return `${routePath.replace(/^\/+/, '').replace(/\//g, '-')}.png`;
}

const el = (type, props, ...children) => ({
  type,
  props: { ...props, children: children.length === 0 ? undefined : children.length === 1 ? children[0] : children },
});

/**
 * The real mark, embedded as a data URI.
 *
 * satori and resvg both handle an inline SVG image, so the card carries the
 * actual logo - brackets, DS ligature, knockout and all - rather than an
 * approximation drawn from divs. Read from brand/ so it can never drift from
 * the generated asset.
 */
let markDataUri = null;

async function loadMark() {
  if (markDataUri) return markDataUri;
  const svg = await readFile(join(ROOT, 'brand', 'ds-mark.svg'), 'utf8');
  markDataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return markDataUri;
}

function mark(size = 74) {
  return el('img', { src: markDataUri, width: size, height: size });
}

function card({ title, kicker, footer }) {
  return el(
    'div',
    {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: INK,
        padding: '68px 80px',
        fontFamily: 'Geist',
      },
    },

    // Header: mark + wordmark, kicker on the right
    el(
      'div',
      { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      el(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 18 } },
        mark(74),
        el(
          'div',
          { style: { display: 'flex', flexDirection: 'column', lineHeight: 1 } },
          el('div', { style: { fontSize: 40, fontWeight: 900, color: BONE, letterSpacing: -1 } }, 'DEV'),
          el('div', { style: { fontSize: 30, fontWeight: 400, color: GOLD, letterSpacing: 4 } }, 'SAHEB'),
        ),
      ),
      el(
        'div',
        { style: { fontSize: 17, color: GOLD, letterSpacing: 3.5, textTransform: 'uppercase' } },
        kicker,
      ),
    ),

    // Title block
    el(
      'div',
      { style: { display: 'flex', flexDirection: 'column' } },
      el(
        'div',
        {
          style: {
            fontSize: title.length > 58 ? 56 : 70,
            fontWeight: 900,
            color: BONE,
            letterSpacing: -2.2,
            lineHeight: 1.06,
            display: 'flex',
          },
        },
        title,
      ),
      el('div', { style: { height: 1, background: 'rgba(204,170,80,0.3)', margin: '36px 0 24px' } }),
      el(
        'div',
        {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 18,
            color: SILVER,
            letterSpacing: 2,
            textTransform: 'uppercase',
          },
        },
        el('div', {}, 'devsaheb.com'),
        el('div', { style: { color: GOLD } }, footer),
      ),
    ),
  );
}

/** Section label for a route, used as the kicker. */
function kickerFor(routePath) {
  if (routePath === '/') return '<software engineering>';
  if (routePath.startsWith('/services/')) return '<service>';
  if (routePath.startsWith('/technologies/')) return '<technology>';
  if (routePath.startsWith('/company/')) return '<company>';
  return `<${routePath.replace(/^\//, '').split('/')[0]}>`;
}

async function writeAtomic(file, buffer) {
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await writeFile(tmp, buffer);
  await rename(tmp, file);
}

let fontsCache = null;

async function loadFonts() {
  if (fontsCache) return fontsCache;
  const [black, regular] = await Promise.all([
    readFile(join(FONT_DIR, 'Geist-Black.ttf')),
    readFile(join(FONT_DIR, 'Geist-Regular.ttf')),
  ]);
  fontsCache = [
    { name: 'Geist', data: black, weight: 900, style: 'normal' },
    { name: 'Geist', data: regular, weight: 400, style: 'normal' },
  ];
  return fontsCache;
}

/** Renders one route's card. Returns the file written, or null if skipped. */
export async function generateOgImage(route) {
  if (route.meta.noindex || route.skipPrerender) return null;

  const fonts = await loadFonts();
  await loadMark();

  const content = route.contentPath ? await readContent(route.contentPath) : null;
  const title = cardTitle(route, content);

  const svg = await satori(
    card({
      title,
      kicker: kickerFor(route.path),
      footer: 'Custom software · Cloud · Mobile · AI',
    }),
    { width: WIDTH, height: HEIGHT, fonts },
  );

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();

  const file = join(OUT_DIR, ogFileName(route.path));
  await writeAtomic(file, png);
  return file;
}

/**
 * Regenerates the card for one path after a content save.
 *
 * Without this the page would update and its social card would not, so an
 * edited headline would keep showing the old one in every share until the next
 * full build - the kind of drift nobody notices until a customer does.
 */
export async function generateOgImageForPath(routePath) {
  const { routes } = await import(pathToFileURL(SERVER_ENTRY).href);
  const route = routes.find((r) => r.path === routePath);
  return route ? generateOgImage(route) : null;
}

export async function generateOgImages() {
  const { routes } = await import(pathToFileURL(SERVER_ENTRY).href);
  const written = [];
  for (const route of routes) {
    const file = await generateOgImage(route);
    if (file) written.push(file);
  }
  return written;
}

/**
 * The headline for the card.
 *
 * meta.title is written for a search result - truncated, keyword-led. The card
 * is seen by a human deciding whether to click, so it should carry the page's
 * actual headline. Two content shapes carry one: taxonomy pages in `h1`, and
 * block pages in their Hero. Falling back to meta.title left the home card
 * frozen at the route title no matter what the hero said.
 */
function cardTitle(route, content) {
  if (!content) return route.meta.title;
  if (typeof content.h1 === 'string' && content.h1) return content.h1;

  const hero = Array.isArray(content.content)
    ? content.content.find((b) => b.type === 'Hero')
    : null;

  if (hero?.props?.title) {
    return [hero.props.title, hero.props.highlight].filter(Boolean).join(' ').trim();
  }

  return route.meta.title;
}

async function readContent(relPath) {
  try {
    const raw = await readFile(join(ROOT, 'content', `${relPath}.json`), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const files = await generateOgImages();
  for (const f of files) console.log(`  ${f.replace(CLIENT_DIR, 'dist/client')}`);
  console.log(`\ngenerated ${files.length} Open Graph card(s)`);
}
