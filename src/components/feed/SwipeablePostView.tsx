
import React, { useState, useRef, useEffect } from 'react';
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

interface PostWithActions extends Post {
  actions?: React.ReactNode;
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
  const bgColor = theme === 'dark' ? 'bg-gray-200' : 'bg-gray-100';
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
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden py-4">
      <Carousel 
        className="w-full max-w-6xl mx-auto"
        setApi={setApi}
        opts={{
          loop: true,
          align: "center",
          dragFree: isMobile, // Enable drag free scrolling on mobile for smoother experience
        }}
      >
        <CarouselContent className="mx-auto">
          {posts.map((post, index) => (
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
                  <PostCard post={post} />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <CarouselPrevious className={`absolute left-1 sm:left-4 top-1/2 transform -translate-y-1/2 ${navBgColor} border-none z-30 h-7 w-7 sm:h-8 sm:w-8`} />
        <CarouselNext className={`absolute right-1 sm:right-4 top-1/2 transform -translate-y-1/2 ${navBgColor} border-none z-30 h-7 w-7 sm:h-8 sm:w-8`} />

        {/* Embedded counter inside the carousel area */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center items-center gap-2 z-20 text-xs">
          <span className={`${navBgColor} px-2 py-1 rounded-full`}>
            {currentIndex + 1} / {posts.length}
          </span>
        </div>
      </Carousel>
    </div>
  );
};

export default SwipeablePostView;
