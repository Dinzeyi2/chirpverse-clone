
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';
import { Search, Settings } from 'lucide-react';

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  // Trending topics for the right sidebar
  const trendingTopics = [
    { id: 1, category: 'Technology', name: 'Apple Vision Pro', posts: '125K' },
    { id: 2, category: 'Entertainment', name: 'New Movie Release', posts: '98K' },
    { id: 3, category: 'Sports', name: '#WorldCup2023', posts: '87K' },
    { id: 4, category: 'Business', name: 'Tesla Stock', posts: '52K' },
    { id: 5, category: 'Politics', name: 'Election Updates', posts: '45K' },
  ];

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
      
      {/* Main Content */}
      <div className="flex w-full">
        <div 
          className={cn(
            "flex-1 min-h-screen border-r border-[#2F3336]",
            "ml-[275px]"
          )}
        >
          {children || <Outlet />}
        </div>
        
        {/* Right Sidebar */}
        <div className="hidden xl:block w-[350px] pt-4 px-4">
          {/* Search Bar */}
          <div className="sticky top-0 pt-2 pb-4 z-10 bg-black">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="bg-[#202327] h-12 pl-10 pr-4 py-2 w-full rounded-full border-none focus:ring-2 focus:ring-xBlue focus:bg-black transition-all"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Trending Topics */}
          <div className="bg-[#16181C] rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Trends for you</h2>
              <button className="text-xBlue hover:bg-xBlue/10 p-2 rounded-full transition-colors">
                <Settings size={18} />
              </button>
            </div>
            <div className="space-y-6">
              {trendingTopics.map((topic) => (
                <div key={topic.id} className="group cursor-pointer">
                  <p className="text-muted-foreground text-xs">{topic.category}</p>
                  <p className="font-bold group-hover:text-xBlue transition-colors">{topic.name}</p>
                  <p className="text-muted-foreground text-sm">{topic.posts} posts</p>
                </div>
              ))}
            </div>
            <button className="text-xBlue hover:text-xBlue/80 mt-4 text-sm transition-colors">
              Show more
            </button>
          </div>
          
          {/* Who to Follow */}
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
