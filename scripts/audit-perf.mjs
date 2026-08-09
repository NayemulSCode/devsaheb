/**
 * Lighthouse run asserted against the budget the site publishes.
 *
 * The home page states LCP < 2.0s, CLS < 0.05 and a Lighthouse floor as
 * contractual. Something has to enforce that or it is just copy.
 *
 * Chrome is launched here rather than by chrome-launcher: its teardown deletes
 * a temp profile directory and fails with EPERM on Windows, which crashes the
 * run after the audits have already succeeded. Owning the browser lifecycle
 * sidesteps that entirely.
 *
 *   node scripts/audit-perf.mjs
 *
 * A caveat worth remembering when reading the output: this runs against
 * localhost on developer hardware. Lighthouse's desktop preset throttles CPU
 * and network, but real users on real connections will be slower. Treat these
 * as a regression gate, not as field data - that comes from CrUX once the site
 * has traffic.
 */

import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';

const BASE = process.env.AUDIT_BASE ?? `http://localhost:${process.env.PORT ?? 3000}`;

const URLS = ['/', '/services', '/services/custom-software', '/contact'];

/** The numbers published on the site, plus the category floors from the plan. */
const BUDGET = {
  'categories:performance': { min: 0.95 },
  'categories:accessibility': { min: 0.95 },
  'categories:best-practices': { min: 0.95 },
  'categories:seo': { min: 0.95 },
  'largest-contentful-paint': { max: 2000, unit: 'ms' },
  'cumulative-layout-shift': { max: 0.05, unit: '' },
  // INP cannot be measured in a lab run - it needs real interactions. Total
  // Blocking Time is the accepted lab proxy, so that is what gets gated.
  'total-blocking-time': { max: 200, unit: 'ms' },
};

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => existsSync(p));

function collect(lhr) {
  const out = {};
  for (const key of Object.keys(BUDGET)) {
    if (key.startsWith('categories:')) {
      const id = key.slice('categories:'.length);
      out[key] = lhr.categories[id]?.score ?? 0;
    } else {
      out[key] = lhr.audits[key]?.numericValue ?? 0;
    }
  }
  return out;
}

function fmt(key, value) {
  if (key.startsWith('categories:')) return Math.round(value * 100).toString();
  if (BUDGET[key].unit === 'ms') return `${Math.round(value)} ms`;
  return value.toFixed(3);
}

async function main() {
  if (!CHROME) {
    console.error('No Chrome or Edge found.');
    process.exit(1);
  }

  const profile = mkdtempSync(join(tmpdir(), 'ds-lh-'));
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    userDataDir: profile,
    args: ['--no-sandbox', '--disable-gpu', '--remote-debugging-port=9222'],
  });

  const port = Number(new URL(browser.wsEndpoint()).port);
  const failures = [];

  try {
    for (const path of URLS) {
      const url = BASE + path;
      const runnerResult = await lighthouse(
        url,
        { port, output: 'json', logLevel: 'error' },
        desktopConfig,
      );

      const lhr = runnerResult.lhr;
      const metrics = collect(lhr);

      console.log(`\n${path}`);
      for (const [key, budget] of Object.entries(BUDGET)) {
        const value = metrics[key];
        const ok = 'min' in budget ? value >= budget.min : value <= budget.max;
        const limit = 'min' in budget ? `>= ${budget.min * 100}` : `<= ${budget.max}`;
        console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${key.padEnd(28)} ${fmt(key, value).padStart(9)}   (${limit})`);
        if (!ok) failures.push({ path, key, value: fmt(key, value), limit });
      }
    }
  } finally {
    await browser.close();
    // Chrome can hold the profile briefly after close; a failure to clean up a
    // temp directory must not fail the audit.
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    } catch {
      /* ignore */
    }
  }

  if (failures.length) {
    console.error(`\n${failures.length} budget violation(s):`);
    for (const f of failures) console.error(`  ${f.path} — ${f.key} = ${f.value} (needs ${f.limit})`);
    process.exit(1);
  }

  console.log('\nall budgets met\n');
}

await main();
