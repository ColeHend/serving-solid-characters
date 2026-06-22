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
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const log = (msg) => console.log(`[pwa-smoke] ${msg}`);
const fail = (msg, code) => { console.error(`[pwa-smoke] FAIL: ${msg}`); process.exit(code); };

// Tunables — keep in sync with vite.config.ts injectManifest.maximumFileSizeToCacheInBytes.
const MIN_PRECACHE_ENTRIES = 20;
const MAX_PRECACHE_BYTES = 10 * 1024 * 1024; // ~4MB expected; trips if the heavy images creep back in.
// Workbox silently DROPS any globbed asset larger than this from the precache (it only warns). So a
// shell asset that grows past the cap would vanish from offline with no error. This guard re-asserts
// it: a precachable-extension file over the cap that isn't in the manifest fails the build.
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const PRECACHE_EXT = /\.(?:js|css|html|woff2?|otf|png|jpe?g|svg|webp|pdf|json|ico|webmanifest)$/i;
// Intentionally excluded from precache (vite.config.ts globIgnores) — runtime-cached instead.
const PRECACHE_IGNORE = [/(^|\/)tessdata\//, /\.map$/];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

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

  // Guard: no precachable-extension asset over the size cap should be missing from the precache
  // (Workbox drops these silently). Excludes the intentionally runtime-cached tessdata/ + maps.
  const precacheSet = new Set(unique);
  const skipped = [];
  for (const f of walk(dist)) {
    const rel = path.relative(dist, f).split(path.sep).join('/');
    if (!PRECACHE_EXT.test(rel) || PRECACHE_IGNORE.some((re) => re.test(rel))) continue;
    if (statSync(f).size > MAX_FILE_BYTES && !precacheSet.has(rel)) {
      skipped.push(`${rel} (${(statSync(f).size / 1048576).toFixed(2)}MB)`);
    }
  }
  if (skipped.length) {
    fail(`over-cap asset(s) silently dropped from precache (raise the cap or runtime-cache them): ${skipped.join(', ')}`, 11);
  }
  log('No over-cap assets silently dropped from precache');

  log('PWA smoke test PASS');
  process.exit(0);
} catch (err) {
  fail(err?.message ?? String(err), 10);
}
