
// Service Worker for iblue Web Push Notifications and URL handling

const CACHE_NAME = 'iblue-v6'; // Updated version
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
          '/'
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
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim clients to take control immediately
  return self.clients.claim();
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

// Simplified fetch event handling focusing on core app functionality
self.addEventListener('fetch', (event) => {
  // Only handle navigation requests
  if (event.request.mode === 'navigate') {
    const url = new URL(event.request.url);
    
    // Log navigation
    console.log('Service worker handling navigation to:', url.toString());
    
    // Check if this is a direct app route
    const isAppRoute = APP_ROUTES.some(route => url.pathname === route || url.pathname.startsWith(`${route}/`));
    
    // Check if this is likely a post URL
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
    
    // For standard app routes, let the app handle it
    if (isAppRoute || url.pathname === '/' || url.pathname.startsWith('/post/')) {
      // For SPA navigation, respond with the index.html
      event.respondWith(
        fetch(event.request).catch(() => {
          console.log('Fetch failed, falling back to index.html');
          return caches.match('/') || caches.match(OFFLINE_URL);
        })
      );
    } else {
      // For other routes, try the network first
      event.respondWith(
        fetch(event.request).catch(() => {
          console.log('Fetch failed, falling back to cached content');
          return caches.match('/') || caches.match(OFFLINE_URL);
        })
      );
    }
  }
});
