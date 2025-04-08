
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Enhanced UUID extraction with better pattern matching
  const extractPostId = () => {
    // First try standard format - /post/{uuid}
    const standardMatch = location.pathname.match(/\/post\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (standardMatch) return standardMatch[1];
    
    // Try alternative formats - /p/{uuid} or /posts/{uuid}
    const altFormatMatch = location.pathname.match(/\/(p|posts)\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (altFormatMatch) return altFormatMatch[2];
    
    // Try to see if the path itself is a UUID (happens when email link is malformed)
    const uuidPattern = /^\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
    const directMatch = location.pathname.match(uuidPattern);
    if (directMatch) return directMatch[1];
    
    // Try to see if the entire path excluding the first slash is a UUID
    const rawPath = location.pathname.substring(1); // Remove the leading slash
    if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(rawPath)) {
      return rawPath;
    }
    
    // Check for UUID anywhere in the path (more aggressive matching)
    const uuidInPathMatch = location.pathname.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (uuidInPathMatch) {
      return uuidInPathMatch[1];
    }
    
    return null;
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
    
    // If path is a UUID, automatically redirect to correct format
    const uuid = location.pathname.substring(1); // Remove leading slash
    const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    
    if (uuidPattern.test(uuid)) {
      console.log(`Auto-redirecting from raw UUID path to /post/${uuid}${location.hash || ''}${location.search || ''}`);
      navigate(`/post/${uuid}${location.hash || ''}${location.search || ''}`, { replace: true });
      toast.success("Redirected to post");
      return;
    }
    
    // Handle comment URLs more specifically
    const commentId = extractCommentId();
    const postId = extractPostId();
    
    if (commentId && postId) {
      console.log(`Found comment ID: ${commentId} for post: ${postId}, redirecting`);
      navigate(`/post/${postId}#comment-${commentId}${location.search || ''}`, { replace: true });
      toast.success("Redirected to comment");
      return;
    }
    
    // Check if the path contains a UUID anywhere - more aggressive matching
    const uuidInPathMatch = location.pathname.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (uuidInPathMatch) {
      const extractedUuid = uuidInPathMatch[1];
      console.log(`Found UUID in path: ${extractedUuid}, redirecting to proper format`);
      navigate(`/post/${extractedUuid}${location.hash || ''}${location.search || ''}`, { replace: true });
      toast.success("Redirected to the correct post format");
    }
  }, [location.pathname, location.hash, location.search, navigate]);

  const postId = extractPostId();
  const commentId = extractCommentId();
  
  console.log("NotFound - Current path:", location.pathname);
  console.log("NotFound - Extracted post ID:", postId);
  console.log("NotFound - Extracted comment ID:", commentId);

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
            >
              Go to post
            </Link>
            
            {commentId ? (
              <Link 
                to={`/post/${postId}#comment-${commentId}`} 
                className="mt-2 text-xBlue hover:underline font-medium block"
              >
                Go to specific comment
              </Link>
            ) : (
              <Link 
                to={`/post/${postId}#comments`} 
                className="mt-2 text-xBlue hover:underline font-medium block"
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
