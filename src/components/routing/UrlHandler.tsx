
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// UUID pattern for validating direct UUID routes
const UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

// List of routes that should be persisted for reload
const PERSIST_ROUTES = ['/post/', '/notifications', '/for-you'];

// List of valid app routes to check against
const APP_ROUTES = ['/auth', '/explore', '/bookmarks', '/profile', '/settings', '/notifications', '/for-you'];

// Cache for page transitions to avoid excessive localStorage operations
const pageTransitionCache = new Map();

/**
 * Handle all URL normalization and persistence in one place
 * to avoid conflicts between different mechanisms
 */
export const UrlHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialLoadDoneRef = useRef(false);
  const { pathname, hash, search } = location;
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Extract a UUID from various URL patterns - optimized
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
  
  // Check if the path is a profile path with UUID
  const isProfilePath = (path: string): boolean => {
    return path.startsWith('/profile/');
  };
  
  // Extract comment ID from hash
  const extractCommentId = (hashStr: string): string | null => {
    if (hashStr && hashStr.startsWith('#comment-')) {
      return hashStr.substring('#comment-'.length);
    }
    return null;
  };

  // Store current URL in localStorage for persistence across reloads - optimized
  const persistCurrentUrl = () => {
    // Check if the current route should be persisted
    const shouldPersist = PERSIST_ROUTES.some(route => pathname.includes(route));
    
    if (shouldPersist) {
      const fullUrlKey = `${pathname}${hash}${search}`;
      
      // Check if we already persisted this exact URL recently
      if (pageTransitionCache.has(fullUrlKey)) {
        const cachedTime = pageTransitionCache.get(fullUrlKey);
        if (Date.now() - cachedTime < 5000) {
          return; // Skip if we persisted this URL less than 5 seconds ago
        }
      }
      
      const fullUrl = window.location.href;
      console.log('Persisting URL:', fullUrl);
      localStorage.setItem('lastUrl', fullUrl);
      localStorage.setItem('lastPath', pathname + hash + search);
      localStorage.setItem('lastPathTimestamp', Date.now().toString());
      
      // Cache this persistence operation
      pageTransitionCache.set(fullUrlKey, Date.now());
      
      // Specifically mark if this was a notifications path
      if (pathname === '/notifications' || pathname.startsWith('/notifications/')) {
        localStorage.setItem('wasOnNotifications', 'true');
      }
    }
  };

  // Special function to handle notifications path persistence
  const ensureNotificationsPathIsPersisted = () => {
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
  };

  // Optimize navigation performance
  useEffect(() => {
    const startTransition = performance.now();
    
    // Set transition state for potential loading indicators
    setIsTransitioning(true);
    
    // Wait until navigation is complete
    const completeTransition = () => {
      const duration = performance.now() - startTransition;
      console.log(`Navigation to ${pathname} completed in ${duration.toFixed(2)}ms`);
      setIsTransitioning(false);
      
      // Show toast for slow transitions (debugging purposes)
      if (duration > 1000) {
        console.warn(`Slow navigation detected: ${duration.toFixed(2)}ms to ${pathname}`);
      }
    };
    
    // Schedule transition completion
    const timerId = setTimeout(completeTransition, 10);
    return () => clearTimeout(timerId);
  }, [pathname]);

  // Normalize URL on initial load and route changes
  useEffect(() => {
    // Ensure notifications path is always persisted
    ensureNotificationsPathIsPersisted();
    
    // Skip processing for standard routes that don't need special handling
    if (APP_ROUTES.includes(pathname) || isProfilePath(pathname)) {
      return;
    }
    
    // Store the current page info for reload handling
    persistCurrentUrl();
    
    // Extract UUID and normalize if needed - but don't redirect profile paths
    const uuid = extractUuid(pathname);
    if (uuid && !pathname.startsWith('/post/') && !pathname.startsWith('/profile/')) {
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
          navigate('/notifications', { replace: true });
          return;
        }
        
        if (lastPath) {
          console.log('Restoring from recent navigation:', lastPath);
          navigate(lastPath, { replace: true });
        }
      }
    }
    
    // Handle direct post/comment URL access - but don't redirect profile paths
    const uuid = extractUuid(pathname);
    if (uuid && !pathname.startsWith('/post/') && !pathname.startsWith('/profile/')) {
      console.log(`Direct access with UUID: ${uuid}`);
      const normalizedPath = `/post/${uuid}${hash}${search}`;
      navigate(normalizedPath, { replace: true });
    }
  }, [pathname, navigate]);

  // Add event listener for before unload to persist state
  useEffect(() => {
    const handleBeforeUnload = () => {
      persistCurrentUrl();
      ensureNotificationsPathIsPersisted();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname, hash, search]);

  // Prefetch adjacent routes for faster navigation
  useEffect(() => {
    // Prefetch logic based on current route
    const prefetchAdjacentRoutes = () => {
      const routesToPrefetch = [];
      
      // For home page, prefetch explore and for-you
      if (pathname === '/') {
        routesToPrefetch.push('/explore', '/for-you');
      }
      
      // For other main routes, always prefetch home
      else if (['/explore', '/bookmarks', '/profile', '/for-you'].includes(pathname)) {
        routesToPrefetch.push('/');
      }
      
      // Prefetch all routes
      routesToPrefetch.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        link.as = 'document';
        document.head.appendChild(link);
        console.log(`Prefetching route: ${route}`);
      });
    };
    
    // Run prefetch after navigation completes
    if (!isTransitioning) {
      prefetchAdjacentRoutes();
    }
  }, [pathname, isTransitioning]);

  // Component doesn't render anything visible
  return null;
};
