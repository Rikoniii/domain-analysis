// Service Worker for Дом Лап PWA

// Версия кэша - увеличиваем при изменении для очистки старого кэша
const CACHE_NAME = 'domlap-v2.1.0';
// НЕ кэшируем CSS и JS файлы - они всегда загружаются свежими
// Кэшируем только статические ресурсы (изображения, манифест)
const urlsToCache = [
  '/',
  '/frontend/manifest.json',
  '/frontend/images/logo.svg',
  '/frontend/images/hero-dog.svg',
  '/frontend/images/dog1.svg',
  '/frontend/images/cat1.svg',
  '/frontend/images/dog2.svg',
  '/frontend/images/shelter.svg',
  '/frontend/images/news1.svg',
  '/frontend/images/news2.svg',
  '/frontend/images/icon-192.svg',
  '/frontend/images/icon-512.svg'
];

// Событие установки
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Событие получения
self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);
  
  // Пропускаем кэширование для chrome-extension и других неподдерживаемых схем
  if (requestUrl.protocol === 'chrome-extension:' || 
      requestUrl.protocol === 'chrome:' ||
      requestUrl.protocol === 'moz-extension:') {
    return; // Не обрабатываем эти запросы
  }
  
  // Пропускаем все запросы к API - они должны идти напрямую к серверу
  // Проверяем по порту (localhost:5000) или по пути (/api/)
  var isApiRequest = requestUrl.port === '5000' || 
                     (requestUrl.hostname === 'localhost' && requestUrl.port === '5000') ||
                     requestUrl.pathname.startsWith('/api/') ||
                     (requestUrl.hostname.includes('localhost') && requestUrl.pathname.includes('/api/'));
  
  // Пропускаем POST, PUT, DELETE запросы (обычно это API запросы)
  var isNonGetRequest = event.request.method !== 'GET' && event.request.method !== 'HEAD';
  
  if (isApiRequest || isNonGetRequest) {
    // Для API запросов - пропускаем напрямую к серверу, не обрабатываем через ServiceWorker
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Для файлов разработки (CSS, JS) - всегда загружаем свежую версию
  var isDevFile = requestUrl.pathname.endsWith('.css') || 
                  requestUrl.pathname.endsWith('.js') ||
                  requestUrl.pathname.endsWith('.html');
  
  if (isDevFile) {
    // Для файлов разработки - всегда загружаем из сети, не используем кэш
    event.respondWith(
      fetch(event.request).then(function(response) {
        return response;
      }).catch(function() {
        // Если сеть недоступна, пытаемся из кэша
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // Для остальных файлов используем стандартное кэширование
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Попадание в кэш - возвращаем ответ
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          function(response) {
            // Проверяем, получили ли мы валидный ответ
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Проверяем, что это не chrome-extension запрос
            var requestUrl = new URL(event.request.url);
            if (requestUrl.protocol === 'chrome-extension:' || 
                requestUrl.protocol === 'chrome:' ||
                requestUrl.protocol === 'moz-extension:') {
              return response; // Не кэшируем
            }

            // Клонирование ответа
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

// Событие активации
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
    }).then(function() {
      // Принудительно обновляем все открытые страницы
      return self.clients.claim();
    })
  );
});

// Фоновая синхронизация для пожертвований
self.addEventListener('sync', function(event) {
  if (event.tag === 'donation-sync') {
    event.waitUntil(syncDonations());
  }
});

// Push-уведомления
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'Новое уведомление от Дом Лап',
    icon: '/frontend/images/icon-192.svg',
    badge: '/frontend/images/icon-192.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Посмотреть',
        icon: '/frontend/images/icon-192.svg'
      },
      {
        action: 'close',
        title: 'Закрыть',
        icon: '/frontend/images/icon-192.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Дом Лап', options)
  );
});

// Клик по уведомлению
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Вспомогательная функция для синхронизации пожертвований
function syncDonations() {
  // В реальной реализации это синхронизировало бы офлайн-пожертвования
  return Promise.resolve();
}
