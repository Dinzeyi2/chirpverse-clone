
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PostList from '@/components/feed/PostList';
import SwipeablePostView from '@/components/feed/SwipeablePostView';
import FilterDialog from '@/components/feed/FilterDialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ChevronDown, Grid, List } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type SortOption = 'latest' | 'popular' | 'commented';

const Index = () => {
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [feedView, setFeedView] = useState<'swipeable' | 'list'>('swipeable');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const { user, username } = useAuth();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        
        // Fixed the query to correctly fetch posts with their related data
        const { data: shoutoutData, error: shoutoutError } = await supabase
          .from('shoutouts')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (shoutoutError) {
          console.error('Error fetching shoutouts:', shoutoutError);
          toast.error('Could not load posts');
          return;
        }
        
        if (!shoutoutData) {
          setFeedPosts([]);
          return;
        }
        
        // For each shoutout, fetch the profile data separately
        const formattedPosts = await Promise.all(shoutoutData.map(async post => {
          // Get profile data
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', post.user_id)
            .single();
            
          // Get counts in separate queries
          const { count: likesCount } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('shoutout_id', post.id);
            
          const { count: commentsCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('shoutout_id', post.id);
            
          const { count: savesCount } = await supabase
            .from('saved_posts')
            .select('*', { count: 'exact', head: true })
            .eq('shoutout_id', post.id);
          
          const profile = profileData || {
            full_name: 'User',
            avatar_url: 'https://i.pravatar.cc/150?img=1',
          };
          
          // Create a default username using user_id if username is not available
          const displayUsername = profile.username || post.user_id?.substring(0, 8) || 'user';
          
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
        }));
        
        setFeedPosts(formattedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.error('Could not load posts');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
    
    // Set up realtime subscription to listen for new posts
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
            // Get the profile data for the new post
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', payload.new.user_id)
              .single();
              
            const profile = profileData || {
              full_name: 'User',
              avatar_url: 'https://i.pravatar.cc/150?img=1',
            };
            
            // Create a default username using user_id if username is not available
            const displayUsername = profile.username || payload.new.user_id?.substring(0, 8) || 'user';
          
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
  
  // Apply both filtering and sorting to posts
  useEffect(() => {
    // Step 1: Filter posts by categories if any are selected
    let postsToDisplay = [...feedPosts];
    
    if (selectedCategories.length > 0) {
      postsToDisplay = feedPosts.filter(post => {
        const content = post.content.toLowerCase();
        return selectedCategories.some(category => 
          content.includes(category.toLowerCase())
        );
      });
    }
    
    // Step 2: Sort the filtered posts according to selected sort option
    switch (sortOption) {
      case 'latest':
        postsToDisplay.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        postsToDisplay.sort((a, b) => {
          // Calculate popularity score (likes + comments + saves)
          const scoreA = a.likes + a.comments + a.saves;
          const scoreB = b.likes + b.comments + b.saves;
          return scoreB - scoreA;
        });
        break;
      case 'commented':
        postsToDisplay.sort((a, b) => b.comments - a.comments);
        break;
      default:
        // Default to latest if sortOption is invalid
        postsToDisplay.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    setFilteredPosts(postsToDisplay);
  }, [feedPosts, selectedCategories, sortOption]);
  
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

  return (
    <AppLayout>
      <div className="sticky top-0 z-20 bg-black backdrop-blur-md border-b border-neutral-800">
        <div className="flex justify-between items-center px-4 py-4">
          <div className="flex items-center gap-6">
            <FilterDialog 
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white flex items-center gap-2 text-lg font-medium p-0 hover:bg-transparent">
                  Sort
                  <ChevronDown className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-black border border-neutral-800 text-white">
                <DropdownMenuItem 
                  className={cn("hover:bg-neutral-800", sortOption === 'latest' && "bg-neutral-800")}
                  onClick={() => handleSortChange('latest')}
                >
                  Latest
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={cn("hover:bg-neutral-800", sortOption === 'popular' && "bg-neutral-800")}
                  onClick={() => handleSortChange('popular')}
                >
                  Most Popular
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={cn("hover:bg-neutral-800", sortOption === 'commented' && "bg-neutral-800")}
                  onClick={() => handleSortChange('commented')}
                >
                  Most Commented
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              className={cn(
                "p-2 rounded-md transition-colors",
                feedView === 'swipeable' 
                  ? "bg-neutral-800 text-white" 
                  : "text-neutral-400"
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
                  ? "bg-neutral-800 text-white" 
                  : "text-neutral-400"
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
        <div className="p-4 space-y-6 bg-black">
          {[1, 2, 3].map((item) => (
            <div key={item} className="animate-pulse">
              <div className="flex space-x-4">
                <div className="rounded-full bg-gray-800 h-12 w-12"></div>
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-800 rounded"></div>
                    <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                  </div>
                  <div className="h-40 bg-gray-800 rounded"></div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-800 rounded w-1/5"></div>
                    <div className="h-4 bg-gray-800 rounded w-1/5"></div>
                    <div className="h-4 bg-gray-800 rounded w-1/5"></div>
                    <div className="h-4 bg-gray-800 rounded w-1/5"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && (
        <div className="pt-0 bg-black">
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
