import React, { useState, useEffect } from 'react';
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

interface SwipeablePostViewProps {
  posts: Post[];
  loading?: boolean;
}

const SwipeablePostView: React.FC<SwipeablePostViewProps> = ({ posts, loading = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const { theme } = useTheme();
  const { isMobile, width } = useScreenSize();
  const [isInitialRender, setIsInitialRender] = useState(true);

  useEffect(() => {
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
      setCurrentIndex(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

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

  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedTextColor = theme === 'dark' ? 'text-neutral-400' : 'text-gray-500';
  const bgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100';
  const navBgColor = theme === 'dark' ? 'bg-black/40 hover:bg-black/60 text-white' : 'bg-gray-700/40 hover:bg-gray-700/60 text-white';

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
          loop: true,
          align: "center",
          skipSnaps: false,
          dragFree: false,
          containScroll: "trimSnaps"
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
