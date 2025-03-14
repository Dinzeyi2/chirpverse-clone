
import React, { useState, useRef, useEffect } from 'react';
import PostCard from './PostCard';
import { Post } from '@/lib/data';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    <div className="w-full overflow-hidden py-8">
      <Carousel 
        className="w-full mx-auto"
        setApi={setApi}
      >
        <CarouselContent>
          {posts.map((post, index) => (
            <CarouselItem key={post.id} className="md:basis-2/3 lg:basis-1/2 mx-auto flex justify-center items-center pl-0">
              <div className={cn(
                "relative w-full max-w-2xl transition-all duration-300",
                currentIndex === index ? "scale-100 opacity-100" : "scale-90 opacity-80"
              )}>
                <PostCard post={post} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {!isMobile && (
          <>
            <CarouselPrevious className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white border-none" />
            <CarouselNext className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white border-none" />
          </>
        )}

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/40 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {posts.length}
        </div>
      </Carousel>
    </div>
  );
};

export default SwipeablePostView;
