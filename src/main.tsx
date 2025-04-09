
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { toast } from 'sonner'

// Enhanced error handler for unhandled exceptions
const setupGlobalErrorHandling = () => {
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    
    // Show error toast to user
    toast.error('Something went wrong. Please try refreshing the page.');
    
    // Prevent the error from completely crashing the app
    event.preventDefault();
    
    // Record error for analytics if needed
    // recordError(event.error); // Implement later if needed
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Show error toast to user
    toast.error('Network issue detected. Please check your connection.');
    
    // Prevent the error from completely crashing the app
    event.preventDefault();
  });
};

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

// Create root element with enhanced error boundary
const renderApp = () => {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error("Root element not found");
    
    // Create root element if missing
    const newRoot = document.createElement('div');
    newRoot.id = 'root';
    document.body.appendChild(newRoot);
    
    try {
      const root = createRoot(newRoot);
      root.render(<App />);
      console.log("App mounted on dynamically created root");
    } catch (error) {
      console.error("Failed to render application on dynamic root:", error);
      showFallbackUI(newRoot);
    }
    return;
  }

  try {
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log("App mounted successfully");
  } catch (error) {
    console.error("Failed to render application:", error);
    showFallbackUI(rootElement);
  }
};

// Enhanced fallback UI with retry button
const showFallbackUI = (element) => {
  if (!element) return;
  
  element.innerHTML = `
    <div style="font-family: system-ui, sans-serif; padding: 2rem; text-align: center; max-width: 500px; margin: 0 auto; color: #333;">
      <h1 style="color: #1d4ed8;">Application Error</h1>
      <p>We're experiencing technical difficulties loading the application. This could be due to network issues or a temporary server problem.</p>
      <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <strong>Troubleshooting tips:</strong>
        <ul style="text-align: left; margin-top: 10px;">
          <li>Check your internet connection</li>
          <li>Clear your browser cache</li>
          <li>Try disabling any browser extensions</li>
        </ul>
      </div>
      <button onclick="window.location.reload()" 
        style="padding: 10px 20px; margin-top: 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
        Refresh Page
      </button>
      <button onclick="window.location.href='/'" 
        style="padding: 10px 20px; margin-top: 16px; margin-left: 10px; background: #f3f4f6; color: #1f2937; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; font-weight: bold;">
        Go to Home
      </button>
    </div>
  `;
};

// Initialize app with proper error handling
setupGlobalErrorHandling();
registerServiceWorker();
renderApp();
