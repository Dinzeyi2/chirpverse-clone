
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Simple function to register service worker with better error handling
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
          // Continue app initialization even if service worker fails
        });
    });
  }
};

// Create root element with error boundary
const renderApp = () => {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error("Root element not found");
    return;
  }

  try {
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log("App mounted successfully");
  } catch (error) {
    console.error("Failed to render application:", error);
    
    // Fallback UI if rendering fails
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="font-family: system-ui, sans-serif; padding: 2rem; text-align: center;">
          <h1>Application Error</h1>
          <p>We're experiencing technical difficulties. Please try refreshing the page.</p>
          <button onclick="window.location.reload()" style="padding: 8px 16px; margin-top: 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Refresh Page
          </button>
        </div>
      `;
    }
  }
};

// Initialize app
registerServiceWorker();
renderApp();
