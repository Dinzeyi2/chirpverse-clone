import React, { useState, useRef, useEffect } from 'react';
import PostCard from './PostCard';
import { Post } from '@/lib/data';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";

interface SwipeablePostViewProps {
  posts: Post[];
  loading?: boolean;
}

const SwipeablePostView: React.FC<SwipeablePostViewProps> = ({ posts, loading = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [api, setApi] = useState<CarouselApi | null>(null);

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

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="animate-pulse">
          <div className="aspect-square w-full max-w-3xl mx-auto bg-gray-200 rounded-xl"></div>
          <div className="flex justify-between mt-4 mx-auto max-w-3xl">
            <div className="h-8 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded mt-4 mx-auto max-w-3xl"></div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 mb-4 text-neutral-500">
          <Inbox className="w-full h-full" />
        </div>
        <h3 className="text-2xl font-bold mb-2">No posts yet</h3>
        <p className="text-neutral-500 mb-6 max-w-md">When posts are published, they'll show up here.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden py-8">
      <Carousel 
        className="w-full max-w-6xl mx-auto"
        setApi={setApi}
        opts={{
          loop: true,
          align: "center"
        }}
      >
        <CarouselContent>
          {posts.map((post, index) => (
            <CarouselItem key={post.id} className="md:basis-1/2 lg:basis-1/3 flex justify-center items-center pl-0">
              <div className={cn(
                "relative w-full transition-all duration-300 max-w-[400px] sm:max-w-[450px]",
                currentIndex === index 
                  ? "scale-100 opacity-100 z-20" 
                  : "scale-90 opacity-50 z-10"
              )}>
                <PostCard post={post} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {!isMobile && (
          <>
            <CarouselPrevious className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white border-none z-30" />
            <CarouselNext className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white border-none z-30" />
          </>
        )}

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm z-30">
          {currentIndex + 1} / {posts.length}
        </div>
      </Carousel>
    </div>
  );
};

export default SwipeablePostView;
