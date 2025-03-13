
import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Bookmark, Search, MoreHorizontal, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Sample bookmark data - in a real app, this would come from an API
const sampleBookmarks = [
  {
    id: 1,
    user: {
      name: 'Jane Smith',
      username: 'janesmith',
      avatar: 'https://i.pravatar.cc/150?img=5',
      verified: true
    },
    content: 'Just launched our new AI feature! Check it out and let me know what you think. #AI #Innovation',
    time: '2h',
    stats: {
      replies: 24,
      reposts: 12,
      likes: 89,
      views: 1204
    }
  },
  {
    id: 2,
    user: {
      name: 'Tech Today',
      username: 'techtoday',
      avatar: 'https://i.pravatar.cc/150?img=12',
      verified: true
    },
    content: 'Breaking: New advancements in quantum computing could revolutionize data processing. Scientists predict commercial applications within 5 years.',
    time: '5h',
    stats: {
      replies: 56,
      reposts: 132,
      likes: 541,
      views: 12450
    }
  },
  {
    id: 3,
    user: {
      name: 'Alex Johnson',
      username: 'alexj',
      avatar: 'https://i.pravatar.cc/150?img=3',
      verified: false
    },
    content: 'Just finished reading this amazing article on web development trends for 2023. Highly recommend checking it out! #webdev #coding',
    time: '1d',
    stats: {
      replies: 8,
      reposts: 4,
      likes: 32,
      views: 421
    }
  },
];

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState(sampleBookmarks);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBookmarks = searchQuery
    ? bookmarks.filter(bookmark => 
        bookmark.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.user.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : bookmarks;

  const removeBookmark = (id: number) => {
    setBookmarks(bookmarks.filter(bookmark => bookmark.id !== id));
  };

  const clearAllBookmarks = () => {
    setBookmarks([]);
  };

  return (
    <AppLayout>
      {/* Header - sticky */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md">
        <div className="px-4 py-3 border-b border-xExtraLightGray">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Bookmarks</h1>
              <p className="text-sm text-xGray">@johndoe</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-xExtraLightGray/50">
                  <MoreHorizontal size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={clearAllBookmarks} className="text-red-500 focus:text-red-500">
                  <Trash2 size={16} className="mr-2" />
                  Clear all Bookmarks
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Search */}
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-xGray" size={16} />
              <Input
                placeholder="Search Bookmarks"
                className="pl-10 bg-xExtraLightGray/50 border-none rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Bookmarks list */}
      <div className="divide-y divide-xExtraLightGray">
        {filteredBookmarks.length > 0 ? (
          filteredBookmarks.map((bookmark) => (
            <div key={bookmark.id} className="p-4 hover:bg-xExtraLightGray/30 transition-colors">
              <div className="flex">
                <img 
                  src={bookmark.user.avatar} 
                  alt={bookmark.user.name} 
                  className="w-10 h-10 rounded-full object-cover mr-3"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <span className="font-bold truncate">{bookmark.user.name}</span>
                    {bookmark.user.verified && (
                      <span className="ml-0.5 text-xBlue">
                        <svg viewBox="0 0 24 24" aria-label="Verified account" className="w-4 h-4 fill-current">
                          <g>
                            <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"></path>
                          </g>
                        </svg>
                      </span>
                    )}
                    <span className="text-xGray ml-1 truncate">@{bookmark.user.username}</span>
                    <span className="text-xGray mx-1">·</span>
                    <span className="text-xGray">{bookmark.time}</span>
                    <div className="ml-auto">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-xExtraLightGray/50">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => removeBookmark(bookmark.id)} className="text-red-500 focus:text-red-500">
                            <Trash2 size={16} className="mr-2" />
                            Remove Bookmark
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p className="mt-1 text-base whitespace-pre-wrap">{bookmark.content}</p>
                  <div className="flex mt-3 text-xGray justify-between max-w-md">
                    <div className="flex items-center">
                      <span className="text-sm">{bookmark.stats.replies}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm">{bookmark.stats.reposts}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm">{bookmark.stats.likes}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm">{bookmark.stats.views}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Bookmark size={40} className="text-xBlue mb-4" />
            <h2 className="text-2xl font-bold mb-2">Save posts for later</h2>
            <p className="text-xGray max-w-sm">
              Bookmark posts to easily find them again in the future.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Bookmarks;
