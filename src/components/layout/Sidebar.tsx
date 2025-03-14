
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Search, Bell, User, Bookmark, Settings, PlusCircle, X, LogOut, LogIn } from 'lucide-react';
import Button from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import CreatePost from '@/components/feed/CreatePost';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  
  // Make sure we're using a proper path for the profile
  const profilePath = '/profile';
  
  const navigation = [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'Explore', icon: Search, href: '/explore' },
    { name: 'Notifications', icon: Bell, href: '/notifications' },
    { name: 'Bookmarks', icon: Bookmark, href: '/bookmarks' },
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

  const handlePostCreated = (content: string) => {
    setIsPostDialogOpen(false);
  };

  // Handle profile navigation separately to ensure proper user check
  const handleProfileClick = (e) => {
    if (!user) {
      e.preventDefault();
      navigate('/auth');
    } else {
      navigate(`/profile/${user.id}`);
    }
  };

  return (
    <div 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out bg-background border-r border-border",
        isCollapsed ? "w-20" : "w-[275px]"
      )}
    >
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-3 top-3 p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors lg:hidden"
      >
        <X size={20} />
      </button>
      
      <div className="flex flex-col h-full px-3 py-5">
        <div className="mb-6 flex justify-center lg:justify-start">
          <Link to="/" className="text-xBlue p-2 rounded-full hover:bg-xBlue/10 transition-colors">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-8 h-8 fill-current">
              <g>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
              </g>
            </svg>
            <span className="sr-only">Home</span>
          </Link>
        </div>
        
        <nav className="space-y-1.5">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/' && location.pathname.startsWith(item.href));
              
            // Special handling for profile link
            if (item.name === 'Profile') {
              return (
                <a
                  key={item.name}
                  onClick={handleProfileClick}
                  className={cn(
                    "flex items-center p-3 text-lg font-medium rounded-full transition-colors cursor-pointer",
                    isActive 
                      ? "font-bold" 
                      : "text-foreground hover:bg-secondary/70",
                    isCollapsed && "justify-center"
                  )}
                >
                  <item.icon size={24} className={isActive ? "text-foreground" : "text-muted-foreground"} />
                  {!isCollapsed && (
                    <span className="ml-4 border border-white/20 rounded-full px-4 py-1">{item.name}</span>
                  )}
                </a>
              );
            }
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center p-3 text-lg font-medium rounded-full transition-colors",
                  isActive 
                    ? "font-bold" 
                    : "text-foreground hover:bg-secondary/70",
                  isCollapsed && "justify-center"
                )}
              >
                <item.icon size={24} className={isActive ? "text-foreground" : "text-muted-foreground"} />
                {!isCollapsed && (
                  <span className="ml-4 border border-white/20 rounded-full px-4 py-1">{item.name}</span>
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
                <span className="ml-4 border border-white/20 rounded-full px-4 py-1">Sign out</span>
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
                <span className="ml-4 border border-white/20 rounded-full px-4 py-1">Sign in</span>
              )}
            </button>
          )}
        </nav>
        
        <div className="mt-auto">
          {user && (
            <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="primary"
                  size={isCollapsed ? "icon" : "lg"}
                  className={cn(
                    "w-full font-bold", 
                    isCollapsed ? "p-3" : "px-6 py-3 rounded-full"
                  )}
                >
                  {isCollapsed ? (
                    <PlusCircle size={24} />
                  ) : (
                    <>
                      <PlusCircle size={24} className="mr-2" />
                      <span className="border border-white/20 rounded-full px-4 py-1">Post</span>
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] p-0 rounded-2xl bg-background border-border">
                <CreatePost onPostCreated={handlePostCreated} inDialog={true} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
