
import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import CreatePost from '@/components/feed/CreatePost';
import PostList from '@/components/feed/PostList';
import { posts } from '@/lib/data';
import { Settings } from 'lucide-react';

const Index = () => {
  const [feedPosts, setFeedPosts] = useState(posts);
  const [activeTab, setActiveTab] = useState('for-you');
  
  const handlePostCreated = (content: string) => {
    const newPost = {
      id: `temp-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      likes: 0,
      reposts: 0,
      replies: 0,
      views: 0,
      userId: '1', // Use the current user's ID
      user: {
        id: '1',
        name: 'John Doe',
        username: 'johndoe',
        avatar: 'https://i.pravatar.cc/150?img=1',
        followers: 1453,
        following: 234,
        verified: true,
      }
    };
    
    setFeedPosts([newPost, ...feedPosts]);
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md">
        <div className="flex justify-between items-center px-4 py-3">
          <h1 className="text-xl font-bold">Home</h1>
          <button className="p-2 rounded-full hover:bg-xExtraLightGray/50 transition-colors">
            <Settings size={20} />
          </button>
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
          <button
            className={`flex-1 py-4 font-medium text-center relative ${
              activeTab === 'following' ? 'font-bold' : 'text-xGray'
            }`}
            onClick={() => setActiveTab('following')}
          >
            Following
            {activeTab === 'following' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-xBlue rounded-full" />
            )}
          </button>
        </div>
      </div>
      
      {/* Create Post */}
      <CreatePost onPostCreated={handlePostCreated} />
      
      {/* Posts */}
      <PostList posts={feedPosts} />
    </AppLayout>
  );
};

export default Index;
