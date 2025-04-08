
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Enhanced function to normalize post URLs with comment fragments
const normalizePostUrl = (url) => {
  // Get the current URL components
  const pathname = url.pathname;
  const hash = url.hash;
  const search = url.search;
  
  // Special handling for direct URLs with www prefix
  if (url.hostname.startsWith('www.') && pathname.includes('post/')) {
    console.log("URL already has www prefix and correct path format");
    return null; // Already correct format
  }
  
  // Match UUID pattern in the URL
  const uuidMatch = pathname.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  
  if (uuidMatch) {
    // UUID detected in the URL path
    const uuid = uuidMatch[1];
    
    // Check if it's already in the correct format
    if (pathname.startsWith('/post/') && pathname.includes(uuid)) {
      console.log("URL already in correct post format");
      return null; // Already correct format
    }
    
    // Handle raw UUID, /p/ or /posts/ formats
    if (pathname === `/${uuid}` || 
        pathname.startsWith('/p/') || 
        pathname.startsWith('/posts/')) {
      
      // Create normalized URL with the hash and search parameters preserved
      const normalizedPath = `/post/${uuid}${hash || ''}${search || ''}`;
      console.log(`Normalizing post path from ${pathname} to ${normalizedPath}`);
      return normalizedPath;
    }
  }
  
  // Check for comment hash in incorrect URL format
  const commentMatch = hash && hash.match(/#comment-([a-f0-9-]+)/);
  if (commentMatch && uuidMatch) {
    const normalizedPath = `/post/${uuidMatch[1]}${hash}${search || ''}`;
    console.log(`Normalizing comment URL from ${pathname}${hash} to ${normalizedPath}`);
    return normalizedPath;
  }
  
  return null;
}

// Function to set up URL normalization
const setupUrlNormalization = () => {
  // Fix URLs on initial page load
  const currentUrl = new URL(window.location.href);
  const normalizedUrl = normalizePostUrl(currentUrl);
  
  if (normalizedUrl) {
    console.log(`Initial load: Redirecting ${currentUrl.pathname}${currentUrl.hash} → ${normalizedUrl}`);
    window.history.replaceState({}, '', normalizedUrl);
  }
  
  // Store the pathname and hash in session storage to survive reloads
  const storeCurrentPath = () => {
    const path = window.location.pathname + window.location.hash + window.location.search;
    
    // Only store paths that are for posts/comments
    if (path.includes('/post/') || path.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i)) {
      console.log("Storing current path in session storage:", path);
      sessionStorage.setItem('lastPath', path);
    }
  };
  
  // Store path when navigating
  window.addEventListener('popstate', storeCurrentPath);
  
  // Handle clicks on anchor elements
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    
    if (anchor && anchor.href && !anchor.getAttribute('target')) {
      try {
        const url = new URL(anchor.href);
        const normalizedUrl = normalizePostUrl(url);
        
        if (normalizedUrl) {
          e.preventDefault();
          console.log(`Link clicked: Redirecting ${url.pathname}${url.hash} → ${normalizedUrl}`);
          // Store the path before navigating
          sessionStorage.setItem('lastPath', normalizedUrl);
          window.history.pushState({}, '', normalizedUrl);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      } catch (error) {
        console.error("Error processing link click:", error);
      }
    }
  });
  
  // Handle direct navigation in the address bar
  window.addEventListener('popstate', () => {
    const currentUrl = new URL(window.location.href);
    const normalizedUrl = normalizePostUrl(currentUrl);
    
    if (normalizedUrl) {
      console.log(`Popstate: Redirecting ${currentUrl.pathname}${currentUrl.hash} → ${normalizedUrl}`);
      window.history.replaceState({}, '', normalizedUrl);
    }
  });
  
  // Store path before page unload (reload/navigation)
  window.addEventListener('beforeunload', storeCurrentPath);
}

// Enhanced reload path restoration
const restorePathAfterReload = () => {
  // Check if we're on the root path but have a stored path
  const currentPath = window.location.pathname + window.location.hash + window.location.search;
  const lastPath = sessionStorage.getItem('lastPath');
  
  // Only restore if we're at root or 404 and have a stored path
  if (lastPath && (window.location.pathname === '/' || window.location.pathname === '/404') && lastPath !== currentPath) {
    console.log('Restoring path after reload:', lastPath);
    window.history.replaceState(null, '', lastPath);
    
    // Force a render update by dispatching a popstate event
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
};

// Initialize URL normalization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setupUrlNormalization();
  
  // Restore path after small delay to ensure app has initialized
  setTimeout(restorePathAfterReload, 100);
});

// Register service worker for offline support and push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
