import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

declare let self: ServiceWorkerGlobalScope

// Handle service worker update events
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING')
    self.skipWaiting()
})

// self.__WB_MANIFEST is default injection point
precacheAndRoute(self.__WB_MANIFEST)

// Clean old assets
cleanupOutdatedCaches()

// Cache strategies for different asset types
// Cache static assets with CacheFirst strategy
registerRoute(
  ({ request }) => request.destination === 'style' || 
                  request.destination === 'script' || 
                  request.destination === 'font',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
)

// Cache images with CacheFirst strategy but allow for more entries and longer expiration
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 24 * 60 * 60 // 60 days
      })
    ]
  })
)

// Network-first for API calls that aren't in /api/ (which are excluded from service worker)
registerRoute(
  ({ url }) => url.pathname.startsWith('/data/'),
  new NetworkFirst({
    cacheName: 'api-responses',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 10 * 60 // 10 minutes
      })
    ]
  })
)

// Use StaleWhileRevalidate for any other resources
registerRoute(
  // Match all other requests
  ({ request, url }) => 
    !url.pathname.startsWith('/api/') && 
    request.destination !== 'document',
  new StaleWhileRevalidate({
    cacheName: 'other-resources',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
      })
    ]
  })
)

// Fallback to index.html for navigation requests
registerRoute(
  new NavigationRoute(
    createHandlerBoundToURL('index.html'),
    {
      // Use a general allowlist instead of the default which can be too restrictive
      allowlist: [/^\//],
      // Explicitly define denylist for assets that shouldn't trigger the index.html response
      denylist: [
        /^\/api\//
      ]
    }
  )
)