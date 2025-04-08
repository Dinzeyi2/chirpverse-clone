
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/theme-provider';
import { useIsMobile, useScreenSize } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { width } = useScreenSize();
  const { user } = useAuth();
  
  return (
    <div className={cn(
      "min-h-screen w-full overflow-x-hidden",
      theme === "dark" ? "bg-black dark" : "bg-lightBeige light"
    )}>
      {/* Top Bar with Logo */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src="/lovable-uploads/857a6273-b50b-42ad-b149-bee98311974b.png" alt="iblue logo" />
            <AvatarFallback>IB</AvatarFallback>
          </Avatar>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-[#4285F4] to-[#8AB4F8] bg-clip-text text-transparent">iblue</span>
        </div>
        
        {/* Auth buttons for non-authenticated users */}
        {!user && (
          <div className={cn(
            "flex gap-2",
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
      </div>
      
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main 
        className={cn(
          "flex-grow min-h-screen w-full pt-14", // Added padding-top for the top bar
          theme === "dark" ? "bg-black" : "bg-lightBeige",
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
