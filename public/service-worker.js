
// Service Worker for iblue Web Push Notifications and URL handling

const CACHE_NAME = 'iblue-v10'; // Increment version for cache busting
const OFFLINE_URL = '/offline.html';

// Installation event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
  
  // Create offline page cache
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll([
          OFFLINE_URL,
          '/',
          '/index.html',
          '/manifest.json'
        ]);
      })
  );
});

// Activation event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated.');
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: All old caches cleared');
      // Claim clients to take control immediately
      return self.clients.claim();
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  // Parse the notification data
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'iblue Notification',
      body: event.data ? event.data.text() : 'New notification from iblue',
      icon: '/lovable-uploads/6cd6103f-8ab6-49f9-b4cc-8d47775646bd.png',
      badge: '/lovable-uploads/6cd6103f-8ab6-49f9-b4cc-8d47775646bd.png',
      data: {
        url: '/'
      }
    };
  }
  
  // Show the notification
  const showNotification = self.registration.showNotification(
    data.title || 'iblue Notification',
    {
      body: data.body || 'You have a new notification from iblue',
      icon: data.icon || '/lovable-uploads/6cd6103f-8ab6-49f9-b4cc-8d47775646bd.png',
      badge: data.badge || '/lovable-uploads/6cd6103f-8ab6-49f9-b4cc-8d47775646bd.png',
      data: data.data || { url: '/' },
      actions: data.actions || [],
      vibrate: [100, 50, 100],
      tag: data.tag || 'iblue-notification',
      renotify: true
    }
  );
  
  event.waitUntil(showNotification);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  // Close the notification
  event.notification.close();
  
  // Get the notification data
  const notificationData = event.notification.data;
  const urlToOpen = notificationData && notificationData.url ? notificationData.url : '/';
  
  // Open or focus the relevant page
  event.waitUntil(
    self.clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    })
    .then((clientList) => {
      // Store this in localStorage for persistence if needed
      try {
        // If it's a post URL, store the post ID
        if (urlToOpen.includes('/post/')) {
          const postId = urlToOpen.split('/post/')[1].split('?')[0];
          localStorage.setItem('notificationPostId', postId);
          localStorage.setItem('lastPathTimestamp', Date.now().toString());
        }
      } catch (e) {
        console.error('Error setting localStorage:', e);
      }
      
      // Check if a window is already open
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no matching client is found, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// UUID pattern for URL validation
const UUID_PATTERN = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;

// List of app routes that should be navigated to directly
const APP_ROUTES = [
  '/auth',
  '/explore',
  '/bookmarks',
  '/profile',
  '/settings',
  '/notifications',
  '/for-you'
];

// Listen for the custom event from the UrlHandler component
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PERSIST_NOTIFICATIONS_PATH') {
    console.log('Service worker received notification persistence message:', event.data);
    // Could store this in IndexedDB if needed for better persistence
  }
});

// Improved fetch event handling focusing on SPA routing regardless of domain
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Log important request information for debugging
  if (event.request.mode === 'navigate') {
    console.log('Navigating to:', url.pathname, 'on domain:', url.hostname);
  }
  
  // Only handle same-origin requests to avoid CORS issues
  if (url.origin === self.location.origin) {
    // Handle navigation requests (i.e., route changes)
    if (event.request.mode === 'navigate') {
      // Special handling for notifications
      if (url.pathname === '/notifications' || url.pathname.startsWith('/notifications/')) {
        console.log('Serving index.html for notifications route');
        event.respondWith(
          caches.match('/index.html')
            .then(response => {
              return response || fetch('/index.html').catch(() => {
                return caches.match(OFFLINE_URL);
              });
            })
        );
        return;
      }
      
      // For SPA routes, serve index.html to let the client-side router handle it
      if (APP_ROUTES.some(route => url.pathname === route || url.pathname.startsWith(`${route}/`)) || 
          url.pathname === '/' || 
          url.pathname.startsWith('/post/') ||
          UUID_PATTERN.test(url.pathname)) {
        console.log('Serving index.html for SPA route:', url.pathname);
        event.respondWith(
          caches.match('/index.html')
            .then(response => {
              return response || fetch('/index.html').catch(() => {
                return caches.match(OFFLINE_URL);
              });
            })
        );
        return;
      }
      
      // Check if this is likely a post URL with UUID
      const pathContainsUuid = UUID_PATTERN.test(url.pathname);
      
      if (pathContainsUuid) {
        // Extract the UUID
        const uuidMatch = url.pathname.match(UUID_PATTERN);
        if (uuidMatch) {
          const uuid = uuidMatch[0];
          
          // Check if already in canonical format
          if (!url.pathname.startsWith('/post/')) {
            // Normalize to canonical format
            const normalizedPath = `/post/${uuid}${url.hash}${url.search}`;
            console.log('Service worker normalizing to:', normalizedPath);
            
            // Use a simple redirect
            event.respondWith(Response.redirect(normalizedPath, 302));
            return;
          }
        }
      }
    }
  }
  
  // For all other requests, try the network first, then fall back to cache
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        console.log('Fetch failed, falling back to cached content for:', event.request.url);
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If it's a navigation request and we don't have a cached response,
            // serve the index.html
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // For other resources, serve the offline page
            return caches.match(OFFLINE_URL);
          });
      })
  );
});
