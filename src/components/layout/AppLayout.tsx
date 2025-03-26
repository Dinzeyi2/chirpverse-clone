
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/theme-provider';
import { useIsMobile, useScreenSize } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { width } = useScreenSize();
  const { user } = useAuth();
  
  const getBackgroundClasses = () => {
    if (theme === "dark") return "bg-black dark";
    if (theme === "ghibli") return "bg-ghibli-cream ghibli ghibli-bg-pattern";
    return "bg-lightBeige light";
  };
  
  return (
    <div className={cn(
      "min-h-screen w-full overflow-x-hidden",
      getBackgroundClasses()
    )}>
      {/* Auth buttons for non-authenticated users */}
      {!user && (
        <div className={cn(
          "fixed top-0 right-0 z-50 p-4 flex gap-2",
          theme === "dark" ? "text-white" : "text-gray-900"
        )}>
          <Link to="/auth">
            <Button variant="outline" size="sm" className={cn(
              "rounded-full px-4", 
              theme === "ghibli" && "border-ghibli-blue text-ghibli-darkTeal hover:bg-ghibli-blue/10"
            )}>
              Log in
            </Button>
          </Link>
          <Link to="/auth?tab=signup">
            <Button className={cn(
              "rounded-full px-4", 
              theme === "ghibli" ? "bg-ghibli-blue hover:bg-ghibli-blue/90" : "bg-xBlue hover:bg-blue-600"
            )} size="sm">
              Sign up
            </Button>
          </Link>
        </div>
      )}
      
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main 
        className={cn(
          "flex-grow min-h-screen w-full",
          theme === "dark" ? "bg-black" : 
            theme === "ghibli" ? "bg-ghibli-cream" : "bg-lightBeige",
          isMobile 
            ? "pb-20 px-1" // Reduced padding for better mobile view
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
