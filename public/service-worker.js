
// Service Worker for iblue Web Push Notifications

const CACHE_NAME = 'iblue-v4'; // Updated version
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

// Enhanced function to normalize post URLs with better protocol handling
function normalizePostUrl(url) {
  // Extract URL components
  const pathname = url.pathname;
  const hash = url.hash;
  const search = url.search;
  const hostname = url.hostname;
  const protocol = url.protocol;
  
  console.log(`Service worker normalizing URL: ${url.toString()}`);
  console.log(`Components - Protocol: ${protocol}, Hostname: ${hostname}, Path: ${pathname}`);
  
  // Match UUID pattern
  const uuidMatch = pathname.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  
  if (uuidMatch) {
    const uuid = uuidMatch[1];
    
    // Check if already in correct format
    if (pathname.startsWith('/post/') && pathname.includes(uuid)) {
      console.log("URL already in correct format");
      return null; // Already in correct format
    }
    
    // Handle raw UUID or alternative formats
    if (pathname === `/${uuid}` || 
        pathname.startsWith('/p/') || 
        pathname.startsWith('/posts/')) {
      const normalizedPathOnly = `/post/${uuid}${hash || ''}${search || ''}`;
      console.log(`Normalized path: ${normalizedPathOnly}`);
      return normalizedPathOnly;
    }
  }
  
  // Handle comment hash with UUID
  if (hash && hash.match(/#comment-([a-f0-9-]+)/) && uuidMatch) {
    const normalizedPath = `/post/${uuidMatch[1]}${hash}${search || ''}`;
    console.log(`Normalized comment URL: ${normalizedPath}`);
    return normalizedPath;
  }
  
  return null;
}

// Fetch event for SPA navigation - IMPROVED FOR COMMENT LINKS AND PROTOCOL HANDLING
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    const url = new URL(event.request.url);
    console.log('Service worker intercepting navigation to:', url.toString());
    
    // Check if this is a direct UUID path, post URL, or comment URL
    const uuidPattern = /^\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}(?:#.*)?$/i;
    const postPattern = /^\/(post|p|posts)\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}(?:#.*)?$/i;
    const commentPattern = /#comment-[a-f0-9-]+$/i;
    
    // Look for comment hash
    const hasCommentHash = commentPattern.test(url.hash);
    
    // Store hostname and protocol for preservation
    if (url.pathname.includes('/post/') || uuidPattern.test(url.pathname) || postPattern.test(url.pathname)) {
      console.log('Storing protocol and hostname info in sessionStorage');
      self.clients.matchAll().then(clients => {
        if (clients && clients.length) {
          // Use the first client to execute script in the window context
          clients[0].postMessage({
            type: 'STORE_URL_INFO',
            protocol: url.protocol,
            hostname: url.hostname,
            fullUrl: url.toString()
          });
        }
      });
    }
    
    // Normalize the URL if needed
    const normalizedUrl = normalizePostUrl(url);
    if (normalizedUrl) {
      console.log('Service worker normalizing URL to:', normalizedUrl);
      
      // Use respondWith to return a redirected response that preserves protocol and hostname
      const currentProtocol = url.protocol;
      const currentHostname = url.hostname;
      
      // Build the full URL while preserving the original protocol and hostname
      const redirectUrl = `${currentProtocol}//${currentHostname}${normalizedUrl}`;
      console.log('Redirecting to full URL:', redirectUrl);
      
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

// Special message handler for protocol preservation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PRESERVE_URL_INFO') {
    console.log('Service worker received URL info to preserve:', event.data);
    // We can't directly access sessionStorage from service worker
    // This is handled by sending a message back to the client
    self.clients.matchAll().then(clients => {
      if (clients && clients.length) {
        clients.forEach(client => {
          client.postMessage({
            type: 'STORE_URL_INFO',
            protocol: event.data.protocol,
            hostname: event.data.hostname,
            fullUrl: event.data.fullUrl
          });
        });
      }
    });
  }
});
