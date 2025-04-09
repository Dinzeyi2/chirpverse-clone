
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Enhanced UUID extraction with better pattern matching
  const extractPostId = () => {
    // Check for UUID anywhere in the path
    const uuidMatch = location.pathname.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    return uuidMatch ? uuidMatch[1] : null;
  };

  // Extract comment ID from hash if present
  const extractCommentId = () => {
    if (location.hash && location.hash.startsWith('#comment-')) {
      return location.hash.substring('#comment-'.length);
    }
    return null;
  };

  useEffect(() => {
    console.log("NotFound component rendered for path:", location.pathname, "hash:", location.hash);
    
    // Check if this is a direct access to the notifications page
    if (location.pathname === "/notifications" || location.pathname.startsWith("/notifications/")) {
      console.log("Redirecting to notifications page");
      localStorage.setItem('lastPath', "/notifications");
      localStorage.setItem('lastUrl', window.location.origin + "/notifications");
      localStorage.setItem('lastPathTimestamp', Date.now().toString());
      
      // Navigate to the notifications page
      navigate("/notifications", { replace: true });
      return;
    }
    
    // Persist the current path attempt
    if (location.pathname.includes('/post/') || extractPostId()) {
      const fullUrl = window.location.href;
      console.log("Persisting current URL:", fullUrl);
      localStorage.setItem('lastUrl', fullUrl);
      localStorage.setItem('lastPath', location.pathname + location.hash + location.search);
      localStorage.setItem('lastPathTimestamp', Date.now().toString());
    }
    
    // Auto-redirect for UUID paths
    const postId = extractPostId();
    if (postId) {
      console.log("Found UUID in path, redirecting to proper format");
      const normalizedPath = `/post/${postId}${location.hash || ''}${location.search || ''}`;
      
      // Store normalized path for reload persistence
      localStorage.setItem('lastPath', normalizedPath);
      localStorage.setItem('lastUrl', window.location.origin + normalizedPath);
      localStorage.setItem('lastPathTimestamp', Date.now().toString());
      
      // Navigate to normalized path
      navigate(normalizedPath, { replace: true });
      toast.success("Redirected to post");
    }
  }, [location.pathname, location.hash, location.search, navigate]);

  const postId = extractPostId();
  const commentId = extractCommentId();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center bg-secondary p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-6xl font-bold mb-4 text-red-500">404</h1>
        <p className="text-xl text-foreground mb-6">Oops! Page not found</p>
        <p className="text-muted-foreground mb-6">
          The route <span className="font-mono bg-background px-2 py-1 rounded">{location.pathname}{location.hash}</span> does not exist or you may not have permission to access it.
        </p>
        
        {postId && (
          <div className="mb-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              It looks like you're trying to access a post. Click below to go to the correct post URL:
            </p>
            <Link 
              to={`/post/${postId}${location.hash || ''}${location.search || ''}`} 
              className="mt-2 text-xBlue hover:underline font-medium block"
              onClick={() => {
                // Store the path being navigated to
                const path = `/post/${postId}${location.hash || ''}${location.search || ''}`;
                localStorage.setItem('lastPath', path);
                localStorage.setItem('lastUrl', window.location.origin + path);
                localStorage.setItem('lastPathTimestamp', Date.now().toString());
              }}
            >
              Go to post
            </Link>
            
            {commentId ? (
              <Link 
                to={`/post/${postId}#comment-${commentId}`} 
                className="mt-2 text-xBlue hover:underline font-medium block"
                onClick={() => {
                  const path = `/post/${postId}#comment-${commentId}`;
                  localStorage.setItem('lastPath', path);
                  localStorage.setItem('lastUrl', window.location.origin + path);
                  localStorage.setItem('lastPathTimestamp', Date.now().toString());
                }}
              >
                Go to specific comment
              </Link>
            ) : (
              <Link 
                to={`/post/${postId}#comments`} 
                className="mt-2 text-xBlue hover:underline font-medium block"
                onClick={() => {
                  const path = `/post/${postId}#comments`;
                  localStorage.setItem('lastPath', path);
                  localStorage.setItem('lastUrl', window.location.origin + path);
                  localStorage.setItem('lastPathTimestamp', Date.now().toString());
                }}
              >
                Go to post comments
              </Link>
            )}
          </div>
        )}
        
        <Link to="/" className="flex items-center justify-center gap-2 text-xBlue hover:text-xBlue/80 font-medium">
          <ArrowLeft size={16} />
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
