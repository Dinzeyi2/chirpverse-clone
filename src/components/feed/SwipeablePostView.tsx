
import React, { useState, useEffect, useRef } from 'react';
import PostCard from './PostCard';
import { Post } from '@/lib/data';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/theme-provider';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";
import { useScreenSize } from '@/hooks/use-mobile';
import PostSkeleton from './PostSkeleton';

interface PostWithActions extends Post {
  actions?: React.ReactNode;
  languages?: string[];
}

interface SwipeablePostViewProps {
  posts: PostWithActions[];
  loading?: boolean;
  loadMore?: () => void;
}

const SwipeablePostView: React.FC<SwipeablePostViewProps> = ({ posts, loading = false, loadMore }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const { theme } = useTheme();
  const { isMobile, width } = useScreenSize();
  const [isInitialRender, setIsInitialRender] = useState(true);
  const prevPostsRef = useRef<PostWithActions[]>([]);
  const [carouselKey, setCarouselKey] = useState<string>(`carousel-${Date.now()}`);
  const hasReachedEndRef = useRef(false);

  useEffect(() => {
    // Mark that we've completed initial render after a short timeout
    const timer = setTimeout(() => {
      setIsInitialRender(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!api) {
      return;
    }

    const onSelect = () => {
      const newIndex = api.selectedScrollSnap();
      setCurrentIndex(newIndex);
      
      // Check if we reached the end of the carousel (last post)
      if (newIndex === posts.length - 1 && !hasReachedEndRef.current) {
        hasReachedEndRef.current = true;
        console.log("Reached end of posts, loading more...");
        // Load more posts if available
        if (loadMore) {
          loadMore();
        }
      } else if (newIndex < posts.length - 2) {
        // Reset the flag when we're not near the end
        hasReachedEndRef.current = false;
      }
    };

    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, posts.length, loadMore]);

  // IMPROVED: More efficient post changes detection
  useEffect(() => {
    // If posts have changed
    if (posts.length > 0) {
      console.log("Posts changed, checking if carousel update needed");
      
      const currentFirstPostId = posts[0]?.id;
      const prevFirstPostId = prevPostsRef.current[0]?.id;
      
      // Force carousel reset when new posts are added or the array changes significantly
      if (
        posts.length !== prevPostsRef.current.length || 
        currentFirstPostId !== prevFirstPostId
      ) {
        console.log("Posts list significantly changed, forcing carousel refresh");
        
        // Generate new key to force carousel re-render
        setCarouselKey(`carousel-${Date.now()}`);
        
        // Reset to first slide immediately
        setTimeout(() => {
          if (api) {
            api.scrollTo(0);
            setCurrentIndex(0);
            hasReachedEndRef.current = false;
          }
        }, 10);
      }
      
      // Always update our reference to the current posts
      prevPostsRef.current = [...posts];
    }
  }, [posts, api]);

  // Calculate post sizes based on screen width
  const getPostSizing = () => {
    // For mobile devices, make posts smaller to show more of adjacent posts
    if (width <= 480) {
      return {
        basis: "90%",          // Takes 90% of the container width on very small devices
        scale: "scale-95",     // Base scale for current post
        opacity: "opacity-100" // Full opacity for current post
      };
    } else if (width <= 768) {
      return {
        basis: "85%",          // Takes 85% of the container width on mobile devices
        scale: "scale-95",     // Base scale for current post
        opacity: "opacity-100" // Full opacity for current post
      };
    } else if (width <= 1024) {
      return {
        basis: "1/2",          // Takes half the container width on tablets
        scale: "scale-100",
        opacity: "opacity-100"
      };
    } else {
      return {
        basis: "1/3",          // Takes a third of the container width on desktops
        scale: "scale-100",
        opacity: "opacity-100"
      };
    }
  };

  const { basis, scale, opacity } = getPostSizing();

  // Determine colors based on theme
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedTextColor = theme === 'dark' ? 'text-neutral-400' : 'text-gray-500';
  const bgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100';
  const navBgColor = theme === 'dark' ? 'bg-black/40 hover:bg-black/60 text-white' : 'bg-gray-700/40 hover:bg-gray-700/60 text-white';

  // Custom navigation handlers to work with the loadMore function
  const handlePrevious = () => {
    api?.scrollPrev();
  };

  const handleNext = () => {
    // If we're at the last slide, try to load more posts first
    if (currentIndex === posts.length - 1) {
      if (loadMore) {
        console.log("At last post, loading more before scrolling");
        loadMore();
        // Scroll will happen after new posts are loaded
      }
    } else {
      api?.scrollNext();
    }
  };

  if (loading && isInitialRender) {
    return (
      <div className="p-4 space-y-6">
        <PostSkeleton count={1} />
      </div>
    );
  }

  if (posts.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className={`w-16 h-16 mb-4 ${mutedTextColor}`}>
          <Inbox className="w-full h-full" />
        </div>
        <h3 className={`text-2xl font-bold mb-2 ${textColor}`}>No posts yet</h3>
        <p className={`${mutedTextColor} mb-6 max-w-md`}>When posts are published, they'll show up here.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden py-4 relative">
      <Carousel 
        className="w-full max-w-6xl mx-auto"
        setApi={setApi}
        opts={{
          loop: false, // Changed to false to properly detect end of carousel
          align: "center",
          skipSnaps: false,
          dragFree: false,
          containScroll: "trimSnaps"
        }}
        key={carouselKey} // Dynamic key to force re-render when posts change
      >
        <CarouselContent className="mx-auto">
          {posts.map((post, index) => (
            <CarouselItem 
              key={`${post.id}-${index}`} // IMPROVED: Better key for more reliable renders
              className={`basis-${basis} flex justify-center items-center pl-0`}
            >
              <div className={cn(
                "relative w-full transition-all duration-300 max-w-[350px] sm:max-w-[400px] mx-auto"
              )}>
                <div className="relative">
                  {post.actions && (
                    <div className="absolute top-3 right-3 z-30">
                      {post.actions}
                    </div>
                  )}
                  <PostCard post={post} />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {posts.length > 1 && (
          <>
            <button 
              onClick={handlePrevious} 
              className={`absolute left-1 sm:left-4 top-1/2 transform -translate-y-1/2 ${navBgColor} z-30 h-10 w-10 rounded-full flex items-center justify-center`}
              aria-label="Previous post"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            <button 
              onClick={handleNext} 
              className={`absolute right-1 sm:right-4 top-1/2 transform -translate-y-1/2 ${navBgColor} z-30 h-10 w-10 rounded-full flex items-center justify-center`}
              aria-label="Next post"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </Carousel>
    </div>
  );
};

export default SwipeablePostView;
