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
  
  const profilePath = user ? `/profile/${user.id}` : '/auth';
  
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

  console.log("Current user ID for profile:", user?.id);

  return (
    <div 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out bg-background border-r",
        isCollapsed ? "w-20" : "w-[275px]"
      )}
    >
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-3 top-3 p-1 rounded-full hover:bg-xExtraLightGray text-xGray hover:text-xDark transition-colors lg:hidden"
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
          </Link>
        </div>
        
        <nav className="space-y-1.5">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/' && location.pathname.startsWith(item.href));
              
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center p-3 text-lg font-medium rounded-full transition-colors",
                  isActive 
                    ? "font-bold" 
                    : "text-xDark hover:bg-xExtraLightGray/50",
                  isCollapsed && "justify-center"
                )}
              >
                <item.icon size={24} className={isActive ? "text-xDark" : "text-xGray"} />
                {!isCollapsed && <span className="ml-4">{item.name}</span>}
              </Link>
            );
          })}

          {user ? (
            <button
              onClick={handleSignOut}
              className={cn(
                "flex items-center p-3 text-lg font-medium rounded-full transition-colors text-xDark hover:bg-xExtraLightGray/50",
                isCollapsed && "justify-center w-full"
              )}
            >
              <LogOut size={24} className="text-xGray" />
              {!isCollapsed && <span className="ml-4">Sign out</span>}
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              className={cn(
                "flex items-center p-3 text-lg font-medium rounded-full transition-colors text-xDark hover:bg-xExtraLightGray/50",
                isCollapsed && "justify-center w-full"
              )}
            >
              <LogIn size={24} className="text-xGray" />
              {!isCollapsed && <span className="ml-4">Sign in</span>}
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
                    isCollapsed ? "p-3" : "px-6 py-3"
                  )}
                >
                  {isCollapsed ? (
                    <PlusCircle size={24} />
                  ) : (
                    "Post"
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] p-0 rounded-2xl bg-background border-0">
                <CreatePost onPostCreated={handlePostCreated} inDialog={true} />
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {user && (
          <div className="mt-4">
            <div className="flex items-center p-3 rounded-full hover:bg-xExtraLightGray/50 transition-colors cursor-pointer">
              <img 
                src="https://i.pravatar.cc/150?img=1" 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover"
              />
              {!isCollapsed && (
                <div className="ml-3 overflow-hidden">
                  <p className="font-bold text-sm truncate">{user.user_metadata?.full_name || 'User'}</p>
                  <p className="text-xGray text-sm truncate">@{user.user_metadata?.username || user.email}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
