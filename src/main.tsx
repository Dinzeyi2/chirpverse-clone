
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { toast } from 'sonner'

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

// Error boundary for the entire app
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  toast.error('Something went wrong. Please refresh the page.');
});

// Initialize app with performance monitoring
const startTime = performance.now();
console.log('App initialization started');

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
    });
  } catch (error) {
    console.error('Error rendering application:', error);
    root.render(
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Something went wrong</h1>
        <p>Please refresh the page to try again.</p>
      </div>
    );
  }
}
