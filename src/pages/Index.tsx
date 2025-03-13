
import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import CreatePost from '@/components/feed/CreatePost';
import PostList from '@/components/feed/PostList';
import SwipeablePostView from '@/components/feed/SwipeablePostView';
import { Post, posts, users } from '@/lib/data';
import { Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const [feedPosts, setFeedPosts] = useState(posts);
  const [activeTab, setActiveTab] = useState('for-you');
  const [feedView, setFeedView] = useState<'swipeable' | 'list'>('swipeable');
  const { user } = useAuth();
  
  // Filter posts based on active tab
  const displayPosts = React.useMemo(() => {
    if (activeTab === 'for-you') {
      return feedPosts;
    } else if (activeTab === 'following') {
      // Simulate following functionality (showing posts from users with IDs 1, 3, 5)
      // In a real app, this would filter based on users the current user follows
      const followedUserIds = ['1', '3', '5'];
      return feedPosts.filter(post => followedUserIds.includes(post.userId));
    }
    return feedPosts;
  }, [feedPosts, activeTab]);
  
  const handlePostCreated = (content: string) => {
    const newPost = {
      id: `temp-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      likes: 0,
      reposts: 0,
      replies: 0,
      views: 0,
      userId: user?.id || '1', // Use the current user's ID
      user: {
        id: user?.id || '1',
        name: user?.user_metadata?.full_name || 'John Doe',
        username: user?.user_metadata?.username || 'johndoe',
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
          <div className="flex items-center">
            <button 
              className="p-2 mr-2 rounded-full hover:bg-xExtraLightGray/50 transition-colors text-xs font-medium"
              onClick={() => setFeedView(feedView === 'swipeable' ? 'list' : 'swipeable')}
            >
              {feedView === 'swipeable' ? 'Switch to List View' : 'Switch to Swipe View'}
            </button>
            <button className="p-2 rounded-full hover:bg-xExtraLightGray/50 transition-colors">
              <Settings size={20} />
            </button>
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
      {activeTab === 'following' && displayPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <h2 className="text-2xl font-bold mb-2">Welcome to your timeline!</h2>
          <p className="text-xGray mb-6 max-w-md">
            When you follow someone, their posts will show up here. You can discover accounts to follow in the "For you" section.
          </p>
          <button 
            className="bg-xBlue text-white px-6 py-2 rounded-full font-bold hover:bg-xBlue/90 transition-colors"
            onClick={() => setActiveTab('for-you')}
          >
            Discover people to follow
          </button>
        </div>
      ) : (
        feedView === 'swipeable' ? (
          <SwipeablePostView posts={displayPosts} />
        ) : (
          <PostList posts={displayPosts} />
        )
      )}
    </AppLayout>
  );
};

export default Index;
