
import React from 'react';
import { useTheme } from '@/components/theme/theme-provider';
import { Skeleton } from '@/components/ui/skeleton';

interface PostSkeletonProps {
  count?: number;
}

const PostSkeleton: React.FC<PostSkeletonProps> = ({ count = 3 }) => {
  const { theme } = useTheme();
  const skeletonBg = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200';
  
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse mb-6">
          <div className="flex space-x-4">
            <Skeleton className="rounded-full h-12 w-12" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-1/6" />
            </div>
          </div>
          <div className="space-y-3 mt-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-64 w-full mt-4" />
          <div className="flex justify-between mt-4">
            <Skeleton className="h-5 w-1/6" />
            <Skeleton className="h-5 w-1/6" />
            <Skeleton className="h-5 w-1/6" />
            <Skeleton className="h-5 w-1/6" />
          </div>
        </div>
      ))}
    </>
  );
};

export default PostSkeleton;
