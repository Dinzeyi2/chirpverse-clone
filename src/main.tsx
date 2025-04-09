
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

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

// Improved error handling for app initialization
const initializeApp = () => {
  try {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      console.error("Root element not found!");
      document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; font-family: Arial, sans-serif;">
          <h1>Application Error</h1>
          <p>Could not find root element. Please refresh the page or contact support.</p>
          <button style="padding: 10px 20px; margin-top: 20px; cursor: pointer;" onclick="window.location.reload()">
            Refresh Page
          </button>
        </div>
      `;
      return;
    }
    
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log('Application successfully rendered');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    // Provide a fallback UI when the app fails to initialize
    document.body.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; font-family: Arial, sans-serif;">
        <h1>Application Error</h1>
        <p>Something went wrong while loading the application. Please try refreshing your browser.</p>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; max-width: 80vw; overflow: auto;">${
          error instanceof Error ? error.message : String(error)
        }</pre>
        <button style="padding: 10px 20px; margin-top: 20px; cursor: pointer;" onclick="window.location.reload()">
          Refresh Page
        </button>
      </div>
    `;
  }
};

// Initialize app with improved error handling
registerServiceWorker();
initializeApp();

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

// Add unhandled rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
