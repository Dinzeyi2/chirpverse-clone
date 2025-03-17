
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type SortOption = 'latest' | 'popular' | 'commented';

export const usePosts = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [sortedPosts, setSortedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  
  // Fetch posts with optimized queries
  const fetchPosts = async () => {
    try {
      setError(null);
      
      // First quickly get basic post data to show something immediately
      const { data: basicShoutoutData, error: basicShoutoutError } = await supabase
        .from('shoutouts')
        .select('id, content, created_at, user_id, media')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (basicShoutoutError) {
        console.error('Error fetching shoutouts:', basicShoutoutError);
        setError('Could not load posts');
        return;
      }
      
      if (basicShoutoutData && basicShoutoutData.length > 0) {
        // Format basic data for immediate display
        const quickPosts = basicShoutoutData.map(post => ({
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
            name: 'Loading...',
            username: post.user_id?.substring(0, 8) || 'user',
            avatar: 'https://i.pravatar.cc/150?img=1',
            verified: false,
            followers: 0,
            following: 0,
          }
        }));
        
        // Show quick data first
        setPosts(quickPosts);
        setLoading(false);
        
        // Then load full post data in parallel
        const formattedPosts = await Promise.all(basicShoutoutData.map(async post => {
          try {
            // Load profile data
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('user_id', post.user_id)
              .single();
              
            // Get counts in parallel
            const [likesResult, commentsResult, savesResult] = await Promise.all([
              supabase.from('likes').select('*', { count: 'exact', head: true }).eq('shoutout_id', post.id),
              supabase.from('comments').select('*', { count: 'exact', head: true }).eq('shoutout_id', post.id),
              supabase.from('saved_posts').select('*', { count: 'exact', head: true }).eq('shoutout_id', post.id)
            ]);
            
            // Get counts
            const likesCount = likesResult.count || 0;
            const commentsCount = commentsResult.count || 0;
            const savesCount = savesResult.count || 0;
            
            const profile = profileData || {
              full_name: 'User',
              avatar_url: 'https://i.pravatar.cc/150?img=1',
            };
            
            const displayUsername = post.user_id?.substring(0, 8) || 'user';
            
            return {
              id: post.id,
              content: post.content,
              createdAt: post.created_at,
              likes: likesCount,
              comments: commentsCount,
              saves: savesCount,
              reposts: 0,
              replies: commentsCount,
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
        
        // Update with complete data
        setPosts(formattedPosts);
      } else {
        setPosts([]);
        setLoading(false);
      }
      
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Could not load posts');
      toast.error('Could not load posts');
      setLoading(false);
    }
  };
  
  // Load more posts beyond initial batch
  const loadMorePosts = async () => {
    if (posts.length === 0) return;
    
    try {
      const lastPostDate = posts[posts.length - 1].createdAt;
      
      const { data: moreShoutoutData, error: moreShoutoutError } = await supabase
        .from('shoutouts')
        .select('id, content, created_at, user_id, media')
        .lt('created_at', lastPostDate)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (moreShoutoutError || !moreShoutoutData || moreShoutoutData.length === 0) {
        return;
      }
      
      // Process more posts similar to initial fetch
      const morePosts = await Promise.all(moreShoutoutData.map(async post => {
        // Similar processing as in fetchPosts but for additional posts
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', post.user_id)
          .single();
          
        // Basic formatted post with placeholder counts
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
            name: profileData?.full_name || 'User',
            username: post.user_id?.substring(0, 8) || 'user',
            avatar: profileData?.avatar_url || 'https://i.pravatar.cc/150?img=1',
            verified: false,
            followers: 0,
            following: 0,
          }
        };
      }));
      
      // Append to existing posts
      setPosts(prevPosts => [...prevPosts, ...morePosts]);
      
    } catch (error) {
      console.error('Error loading more posts:', error);
    }
  };
  
  // Subscribe to real-time updates
  useEffect(() => {
    const setupRealtimeSubscription = () => {
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
              // First add the new post with placeholder data for immediate feedback
              const quickNewPost = {
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
                  name: 'Loading...',
                  username: payload.new.user_id?.substring(0, 8) || 'user',
                  avatar: 'https://i.pravatar.cc/150?img=1',
                  verified: false,
                  followers: 0,
                  following: 0,
                }
              };
              
              // Add immediately to the posts array
              setPosts(prev => [quickNewPost, ...prev]);
              toast.success('New post added!');
              
              // Then fetch full profile data
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
            
              // Update the post with proper profile data
              setPosts(prev => prev.map(post => 
                post.id === payload.new.id 
                  ? {
                      ...post,
                      user: {
                        id: payload.new.user_id,
                        name: profile.full_name || 'User',
                        username: displayUsername,
                        avatar: profile.avatar_url || 'https://i.pravatar.cc/150?img=1',
                        verified: false,
                        followers: 0,
                        following: 0,
                      }
                    }
                  : post
              ));
            } catch (error) {
              console.error('Error processing new post:', error);
            }
          }
        )
        .subscribe();
        
      return channel;
    };
    
    const channel = setupRealtimeSubscription();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Sort posts whenever posts or sortOption changes
  useEffect(() => {
    let sortedPosts = [...posts];
    
    switch (sortOption) {
      case 'latest':
        sortedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        sortedPosts.sort((a, b) => {
          const scoreA = a.likes + a.comments + a.saves;
          const scoreB = b.likes + b.comments + b.saves;
          return scoreB - scoreA;
        });
        break;
      case 'commented':
        sortedPosts.sort((a, b) => b.comments - a.comments);
        break;
      default:
        sortedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    setSortedPosts(sortedPosts);
  }, [posts, sortOption]);
  
  // Initial fetch
  useEffect(() => {
    fetchPosts();
  }, []);
  
  return {
    posts: sortedPosts,
    loading,
    error,
    sortOption,
    setSortOption,
    refresh: fetchPosts,
    loadMore: loadMorePosts
  };
};
