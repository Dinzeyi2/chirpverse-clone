
import React from 'react';
import { useTheme } from '@/components/theme/theme-provider';

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
            <div className={`rounded-full ${skeletonBg} h-12 w-12`}></div>
            <div className="flex-1 space-y-2 py-1">
              <div className={`h-4 ${skeletonBg} rounded w-1/4`}></div>
              <div className={`h-3 ${skeletonBg} rounded w-1/6`}></div>
            </div>
          </div>
          <div className="space-y-3 mt-3">
            <div className={`h-4 ${skeletonBg} rounded`}></div>
            <div className={`h-4 ${skeletonBg} rounded w-5/6`}></div>
            <div className={`h-4 ${skeletonBg} rounded w-3/4`}></div>
          </div>
          <div className={`h-64 ${skeletonBg} rounded mt-4`}></div>
          <div className="flex justify-between mt-4">
            <div className={`h-5 ${skeletonBg} rounded w-1/6`}></div>
            <div className={`h-5 ${skeletonBg} rounded w-1/6`}></div>
            <div className={`h-5 ${skeletonBg} rounded w-1/6`}></div>
            <div className={`h-5 ${skeletonBg} rounded w-1/6`}></div>
          </div>
        </div>
      ))}
    </>
  );
};

export default PostSkeleton;
