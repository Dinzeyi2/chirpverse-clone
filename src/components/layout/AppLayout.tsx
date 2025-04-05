
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/theme-provider';
import { useIsMobile, useScreenSize } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { width } = useScreenSize();
  const { user } = useAuth();
  const location = useLocation();
  
  // Check if we're on the Palm page
  const isPalmPage = location.pathname === '/palm';
  
  return (
    <div className={cn(
      "min-h-screen w-full overflow-x-hidden",
      theme === "dark" ? "bg-black dark" : "bg-lightBeige light"
    )}>
      {/* Auth buttons for non-authenticated users */}
      {!user && (
        <div className={cn(
          "fixed top-0 right-0 z-50 p-4 flex gap-2",
          theme === "dark" ? "text-white" : "text-gray-900"
        )}>
          <Link to="/auth">
            <Button variant="outline" size="sm" className="rounded-full px-4">
              Log in
            </Button>
          </Link>
          <Link to="/auth?tab=signup">
            <Button className="rounded-full px-4 bg-xBlue hover:bg-blue-600" size="sm">
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
          theme === "dark" ? "bg-black" : "bg-lightBeige",
          isMobile ? "pb-20 px-1" : "ml-[275px]"
        )}
        style={{ 
          maxWidth: isMobile ? '100%' : 'calc(100% - 275px)',
        }}
      >
        <div className={cn(
          "mx-auto",
          isPalmPage ? "w-full max-w-none p-0" : "w-full max-w-2xl"
        )}>
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
