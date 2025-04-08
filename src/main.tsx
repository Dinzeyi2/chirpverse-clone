
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Create a function to normalize post URLs
const normalizePostUrl = (url) => {
  const pathname = url.pathname;
  const uuidMatch = pathname.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  
  if (uuidMatch) {
    // Check if it's already in the correct format
    if (pathname.startsWith('/post/')) {
      return null; // Already correct format
    }
    
    // Handle raw UUID, /p/ or /posts/ formats
    if (pathname === `/${uuidMatch[1]}` || 
        pathname.startsWith('/p/') || 
        pathname.startsWith('/posts/')) {
      
      return `/post/${uuidMatch[1]}${url.hash || ''}${url.search || ''}`;
    }
  }
  
  return null;
}

// Function to set up URL normalization
const setupUrlNormalization = () => {
  // Fix URLs on initial page load
  const currentUrl = new URL(window.location.href);
  const normalizedUrl = normalizePostUrl(currentUrl);
  
  if (normalizedUrl) {
    console.log(`Initial load: Redirecting ${currentUrl.pathname} → ${normalizedUrl}`);
    window.history.replaceState({}, '', normalizedUrl);
  }
  
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
          console.log(`Link clicked: Redirecting ${url.pathname} → ${normalizedUrl}`);
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
      console.log(`Popstate: Redirecting ${currentUrl.pathname} → ${normalizedUrl}`);
      window.history.replaceState({}, '', normalizedUrl);
    }
  });
}

// Initialize URL normalization when DOM is ready
document.addEventListener('DOMContentLoaded', setupUrlNormalization);

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
