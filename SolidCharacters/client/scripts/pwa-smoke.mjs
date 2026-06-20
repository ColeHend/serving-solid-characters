#!/usr/bin/env node
/**
 * PWA smoke test
 *  1. Builds the client (anchored to this script's own location, so cwd doesn't matter).
 *  2. Verifies the production service worker exists and broadcasts SW_ACTIVATED.
 *  3. Parses the INJECTED precache manifest from the built SW and asserts:
 *       - a sane number of entries (so an empty/failed __WB_MANIFEST injection fails the build),
 *       - key assets are precached (index.html, a hashed JS chunk, the web manifest),
 *       - the total precache footprint stays under a budget (so an image/asset re-bloat fails).
 * Exits non-zero on any failure.
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const log = (msg) => console.log(`[pwa-smoke] ${msg}`);
const fail = (msg, code) => { console.error(`[pwa-smoke] FAIL: ${msg}`); process.exit(code); };

// Tunables — keep in sync with vite.config.ts injectManifest.maximumFileSizeToCacheInBytes.
const MIN_PRECACHE_ENTRIES = 20;
const MAX_PRECACHE_BYTES = 10 * 1024 * 1024; // ~4MB expected; trips if the heavy images creep back in.

try {
  // Anchor to the client root (parent of scripts/), regardless of where this is invoked from.
  const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const dist = path.join(clientRoot, 'dist');

  log('Building project...');
  execSync('npm run build', { stdio: 'inherit', cwd: clientRoot });

  const swPath = path.join(dist, 'claims-sw.js');
  if (!existsSync(swPath)) fail('service worker not found at dist/claims-sw.js', 1);
  log('Service worker present');

  const sw = readFileSync(swPath, 'utf-8');
  if (!/precacheAndRoute\(/.test(sw)) fail('precacheAndRoute call not found in service worker', 2);
  if (!/SW_ACTIVATED/.test(sw)) fail('SW_ACTIVATED broadcast missing', 3);
  log('precacheAndRoute + SW_ACTIVATED present');

  // Extract the injected precache URLs ("url":"...") from the built SW.
  const urls = [...sw.matchAll(/"url"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
  const unique = [...new Set(urls)];
  if (unique.length < MIN_PRECACHE_ENTRIES) {
    fail(`only ${unique.length} precache entries (< ${MIN_PRECACHE_ENTRIES}) — __WB_MANIFEST injection likely failed`, 5);
  }
  log(`Precache manifest has ${unique.length} entries`);

  // Key assets must be precached for the offline shell to work.
  const hasIndex = unique.some((u) => /(^|\/)index\.html$/.test(u));
  const hasJsChunk = unique.some((u) => /assets\/.*\.js$/.test(u));
  const hasManifest = unique.some((u) => /manifest\.webmanifest$/.test(u));
  if (!hasIndex) fail('index.html not in precache manifest', 6);
  if (!hasJsChunk) fail('no hashed JS chunk in precache manifest', 7);
  if (!hasManifest) fail('manifest.webmanifest not in precache manifest', 8);
  log('Key assets (index.html, JS chunk, web manifest) precached');

  // Sum the precache footprint from the real emitted files.
  let total = 0;
  let missing = 0;
  for (const u of unique) {
    const f = path.join(dist, u);
    if (existsSync(f)) total += statSync(f).size;
    else missing++;
  }
  const mb = (total / 1048576).toFixed(2);
  if (missing) log(`(note: ${missing} precached URLs had no matching dist file — likely external/virtual)`);
  if (total > MAX_PRECACHE_BYTES) {
    fail(`precache footprint ${mb}MB exceeds budget ${(MAX_PRECACHE_BYTES / 1048576).toFixed(0)}MB`, 9);
  }
  log(`Precache footprint ${mb}MB (budget ${(MAX_PRECACHE_BYTES / 1048576).toFixed(0)}MB)`);

  if (!existsSync(path.join(dist, 'index.html'))) fail('index.html missing in dist', 4);

  log('PWA smoke test PASS');
  process.exit(0);
} catch (err) {
  fail(err?.message ?? String(err), 10);
}
