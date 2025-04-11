
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/theme-provider';
import { useIsMobile, useScreenSize } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

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
          isMobile 
            ? "pb-20 px-1" // Reduced padding for better mobile view
            : "ml-[275px]" // Add margin for sidebar on desktop
        )}
        style={{ 
          maxWidth: isMobile ? '100%' : 'calc(100% - 275px)',
        }}
      >
        {/* Message for non-logged-in users */}
        {!user && (
          <Alert className={cn(
            "mb-4 mt-4 mx-auto max-w-2xl",
            theme === "dark" 
              ? "bg-blue-900/20 border-blue-800/30 text-blue-200"
              : "bg-blue-50 border-blue-200 text-blue-800"
          )}>
            <Info className="h-4 w-4 mr-2" />
            <AlertDescription>
              We are facing a high volume of signups and posts. We are working on it to make the platform more faster. Log in to your account to see comments and post your issues to the community.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="w-full max-w-2xl mx-auto">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
