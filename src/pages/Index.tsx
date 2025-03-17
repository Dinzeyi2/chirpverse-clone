
import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PostList from '@/components/feed/PostList';
import SwipeablePostView from '@/components/feed/SwipeablePostView';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Grid, List, RefreshCw } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTheme } from '@/components/theme/theme-provider';
import PostSkeleton from '@/components/feed/PostSkeleton';
import { usePosts, SortOption } from '@/hooks/use-posts';

const Index = () => {
  const [feedView, setFeedView] = useState<'swipeable' | 'list'>('swipeable');
  const { user } = useAuth();
  const { theme } = useTheme();
  const { 
    posts, 
    loading, 
    error, 
    sortOption, 
    setSortOption, 
    refresh: refreshPosts,
    loadMore 
  } = usePosts();
  
  const handlePostCreated = (content: string, media?: {type: string, url: string}[]) => {
    if (!user) return;
    
    const createPost = async () => {
      try {
        const { data, error } = await supabase
          .from('shoutouts')
          .insert({
            content,
            user_id: user.id,
            media: media || null
          })
          .select()
          .single();
          
        if (error) throw error;
        
        toast.success('Post created successfully!');
      } catch (error) {
        console.error('Error creating post:', error);
        toast.error('Failed to create post');
      }
    };
    
    createPost();
  };

  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
  };

  const handleRefresh = () => {
    refreshPosts();
    toast.info('Refreshing posts...');
  };

  // Theme-based styling
  const bgColor = theme === 'dark' ? 'bg-black' : 'bg-lightBeige';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const borderColor = theme === 'dark' ? 'border-neutral-800' : 'border-gray-200';
  const headerBg = theme === 'dark' ? 'bg-black backdrop-blur-md' : 'bg-lightBeige backdrop-blur-md';
  const buttonBgActive = theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-200 text-gray-900';
  const buttonTextInactive = theme === 'dark' ? 'text-neutral-400' : 'text-gray-500';
  const dropdownBg = theme === 'dark' ? 'bg-black border-neutral-800 text-white' : 'bg-white border-gray-200 text-gray-900';
  const dropdownHover = theme === 'dark' ? 'hover:bg-neutral-800' : 'hover:bg-gray-100';
  const dropdownActive = theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100';
  const errorBg = theme === 'dark' ? 'bg-red-900/10' : 'bg-red-50';
  const errorBorder = theme === 'dark' ? 'border-red-900/20' : 'border-red-100';
  const errorText = theme === 'dark' ? 'text-red-400' : 'text-red-500';

  return (
    <AppLayout>
      <div className={`sticky top-0 z-20 ${headerBg} border-b ${borderColor}`}>
        <div className="flex justify-between items-center px-4 py-4">
          <div className="flex items-center gap-6">  
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`flex items-center gap-2 text-lg font-medium p-0 hover:bg-transparent ${textColor}`}>
                  Sort
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className={dropdownBg}>
                <DropdownMenuItem 
                  className={cn(dropdownHover, sortOption === 'latest' && dropdownActive)}
                  onClick={() => handleSortChange('latest')}
                >
                  Latest
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={cn(dropdownHover, sortOption === 'popular' && dropdownActive)}
                  onClick={() => handleSortChange('popular')}
                >
                  Most Popular
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={cn(dropdownHover, sortOption === 'commented' && dropdownActive)}
                  onClick={() => handleSortChange('commented')}
                >
                  Most Commented
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              className="p-2 rounded-md transition-colors hover:bg-gray-200/10"
              onClick={handleRefresh}
              aria-label="Refresh posts"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''} ${textColor}`} />
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
      
      {/* Always show skeleton loader initially, then actual content when loaded */}
      <div className={`pt-0 ${bgColor}`}>
        {loading && <div className="p-4 space-y-6"><PostSkeleton count={3} /></div>}
        
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
        
        {posts.length > 0 && (
          <div className={`pt-0 ${bgColor}`}>
            {feedView === 'swipeable' ? (
              <SwipeablePostView posts={posts} loading={loading} />
            ) : (
              <PostList posts={posts} loading={loading} />
            )}
          </div>
        )}
        
        {/* Load more posts when user scrolls to bottom */}
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
