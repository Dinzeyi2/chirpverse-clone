
import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import SwipeablePostView from '@/components/feed/SwipeablePostView';
import { Search, TrendingUp, Users, ArrowLeft } from 'lucide-react';
import { Post } from '@/lib/data';

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('for-you');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showingTopicView, setShowingTopicView] = useState(false);
  
  // Trending topics with research statistics - in a real app these would come from an API
  const trendingTopics = [
    { id: 1, category: 'Technology', name: 'Apple Vision Pro', posts: '125K', researchers: '48K' },
    { id: 2, category: 'Entertainment', name: 'New Movie Release', posts: '98K', researchers: '36K' },
    { id: 3, category: 'Sports', name: '#WorldCup2023', posts: '87K', researchers: '29K' },
    { id: 4, category: 'Business', name: 'Tesla Stock', posts: '52K', researchers: '19K' },
    { id: 5, category: 'Politics', name: 'Election Updates', posts: '45K', researchers: '22K' },
    { id: 6, category: 'Science', name: 'SpaceX Launch', posts: '38K', researchers: '17K' },
    { id: 7, category: 'Health', name: 'Nutrition Facts', posts: '25K', researchers: '12K' },
    { id: 8, category: 'Music', name: 'New Album Release', posts: '22K', researchers: '8K' },
    { id: 9, category: 'Gaming', name: 'E3 Conference', posts: '18K', researchers: '7K' },
    { id: 10, category: 'Travel', name: 'Summer Destinations', posts: '15K', researchers: '6K' },
  ];

  // Sample related posts for demonstration - in a real app, these would be fetched from an API
  const getRelatedPosts = (topicName: string): Post[] => {
    return [
      {
        id: `${topicName}-1`,
        content: `Amazing new developments about ${topicName} today! #trending`,
        createdAt: new Date().toISOString(),
        likes: 1200,
        reposts: 450,
        replies: 89,
        views: 14500,
        userId: 'user1',
        user: {
          id: 'user1',
          name: 'John Doe',
          username: 'johndoe',
          avatar: 'https://i.pravatar.cc/150?img=1',
          verified: true,
          followers: 5000,
          following: 750
        }
      },
      {
        id: `${topicName}-2`,
        content: `Just saw the latest on ${topicName} and I'm impressed! What do you all think?`,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        likes: 850,
        reposts: 210,
        replies: 45,
        views: 9200,
        userId: 'user2',
        user: {
          id: 'user2',
          name: 'Jane Smith',
          username: 'janesmith',
          avatar: 'https://i.pravatar.cc/150?img=2',
          verified: false,
          followers: 3200,
          following: 420
        }
      },
      {
        id: `${topicName}-3`,
        content: `Breaking: New information on ${topicName} just dropped. This changes everything!`,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        likes: 1500,
        reposts: 730,
        replies: 112,
        views: 19800,
        userId: 'user3',
        user: {
          id: 'user3',
          name: 'Mark Wilson',
          username: 'markwilson',
          avatar: 'https://i.pravatar.cc/150?img=3',
          verified: true,
          followers: 12000,
          following: 350
        }
      },
      {
        id: `${topicName}-4`,
        content: `My thoughts on ${topicName} after a week of research. Thread 🧵`,
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        likes: 2200,
        reposts: 1100,
        replies: 205,
        views: 32500,
        userId: 'user4',
        user: {
          id: 'user4',
          name: 'Sarah Johnson',
          username: 'sarahj',
          avatar: 'https://i.pravatar.cc/150?img=4',
          verified: true,
          followers: 25000,
          following: 410
        }
      },
      {
        id: `${topicName}-5`,
        content: `I can't believe what's happening with ${topicName} right now. Anyone else following this?`,
        createdAt: new Date(Date.now() - 14400000).toISOString(),
        likes: 970,
        reposts: 320,
        replies: 78,
        views: 11200,
        userId: 'user5',
        user: {
          id: 'user5',
          name: 'Alex Thompson',
          username: 'alexthompson',
          avatar: 'https://i.pravatar.cc/150?img=5',
          verified: false,
          followers: 4800,
          following: 650
        }
      }
    ];
  };

  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic);
    setShowingTopicView(true);
  };

  const handleBackToTopics = () => {
    setShowingTopicView(false);
    setSelectedTopic(null);
  };

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
        </div>
      </div>
      
      {/* Main content */}
      {showingTopicView && selectedTopic ? (
        <div className="pb-4">
          {/* Back button and topic header */}
          <div className="px-4 py-3 border-b border-xExtraLightGray">
            <button 
              onClick={handleBackToTopics}
              className="flex items-center text-xBlue mb-2"
            >
              <ArrowLeft size={18} className="mr-1" /> Back to Topics
            </button>
            <h2 className="font-bold text-xl">{selectedTopic}</h2>
            <p className="text-sm text-xGray">Trending posts about this topic</p>
          </div>
          
          {/* Swipeable posts view for the selected topic */}
          <SwipeablePostView 
            posts={getRelatedPosts(selectedTopic)} 
          />
        </div>
      ) : (
        <div className="pb-4">
          {/* First highlighted trending topic */}
          <div className="px-4 py-3 border-b border-xExtraLightGray">
            <div className="flex items-center text-sm text-xGray">
              <span>Research Statistics</span>
            </div>
            <h2 className="font-bold text-xl mt-1">People asking similar questions</h2>
          </div>
          
          {/* Trending topics */}
          <div className="divide-y divide-xExtraLightGray">
            {trendingTopics.map((topic) => (
              <div 
                key={topic.id} 
                className="px-4 py-3 hover:bg-xExtraLightGray/30 transition-colors cursor-pointer"
                onClick={() => handleTopicClick(topic.name)}
              >
                <div className="flex justify-between">
                  <div>
                    <div className="flex items-center text-sm text-xGray">
                      <span>{topic.category} · Popular Research</span>
                    </div>
                    <p className="font-bold">{topic.name}</p>
                    <div className="flex items-center text-sm text-xGray gap-3">
                      <span>{topic.posts} posts</span>
                      <span className="flex items-center">
                        <Users size={14} className="mr-1" />
                        {topic.researchers} people researching
                      </span>
                    </div>
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
      )}
    </AppLayout>
  );
};

export default Explore;
