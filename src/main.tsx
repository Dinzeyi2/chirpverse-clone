
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Enhanced URL normalization function that handles all possible URL formats
const normalizePostUrl = (url) => {
  // Get the current URL components
  const pathname = url.pathname;
  const hash = url.hash;
  const search = url.search;
  
  // Handle URLs with or without www prefix
  const hostname = url.hostname;
  const isHttpsProtocol = url.protocol === 'https:';
  
  // Debug the URL being normalized
  console.log(`Normalizing URL: ${url.toString()}, Pathname: ${pathname}, Hostname: ${hostname}`);
  
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

// Enhanced function to set up URL normalization with protocol handling
const setupUrlNormalization = () => {
  // Fix URLs on initial page load
  const currentUrl = new URL(window.location.href);
  const normalizedUrl = normalizePostUrl(currentUrl);
  
  if (normalizedUrl) {
    console.log(`Initial load: Redirecting ${currentUrl.pathname}${currentUrl.hash} → ${normalizedUrl}`);
    window.history.replaceState({}, '', normalizedUrl);
  }
  
  // Store the full URL in session storage to survive reloads
  const storeCurrentPath = () => {
    // Store both pathname and full URL
    const path = window.location.pathname + window.location.hash + window.location.search;
    const fullUrl = window.location.href;
    
    // Only store paths that are for posts/comments
    if (path.includes('/post/') || path.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i)) {
      console.log("Storing current path in session storage:", path);
      console.log("Storing full URL in session storage:", fullUrl);
      sessionStorage.setItem('lastPath', path);
      sessionStorage.setItem('fullUrl', fullUrl);
    }
  };
  
  // Store path when navigating
  window.addEventListener('popstate', storeCurrentPath);
  
  // Enhanced link click handler with protocol preservation
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    
    if (anchor && anchor.href && !anchor.getAttribute('target')) {
      try {
        const url = new URL(anchor.href);
        const normalizedUrl = normalizePostUrl(url);
        
        if (normalizedUrl) {
          e.preventDefault();
          // Get the current protocol and host to preserve them
          const currentProtocol = window.location.protocol;
          const currentHostname = window.location.hostname;
          
          console.log(`Link clicked: Redirecting ${url.pathname}${url.hash} → ${normalizedUrl}`);
          console.log(`Using protocol: ${currentProtocol}, hostname: ${currentHostname}`);
          
          // Store the full URL before navigating
          const fullUrl = `${currentProtocol}//${currentHostname}${normalizedUrl}`;
          sessionStorage.setItem('lastPath', normalizedUrl);
          sessionStorage.setItem('fullUrl', fullUrl);
          
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

// Enhanced reload path restoration that maintains protocol and hostname
const restorePathAfterReload = () => {
  // Check for stored full URL first
  const fullUrl = sessionStorage.getItem('fullUrl');
  const lastPath = sessionStorage.getItem('lastPath');
  const currentPath = window.location.pathname + window.location.hash + window.location.search;
  
  console.log("Checking for path restoration:");
  console.log("Current path:", currentPath);
  console.log("Stored path:", lastPath);
  console.log("Stored full URL:", fullUrl);
  
  // Only restore if we're at root or 404 and have a stored path
  if (window.location.pathname === '/' || window.location.pathname === '/404') {
    if (fullUrl && fullUrl !== window.location.href) {
      console.log('Restoring full URL after reload:', fullUrl);
      
      try {
        // Extract the path part from the full URL to avoid cross-origin issues
        const urlObj = new URL(fullUrl);
        const pathToRestore = urlObj.pathname + urlObj.hash + urlObj.search;
        
        console.log('Restoring path component:', pathToRestore);
        window.history.replaceState(null, '', pathToRestore);
        
        // Force a render update by dispatching a popstate event
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch (error) {
        console.error("Error restoring full URL:", error);
        
        // Fallback to path-only restoration
        if (lastPath && lastPath !== currentPath) {
          console.log('Fallback: Restoring path after reload:', lastPath);
          window.history.replaceState(null, '', lastPath);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }
    } else if (lastPath && lastPath !== currentPath) {
      // Fallback to path-only restoration if no full URL is available
      console.log('Restoring path after reload (no full URL):', lastPath);
      window.history.replaceState(null, '', lastPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
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
