import React, { useState, useCallback, Suspense, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PostList from '@/components/feed/PostList';
import SwipeablePostView from '@/components/feed/SwipeablePostView';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Grid, List, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTheme } from '@/components/theme/theme-provider';
import PostSkeleton from '@/components/feed/PostSkeleton';
import { usePosts } from '@/hooks/use-posts';
import { Progress } from '@/components/ui/progress';
import CreatePost from '@/components/feed/CreatePost';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { supabase, enableRealtimeForTables } from '@/integrations/supabase/client';

const Index = () => {
  const [feedView, setFeedView] = useState<'swipeable' | 'list'>('swipeable');
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedKey, setFeedKey] = useState<string>(`feed-${Date.now()}`);
  
  const { 
    posts, 
    loading, 
    error, 
    refresh: refreshPosts,
    loadMore,
    addNewPost,
    userLanguages
  } = usePosts();
  
  const handlePostCreated = (content: string, media?: {type: string, url: string}[]) => {
    if (!user) return;
    
    console.log("Post created, adding to feed:", content, media);
    
    // We'll manually trigger a refresh to get the new post
    setTimeout(() => {
      refreshPosts();
    }, 500);
    
    toast.success("Post created! It will appear in your feed shortly.");
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    console.log("Refreshing posts...");
    
    // Reset the feed key to force component remount
    setFeedKey(`feed-${Date.now()}`);
    
    refreshPosts().finally(() => {
      setTimeout(() => {
        setIsRefreshing(false);
        console.log("Refresh complete");
      }, 500);
    });
    
    toast.info('Refreshing feed...');
  }, [refreshPosts]);

  // Setup realtime subscription for posts table changes
  useEffect(() => {
    console.log("Setting up realtime in Index component");
    
    // Enable realtime for tables and get the channel
    const channel = enableRealtimeForTables();
    
    // Initial fetch
    refreshPosts();
    
    return () => {
      // Clean up subscription - fix the removeAllSubscriptions issue
      channel.unsubscribe();
    };
  }, [refreshPosts]);

  const bgColor = theme === 'dark' ? 'bg-black' : 'bg-lightBeige';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const borderColor = theme === 'dark' ? 'border-neutral-800' : 'border-gray-200';
  const headerBg = theme === 'dark' ? 'bg-black backdrop-blur-md' : 'bg-lightBeige backdrop-blur-md';
  const buttonBgActive = theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-200 text-gray-900';
  const buttonTextInactive = theme === 'dark' ? 'text-neutral-400' : 'text-gray-500';
  const errorBg = theme === 'dark' ? 'bg-red-900/10' : 'bg-red-50';
  const errorBorder = theme === 'dark' ? 'border-red-900/20' : 'border-red-100';
  const errorText = theme === 'dark' ? 'text-red-400' : 'text-red-500';

  return (
    <AppLayout>
      <div className={`sticky top-0 z-20 ${headerBg} border-b ${borderColor}`}>
        <div className="flex justify-end items-center px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              className="p-2 rounded-md transition-colors hover:bg-gray-200/10"
              onClick={handleRefresh}
              aria-label="Refresh posts"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''} ${textColor}`} />
            </button>
            <button 
              className={cn(
                "p-2 rounded-md transition-colors",
                feedView === 'swipeable' 
                  ? buttonBgActive
                  : buttonTextInactive
              )}
              onClick={() => setFeedView('swipeable')}
            >
              <span className="sr-only">Gallery View</span>
              <Grid className="w-5 h-5" />
            </button>
            <button 
              className={cn(
                "p-2 rounded-md transition-colors",
                feedView === 'list' 
                  ? buttonBgActive
                  : buttonTextInactive
              )}
              onClick={() => setFeedView('list')}
            >
              <span className="sr-only">List View</span>
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="border-b border-neutral-800">
        <CreatePost onPostCreated={handlePostCreated} />
      </div>
      
      {loading && !posts.length && (
        <div className="p-4">
          <div className="w-full h-1 overflow-hidden">
            <Progress className="h-1" value={undefined} />
          </div>
          <div className="space-y-6 mt-4">
            <PostSkeleton count={3} />
          </div>
        </div>
      )}
      
      <div className={`pt-0 ${bgColor}`}>
        {error && !loading && (
          <div className={`p-6 ${errorBg} ${errorText} border ${errorBorder} rounded-md mx-4 my-6`}>
            <p className="mb-4">There was a problem loading posts. Please try again.</p>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        )}
        
        {userLanguages && userLanguages.length > 0 && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-sm text-neutral-500">
              Your feed is personalized for: {userLanguages.map(lang => 
                `#${lang}`
              ).join(', ')}
            </p>
          </div>
        )}
        
        {posts.length > 0 && (
          <div className={`pt-0 ${bgColor}`}>
            <Suspense fallback={<PostSkeleton count={3} />}>
              {feedView === 'swipeable' ? (
                <SwipeablePostView 
                  posts={posts} 
                  loading={loading} 
                  key={`${feedKey}-swipeable-${posts.length}`}
                />
              ) : (
                <PostList 
                  posts={posts} 
                  loading={loading} 
                  key={`${feedKey}-list-${posts.length}`}
                />
              )}
            </Suspense>
          </div>
        )}
        
        {posts.length > 0 && !loading && (
          <div className="flex justify-center pb-8 pt-4">
            <Button 
              variant="outline" 
              onClick={loadMore}
              className="text-sm"
            >
              Load more posts
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
