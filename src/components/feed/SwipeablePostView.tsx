
import React, { useState, useRef, useEffect } from 'react';
import PostCard from './PostCard';
import { Post } from '@/lib/data';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SwipeablePostViewProps {
  posts: Post[];
  loading?: boolean;
}

const SwipeablePostView: React.FC<SwipeablePostViewProps> = ({ posts, loading = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if device is mobile based on screen width
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Handle navigation to previous post
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      toast.info('Previous post');
    } else {
      toast.info('You reached the beginning of your feed');
    }
  };

  // Handle navigation to next post
  const goToNext = () => {
    if (currentIndex < posts.length - 1) {
      setCurrentIndex(currentIndex + 1);
      toast.info('Next post');
    } else {
      toast.info('You reached the end of your feed');
    }
  };

  // Touch event handlers for swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      goToNext();
    }
    
    if (isRightSwipe) {
      goToPrevious();
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Mouse drag for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStart(e.clientX);
    
    const handleMouseMove = (e: MouseEvent) => {
      setTouchEnd(e.clientX);
    };
    
    const handleMouseUp = () => {
      if (!touchStart || !touchEnd) return;
      
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;
      
      if (isLeftSwipe) {
        goToNext();
      }
      
      if (isRightSwipe) {
        goToPrevious();
      }
      
      setTouchStart(null);
      setTouchEnd(null);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="animate-pulse">
          <div className="flex space-x-4">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
              <div className="h-40 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 mb-4 text-xGray">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-full h-full fill-current">
            <g>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
            </g>
          </svg>
        </div>
        <h3 className="text-2xl font-bold mb-2">No posts yet</h3>
        <p className="text-xGray mb-6 max-w-md">When posts are published, they'll show up here.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full" ref={containerRef}>
      {/* Current Post */}
      <div 
        className="h-full w-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <div className={cn(
          "transition-all duration-300 transform",
          touchStart && touchEnd && touchStart > touchEnd ? "-translate-x-6" : "",
          touchStart && touchEnd && touchStart < touchEnd ? "translate-x-6" : ""
        )}>
          {posts[currentIndex] && (
            <div className="relative">
              <PostCard post={posts[currentIndex]} />
              
              {/* Mobile indicator text */}
              {isMobile && (
                <div className="text-center text-xGray text-sm py-2">
                  Swipe to navigate • {currentIndex + 1} of {posts.length}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation for desktop */}
      {!isMobile && (
        <>
          {/* Left navigation arrow */}
          <button 
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className={cn(
              "absolute top-1/2 left-3 transform -translate-y-1/2 p-3 rounded-full bg-black/10 text-black hover:bg-black/20 transition-all z-10",
              currentIndex === 0 ? "opacity-30 cursor-not-allowed" : "opacity-70 hover:opacity-100"
            )}
          >
            <ChevronLeft size={24} />
          </button>

          {/* Right navigation arrow */}
          <button
            onClick={goToNext}
            disabled={currentIndex === posts.length - 1}
            className={cn(
              "absolute top-1/2 right-3 transform -translate-y-1/2 p-3 rounded-full bg-black/10 text-black hover:bg-black/20 transition-all z-10",
              currentIndex === posts.length - 1 ? "opacity-30 cursor-not-allowed" : "opacity-70 hover:opacity-100"
            )}
          >
            <ChevronRight size={24} />
          </button>

          {/* Post counter indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/20 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {posts.length}
          </div>
        </>
      )}
    </div>
  );
};

export default SwipeablePostView;
