
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// List of supported domains
const SUPPORTED_DOMAINS = [
  'lovable.app',
  'lovableproject.com',
  'i-blue.dev',
  'iblue.dev'
];

// Improved service worker registration with error handling
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Log current domain
      const currentDomain = window.location.hostname;
      console.log('Registering service worker on domain:', currentDomain);
      
      // Check if this is a known domain
      const isKnownDomain = SUPPORTED_DOMAINS.some(domain => currentDomain.includes(domain));
      if (isKnownDomain) {
        console.log('Known domain detected, proceeding with normal registration');
      } else {
        console.log('Unknown domain detected:', currentDomain, 'but will attempt registration anyway');
      }
      
      // Add a small delay to ensure the DOM is fully loaded
      setTimeout(() => {
        const swUrl = '/service-worker.js'; 
        
        // Clear any existing service worker cache to force update
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            if (cacheName.startsWith('iblue-')) {
              console.log(`Clearing cache: ${cacheName}`);
              caches.delete(cacheName);
            }
          });
        });
        
        navigator.serviceWorker.register(swUrl)
          .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
            
            // Force update if needed
            registration.update();
            
            // Check for updates every 60 minutes
            setInterval(() => {
              registration.update();
              console.log('Service Worker update check initiated');
            }, 60 * 60 * 1000);
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
      }, 1000);
    });
  }
};

// Initialize app with error handling
try {
  registerServiceWorker();
  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(<App />);
  } else {
    console.error("Could not find root element to mount application");
  }
} catch (error) {
  console.error("Application failed to initialize:", error);
  // Display a fallback UI for critical errors
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: sans-serif;">
      <h1>Something went wrong</h1>
      <p>The application encountered an error. Please refresh the page or try again later.</p>
    </div>
  `;
}
