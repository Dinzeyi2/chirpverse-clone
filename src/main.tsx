
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Performance metrics logging
const startTime = performance.now();

// Simple function to register service worker
const registerServiceWorker = () => {
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
};

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Prevent complete app crash for non-critical errors
  if (!event.error?.toString().includes('ChunkLoadError')) {
    return;
  }
  event.preventDefault();
});

// Initialize app with performance logging
const initApp = () => {
  try {
    console.info('App initialization started');
    const rootElement = document.getElementById("root");
    
    if (!rootElement) {
      throw new Error('Root element not found');
    }
    
    const root = createRoot(rootElement);
    root.render(<App />);
    
    const loadTime = performance.now() - startTime;
    console.info(`App fully loaded in ${loadTime.toFixed(2)}ms`);
    
  } catch (error) {
    console.error('Critical initialization error:', error);
    
    // Recovery mechanism
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background-color: #000;
          color: #fff;
          text-align: center;
          padding: 1rem;
        ">
          <h1 style="margin-bottom: 1rem; font-size: 1.5rem; font-weight: bold;">Unable to load the application</h1>
          <p style="margin-bottom: 1.5rem; color: #aaa;">Please try refreshing the page.</p>
          <button 
            onclick="window.location.reload()" 
            style="
              background-color: #1d9bf0;
              color: white;
              border: none;
              padding: 0.5rem 1rem;
              border-radius: 0.25rem;
              cursor: pointer;
              font-weight: bold;
            "
          >
            Refresh Page
          </button>
        </div>
      `;
    }
  }
};

// Improve navigation performance by preloading key routes
const prefetchRoutes = () => {
  // Prefetch key routes
  const routesToPrefetch = ['/explore', '/for-you'];
  
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      routesToPrefetch.forEach(route => {
        console.info(`Prefetching route: ${route}`);
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    });
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(() => {
      routesToPrefetch.forEach(route => {
        console.info(`Prefetching route: ${route}`);
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    }, 1000);
  }
};

// Initialize app
registerServiceWorker();
initApp();
prefetchRoutes();
