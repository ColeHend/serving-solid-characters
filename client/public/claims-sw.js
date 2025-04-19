import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { NavigationRoute, registerRoute, setDefaultHandler } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

// declare let self: ServiceWorkerGlobalScope

// self.__WB_MANIFEST is default injection point
const manualRoutes = ['/index.html', '/index.css', '/index.js','/claims-sw.ts', '/index.jsx', '/index.tsx']
const autoRoutes = self.__WB_MANIFEST
precacheAndRoute(autoRoutes.length ? autoRoutes : manualRoutes)

// clean old assets
cleanupOutdatedCaches()

// to allow work offline
registerRoute(new NavigationRoute(
  createHandlerBoundToURL('index.html'),
))

// Add a default fallback handler
setDefaultHandler(new NetworkFirst())

self.skipWaiting()
clientsClaim()

// Add event listener for the install event
self.addEventListener('install', (event) => {
  console.log('Service worker installed')
})

// Add event listener for the activate event
self.addEventListener('activate', (event) => {
  console.log('Service worker activated')
})