
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// UUID pattern for validating direct UUID routes
const UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

// List of routes that should be persisted for reload
const PERSIST_ROUTES = ['/post/', '/notifications', '/for-you'];

// List of valid app routes to check against
const APP_ROUTES = [
  '/auth', '/explore', '/bookmarks', '/profile', 
  '/settings', '/notifications', '/for-you'
];

// Fallback route in case of error
const FALLBACK_ROUTE = '/';

/**
 * Handle all URL normalization and persistence in one place
 * to avoid conflicts between different mechanisms
 */
export const UrlHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialLoadDoneRef = useRef(false);
  const initialNavigationAttemptedRef = useRef(false);
  const { pathname, hash, search } = location;
  const [navigationError, setNavigationError] = useState<Error | null>(null);
  
  // Safety mechanism to prevent infinite redirect loops
  const redirectAttemptsRef = useRef(0);
  const MAX_REDIRECT_ATTEMPTS = 3;
  
  // Extract a UUID from various URL patterns
  const extractUuid = (path: string): string | null => {
    try {
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
    } catch (error) {
      console.error("Error extracting UUID:", error);
    }
    
    return null;
  };
  
  // Extract comment ID from hash
  const extractCommentId = (hashStr: string): string | null => {
    try {
      if (hashStr && hashStr.startsWith('#comment-')) {
        return hashStr.substring('#comment-'.length);
      }
    } catch (error) {
      console.error("Error extracting comment ID:", error);
    }
    return null;
  };

  // Store current URL in localStorage for persistence across reloads
  const persistCurrentUrl = () => {
    try {
      // Check if the current route should be persisted
      const shouldPersist = PERSIST_ROUTES.some(route => pathname.includes(route));
      
      if (shouldPersist) {
        const fullUrl = window.location.href;
        console.log('Persisting URL:', fullUrl);
        localStorage.setItem('lastUrl', fullUrl);
        localStorage.setItem('lastPath', pathname + hash + search);
        localStorage.setItem('lastPathTimestamp', Date.now().toString());
        
        // Specifically mark if this was a notifications path
        if (pathname === '/notifications' || pathname.startsWith('/notifications/')) {
          localStorage.setItem('wasOnNotifications', 'true');
        }
      }
    } catch (error) {
      console.error("Error persisting URL:", error);
    }
  };

  // Special function to handle notifications path persistence
  const ensureNotificationsPathIsPersisted = () => {
    try {
      if (pathname === '/notifications' || pathname.startsWith('/notifications/')) {
        console.log('Ensuring notifications path is persisted');
        localStorage.setItem('lastUrl', window.location.origin + pathname);
        localStorage.setItem('lastPath', pathname);
        localStorage.setItem('lastPathTimestamp', Date.now().toString());
        localStorage.setItem('wasOnNotifications', 'true');
        
        // Trigger a custom event that the service worker can listen for
        try {
          const persistEvent = new CustomEvent('persist-notifications-path', {
            detail: { path: pathname }
          });
          window.dispatchEvent(persistEvent);
        } catch (e) {
          console.error('Error dispatching persist event:', e);
        }
      }
    } catch (error) {
      console.error("Error persisting notifications path:", error);
    }
  };

  // Safe navigation function to prevent loops and errors
  const safeNavigate = (targetPath: string, options: { replace?: boolean } = {}) => {
    try {
      if (redirectAttemptsRef.current >= MAX_REDIRECT_ATTEMPTS) {
        console.warn('Max redirect attempts reached, aborting navigation');
        toast.error('Navigation error detected. Going to home page.');
        navigate(FALLBACK_ROUTE, { replace: true });
        redirectAttemptsRef.current = 0;
        return;
      }
      
      redirectAttemptsRef.current++;
      navigate(targetPath, options);
      
      // Reset counter after successful navigation
      setTimeout(() => {
        redirectAttemptsRef.current = 0;
      }, 1000);
      
    } catch (error) {
      console.error('Navigation error:', error);
      setNavigationError(error instanceof Error ? error : new Error('Unknown navigation error'));
      
      // If navigation fails, try going to home
      if (targetPath !== FALLBACK_ROUTE) {
        toast.error('Navigation failed. Going to home page.');
        navigate(FALLBACK_ROUTE, { replace: true });
      }
    }
  };

  // Normalize URL on initial load and route changes
  useEffect(() => {
    try {
      // Ensure notifications path is always persisted
      ensureNotificationsPathIsPersisted();
      
      // Skip processing for standard routes that don't need special handling
      if (APP_ROUTES.includes(pathname)) {
        return;
      }
      
      // Store the current page info for reload handling
      persistCurrentUrl();
      
      // Extract UUID and normalize if needed
      const uuid = extractUuid(pathname);
      if (uuid && !pathname.startsWith('/post/')) {
        console.log(`Redirecting to normalized post URL for UUID: ${uuid}`);
        const normalizedPath = `/post/${uuid}${hash}${search}`;
        safeNavigate(normalizedPath, { replace: true });
        return;
      }
      
      // Log comment navigations for debugging
      const commentId = extractCommentId(hash);
      if (commentId) {
        console.log(`Navigation to comment: ${commentId} detected`);
      }
    } catch (error) {
      console.error("Error in URL normalization:", error);
      // Show a toast message if there's an error but don't break navigation
      toast.error("Navigation error - try refreshing the page");
    }
  }, [pathname, hash, search, navigate]);

  // Handle initial page load and restore from localStorage if needed
  useEffect(() => {
    try {
      if (initialLoadDoneRef.current || initialNavigationAttemptedRef.current) return;
      
      // Only run once on initial load
      initialLoadDoneRef.current = true;
      initialNavigationAttemptedRef.current = true;
      
      // Special handling for notifications direct access
      if (pathname === '/notifications' || pathname.startsWith('/notifications/')) {
        console.log('Direct access to notifications detected');
        ensureNotificationsPathIsPersisted();
        return; // No need to redirect, this is already a valid route
      }
      
      // Check if we're at root or 404 after a reload
      if (pathname === '/' || pathname === '/404') {
        const lastPath = localStorage.getItem('lastPath');
        const lastUrl = localStorage.getItem('lastUrl');
        const lastTimestamp = localStorage.getItem('lastPathTimestamp');
        const wasOnNotifications = localStorage.getItem('wasOnNotifications');
        
        // Only restore if path was saved recently (within last 5 minutes)
        const isRecent = lastTimestamp && (Date.now() - parseInt(lastTimestamp)) < 5 * 60 * 1000;
        
        if (isRecent) {
          if (wasOnNotifications === 'true') {
            console.log('Restoring notifications page from recent navigation');
            safeNavigate('/notifications', { replace: true });
            return;
          }
          
          if (lastPath) {
            console.log('Restoring from recent navigation:', lastPath);
            safeNavigate(lastPath, { replace: true });
          }
        }
      }
      
      // Handle direct post/comment URL access
      const uuid = extractUuid(pathname);
      if (uuid && !pathname.startsWith('/post/')) {
        console.log(`Direct access with UUID: ${uuid}`);
        const normalizedPath = `/post/${uuid}${hash}${search}`;
        safeNavigate(normalizedPath, { replace: true });
      }
    } catch (error) {
      console.error("Error in initial load URL processing:", error);
      // If there's an error restoring from localStorage, ensure we redirect to home
      if (pathname === '/404') {
        safeNavigate('/', { replace: true });
      }
    }
  }, [pathname, navigate]);

  // Add event listener for before unload to persist state
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        persistCurrentUrl();
        ensureNotificationsPathIsPersisted();
      } catch (error) {
        console.error("Error in beforeunload handler:", error);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname, hash, search]);

  // Display error if navigation failed
  useEffect(() => {
    if (navigationError) {
      toast.error(`Navigation error: ${navigationError.message}`);
    }
  }, [navigationError]);

  // Component doesn't render anything visible
  return null;
};
