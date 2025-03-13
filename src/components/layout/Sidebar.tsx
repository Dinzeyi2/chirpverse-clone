
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Bell, Bookmark, User, MoreHorizontal, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('You have been signed out');
      navigate('/auth');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const sidebarItems = [
    { icon: <Home size={26} />, label: 'Home', path: '/' },
    { icon: <Search size={26} />, label: 'Explore', path: '/explore' },
    { icon: <Bell size={26} />, label: 'Notifications', path: '/notifications' },
    { icon: <Bookmark size={26} />, label: 'Bookmarks', path: '/bookmarks' },
    { icon: <User size={26} />, label: 'Profile', path: user ? `/profile/${user.id}` : '/auth' },
  ];

  return (
    <div className="fixed z-50 bottom-0 w-full bg-white md:h-screen md:w-20 lg:w-[275px] md:p-4 lg:p-6 md:pb-8 md:top-0 md:left-0">
      <div className="grid grid-cols-5 md:grid-cols-1 md:gap-6">
        {/* X Logo - Desktop */}
        <div className="hidden md:block">
          <Link to="/" className="rounded-full p-3 inline-flex hover:bg-gray-200 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Link>
        </div>

        {/* Navigation items */}
        {sidebarItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`
              flex items-center justify-center md:justify-start 
              h-14 py-2 md:py-3 md:px-3 md:rounded-full
              hover:bg-gray-200 transition-colors
              ${location.pathname === item.path ? 'font-bold' : 'font-normal'}
            `}
          >
            {item.icon}
            <span className="hidden lg:block ml-4 text-xl">{item.label}</span>
          </Link>
        ))}

        {/* Authentication Button */}
        {user ? (
          <button
            onClick={handleSignOut}
            className="hidden md:flex items-center justify-center md:justify-start 
            h-14 py-2 md:py-3 md:px-3 md:rounded-full
            hover:bg-gray-200 transition-colors"
          >
            <LogOut size={26} />
            <span className="hidden lg:block ml-4 text-xl">Sign Out</span>
          </button>
        ) : (
          <Link
            to="/auth"
            className="hidden md:flex items-center justify-center md:justify-start 
            h-14 py-2 md:py-3 md:px-3 md:rounded-full
            hover:bg-gray-200 transition-colors"
          >
            <LogIn size={26} />
            <span className="hidden lg:block ml-4 text-xl">Sign In</span>
          </Link>
        )}

        {/* Tweet Button - Desktop */}
        {user && (
          <div className="hidden md:block mt-4">
            <button className="bg-xBlue text-white w-full py-3 rounded-full hover:bg-opacity-90 transition-colors">
              <span className="hidden lg:inline">Post</span>
              <span className="lg:hidden">+</span>
            </button>
          </div>
        )}

        {/* User Profile - Desktop */}
        {user && (
          <div className="hidden md:flex mt-auto items-center justify-center lg:justify-between p-3 rounded-full hover:bg-gray-200 cursor-pointer">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gray-300 overflow-hidden">
                <img 
                  src={user.user_metadata?.avatar_url || "https://i.pravatar.cc/150?img=12"} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="hidden lg:block ml-3">
                <p className="font-bold text-sm">{user.user_metadata?.name || "User"}</p>
                <p className="text-gray-500 text-sm">@{user.email?.split('@')[0]}</p>
              </div>
            </div>
            <MoreHorizontal className="hidden lg:block" size={20} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
