
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/theme-provider';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      "min-h-screen",
      theme === "dark" ? "bg-black dark" : "bg-lightBeige light"
    )}>
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex">
        <div 
          className={cn(
            "flex-grow min-h-screen",
            theme === "dark" ? "bg-black" : "bg-lightBeige",
            isMobile ? "mb-16" : "ml-[275px] lg:ml-[275px]"
          )}
        >
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
