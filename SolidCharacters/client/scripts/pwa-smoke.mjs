#!/usr/bin/env node
/**
 * PWA smoke test script
 * 1. Builds the client (assumes run from client folder)
 * 2. Verifies service worker file exists
 * 3. Parses claims-sw.js for precache usage
 * 4. Lists cache names after a lightweight Workbox-window simulation (skipped – no browser)
 * Exits non-zero on failure.
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

function log(msg){ console.log(`[pwa-smoke] ${msg}`); }

try {
  const root = process.cwd();
  const dist = path.join(root, 'dist');
  log('Building project...');
  execSync('npm run build', {stdio: 'inherit'});

  const swPath = path.join(dist, 'claims-sw.js');
  if(!existsSync(swPath)) {
    console.error('Service worker file not found at dist/claims-sw.js');
    process.exit(1);
  }
  log('Service worker present');

  const swContent = readFileSync(swPath,'utf-8');
  if(!/precacheAndRoute\(/.test(swContent)) {
    console.error('precacheAndRoute call not found in service worker');
    process.exit(2);
  }
  log('precacheAndRoute detected');

  if(!/SW_ACTIVATED/.test(swContent)) {
    console.error('Expected broadcast message type SW_ACTIVATED missing');
    process.exit(3);
  }
  log('SW_ACTIVATED broadcast logic present');

  // Basic manifest presence check
  const htmlPath = path.join(dist,'index.html');
  if(!existsSync(htmlPath)) {
    console.error('index.html missing in dist');
    process.exit(4);
  }
  log('index.html present');

  log('PWA smoke test PASS');
  process.exit(0);
} catch (err) {
  console.error('[pwa-smoke] Failure:', err.message);
  process.exit(10);
}
