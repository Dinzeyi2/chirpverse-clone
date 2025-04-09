
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
          '/index.html'
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

// Notification click event - handles both push notifications and email links
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  // Close the notification
  event.notification.close();
  
  // Get the notification data
  const notificationData = event.notification.data;
  const urlToOpen = notificationData && notificationData.url ? notificationData.url : '/';
  
  // Enhanced handling for comment notifications
  let targetUrl = urlToOpen;
  if (notificationData && notificationData.type === 'comment') {
    // Make sure we go directly to the post with the comment
    if (notificationData.postId) {
      targetUrl = `/post/${notificationData.postId}`;
    }
  }
  
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
        if (targetUrl.includes('/post/')) {
          const postId = targetUrl.split('/post/')[1].split('?')[0];
          localStorage.setItem('notificationPostId', postId);
          localStorage.setItem('lastPathTimestamp', Date.now().toString());
        }
      } catch (e) {
        console.error('Error setting localStorage:', e);
      }
      
      // Check if a window is already open
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no matching client is found, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
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
  '/for-you'
];

// Listen for the custom event from the UrlHandler component
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PERSIST_NOTIFICATIONS_PATH') {
    console.log('Service worker received notification persistence message:', event.data);
    // Could store this in IndexedDB if needed for better persistence
  }
});

// Simplified fetch event handling focusing on core app functionality
self.addEventListener('fetch', (event) => {
  // Only handle navigation requests
  if (event.request.mode === 'navigate') {
    const url = new URL(event.request.url);
    
    // Log navigation
    console.log('Service worker handling navigation to:', url.toString());
    
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
    
    // CRITICAL: Always serve index.html for SPA routes
    // This ensures React Router can handle the route
    if (APP_ROUTES.some(route => url.pathname === route || url.pathname.startsWith(`${route}/`))) {
      console.log('Serving index.html for app route:', url.pathname);
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
    
    // For all other app routes or the root path, serve index.html
    // This is critical for SPA routing
    if (url.pathname === '/' || url.pathname.startsWith('/post/')) {
      event.respondWith(
        caches.match('/index.html')
          .then(response => {
            return response || fetch('/index.html').catch(() => {
              return caches.match(OFFLINE_URL);
            });
          })
      );
    } else {
      // For non-app routes (e.g., static assets), try network first
      event.respondWith(
        fetch(event.request).catch(() => {
          console.log('Fetch failed, falling back to cached content');
          return caches.match(event.request) || 
                 caches.match('/index.html') || 
                 caches.match(OFFLINE_URL);
        })
      );
    }
  }
});
