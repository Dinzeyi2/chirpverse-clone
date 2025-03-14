
import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Search, TrendingUp } from 'lucide-react';

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('for-you');
  
  // Trending topics - in a real app these would come from an API
  const trendingTopics = [
    { id: 1, category: 'Technology', name: 'Apple Vision Pro', posts: '125K' },
    { id: 2, category: 'Entertainment', name: 'New Movie Release', posts: '98K' },
    { id: 3, category: 'Sports', name: '#WorldCup2023', posts: '87K' },
    { id: 4, category: 'Business', name: 'Tesla Stock', posts: '52K' },
    { id: 5, category: 'Politics', name: 'Election Updates', posts: '45K' },
    { id: 6, category: 'Science', name: 'SpaceX Launch', posts: '38K' },
    { id: 7, category: 'Health', name: 'Nutrition Facts', posts: '25K' },
    { id: 8, category: 'Music', name: 'New Album Release', posts: '22K' },
    { id: 9, category: 'Gaming', name: 'E3 Conference', posts: '18K' },
    { id: 10, category: 'Travel', name: 'Summer Destinations', posts: '15K' },
  ];

  // News sections
  const newsSections = [
    { id: 1, title: 'Technology News', image: 'https://i.pravatar.cc/150?img=50' },
    { id: 2, title: 'Sports Updates', image: 'https://i.pravatar.cc/150?img=51' },
    { id: 3, title: 'Entertainment Buzz', image: 'https://i.pravatar.cc/150?img=52' },
  ];

  return (
    <AppLayout>
      {/* Header with search bar - sticky */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md pt-0.5">
        {/* Search input */}
        <div className="px-4 py-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search"
              className="bg-xExtraLightGray/70 h-12 pl-10 pr-4 py-2 w-full rounded-full border-none focus:ring-2 focus:ring-xBlue focus:bg-background transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-xExtraLightGray">
          <button
            className={`flex-1 py-4 font-medium text-center relative ${
              activeTab === 'for-you' ? 'font-bold' : 'text-xGray'
            }`}
            onClick={() => setActiveTab('for-you')}
          >
            For you
            {activeTab === 'for-you' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-xBlue rounded-full" />
            )}
          </button>
          {/* Removed "Trending" tab */}
          {/* Removed "News" tab */}
          {/* Removed "Sports" tab */}
        </div>
      </div>
      
      {/* Main content */}
      <div className="pb-4">
        {/* First highlighted trending topic */}
        <div className="px-4 py-3 border-b border-xExtraLightGray">
          <div className="flex items-center text-sm text-xGray">
            <span>Trending</span>
          </div>
          <h2 className="font-bold text-xl mt-1">What's happening today</h2>
        </div>
        
        {/* Trending topics */}
        <div className="divide-y divide-xExtraLightGray">
          {trendingTopics.map((topic) => (
            <div key={topic.id} className="px-4 py-3 hover:bg-xExtraLightGray/30 transition-colors cursor-pointer">
              <div className="flex justify-between">
                <div>
                  <div className="flex items-center text-sm text-xGray">
                    <span>{topic.category} · Trending</span>
                  </div>
                  <p className="font-bold">{topic.name}</p>
                  <p className="text-sm text-xGray">{topic.posts} posts</p>
                </div>
                <div className="flex items-center justify-center h-10 w-10">
                  <TrendingUp size={18} className="text-xGray" />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Show more button */}
        <div className="px-4 py-3 text-xBlue hover:bg-xExtraLightGray/30 transition-colors cursor-pointer">
          <span>Show more</span>
        </div>
      </div>
    </AppLayout>
  );
};

export default Explore;
