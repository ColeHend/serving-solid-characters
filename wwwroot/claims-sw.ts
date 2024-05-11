import { PrecacheEntry, PrecacheRouteOptions, cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare let self: ServiceWorkerGlobalScope

// self.__WB_MANIFEST is default injection point
const manualRoutes = ['/index.html', '/index.css', '/index.js','/claims-sw.ts', '/index.jsx', '/index.tsx', ]
const autoRoutes = self.__WB_MANIFEST;
precacheAndRoute(!!autoRoutes.length ? autoRoutes : manualRoutes);

// clean old assets
cleanupOutdatedCaches()

let allowlist: undefined | RegExp[]
console.log("import.meta.env.DEV: ", import.meta.env.DEV);

if (import.meta.env.DEV)
  allowlist = [/^\/$/]

// to allow work offline
registerRoute(new NavigationRoute(
  createHandlerBoundToURL('index.html'),
  { allowlist },
))

self.skipWaiting()
clientsClaim()