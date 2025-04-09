
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
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { usePosts } from '@/hooks/use-posts';

const ForYou = () => {
  const [feedView, setFeedView] = useState<'swipeable' | 'list'>('swipeable');
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedKey, setFeedKey] = useState<string>(`feed-${Date.now()}`);
  const [isLoading, setIsLoading] = useState(true);
  const [forYouPosts, setForYouPosts] = useState<any[]>([]);
  const [userLanguages, setUserLanguages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Import the usePosts hook directly
  const { engagementData } = usePosts();
  
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
        
        if (data?.programming_languages) {
          // Ensure we have an array of lowercase languages for case-insensitive matching
          const languages = Array.isArray(data.programming_languages) 
            ? data.programming_languages.map(lang => lang.toLowerCase())
            : [];
          
          setUserLanguages(languages);
          console.log('User languages (normalized):', languages);
        }
      } catch (err) {
        console.error('Error in fetchUserLanguages:', err);
      }
    };
    
    fetchUserLanguages();
  }, [user]);
  
  // Function to check if a post matches user's languages
  const postMatchesUserLanguages = (post: any, userLangs: string[]) => {
    if (!post || !userLangs.length) return false;
    
    // Normalize user languages to lowercase for case-insensitive matching
    const normalizedUserLangs = userLangs.map(lang => lang.toLowerCase().trim());
    
    // Approach 1: Check post metadata for languages array
    if (post.metadata) {
      let metadata;
      try {
        // Handle metadata whether it's a string or already an object
        metadata = typeof post.metadata === 'string' 
          ? JSON.parse(post.metadata) 
          : post.metadata;
          
        if (metadata.languages && Array.isArray(metadata.languages)) {
          // Check for language match in metadata.languages
          for (const postLang of metadata.languages) {
            const postLangLower = postLang.toLowerCase().trim();
            if (normalizedUserLangs.includes(postLangLower)) {
              console.log(`Match found in metadata: Post has ${postLang}, user has ${normalizedUserLangs.join(', ')}`);
              return true;
            }
          }
        }
      } catch (e) {
        console.error('Error parsing post metadata:', e);
      }
    }
    
    // Approach 2: Check post content for language mentions
    if (post.content) {
      const postContentLower = post.content.toLowerCase();
      for (const userLang of normalizedUserLangs) {
        // Simple check for language mentions with word boundaries
        const pattern = new RegExp(`\\b${userLang}\\b`, 'i');
        if (pattern.test(postContentLower)) {
          console.log(`Match found in content: Post content mentions ${userLang}`);
          return true;
        }
      }
    }
    
    // Approach 3: Check languages array directly on post object
    if (post.languages && Array.isArray(post.languages)) {
      for (const postLang of post.languages) {
        const postLangLower = postLang.toLowerCase().trim();
        if (normalizedUserLangs.includes(postLangLower)) {
          console.log(`Match found in post.languages: Post has ${postLang}, user has ${normalizedUserLangs.join(', ')}`);
          return true;
        }
      }
    }
    
    return false;
  };
  
  // Fetch posts and filter by user's programming languages
  useEffect(() => {
    const fetchForYouPosts = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      if (userLanguages.length === 0) {
        console.log('No user languages found, skipping post fetch');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching posts for languages:', userLanguages);
        
        // Get ALL posts from the shoutouts table to filter locally
        const { data: posts, error: postsError } = await supabase
          .from('shoutouts')
          .select(`
            id,
            content,
            created_at,
            user_id,
            media,
            metadata,
            user:profiles(id, full_name, avatar_url)
          `)
          .order('created_at', { ascending: false });
        
        if (postsError) {
          console.error('Error fetching posts:', postsError);
          setError('Failed to load posts');
          setIsLoading(false);
          return;
        }
        
        console.log(`Total posts fetched: ${posts?.length || 0}`);
        
        // Filter posts that match user's languages
        const matchingPosts = posts.filter(post => {
          return postMatchesUserLanguages(post, userLanguages);
        });
        
        console.log(`Posts matching user languages: ${matchingPosts.length}`);
        
        // Fetch engagement data for matching posts
        if (matchingPosts.length > 0) {
          const postsWithEngagement = await Promise.all(
            matchingPosts.map(async (post) => {
              // Get likes count
              const { count: likesCount } = await supabase
                .from('likes')
                .select('id', { count: 'exact', head: true })
                .eq('shoutout_id', post.id);
              
              // Get comments count
              const { count: commentsCount } = await supabase
                .from('comments')
                .select('id', { count: 'exact', head: true })
                .eq('shoutout_id', post.id);
              
              // Get reposts count
              const { count: repostsCount } = await supabase
                .from('reposts')
                .select('id', { count: 'exact', head: true })
                .eq('shoutout_id', post.id);
              
              // Get bookmarks count
              const { count: savesCount } = await supabase
                .from('bookmarks')
                .select('id', { count: 'exact', head: true })
                .eq('post_id', post.id.toString());
                
              // Extract languages from metadata
              let languages: string[] = [];
              let codeBlocks: {code: string, language: string}[] = [];
              
              try {
                if (post.metadata) {
                  // Parse metadata if it's a string
                  const metadata = typeof post.metadata === 'string' 
                    ? JSON.parse(post.metadata) 
                    : post.metadata;
                    
                  if (metadata && metadata.languages && Array.isArray(metadata.languages)) {
                    languages = metadata.languages;
                  }
                  
                  // Safely extract code_blocks
                  if (metadata && metadata.code_blocks && Array.isArray(metadata.code_blocks)) {
                    codeBlocks = metadata.code_blocks;
                  }
                }
              } catch (e) {
                console.error('Error parsing languages from metadata:', e);
              }
              
              return {
                id: post.id,
                content: post.content,
                createdAt: post.created_at,
                userId: post.user_id,
                images: post.media,
                languages: languages,
                codeBlocks: codeBlocks,
                likes: likesCount || 0,
                comments: commentsCount || 0,
                reposts: repostsCount || 0,
                saves: savesCount || 0,
                replies: 0,
                views: 0,
                user: {
                  id: post.user?.id,
                  name: post.user?.full_name || 'User',
                  username: post.user_id?.substring(0, 8) || 'user',
                  avatar: post.user?.avatar_url || "/lovable-uploads/325d2d74-ad68-4607-8fab-66f36f0e087e.png",
                  verified: false,
                  followers: 0,
                  following: 0,
                }
              };
            })
          );
          
          setForYouPosts(postsWithEngagement);
        } else {
          setForYouPosts([]);
        }
      } catch (err) {
        console.error('Error in fetchForYouPosts:', err);
        setError('An error occurred while loading posts');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userLanguages.length > 0) {
      console.log('Languages selected, fetching posts...');
      fetchForYouPosts();
    } else {
      setIsLoading(false);
    }
  }, [user, userLanguages]);
  
  // Handle refresh action
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setFeedKey(`feed-${Date.now()}`);
    
    // Refetch posts
    const fetchForYouPosts = async () => {
      if (!user || userLanguages.length === 0) {
        setIsRefreshing(false);
        return;
      }
      
      try {
        // Get ALL posts from the shoutouts table to filter locally
        const { data: posts, error: postsError } = await supabase
          .from('shoutouts')
          .select(`
            id,
            content,
            created_at,
            user_id,
            media,
            metadata,
            user:profiles(id, full_name, avatar_url)
          `)
          .order('created_at', { ascending: false });
        
        if (postsError) {
          console.error('Error fetching posts:', postsError);
          setError('Failed to load posts');
          setIsRefreshing(false);
          return;
        }
        
        // Filter posts that match user's languages
        const matchingPosts = posts.filter(post => {
          return postMatchesUserLanguages(post, userLanguages);
        });
        
        console.log(`Posts matching user languages on refresh: ${matchingPosts.length}`);
        
        // Fetch engagement data
        if (matchingPosts.length > 0) {
          const postsWithEngagement = await Promise.all(
            matchingPosts.map(async (post) => {
              // Get likes count
              const { count: likesCount } = await supabase
                .from('likes')
                .select('id', { count: 'exact', head: true })
                .eq('shoutout_id', post.id);
              
              // Get comments count
              const { count: commentsCount } = await supabase
                .from('comments')
                .select('id', { count: 'exact', head: true })
                .eq('shoutout_id', post.id);
              
              // Get reposts count
              const { count: repostsCount } = await supabase
                .from('reposts')
                .select('id', { count: 'exact', head: true })
                .eq('shoutout_id', post.id);
              
              // Get bookmarks count
              const { count: savesCount } = await supabase
                .from('bookmarks')
                .select('id', { count: 'exact', head: true })
                .eq('post_id', post.id.toString());
                
              // Extract languages from metadata
              let languages: string[] = [];
              let codeBlocks: {code: string, language: string}[] = [];
              
              try {
                if (post.metadata) {
                  // Parse metadata if it's a string
                  const metadata = typeof post.metadata === 'string' 
                    ? JSON.parse(post.metadata) 
                    : post.metadata;
                    
                  if (metadata && metadata.languages && Array.isArray(metadata.languages)) {
                    languages = metadata.languages;
                  }
                  
                  // Safely extract code_blocks
                  if (metadata && metadata.code_blocks && Array.isArray(metadata.code_blocks)) {
                    codeBlocks = metadata.code_blocks;
                  }
                }
              } catch (e) {
                console.error('Error parsing languages from metadata:', e);
              }
              
              return {
                id: post.id,
                content: post.content,
                createdAt: post.created_at,
                userId: post.user_id,
                images: post.media,
                languages: languages,
                codeBlocks: codeBlocks,
                likes: likesCount || 0,
                comments: commentsCount || 0,
                reposts: repostsCount || 0,
                saves: savesCount || 0,
                replies: 0,
                views: 0,
                user: {
                  id: post.user?.id,
                  name: post.user?.full_name || 'User',
                  username: post.user_id?.substring(0, 8) || 'user',
                  avatar: post.user?.avatar_url || "/lovable-uploads/325d2d74-ad68-4607-8fab-66f36f0e087e.png",
                  verified: false,
                  followers: 0,
                  following: 0,
                }
              };
            })
          );
          
          setForYouPosts(postsWithEngagement);
        } else {
          setForYouPosts([]);
        }
      } catch (err) {
        console.error('Error in fetchForYouPosts:', err);
        setError('An error occurred while loading posts');
      } finally {
        setIsRefreshing(false);
      }
    };
    
    fetchForYouPosts();
    toast.info('Refreshing feed...');
  }, [user, userLanguages]);

  // UI theme vars
  const bgColor = theme === 'dark' ? 'bg-black' : 'bg-lightBeige';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const borderColor = theme === 'dark' ? 'border-neutral-800' : 'border-gray-200';
  const headerBg = theme === 'dark' ? 'bg-black backdrop-blur-md' : 'bg-lightBeige backdrop-blur-md';
  const buttonBgActive = theme === 'dark' ? 'bg-neutral-800 text-white' : 'bg-gray-200 text-gray-900';
  const buttonTextInactive = theme === 'dark' ? 'text-neutral-400' : 'text-gray-500';

  return (
    <AppLayout>
      <div className={`sticky top-0 z-20 ${headerBg} border-b ${borderColor}`}>
        <div className="flex justify-between items-center px-4 py-4">
          <h1 className={`text-xl font-bold ${textColor}`}>For You</h1>
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
      
      {isLoading && (
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
        {error && !isLoading && (
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
        
        {!isLoading && userLanguages.length === 0 && (
          <div className="p-6 text-center">
            <h2 className={`text-xl font-semibold mb-2 ${textColor}`}>No programming languages selected</h2>
            <p className="text-muted-foreground mb-4">Add programming languages in your settings to see personalized posts.</p>
            <Button onClick={() => window.location.href = '/settings'} variant="outline">
              Go to Settings
            </Button>
          </div>
        )}
        
        {!isLoading && userLanguages.length > 0 && forYouPosts.length === 0 && (
          <div className="p-6 text-center">
            <h2 className={`text-xl font-semibold mb-2 ${textColor}`}>No matching posts found</h2>
            <p className="text-muted-foreground mb-4">No posts matching your selected programming languages were found.</p>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Your languages: {userLanguages.join(', ')}</p>
            </div>
            <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        )}
        
        {forYouPosts.length > 0 && (
          <div className={`pt-0 ${bgColor}`}>
            <Suspense fallback={<PostSkeleton count={3} />}>
              {feedView === 'swipeable' ? (
                <SwipeablePostView 
                  posts={forYouPosts} 
                  loading={isLoading} 
                  engagementData={engagementData}
                  key={`${feedKey}-swipeable-${forYouPosts.length}`}
                />
              ) : (
                <PostList 
                  posts={forYouPosts} 
                  loading={isLoading} 
                  engagementData={engagementData}
                  key={`${feedKey}-list-${forYouPosts.length}`}
                />
              )}
            </Suspense>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ForYou;
