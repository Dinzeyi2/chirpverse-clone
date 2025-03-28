
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
}

const SwipeablePostView: React.FC<SwipeablePostViewProps> = ({ posts, loading = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const { theme } = useTheme();
  const { isMobile, width } = useScreenSize();
  const [isInitialRender, setIsInitialRender] = useState(true);
  const prevPostsRef = useRef<PostWithActions[]>([]);
  const [carouselKey, setCarouselKey] = useState<string>(`carousel-${Date.now()}`);
  const engagementSignatureRef = useRef<string>('');

  // Effect to mark initial render complete
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialRender(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Set up API event listeners
  useEffect(() => {
    if (!api) {
      return;
    }

    const onSelect = () => {
      setCurrentIndex(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Generate signature for engagement data to detect changes
  const getCurrentEngagementSignature = () => {
    return posts.map(post => 
      `${post.id}:${post.likes}:${post.replies}:${post.comments || 0}`
    ).join('|');
  };

  // Monitor posts changes to update carousel
  useEffect(() => {
    if (posts.length > 0) {
      console.log("Posts received, checking if carousel update needed");
      
      const postsChanged = posts.length !== prevPostsRef.current.length ||
                          posts[0]?.id !== prevPostsRef.current[0]?.id;
      
      // Check if engagement data has changed
      const currentEngagementSignature = getCurrentEngagementSignature();
      const engagementChanged = currentEngagementSignature !== engagementSignatureRef.current;
      
      if (engagementChanged) {
        console.log("Engagement data changed, updating view");
        engagementSignatureRef.current = currentEngagementSignature;
      }
      
      // Reset carousel when posts change significantly or engagement changes
      if (postsChanged || engagementChanged) {
        console.log("Force carousel refresh due to data changes");
        setCarouselKey(`carousel-${Date.now()}`);
        
        // Reset to first slide if post list order changed
        if (postsChanged) {
          setTimeout(() => {
            if (api) {
              api.scrollTo(0);
              setCurrentIndex(0);
            }
          }, 10);
        }
      }
      
      // Update reference to current posts
      prevPostsRef.current = [...posts];
    }
  }, [posts, api]);

  // Calculate post sizing based on screen width
  const getPostSizing = () => {
    if (width <= 480) {
      return {
        basis: "90%",
        scale: "scale-95",
        opacity: "opacity-100"
      };
    } else if (width <= 768) {
      return {
        basis: "85%",
        scale: "scale-95",
        opacity: "opacity-100"
      };
    } else if (width <= 1024) {
      return {
        basis: "1/2",
        scale: "scale-100",
        opacity: "opacity-100"
      };
    } else {
      return {
        basis: "1/3",
        scale: "scale-100",
        opacity: "opacity-100"
      };
    }
  };

  const { basis, scale, opacity } = getPostSizing();

  // Theme-specific colors
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedTextColor = theme === 'dark' ? 'text-neutral-400' : 'text-gray-500';
  const bgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100';
  const navBgColor = theme === 'dark' ? 'bg-black/40 hover:bg-black/60 text-white' : 'bg-gray-700/40 hover:bg-gray-700/60 text-white';

  // Show loading state only on initial render
  if (loading && isInitialRender) {
    return (
      <div className="p-4 space-y-6">
        <PostSkeleton count={1} />
      </div>
    );
  }

  // Show empty state when no posts
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
          loop: true,
          align: "center",
          skipSnaps: false,
          dragFree: false,
          containScroll: "trimSnaps"
        }}
        key={carouselKey}
      >
        <CarouselContent className="mx-auto">
          {posts.map((post, index) => (
            <CarouselItem 
              key={`${post.id}-${index}-${post.likes}-${post.replies}-${post.comments || 0}-${Date.now()}`}
              className={`basis-${basis} flex justify-center items-center pl-0`}
            >
              <div className={cn(
                "relative w-full transition-all duration-300 max-w-[350px] sm:max-w-[400px] mx-auto",
                currentIndex === index 
                  ? `${scale} ${opacity} z-20` 
                  : "scale-90 opacity-70 z-10"
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
              onClick={() => api?.scrollPrev()} 
              className={`absolute left-1 sm:left-4 top-1/2 transform -translate-y-1/2 ${navBgColor} z-30 h-10 w-10 rounded-full flex items-center justify-center`}
              aria-label="Previous post"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            <button 
              onClick={() => api?.scrollNext()} 
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
