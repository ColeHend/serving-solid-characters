import {cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute} from 'workbox-precaching';
import {clientsClaim} from 'workbox-core';
import {NavigationRoute, registerRoute, setDefaultHandler} from 'workbox-routing';
import {NetworkFirst, StaleWhileRevalidate, CacheFirst} from 'workbox-strategies';
import {ExpirationPlugin} from 'workbox-expiration';
import {CacheableResponsePlugin} from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

// Build-time metadata (can be replaced via define in Vite config)
const APP_VERSION = (self as any).APP_VERSION || (import.meta as any).env?.VITE_APP_VERSION || 'dev';
const BUILD_TIME = (self as any).BUILD_TIME || (import.meta as any).env?.VITE_BUILD_TIME || new Date().toISOString();

console.log('[sw] script loaded, starting bootstrap');
// Global error diagnostics
self.addEventListener('error', (e: any) => {
  console.error('[sw] global error', e?.message, e?.filename, e?.lineno, e?.colno);
});
self.addEventListener('unhandledrejection', (e: any) => {
  console.error('[sw] unhandled rejection', e?.reason);
});
// Precache manifest (fallback to minimal list if empty in dev)
const manifestEntries = self.__WB_MANIFEST;
if (!manifestEntries || manifestEntries.length === 0) {
  console.warn('[sw] __WB_MANIFEST empty – falling back to minimal precache list');
}
precacheAndRoute(manifestEntries?.length ? manifestEntries : [
  {url: '/index.html', revision: APP_VERSION},
]);

cleanupOutdatedCaches();
clientsClaim();

// SPA navigation fallback (exclude API & assets)
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), {
  denylist: [/^\/api\//, /\.[^/?]+$/],
}));

// Default handler (network first for resources not matched elsewhere)
setDefaultHandler(new NetworkFirst({
  cacheName: 'default-network-first',
  networkTimeoutSeconds: 10,
  plugins: [
    new CacheableResponsePlugin({statuses: [200]}),
    new ExpirationPlugin({maxEntries: 50, maxAgeSeconds: 60 * 60}),
  ]
}));

// API caching (stale-while-revalidate for SRD JSON, short expiration)
registerRoute(
  ({url}) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-srd',
    plugins: [
      new CacheableResponsePlugin({statuses: [200]}),
      new ExpirationPlugin({maxEntries: 60, maxAgeSeconds: 5 * 60}),
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

// Fonts (Google / local) – CacheFirst
registerRoute(
  ({request, url}) => request.destination === 'font' || /fonts.(gstatic|googleapis).com/.test(url.hostname),
  new CacheFirst({
    cacheName: 'fonts',
    plugins: [
      new CacheableResponsePlugin({statuses: [0, 200]}),
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
  console.log('[sw] install event');
  event.waitUntil(Promise.resolve());
});

self.addEventListener('activate', (evt) => {
  console.log('[sw] activate event; clientsClaim already called earlier');
  broadcast('SW_ACTIVATED', {version: APP_VERSION, buildTime: BUILD_TIME});
});

// Listen for skip waiting command from UI
self.addEventListener('message', (event: any) => {
  if (!event?.data) return;
  const {type} = event.data;
  if (type === 'SKIP_WAITING') {
    console.log('[sw] skipping waiting per client request');
    self.skipWaiting();
  } else if (type === 'PING') {
    broadcast('PONG', {version: APP_VERSION});
  }
});

export {}; // ensure module scope
