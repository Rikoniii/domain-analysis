// Service Worker for Дом Лап PWA

const CACHE_NAME = 'domlap-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/animals.html',
  '/news.html',
  '/help.html',
  '/about.html',
  '/donate.html',
  '/css/style.css',
  '/js/main.js',
  '/js/animals.js',
  '/js/donate.js',
  '/js/news.js',
  '/js/help.js',
  '/js/about.js',
  '/manifest.json',
  '/images/logo.svg',
  '/images/hero-dog.svg',
  '/images/dog1.svg',
  '/images/cat1.svg',
  '/images/dog2.svg',
  '/images/shelter.svg',
  '/images/news1.svg',
  '/images/news2.svg',
  '/images/icon-192.svg',
  '/images/icon-512.svg'
];

// Install event
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});

// Activate event
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for donations
self.addEventListener('sync', function(event) {
  if (event.tag === 'donation-sync') {
    event.waitUntil(syncDonations());
  }
});

// Push notifications
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'Новое уведомление от Дом Лап',
    icon: '/images/icon-192.svg',
    badge: '/images/icon-192.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Посмотреть',
        icon: '/images/icon-192.svg'
      },
      {
        action: 'close',
        title: 'Закрыть',
        icon: '/images/icon-192.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Дом Лап', options)
  );
});

// Notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function for donation sync
function syncDonations() {
  // In real implementation, this would sync offline donations
  return Promise.resolve();
}
