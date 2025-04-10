
import React from 'react';
import { useTheme } from '@/components/theme/theme-provider';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingFallbackProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  message = 'Loading...', 
  fullScreen = true
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className={cn(
      "flex flex-col items-center justify-center z-50",
      fullScreen ? "fixed inset-0 min-h-screen" : "w-full py-12",
      isDark ? "bg-black" : "bg-lightBeige"
    )}>
      <div className="w-16 h-16 relative">
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <img 
            src="/lovable-uploads/3466f833-541a-44f1-86a1-5e3f5ed4d8ed.png" 
            alt="Loading" 
            className="w-10 h-10 animate-pulse"
          />
        </div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="w-16 h-16 border-4 border-t-xBlue border-b-transparent border-l-transparent border-r-transparent rounded-full animate-spin"></div>
        </div>
      </div>
      
      <p className={cn(
        "mt-4 text-sm font-medium animate-pulse",
        isDark ? "text-gray-400" : "text-gray-600"
      )}>
        {message}
      </p>
      
      {/* Loading skeleton UI */}
      {fullScreen && (
        <div className="mt-12 w-full max-w-md mx-auto">
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4 mx-auto rounded-md" />
            <Skeleton className="h-32 w-full rounded-md" />
            <Skeleton className="h-32 w-full rounded-md" />
            <Skeleton className="h-32 w-full rounded-md" />
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingFallback;
