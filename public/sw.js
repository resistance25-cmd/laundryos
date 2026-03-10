// public/sw.js
const CACHE_NAME = 'laundreos-v1'
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Navigation requests — network first, offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    )
    return
  }

  // API requests — network only, never cache
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request))
    return
  }

  // Static assets — cache first
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  )
})

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'LaundryOS'
  const options = {
    body: data.body || 'You have a new update',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      orderId: data.orderId || null
    },
    actions: data.actions || []
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Background sync (for offline order queuing future use)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(
      // Placeholder for future background sync logic
      Promise.resolve()
    )
  }
})
