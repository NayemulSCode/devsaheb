/**
 * Accessibility audit across every prerendered page.
 *
 * The site publishes "WCAG 2.2 AA" as a contractual standard on its own home
 * page. That claim has to be enforced by something, or it is marketing.
 *
 * Runs axe-core against the built pages, and also checks two things axe cannot:
 * that the page does not scroll sideways at 320px, and that it does not at 200%
 * zoom - WCAG 1.4.10 Reflow, which is the failure most sites actually have.
 *
 *   node scripts/audit-a11y.mjs
 *
 * Requires a server on PORT (default 3000). Exits non-zero on any violation.
 */

import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

// axe-core's source is injected directly rather than via @axe-core/puppeteer.
// That wrapper calls require.resolve from a file:// URL, so a project path
// containing a space arrives percent-encoded and resolution fails.
const AXE_SOURCE = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', 'axe-core', 'axe.min.js'),
  'utf8',
);

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT_DIR = join(ROOT, 'dist', 'client');
const BASE = process.env.AUDIT_BASE ?? `http://localhost:${process.env.PORT ?? 3000}`;

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => existsSync(p));

/** WCAG 2.2 AA. axe tags map directly onto the conformance levels. */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

function routePaths() {
  const paths = [];
  (function walk(dir, prefix) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name === 'assets' || entry.name === 'og' || entry.name === '.vite') continue;
        walk(join(dir, entry.name), `${prefix}/${entry.name}`);
      } else if (entry.name === 'index.html') {
        paths.push(prefix === '' ? '/' : prefix);
      }
    }
  })(CLIENT_DIR, '');
  return paths.sort();
}

async function main() {
  if (!CHROME) {
    console.error('No Chrome or Edge found. Set one up or skip with SKIP_A11Y=1.');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const paths = routePaths();
  const failures = [];
  let checked = 0;

  for (const path of paths) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle0', timeout: 30000 });

      await page.evaluate(AXE_SOURCE);
      const results = await page.evaluate(
        async (tags) => window.axe.run(document, { runOnly: { type: 'tag', values: tags } }),
        TAGS,
      );

      for (const v of results.violations) {
        failures.push({
          path,
          kind: 'axe',
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.slice(0, 3).map((n) => n.html.slice(0, 110)),
        });
      }

      // WCAG 1.4.10 Reflow: no horizontal scrolling at 320 CSS px, which is
      // also what 400% zoom on a 1280px viewport reduces to.
      for (const width of [320, 640]) {
        await page.setViewport({ width, height: 900 });
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        if (overflow > 1) {
          failures.push({
            path,
            kind: 'reflow',
            id: `horizontal-scroll-${width}`,
            impact: 'serious',
            help: `Page scrolls sideways by ${overflow}px at ${width}px wide (WCAG 1.4.10)`,
            nodes: [],
          });
        }
      }

      checked += 1;
    } finally {
      await page.close();
    }
  }

  // Keyboard entry point. The layout is shared, so once is enough.
  const kb = await browser.newPage();
  await kb.setViewport({ width: 1280, height: 900 });
  await kb.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await kb.keyboard.press('Tab');

  const skip = await kb.evaluate(() => {
    const el = document.activeElement;
    if (!el) return { focused: null };
    const r = el.getBoundingClientRect();
    return {
      focused: el.tagName.toLowerCase(),
      href: el.getAttribute('href'),
      text: (el.textContent ?? '').trim(),
      // sr-only elements collapse to ~1px; a working skip link expands on focus.
      visibleOnFocus: r.width > 40 && r.height > 10,
    };
  });
  await kb.close();

  if (skip.href !== '#main') {
    failures.push({
      path: '/',
      kind: 'keyboard',
      id: 'skip-link-first',
      impact: 'serious',
      help: `First tab stop should be the skip link, got ${skip.focused} "${skip.text}"`,
      nodes: [],
    });
  } else if (!skip.visibleOnFocus) {
    failures.push({
      path: '/',
      kind: 'keyboard',
      id: 'skip-link-visible',
      impact: 'serious',
      help: 'Skip link does not become visible when focused',
      nodes: [],
    });
  }

  await browser.close();

  console.log(`\naccessibility audit: ${checked} page(s), tags ${TAGS.join(' ')}`);
  console.log(`keyboard: first tab stop is "${skip.text}" (${skip.href})`);

  if (failures.length === 0) {
    console.log('no violations\n');
    return;
  }

  // Group by rule: one broken component usually fails on every page, and a
  // per-page list buries that.
  const byRule = new Map();
  for (const f of failures) {
    const key = `${f.id}`;
    if (!byRule.has(key)) byRule.set(key, { ...f, paths: new Set() });
    byRule.get(key).paths.add(f.path);
  }

  console.error(`\n${byRule.size} distinct violation(s):\n`);
  for (const v of byRule.values()) {
    console.error(`  [${v.impact}] ${v.id} — ${v.help}`);
    console.error(`      on ${v.paths.size} page(s): ${[...v.paths].slice(0, 5).join(', ')}`);
    for (const n of v.nodes) console.error(`      ${n}`);
    console.error('');
  }
  process.exit(1);
}

await main();
