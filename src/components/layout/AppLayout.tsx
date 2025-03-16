
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/theme-provider';
import { useIsMobile, useScreenSize } from '@/hooks/use-mobile';

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { width } = useScreenSize();
  
  return (
    <div className={cn(
      "min-h-screen w-full overflow-x-hidden",
      theme === "dark" ? "bg-black dark" : "bg-lightBeige light"
    )}>
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main 
        className={cn(
          "flex-grow min-h-screen w-full",
          theme === "dark" ? "bg-black" : "bg-lightBeige",
          isMobile 
            ? "pb-20 px-2" // Add bottom padding for mobile navigation bar
            : "ml-[275px]" // Add margin for sidebar on desktop
        )}
        style={{ 
          maxWidth: isMobile ? '100%' : 'calc(100% - 275px)',
        }}
      >
        <div className="w-full max-w-2xl mx-auto">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
