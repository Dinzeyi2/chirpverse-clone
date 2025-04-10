
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

// Initialize app
registerServiceWorker();
createRoot(document.getElementById("root")!).render(<App />);
