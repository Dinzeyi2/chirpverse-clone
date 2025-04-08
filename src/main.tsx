
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add event listener to handle external links
document.addEventListener('DOMContentLoaded', () => {
  // Handle clicks on anchor elements
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    
    if (anchor && anchor.href) {
      const url = new URL(anchor.href);
      
      // Handle post links in various formats
      const uuidMatch = url.pathname.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
      
      if (uuidMatch && 
          (url.pathname === `/${uuidMatch[1]}` || 
           url.pathname.startsWith('/p/') || 
           url.pathname.startsWith('/posts/'))) {
        e.preventDefault();
        
        // Redirect to the correct format with the current hash
        const correctUrl = `/post/${uuidMatch[1]}${url.hash || ''}${url.search || ''}`;
        console.log(`Link clicked: Redirected ${url.pathname} → ${correctUrl}`);
        
        window.history.pushState({}, '', correctUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  });
});

createRoot(document.getElementById("root")!).render(<App />);
