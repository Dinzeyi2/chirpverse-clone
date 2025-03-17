
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PostList from '@/components/feed/PostList';
import SwipeablePostView from '@/components/feed/SwipeablePostView';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ChevronDown, Grid, List, RefreshCw } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTheme } from '@/components/theme/theme-provider';

type SortOption = 'latest' | 'popular' | 'commented';

const Index = () => {
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [feedView, setFeedView] = useState<'swipeable' | 'list'>('swipeable');
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const { user, username } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: shoutoutData, error: shoutoutError } = await supabase
        .from('shoutouts')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (shoutoutError) {
        console.error('Error fetching shoutouts:', shoutoutError);
        setError('Could not load posts');
        toast.error('Could not load posts');
        return;
      }
      
      if (!shoutoutData || shoutoutData.length === 0) {
        setFeedPosts([]);
        setLoading(false);
        return;
      }
      
      const formattedPosts = await Promise.all(shoutoutData.map(async post => {
        try {
          let profileData = null;
          try {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', post.user_id)
              .single();
            profileData = data;
          } catch (profileError) {
            console.error('Error fetching profile:', profileError);
          }
          
          let likesCount = 0;
          try {
            const { count } = await supabase
              .from('likes')
              .select('*', { count: 'exact', head: true })
              .eq('shoutout_id', post.id);
            likesCount = count || 0;
          } catch (likesError) {
            console.error('Error fetching likes count:', likesError);
          }
          
          let commentsCount = 0;
          try {
            const { count } = await supabase
              .from('comments')
              .select('*', { count: 'exact', head: true })
              .eq('shoutout_id', post.id);
            commentsCount = count || 0;
          } catch (commentsError) {
            console.error('Error fetching comments count:', commentsError);
          }
          
          let savesCount = 0;
          try {
            const { count } = await supabase
              .from('saved_posts')
              .select('*', { count: 'exact', head: true })
              .eq('shoutout_id', post.id);
            savesCount = count || 0;
          } catch (savesError) {
            console.error('Error fetching saves count:', savesError);
          }
        
          const profile = profileData || {
            full_name: 'User',
            avatar_url: 'https://i.pravatar.cc/150?img=1',
          };
          
          const displayUsername = post.user_id?.substring(0, 8) || 'user';
          
          return {
            id: post.id,
            content: post.content,
            createdAt: post.created_at,
            likes: likesCount || 0,
            comments: commentsCount || 0,
            saves: savesCount || 0,
            reposts: 0,
            replies: commentsCount || 0,
            views: 0,
            userId: post.user_id,
            images: post.media,
            user: {
              id: post.user_id,
              name: profile.full_name || 'User',
              username: displayUsername,
              avatar: profile.avatar_url || 'https://i.pravatar.cc/150?img=1',
              verified: false,
              followers: 0,
              following: 0,
            }
          };
        } catch (postError) {
          console.error('Error processing post:', postError);
          return {
            id: post.id,
            content: post.content,
            createdAt: post.created_at,
            likes: 0,
            comments: 0,
            saves: 0,
            reposts: 0,
            replies: 0,
            views: 0,
            userId: post.user_id,
            images: post.media,
            user: {
              id: post.user_id,
              name: 'User',
              username: 'user',
              avatar: 'https://i.pravatar.cc/150?img=1',
              verified: false,
              followers: 0,
              following: 0,
            }
          };
        }
      }));
      
      setFeedPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Could not load posts');
      toast.error('Could not load posts');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPosts();
    
    const channel = supabase
      .channel('public:shoutouts')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'shoutouts'
        }, 
        async (payload) => {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', payload.new.user_id)
              .single();
              
            const profile = profileData || {
              full_name: 'User',
              avatar_url: 'https://i.pravatar.cc/150?img=1',
            };
            
            const displayUsername = payload.new.user_id?.substring(0, 8) || 'user';
          
            const newPost = {
              id: payload.new.id,
              content: payload.new.content,
              createdAt: payload.new.created_at,
              likes: 0,
              comments: 0,
              saves: 0,
              reposts: 0,
              replies: 0,
              views: 0,
              userId: payload.new.user_id,
              images: payload.new.media,
              user: {
                id: payload.new.user_id,
                name: profile.full_name || 'User',
                username: displayUsername,
                avatar: profile.avatar_url || 'https://i.pravatar.cc/150?img=1',
                verified: false,
                followers: 0,
                following: 0,
              }
            };
            
            toast.success('New post added!');
            setFeedPosts(prev => [newPost, ...prev]);
          } catch (error) {
            console.error('Error processing new post:', error);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  useEffect(() => {
    let postsToDisplay = [...feedPosts];
    
    switch (sortOption) {
      case 'latest':
        postsToDisplay.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        postsToDisplay.sort((a, b) => {
          const scoreA = a.likes + a.comments + a.saves;
          const scoreB = b.likes + b.comments + b.saves;
          return scoreB - scoreA;
        });
        break;
      case 'commented':
        postsToDisplay.sort((a, b) => b.comments - a.comments);
        break;
      default:
        postsToDisplay.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    setFilteredPosts(postsToDisplay);
  }, [feedPosts, sortOption]);
  
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
    fetchPosts();
    toast.info('Refreshing posts...');
  };

  const bgColor = theme === 'dark' ? 'bg-black' : 'bg-lightBeige';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const borderColor = theme === 'dark' ? 'border-neutral-800' : 'border-gray-200';
  const headerBg = theme === 'dark' ? 'bg-black backdrop-blur-md' : 'bg-lightBeige backdrop-blur-md';
  const buttonBgActive = theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-200 text-gray-900';
  const buttonTextInactive = theme === 'dark' ? 'text-neutral-400' : 'text-gray-500';
  const dropdownBg = theme === 'dark' ? 'bg-black border-neutral-800 text-white' : 'bg-white border-gray-200 text-gray-900';
  const dropdownHover = theme === 'dark' ? 'hover:bg-neutral-800' : 'hover:bg-gray-100';
  const dropdownActive = theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100';
  const skeletonBg = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200';
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
                  <ChevronDown className="w-5 h-5" />
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
      
      {loading && (
        <div className={`p-4 space-y-6 ${bgColor}`}>
          {[1, 2, 3].map((item) => (
            <div key={item} className="animate-pulse">
              <div className="flex space-x-4">
                <div className={`rounded-full ${skeletonBg} h-12 w-12`}></div>
                <div className="flex-1 space-y-4 py-1">
                  <div className={`h-4 ${skeletonBg} rounded w-3/4`}></div>
                  <div className="space-y-2">
                    <div className={`h-4 ${skeletonBg} rounded`}></div>
                    <div className={`h-4 ${skeletonBg} rounded w-5/6`}></div>
                  </div>
                  <div className={`h-40 ${skeletonBg} rounded`}></div>
                  <div className="flex justify-between">
                    <div className={`h-4 ${skeletonBg} rounded w-1/5`}></div>
                    <div className={`h-4 ${skeletonBg} rounded w-1/5`}></div>
                    <div className={`h-4 ${skeletonBg} rounded w-1/5`}></div>
                    <div className={`h-4 ${skeletonBg} rounded w-1/5`}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
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
      
      {!loading && !error && (
        <div className={`pt-0 ${bgColor}`}>
          {feedView === 'swipeable' ? (
            <SwipeablePostView posts={filteredPosts} />
          ) : (
            <PostList posts={filteredPosts} />
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default Index;
