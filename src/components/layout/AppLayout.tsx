
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';
import { Settings } from 'lucide-react';

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  // Who to follow suggestions
  const whoToFollow = [
    { id: 1, name: 'Tech Insider', username: 'techinsider', avatar: 'https://i.pravatar.cc/150?img=67' },
    { id: 2, name: 'Design Matters', username: 'designmatters', avatar: 'https://i.pravatar.cc/150?img=47' },
    { id: 3, name: 'Nature Photography', username: 'naturephotos', avatar: 'https://i.pravatar.cc/150?img=27' },
  ];

  return (
    <div className="min-h-screen bg-black dark">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content Area - Removed width limitations */}
      <div className="flex">
        <div 
          className={cn(
            "flex-grow min-h-screen border-r border-[#2F3336]",
            "ml-[275px] lg:ml-[275px]"
          )}
        >
          {children || <Outlet />}
        </div>
        
        {/* Right Sidebar */}
        <div className="hidden xl:block w-[350px] pt-4 px-4">
          {/* Who to Follow - Removed Trending Topics section */}
          <div className="bg-[#16181C] rounded-2xl p-4">
            <h2 className="text-xl font-bold mb-6">Who to follow</h2>
            <div className="space-y-4">
              {whoToFollow.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-12 h-12 rounded-full object-cover mr-3"
                    />
                    <div>
                      <p className="font-bold hover:underline truncate">{user.name}</p>
                      <p className="text-muted-foreground text-sm truncate">@{user.username}</p>
                    </div>
                  </div>
                  <button className="bg-white text-black text-sm font-bold px-4 py-1.5 rounded-full hover:bg-opacity-90 transition-colors">
                    Follow
                  </button>
                </div>
              ))}
            </div>
            <button className="text-xBlue hover:text-xBlue/80 mt-4 text-sm transition-colors">
              Show more
            </button>
          </div>
          
          {/* Footer */}
          <div className="mt-4 text-xs text-muted-foreground space-x-2">
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Cookie Policy</a>
            <a href="#" className="hover:underline">Accessibility</a>
            <a href="#" className="hover:underline">Ads info</a>
            <p className="mt-2">© 2023 X Corp.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
