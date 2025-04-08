
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/theme-provider';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  Search, 
  Bookmark, 
  MessageSquare, 
  User,
  UserPlus, 
  Settings, 
  LogOut, 
  Bell,
  Code,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

// Standard profile image - blue smile face
const blueProfileImage = "/lovable-uploads/325d2d74-ad68-4607-8fab-66f36f0e087e.png";

export const Sidebar = () => {
  const location = useLocation();
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  // Get unread notification count for the badge
  useEffect(() => {
    if (!user) return;
    
    const getUnreadNotificationCount = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('count')
          .eq('recipient_id', user.id)
          .eq('is_read', false)
          .single();
          
        if (error) {
          console.error('Error fetching unread notifications:', error);
          return;
        }
        
        if (data && data.count) {
          setUnreadNotifications(data.count);
        }
      } catch (err) {
        console.error('Failed to fetch notification count:', err);
      }
    };
    
    getUnreadNotificationCount();
    
    // Subscribe to realtime updates for notifications
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `recipient_id=eq.${user.id}`
      }, () => {
        getUnreadNotificationCount();
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'notifications',
        filter: `recipient_id=eq.${user.id}`
      }, () => {
        getUnreadNotificationCount();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Successfully logged out');
    } catch (error) {
      toast.error('Failed to log out. Please try again.');
      console.error('Logout error:', error);
    }
  };
  
  const isDarkTheme = theme === 'dark';
  const bgColor = isDarkTheme ? 'bg-black' : 'bg-lightBeige';
  const textColor = isDarkTheme ? 'text-white' : 'text-gray-900';
  const logoSrc = isDarkTheme 
    ? '/lovable-uploads/6cd6103f-8ab6-49f9-b4cc-8d47775646bd.png' 
    : '/lovable-uploads/3466f833-541a-44f1-86a1-5e3f5ed4d8ed.png';
  
  const navItems = [
    { 
      path: '/', 
      label: 'Home', 
      icon: Home, 
      requiresAuth: false,
      mobile: true
    },
    { 
      path: '/for-you', 
      label: 'For You', 
      icon: Sparkles, 
      requiresAuth: true,
      mobile: true
    },
    { 
      path: '/explore', 
      label: 'Explore', 
      icon: Search, 
      requiresAuth: false,
      mobile: true
    },
    { 
      path: '/notifications', 
      label: 'Notifications', 
      icon: Bell, 
      requiresAuth: true,
      badge: unreadNotifications > 0 ? unreadNotifications : null,
      mobile: true
    },
    { 
      path: '/bookmarks', 
      label: 'Bookmarks', 
      icon: Bookmark, 
      requiresAuth: true,
      mobile: true
    },
    { 
      path: '/profile', 
      label: 'Profile', 
      icon: User, 
      requiresAuth: true,
      mobile: true
    },
    { 
      path: '/settings', 
      label: 'Settings', 
      icon: Settings, 
      requiresAuth: true,
      mobile: false
    },
  ];
  
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`${bgColor} fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-neutral-800 pt-5 md:flex`}>
        <div className="flex h-full flex-col px-4">
          {/* Logo */}
          <div className="mb-6 flex items-center justify-start pl-1">
            <img src={logoSrc} alt="Logo" className="h-8" />
          </div>
          
          {/* Nav Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              // Skip items that require auth if user is not logged in
              if (item.requiresAuth && !user) return null;
              
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => cn(
                    'flex items-center gap-4 rounded-lg px-3 py-2.5 text-base transition-colors',
                    isActive 
                      ? isDarkTheme 
                        ? 'bg-neutral-800 text-white' 
                        : 'bg-gray-200 text-gray-900'
                      : isDarkTheme
                        ? 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  )}
                >
                  <Icon className={cn(
                    'h-5 w-5',
                    isActive 
                      ? '' 
                      : isDarkTheme
                        ? 'text-neutral-400' 
                        : 'text-gray-500'
                  )} />
                  <span>{item.label}</span>
                  
                  {/* Notification Badge */}
                  {item.badge && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-xBlue px-1.5 text-xs font-medium text-white">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
          
          {/* User Section */}
          <div className="mt-auto mb-8">
            {user ? (
              <>
                <div className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2.5">
                  <img 
                    src={blueProfileImage}
                    alt="Profile" 
                    className="h-8 w-8 rounded-full"
                  />
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${textColor}`}>
                      {user.user_metadata?.full_name || 'User'}
                    </span>
                    <span className="text-xs text-neutral-400">
                      @{user.id?.substring(0, 8) || 'user'}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full justify-start gap-2 border-neutral-800"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <NavLink to="/auth">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <UserPlus className="h-4 w-4" />
                    Log in
                  </Button>
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </aside>
      
      {/* Mobile Navigation */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 border-t ${bgColor} border-neutral-800 md:hidden`}>
        <nav className="flex justify-around p-2">
          {navItems
            .filter(item => item.mobile)
            .map((item) => {
              // Skip items that require auth if user is not logged in
              if (item.requiresAuth && !user) return null;
              
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="relative flex flex-col items-center p-1"
                >
                  <Icon className={cn(
                    'h-6 w-6',
                    isActive 
                      ? 'text-white' 
                      : isDarkTheme 
                        ? 'text-neutral-400' 
                        : 'text-gray-500'
                  )} />
                  
                  {/* Notification Badge (mobile) */}
                  {item.badge && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-xBlue px-1 text-xs font-medium text-white">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                  
                  <span className={cn(
                    'text-xs',
                    isActive 
                      ? 'text-white' 
                      : isDarkTheme 
                        ? 'text-neutral-400' 
                        : 'text-gray-500'
                  )}>
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
        </nav>
      </div>
    </>
  );
};
