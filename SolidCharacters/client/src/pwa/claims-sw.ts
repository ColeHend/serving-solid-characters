import {cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute} from 'workbox-precaching';
import {clientsClaim} from 'workbox-core';
import {NavigationRoute, registerRoute, setDefaultHandler} from 'workbox-routing';
import {NetworkFirst, StaleWhileRevalidate, CacheFirst} from 'workbox-strategies';
import {ExpirationPlugin} from 'workbox-expiration';
import {CacheableResponsePlugin} from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

// Build-time metadata injected via Vite/esbuild `define` (see vite.config.ts). The
// `typeof` guard keeps the SW from throwing if a define is missing in some build path.
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
declare const __SW_DEBUG__: boolean;

const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '';
const DEBUG = typeof __SW_DEBUG__ !== 'undefined' ? __SW_DEBUG__ : false;

// Quiet in production; keep error reporting always on.
const log = (...args: any[]) => { if (DEBUG) console.log('[sw]', ...args); };

log('script loaded, starting bootstrap');
self.addEventListener('error', (e: any) => {
  console.error('[sw] global error', e?.message, e?.filename, e?.lineno, e?.colno);
});
self.addEventListener('unhandledrejection', (e: any) => {
  console.error('[sw] unhandled rejection', e?.reason);
});

// Precache manifest (injected at build time). Falls back to a minimal list if empty
// (e.g. the dev SW, which has no manifest).
const manifestEntries = self.__WB_MANIFEST;
if (!manifestEntries || manifestEntries.length === 0) {
  console.warn('[sw] __WB_MANIFEST empty – falling back to minimal precache list');
}
precacheAndRoute(manifestEntries?.length ? manifestEntries : [
  {url: '/index.html', revision: APP_VERSION},
]);

cleanupOutdatedCaches();
clientsClaim();

// SPA navigation fallback (exclude API & file requests)
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), {
  denylist: [/^\/api\//, /\.[^/?]+$/],
}));

// Default handler (network first for anything not matched by a route below).
setDefaultHandler(new NetworkFirst({
  cacheName: 'default-network-first',
  networkTimeoutSeconds: 10,
  plugins: [
    new CacheableResponsePlugin({statuses: [200]}),
    new ExpirationPlugin({maxEntries: 50, maxAgeSeconds: 60 * 60}),
  ]
}));

// SRD reference data is immutable per ruleset version, so cache it long-lived.
// IndexedDB remains the app's primary store; this is the first-load + offline fallback.
// Scope tightly to the public reference endpoints — never cache user/auth responses.
const SRD_API = /^\/api\/(2014|2024|DndInfo)\//;
registerRoute(
  ({url}) => SRD_API.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'api-srd',
    plugins: [
      new CacheableResponsePlugin({statuses: [200]}),
      new ExpirationPlugin({maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60}),
    ],
  }),
  'GET'
);

// Images (CacheFirst with longer expiration)
registerRoute(
  ({request}) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({statuses: [200]}),
      new ExpirationPlugin({maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60}),
    ],
  }),
  'GET'
);

// Fonts (local, same-origin) – CacheFirst. The app bundles its own OTF fonts, so there
// is no cross-origin/Google-Fonts path to handle.
registerRoute(
  ({request}) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts',
    plugins: [
      new CacheableResponsePlugin({statuses: [200]}),
      new ExpirationPlugin({maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60}),
    ],
  }),
  'GET'
);

// Broadcast helper
function broadcast(type: string, data: any = {}) {
  self.clients.matchAll({includeUncontrolled: true}).then(clients => {
    for (const client of clients) {
      client.postMessage({type, ...data});
    }
  });
}

self.addEventListener('install', (event) => {
  log('install event');
  event.waitUntil(Promise.resolve());
});

self.addEventListener('activate', () => {
  log('activate event');
  broadcast('SW_ACTIVATED', {version: APP_VERSION, buildTime: BUILD_TIME});
});

// Prompt-to-update flow: the page asks us to activate only when the user clicks "Reload".
self.addEventListener('message', (event: any) => {
  if (!event?.data) return;
  const {type} = event.data;
  if (type === 'SKIP_WAITING') {
    log('skipping waiting per client request');
    self.skipWaiting();
  } else if (type === 'PING') {
    broadcast('PONG', {version: APP_VERSION});
  }
});

export {}; // ensure module scope
