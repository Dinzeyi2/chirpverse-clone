
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { toast } from 'sonner'

// Performance monitoring
const startTime = performance.now();
console.log('App initialization started');

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

// Configure network request caching for faster loads
if ('caches' in window) {
  // Create a cache for static assets
  caches.open('static-assets-v1').then(cache => {
    // Pre-cache important static assets
    cache.addAll([
      '/lovable-uploads/3466f833-541a-44f1-86a1-5e3f5ed4d8ed.png',
      '/index.html',
      '/manifest.json'
    ]);
  });
}

// Set up global error handling
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  toast.error('Something went wrong. Please refresh the page.');
  
  // Log error details to console for debugging
  if (event.error) {
    console.error('Error details:', {
      message: event.error.message,
      stack: event.error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  if (event.reason && event.reason.message) {
    if (event.reason.message.includes('Failed to fetch')) {
      toast.error('Network request failed. Please check your connection.');
    } else {
      toast.error('An operation failed. Please try again.');
    }
  }
});

// Create root with error handling
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Unable to load application</h1><p>Please refresh the page or try again later.</p></div>';
} else {
  const root = createRoot(rootElement);
  
  // Render with error handling
  try {
    registerServiceWorker();
    root.render(<App />);
    
    // Performance measurement
    window.addEventListener('load', () => {
      const loadTime = performance.now() - startTime;
      console.log(`App fully loaded in ${loadTime.toFixed(2)}ms`);
      
      // Report performance metrics for analysis
      if ('connection' in navigator && navigator.connection) {
        // @ts-ignore - connection property exists but TypeScript doesn't know about it
        const connectionType = navigator.connection.effectiveType;
        console.log(`Connection type: ${connectionType}`);
      }
      
      // Report navigation timing metrics
      if (performance && performance.getEntriesByType) {
        const navigationTiming = performance.getEntriesByType('navigation')[0];
        if (navigationTiming) {
          // @ts-ignore - navigationTiming has these properties but TypeScript doesn't recognize them
          console.log(`DOM Content Loaded: ${navigationTiming.domContentLoadedEventEnd - navigationTiming.domContentLoadedEventStart}ms`);
          // @ts-ignore
          console.log(`First Paint: ${performance.getEntriesByName('first-paint')[0]?.startTime || 'N/A'}ms`);
        }
      }
    });
  } catch (error) {
    console.error('Error rendering application:', error);
    root.render(
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Something went wrong</h1>
        <p>Please refresh the page to try again.</p>
        <pre style={{ 
          margin: '20px auto', 
          padding: '10px', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '4px',
          textAlign: 'left',
          maxWidth: '80%',
          overflow: 'auto'
        }}>
          {error instanceof Error ? error.message : 'Unknown error'}
        </pre>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh Page
        </button>
      </div>
    );
  }
}
