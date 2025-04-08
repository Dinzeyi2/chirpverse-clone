
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

const ForYou = () => {
  const [feedView, setFeedView] = useState<'swipeable' | 'list'>('swipeable');
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedKey, setFeedKey] = useState<string>(`feed-${Date.now()}`);
  const [userLanguages, setUserLanguages] = useState<string[]>([]);
  
  const { 
    posts, 
    loading, 
    error, 
    refresh: refreshPosts,
    loadMore,
    addNewPost,
    engagementData
  } = usePosts();
  
  // Filter posts based on user's programming languages
  const filteredPosts = posts.filter(post => {
    if (!userLanguages.length) return false;
    
    // Check if any of the post's languages match the user's languages
    return post.languages?.some(lang => 
      userLanguages.map(l => l.toLowerCase()).includes(lang.toLowerCase())
    );
  });

  // Fetch user's programming languages
  useEffect(() => {
    const fetchUserLanguages = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('programming_languages')
          .eq('user_id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching user languages:', error);
          return;
        }
        
        if (data && Array.isArray(data.programming_languages)) {
          setUserLanguages(data.programming_languages);
        }
      } catch (err) {
        console.error('Failed to fetch user languages:', err);
      }
    };
    
    fetchUserLanguages();
  }, [user]);

  const handlePostCreated = (content: string, media?: {type: string, url: string}[]) => {
    if (!user) return;
    
    console.log("Post created, adding to feed:", content);
    
    const extractLanguages = (content: string): string[] => {
      const mentionRegex = /@(\w+)/g;
      const matches = [...(content.match(mentionRegex) || [])];
      return matches.map(match => match.substring(1).toLowerCase());
    };
    
    const languages = extractLanguages(content);
    
    const codeBlocks = media ? media
      .filter(item => item.type === 'code')
      .map(item => {
        try {
          const parsed = JSON.parse(item.url);
          return {
            code: parsed.code,
            language: parsed.language
          };
        } catch (e) {
          console.error("Failed to parse code block:", e);
          return null;
        }
      })
      .filter(Boolean) : [];
    
    const newPost = {
      id: crypto.randomUUID(),
      content,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
      saves: 0,
      reposts: 0,
      replies: 0,
      views: 0,
      userId: user.id,
      images: media || null,
      languages,
      codeBlocks,
      user: {
        id: user.id,
        name: user?.user_metadata?.full_name || 'User',
        username: user.id.substring(0, 8),
        avatar: "/lovable-uploads/325d2d74-ad68-4607-8fab-66f36f0e087e.png",
        verified: false,
        followers: 0,
        following: 0,
      }
    };
    
    addNewPost(newPost);
    
    setFeedKey(`feed-${Date.now()}`);
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    console.log("Refreshing posts...");
    
    refreshPosts().finally(() => {
      setTimeout(() => {
        setIsRefreshing(false);
        setFeedKey(`feed-${Date.now()}`);
      }, 500);
    });
    
    toast.info('Refreshing feed...');
  }, [refreshPosts]);

  useEffect(() => {
    refreshPosts();
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
        <div className="flex justify-between items-center px-4 py-4">
          <div></div>
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
      
      {loading && !filteredPosts.length && (
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
          <Alert variant="destructive" className="m-4">
            <AlertTitle>Error Loading Posts</AlertTitle>
            <AlertDescription>
              <p className="mb-4">There was a problem loading posts. Please try again.</p>
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {!loading && !error && userLanguages.length === 0 && (
          <Alert className="m-4 bg-amber-600/20 border-amber-600/30 text-amber-300">
            <AlertTitle>Set up your programming languages</AlertTitle>
            <AlertDescription>
              <p className="mb-4">
                To see personalized content in your "For You" feed, please add your programming 
                languages in the Settings page.
              </p>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 border-amber-500/30 hover:bg-amber-500/20"
                onClick={() => window.location.href = '/settings'}
              >
                Go to Settings
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && userLanguages.length > 0 && filteredPosts.length === 0 && (
          <Alert className="m-4 bg-blue-900/10 border-blue-900/20">
            <AlertTitle>No content matching your interests yet</AlertTitle>
            <AlertDescription>
              <p className="mb-4">
                We don't have any posts matching your selected programming languages yet. 
                Check back later or explore the main feed.
              </p>
              <div className="space-x-4">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => window.location.href = '/'}
                >
                  Go to Home
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {filteredPosts.length > 0 && (
          <div className={`pt-0 ${bgColor}`}>
            <Suspense fallback={<PostSkeleton count={3} />}>
              {feedView === 'swipeable' ? (
                <SwipeablePostView 
                  posts={filteredPosts} 
                  loading={loading} 
                  engagementData={engagementData}
                  key={`${feedKey}-swipeable-${filteredPosts.length}`}
                />
              ) : (
                <PostList 
                  posts={filteredPosts} 
                  loading={loading} 
                  engagementData={engagementData}
                  key={`${feedKey}-list-${filteredPosts.length}`}
                />
              )}
            </Suspense>
          </div>
        )}
        
        {filteredPosts.length > 0 && !loading && (
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

export default ForYou;
