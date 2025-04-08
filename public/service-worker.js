
// Service Worker for iblue Web Push Notifications

const CACHE_NAME = 'iblue-v3'; // Updated version
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

// Improved function to normalize post URLs
function normalizePostUrl(url) {
  // Extract URL components
  const pathname = url.pathname;
  const hash = url.hash;
  const search = url.search;
  
  // Match UUID pattern
  const uuidMatch = pathname.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  
  if (uuidMatch) {
    const uuid = uuidMatch[1];
    
    // Check if already in correct format
    if (pathname.startsWith('/post/') && pathname.includes(uuid)) {
      return null; // Already in correct format
    }
    
    // Handle raw UUID or alternative formats
    if (pathname === `/${uuid}` || 
        pathname.startsWith('/p/') || 
        pathname.startsWith('/posts/')) {
      return `/post/${uuid}${hash || ''}${search || ''}`;
    }
  }
  
  // Handle comment hash with UUID
  if (hash && hash.match(/#comment-([a-f0-9-]+)/) && uuidMatch) {
    return `/post/${uuidMatch[1]}${hash}${search || ''}`;
  }
  
  return null;
}

// Fetch event for SPA navigation - IMPROVED FOR COMMENT LINKS
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    const url = new URL(event.request.url);
    console.log('Service worker intercepting navigation to:', url.pathname + url.hash);
    
    // Check if this is a direct UUID path, post URL, or comment URL
    const uuidPattern = /^\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}(?:#.*)?$/i;
    const postPattern = /^\/(post|p|posts)\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}(?:#.*)?$/i;
    const commentPattern = /#comment-[a-f0-9-]+$/i;
    
    // Look for comment hash
    const hasCommentHash = commentPattern.test(url.hash);
    
    // Normalize the URL if needed
    const normalizedUrl = normalizePostUrl(url);
    if (normalizedUrl) {
      console.log('Service worker normalizing URL to:', normalizedUrl);
      
      // Use respondWith to return a redirected response
      event.respondWith(
        Response.redirect(normalizedUrl, 302)
      );
      return;
    }
    
    // Special handling for comment URLs
    if (hasCommentHash && url.pathname.includes('/post/')) {
      console.log('Comment URL detected, passing to app for handling');
      // Let the app handle comment URLs
      event.respondWith(
        fetch(event.request).catch(() => {
          console.log('Fetch failed for comment URL, falling back to root');
          return caches.match('/');
        })
      );
      return;
    }
    
    // Check for valid app routes
    if (url.pathname === '/' || 
        url.pathname.startsWith('/auth') || 
        url.pathname.startsWith('/explore') || 
        url.pathname.startsWith('/settings') || 
        url.pathname.startsWith('/profile') || 
        url.pathname.startsWith('/bookmarks') || 
        url.pathname.startsWith('/notifications') || 
        postPattern.test(url.pathname) || 
        uuidPattern.test(url.pathname)) {
      
      // For standard app routes, let the browser handle it
      event.respondWith(
        fetch(event.request).catch(() => {
          console.log('Fetch failed for app route, falling back to root');
          return caches.match('/');
        })
      );
      return;
    }
    
    // For all other routes, check if we have a cached response
    event.respondWith(
      caches.match('/').then(response => {
        return response || fetch(event.request)
          .catch(() => caches.match(OFFLINE_URL));
      })
    );
  }
});
