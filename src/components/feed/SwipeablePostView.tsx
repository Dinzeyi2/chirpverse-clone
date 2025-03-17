
import React, { useState, useRef, useEffect } from 'react';
import PostCard from './PostCard';
import { Post } from '@/lib/data';
import { ChevronLeft, ChevronRight, Inbox, RefreshCw } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { parseProfileField } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PostWithActions extends Post {
  actions?: React.ReactNode;
}

interface SwipeablePostViewProps {
  posts: PostWithActions[];
  loading?: boolean;
  onRefresh?: () => void;
}

const SwipeablePostView: React.FC<SwipeablePostViewProps> = ({ posts, loading = false, onRefresh }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const { theme } = useTheme();
  const { isMobile, width } = useScreenSize();
  const { user, profile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const userCompanies = profile?.company ? parseProfileField(profile.company) : [];

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

  // Check if a post contains company tags matching user's companies
  const isPostFromUserCompany = (postContent: string) => {
    if (!user || !userCompanies.length) return false;
    
    // Look for @company tags in the post content
    return userCompanies.some(company => {
      const tagPattern = new RegExp(`@${company.trim()}\\b`, 'i');
      return tagPattern.test(postContent);
    });
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        toast.success("Content refreshed!");
      } catch (error) {
        console.error("Error refreshing content:", error);
        toast.error("Failed to refresh content. Please try again.");
      } finally {
        setIsRefreshing(false);
      }
    }
  };

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
  const bgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200';
  const navBgColor = theme === 'dark' ? 'bg-black/40 hover:bg-black/60 text-white' : 'bg-gray-700/40 hover:bg-gray-700/60 text-white';

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="animate-pulse">
          <div className={`aspect-square w-full max-w-3xl mx-auto ${bgColor} rounded-xl`}></div>
          <div className="flex justify-between mt-4 mx-auto max-w-3xl">
            <div className={`h-8 ${bgColor} rounded w-24`}></div>
            <div className={`h-8 ${bgColor} rounded w-24`}></div>
            <div className={`h-8 ${bgColor} rounded w-24`}></div>
          </div>
          <div className={`h-12 ${bgColor} rounded mt-4 mx-auto max-w-3xl`}></div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className={`w-16 h-16 mb-4 ${mutedTextColor}`}>
          <Inbox className="w-full h-full" />
        </div>
        <h3 className={`text-2xl font-bold mb-2 ${textColor}`}>No posts yet</h3>
        <p className={`${mutedTextColor} mb-6 max-w-md`}>When posts are published, they'll show up here.</p>
        {onRefresh && (
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" className="mt-4">
            {isRefreshing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden py-4 relative">
      {onRefresh && (
        <div className="absolute top-0 right-4 z-30">
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing} 
            variant="ghost" 
            size="sm" 
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      )}

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
      >
        <CarouselContent className="mx-auto">
          {posts.map((post, index) => {
            const isFromUserCompany = user ? isPostFromUserCompany(post.content) : false;
            
            return (
              <CarouselItem 
                key={post.id} 
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
                    {user && isFromUserCompany && (
                      <div className="absolute top-1 left-1 z-30 bg-blue-500/80 text-white text-xs px-2 py-0.5 rounded-full">
                        Your Company
                      </div>
                    )}
                    <PostCard post={post} />
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        
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
      </Carousel>
    </div>
  );
};

export default SwipeablePostView;
