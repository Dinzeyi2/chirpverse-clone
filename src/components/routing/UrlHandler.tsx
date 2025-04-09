
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// UUID pattern for validating direct UUID routes
const UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

// List of routes that should be persisted for reload
const PERSIST_ROUTES = ['/post/', '/notifications', '/for-you'];

/**
 * Handle all URL normalization and persistence in one place
 * to avoid conflicts between different mechanisms
 */
export const UrlHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialLoadDoneRef = useRef(false);
  const { pathname, hash, search } = location;
  
  // Extract a UUID from various URL patterns
  const extractUuid = (path: string): string | null => {
    // Direct UUID path
    if (path.length > 30 && path.charAt(0) === '/' && UUID_PATTERN.test(path.substring(1))) {
      return path.substring(1);
    }
    
    // /p/ or /posts/ format
    if (path.startsWith('/p/') || path.startsWith('/posts/')) {
      const parts = path.split('/');
      if (parts.length > 2 && UUID_PATTERN.test(parts[2])) {
        return parts[2];
      }
    }
    
    // Find UUID anywhere in path
    const uuidMatch = path.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (uuidMatch) {
      return uuidMatch[1];
    }
    
    return null;
  };
  
  // Extract comment ID from hash
  const extractCommentId = (hashStr: string): string | null => {
    if (hashStr && hashStr.startsWith('#comment-')) {
      return hashStr.substring('#comment-'.length);
    }
    return null;
  };

  // Store current URL in localStorage for persistence across reloads
  const persistCurrentUrl = () => {
    // Check if the current route should be persisted
    const shouldPersist = PERSIST_ROUTES.some(route => pathname.includes(route));
    
    if (shouldPersist) {
      const fullUrl = window.location.href;
      console.log('Persisting URL:', fullUrl);
      localStorage.setItem('lastUrl', fullUrl);
      localStorage.setItem('lastPath', pathname + hash + search);
      localStorage.setItem('lastPathTimestamp', Date.now().toString());
    }
  };

  // Normalize URL on initial load and route changes
  useEffect(() => {
    // Skip processing for standard routes that don't need special handling
    if (['/auth', '/explore', '/bookmarks', '/profile', '/settings', '/'].includes(pathname)) {
      return;
    }
    
    // Store the current page info for reload handling
    persistCurrentUrl();
    
    // Extract UUID and normalize if needed
    const uuid = extractUuid(pathname);
    if (uuid && !pathname.startsWith('/post/')) {
      console.log(`Redirecting to normalized post URL for UUID: ${uuid}`);
      const normalizedPath = `/post/${uuid}${hash}${search}`;
      navigate(normalizedPath, { replace: true });
      return;
    }
    
    // Log comment navigations for debugging
    const commentId = extractCommentId(hash);
    if (commentId) {
      console.log(`Navigation to comment: ${commentId} detected`);
    }
  }, [pathname, hash, search, navigate]);

  // Handle initial page load and restore from localStorage if needed
  useEffect(() => {
    if (initialLoadDoneRef.current) return;
    
    // Only run once on initial load
    initialLoadDoneRef.current = true;
    
    // Check if we're at root or 404 after a reload
    if (pathname === '/' || pathname === '/404') {
      const lastPath = localStorage.getItem('lastPath');
      const lastUrl = localStorage.getItem('lastUrl');
      const lastTimestamp = localStorage.getItem('lastPathTimestamp');
      
      // Only restore if path was saved recently (within last 5 minutes)
      const isRecent = lastTimestamp && (Date.now() - parseInt(lastTimestamp)) < 5 * 60 * 1000;
      
      if (isRecent && lastPath) {
        console.log('Restoring from recent navigation:', lastPath);
        navigate(lastPath, { replace: true });
      }
    }
    
    // Handle direct post/comment URL access
    const uuid = extractUuid(pathname);
    if (uuid && !pathname.startsWith('/post/')) {
      console.log(`Direct access with UUID: ${uuid}`);
      const normalizedPath = `/post/${uuid}${hash}${search}`;
      navigate(normalizedPath, { replace: true });
    }
  }, [pathname, navigate]);

  // Add event listener for before unload to persist state
  useEffect(() => {
    const handleBeforeUnload = () => {
      persistCurrentUrl();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname, hash, search]);

  // Component doesn't render anything visible
  return null;
};
