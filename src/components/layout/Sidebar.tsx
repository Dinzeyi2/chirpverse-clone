
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Search, User, Bookmark, Settings, PlusCircle, LogOut, LogIn, Menu, Palmtree } from 'lucide-react';
import Button from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import CreatePost from '@/components/feed/CreatePost';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { supabase } from "@/integrations/supabase/client";

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, signOut, displayName } = useAuth();
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const profilePath = '/profile';
  
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [isMobile]);
  
  const navigation = [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'Explore', icon: Search, href: '/explore' },
    { name: 'Bookmarks', icon: Bookmark, href: '/bookmarks' },
    { name: 'Palm', icon: Palmtree, href: '/palm' },
    { name: 'Profile', icon: User, href: profilePath },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  const handlePostCreated = () => {
    setIsPostDialogOpen(false);
  };

  const handleProfileClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user) {
      e.preventDefault();
      navigate('/auth');
    } else {
      navigate(`/profile/${user.id}`);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const sidebarClasses = cn(
    "bg-background border-r border-border transition-all duration-300 ease-in-out z-40",
    isMobile ? (
      isMobileMenuOpen 
        ? "fixed inset-0 w-full h-screen" 
        : "fixed bottom-0 left-0 right-0 h-16 border-t border-b-0"
    ) : (
      isCollapsed ? "fixed left-0 top-0 h-screen w-20" : "fixed left-0 top-0 h-screen w-[275px]"
    )
  );

  if (isMobile && !isMobileMenuOpen) {
    return (
      <div className={sidebarClasses}>
        <div className="flex items-center justify-around h-full px-2">
          {navigation.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/' && location.pathname.startsWith(item.href));
              
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-full transition-colors relative",
                  isActive ? "text-primary" : "text-foreground hover:text-primary"
                )}
              >
                <item.icon size={24} className={isActive ? "text-primary" : "text-muted-foreground"} />
              </Link>
            );
          })}
          
          <button 
            onClick={toggleMobileMenu}
            className="flex flex-col items-center justify-center p-2 rounded-full transition-colors"
          >
            <Menu size={24} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  if (isMobile && isMobileMenuOpen) {
    return (
      <div className={sidebarClasses}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="p-2 rounded-full hover:bg-blue-500/10 transition-colors">
              <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-[#4285F4] to-[#8AB4F8] bg-clip-text text-transparent">iblue</span>
            </Link>
            <button 
              onClick={toggleMobileMenu}
              className="p-2 rounded-full hover:bg-secondary/70 transition-colors"
            >
              <Menu size={24} className="text-muted-foreground" />
            </button>
          </div>
          
          <nav className="space-y-4 mb-8">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/' && location.pathname.startsWith(item.href));
                
              if (item.name === 'Profile') {
                return (
                  <a
                    key={item.name}
                    onClick={handleProfileClick}
                    className={cn(
                      "flex items-center p-3 text-xl font-medium rounded-full transition-colors relative",
                      isActive ? "font-bold" : "text-foreground hover:bg-secondary/70"
                    )}
                  >
                    <item.icon size={24} className={isActive ? "text-primary" : "text-muted-foreground"} />
                    <span className="ml-4 font-heading tracking-wide text-lg uppercase">{item.name}</span>
                  </a>
                );
              }
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center p-3 text-xl font-medium rounded-full transition-colors relative",
                    isActive ? "font-bold" : "text-foreground hover:bg-secondary/70"
                  )}
                >
                  <item.icon size={24} className={isActive ? "text-primary" : "text-muted-foreground"} />
                  <span className="ml-4 font-heading tracking-wide text-lg uppercase">{item.name}</span>
                </Link>
              );
            })}
          </nav>
          
          <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                size="lg"
                className="w-full font-bold bg-primary text-white hover:bg-primary/90 hover:text-white border-0 px-6 py-3 rounded-full mb-6"
              >
                <PlusCircle size={24} />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] p-0 rounded-2xl bg-background border-border">
              <CreatePost onPostCreated={handlePostCreated} inDialog={true} />
            </DialogContent>
          </Dialog>
          
          {user ? (
            <button
              onClick={handleSignOut}
              className="flex items-center p-3 text-xl font-medium rounded-full transition-colors text-foreground hover:bg-secondary/70"
            >
              <LogOut size={24} className="text-muted-foreground" />
              <span className="ml-4 font-heading tracking-wide text-lg uppercase">Sign out</span>
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              className="flex items-center p-3 text-xl font-medium rounded-full transition-colors text-foreground hover:bg-secondary/70"
            >
              <LogIn size={24} className="text-muted-foreground" />
              <span className="ml-4 font-heading tracking-wide text-lg uppercase">Sign in</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        sidebarClasses,
        isCollapsed ? "w-20" : "w-[275px]"
      )}
    >
      <div className="flex flex-col h-full px-3 py-5">
        <div className="mb-6 flex justify-center lg:justify-start">
          <Link to="/" className="p-2 rounded-full hover:bg-blue-500/10 transition-colors">
            <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-[#4285F4] to-[#8AB4F8] bg-clip-text text-transparent">iblue</span>
            <span className="sr-only">Home</span>
          </Link>
        </div>
        
        <nav className="space-y-1.5">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/' && location.pathname.startsWith(item.href));
              
            if (item.name === 'Profile') {
              return (
                <a
                  key={item.name}
                  onClick={handleProfileClick}
                  className={cn(
                    "flex items-center p-3 text-lg font-medium rounded-full transition-colors cursor-pointer relative",
                    isActive 
                      ? "font-bold" 
                      : "text-foreground hover:bg-secondary/70",
                    isCollapsed && "justify-center"
                  )}
                >
                  <item.icon size={24} className={isActive ? "text-foreground" : "text-muted-foreground"} />

                  {!isCollapsed && (
                    <span className="ml-4 font-heading tracking-wide text-lg uppercase">{item.name}</span>
                  )}
                </a>
              );
            }
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center p-3 text-lg font-medium rounded-full transition-colors relative",
                  isActive 
                    ? "font-bold" 
                    : "text-foreground hover:bg-secondary/70",
                  isCollapsed && "justify-center"
                )}
              >
                <item.icon size={24} className={isActive ? "text-foreground" : "text-muted-foreground"} />
                
                {!isCollapsed && (
                  <span className="ml-4 font-heading tracking-wide text-lg uppercase">{item.name}</span>
                )}
              </Link>
            );
          })}

          {user ? (
            <button
              onClick={handleSignOut}
              className={cn(
                "flex items-center p-3 text-lg font-medium rounded-full transition-colors text-foreground hover:bg-secondary/70",
                isCollapsed && "justify-center w-full"
              )}
            >
              <LogOut size={24} className="text-muted-foreground" />
              {!isCollapsed && (
                <span className="ml-4 font-heading tracking-wide text-lg uppercase">Sign out</span>
              )}
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              className={cn(
                "flex items-center p-3 text-lg font-medium rounded-full transition-colors text-foreground hover:bg-secondary/70",
                isCollapsed && "justify-center w-full"
              )}
            >
              <LogIn size={24} className="text-muted-foreground" />
              {!isCollapsed && (
                <span className="ml-4 font-heading tracking-wide text-lg uppercase">Sign in</span>
              )}
            </button>
          )}
        </nav>
        
        <div className="mt-auto">
          
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
