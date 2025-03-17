import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PostList from '@/components/feed/PostList';
import SwipeablePostView from '@/components/feed/SwipeablePostView';
import FilterDialog from '@/components/feed/FilterDialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, parseProfileField } from '@/integrations/supabase/client';
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

type SortOption = 'latest' | 'popular' | 'commented' | 'relevant';

const Index = () => {
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [feedView, setFeedView] = useState<'swipeable' | 'list'>('swipeable');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('latest'); // Default to latest for non-logged in users
  const { user, username, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { theme } = useTheme();
  const userCompanies = profile?.company ? parseProfileField(profile.company) : [];
  const userFields = profile?.field ? parseProfileField(profile.field) : [];
  
  const fetchPosts = async () => {
    setError(null);
    try {
      setLoading(true);
      
      console.log("Fetching posts...");
      const { data: shoutoutData, error: shoutoutError } = await supabase
        .from('shoutouts')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (shoutoutError) {
        console.error('Error fetching shoutouts:', shoutoutError);
        throw new Error(`Could not load posts: ${shoutoutError.message}`);
      }
      
      if (!shoutoutData || shoutoutData.length === 0) {
        console.log("No posts found");
        setFeedPosts([]);
        setFilteredPosts([]);
        return;
      }
      
      console.log(`Found ${shoutoutData.length} posts, processing...`);
      
      // For each shoutout, fetch the profile data separately
      const formattedPosts = await Promise.all(shoutoutData.map(async post => {
        try {
          // Get profile data
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', post.user_id)
            .maybeSingle(); // Use maybeSingle instead of single to prevent errors
            
          // Get counts in separate queries
          let likesCount = 0;
          let commentsCount = 0;
          let savesCount = 0;
          
          try {
            const { count } = await supabase
              .from('likes')
              .select('*', { count: 'exact', head: true })
              .eq('shoutout_id', post.id);
              
            likesCount = count || 0;
          } catch (error) {
            console.error(`Error fetching likes for post ${post.id}:`, error);
          }
            
          try {
            const { count } = await supabase
              .from('comments')
              .select('*', { count: 'exact', head: true })
              .eq('shoutout_id', post.id);
              
            commentsCount = count || 0;
          } catch (error) {
            console.error(`Error fetching comments for post ${post.id}:`, error);
          }
            
          try {
            const { count } = await supabase
              .from('saved_posts')
              .select('*', { count: 'exact', head: true })
              .eq('shoutout_id', post.id);
              
            savesCount = count || 0;
          } catch (error) {
            console.error(`Error fetching saves for post ${post.id}:`, error);
          }
          
          const profile = profileData || {
            full_name: 'User',
            avatar_url: 'https://i.pravatar.cc/150?img=1',
          };
          
          // Create a display username from the user_id since profile.username doesn't exist
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
            relevanceScore: user ? calculateRelevanceScore(post.content) : 0, // Only calculate relevance for logged-in users
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
        } catch (error) {
          console.error(`Error processing post ${post.id}:`, error);
          // Return a default post object if there's an error processing this post
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
            relevanceScore: 0,
            user: {
              id: post.user_id,
              name: 'User',
              username: post.user_id?.substring(0, 8) || 'user',
              avatar: 'https://i.pravatar.cc/150?img=1',
              verified: false,
              followers: 0,
              following: 0,
            }
          };
        }
      }));
      
      // Filter out any null/undefined posts that might have occurred due to errors
      const validPosts = formattedPosts.filter(post => post !== null && post !== undefined);
      console.log(`Successfully processed ${validPosts.length} valid posts`);
      setFeedPosts(validPosts);
      
      // Set default sort option based on authentication
      if (!user) {
        setSortOption('latest'); // Default to latest for non-logged in users
      } else if (user && userCompanies.length > 0) {
        setSortOption('relevant'); // Use relevant only if user has companies
      }
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      setError(error.message || "Failed to load posts");
      // Keep existing posts if we have them
      if (feedPosts.length === 0) {
        setFilteredPosts([]);
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
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
              .maybeSingle();
              
            const profile = profileData || {
              full_name: 'User',
              avatar_url: 'https://i.pravatar.cc/150?img=1',
            };
            
            // Create a display username from the user_id since profile.username doesn't exist
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
              relevanceScore: user ? calculateRelevanceScore(payload.new.content) : 0,
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
            
            if (user) {
              toast.success('New post added!');
            }
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
  }, [user, userCompanies, userFields, retryCount]);
  
  // Calculate how relevant a post is to the current user
  const calculateRelevanceScore = (content: string): number => {
    if (!content || !user) return 0;
    
    let score = 0;
    const contentLower = content.toLowerCase();
    
    // Check for company mentions
    if (userCompanies.length > 0) {
      userCompanies.forEach(company => {
        if (company) {
          const companyPattern = new RegExp(`@${company.trim()}\\b`, 'i');
          if (companyPattern.test(contentLower)) {
            // Higher weight for exact company match with @ symbol
            score += 10;
          } else if (contentLower.includes(company.toLowerCase())) {
            // Lower weight for company name mention without @ symbol
            score += 5;
          }
        }
      });
    }
    
    // Check for field mentions (gives some weight but less than company)
    if (userFields.length > 0) {
      userFields.forEach(field => {
        if (field && contentLower.includes(field.toLowerCase())) {
          score += 3;
        }
      });
    }
    
    return score;
  };
  
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
      case 'relevant':
        // Only do relevance sorting if user is logged in
        if (user) {
          // Sort by relevance score first, then by recency
          postsToDisplay.sort((a, b) => {
            if (b.relevanceScore !== a.relevanceScore) {
              return b.relevanceScore - a.relevanceScore;
            }
            // If relevance is the same, show newer posts first
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        } else {
          // Default to latest if not logged in
          postsToDisplay.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        break;
      default:
        // Default to latest if sortOption is invalid
        postsToDisplay.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    setFilteredPosts(postsToDisplay);
  }, [feedPosts, selectedCategories, sortOption, user]);
  
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
    setRetryCount(prev => prev + 1);
    fetchPosts();
  };

  // Determine colors based on theme
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
  const errorBg = theme === 'dark' ? 'bg-red-900/20' : 'bg-red-100';
  const errorText = theme === 'dark' ? 'text-red-400' : 'text-red-600';

  return (
    <AppLayout>
      <div className={`sticky top-0 z-20 ${headerBg} border-b ${borderColor}`}>
        <div className="flex justify-between items-center px-4 py-4">
          <div className="flex items-center gap-6">
            <FilterDialog 
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`flex items-center gap-2 text-lg font-medium p-0 hover:bg-transparent ${textColor}`}>
                  Sort
                  <ChevronDown className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className={dropdownBg}>
                {user && userCompanies.length > 0 && (
                  <DropdownMenuItem 
                    className={cn(dropdownHover, sortOption === 'relevant' && dropdownActive)}
                    onClick={() => handleSortChange('relevant')}
                  >
                    Most Relevant
                  </DropdownMenuItem>
                )}
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
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="mr-2"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>
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
      
      {error && (
        <div className={`${errorBg} p-4 mx-4 my-2 rounded-md ${errorText}`}>
          <p className="flex items-center gap-2">
            <span>Error: {error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Retry
            </Button>
          </p>
        </div>
      )}
      
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
      
      {!loading && (
        <div className={`pt-0 ${bgColor}`}>
          {feedView === 'swipeable' ? (
            <SwipeablePostView posts={filteredPosts} onRefresh={handleRefresh} />
          ) : (
            <PostList posts={filteredPosts} />
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default Index;

