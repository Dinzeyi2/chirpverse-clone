
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type SortOption = 'latest' | 'popular' | 'commented';

export const usePosts = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [sortedPosts, setSortedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  
  const blueProfileImage = "/lovable-uploads/c82714a7-4f91-4b00-922a-4caee389e8b2.png";

  // Function to fetch posts - made callback so it can be used in useEffect dependencies
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: basicShoutoutData, error: basicShoutoutError } = await supabase
        .from('shoutouts')
        .select('id, content, created_at, user_id, media')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (basicShoutoutError) {
        console.error('Error fetching shoutouts:', basicShoutoutError);
        setError('Could not load posts');
        setLoading(false);
        return;
      }
      
      if (basicShoutoutData && basicShoutoutData.length > 0) {
        // First, show quick version of posts for better UX
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
            avatar: blueProfileImage,
            verified: false,
            followers: 0,
            following: 0,
          }
        }));
        
        setPosts(prev => {
          // Merge with existing posts to prevent duplicates
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = quickPosts.filter(p => !existingIds.has(p.id));
          return [...newPosts, ...prev];
        });
        
        setLoading(false);
        
        // Then load full data asynchronously
        const formattedPosts = await Promise.all(basicShoutoutData.map(async post => {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('user_id', post.user_id)
              .single();
              
            const [likesResult, commentsResult, savesResult] = await Promise.all([
              supabase.from('likes').select('*', { count: 'exact', head: true }).eq('shoutout_id', post.id),
              supabase.from('comments').select('*', { count: 'exact', head: true }).eq('shoutout_id', post.id),
              supabase.from('saved_posts').select('*', { count: 'exact', head: true }).eq('shoutout_id', post.id)
            ]);
            
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
                avatar: blueProfileImage,
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
                avatar: blueProfileImage,
                verified: false,
                followers: 0,
                following: 0,
              }
            };
          }
        }));
        
        setPosts(prev => {
          // Update existing posts with full data
          const updatedPosts = prev.map(existingPost => {
            const updatedPost = formattedPosts.find(p => p.id === existingPost.id);
            return updatedPost || existingPost;
          });
          
          // Filter out any processing posts that have now been loaded from the database
          return updatedPosts.filter(post => !processingIds.includes(post.id));
        });
        
        // Clear out any processing IDs that have now been loaded
        setProcessingIds(prev => 
          prev.filter(id => !formattedPosts.some(post => post.id === id))
        );
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
  }, [processingIds]);
  
  const addNewPost = (post: any) => {
    console.log("Adding new post to feed immediately:", post);
    
    // Immediately add post to the top of the list
    setPosts(prev => {
      // Check if post exists by content + user combo (avoiding duplicates)
      const isDuplicate = prev.some(p => 
        p.content === post.content && 
        p.userId === post.userId &&
        Math.abs(new Date(p.createdAt).getTime() - new Date(post.createdAt).getTime()) < 3000
      );
      
      if (isDuplicate) {
        console.log("Duplicate post detected, not adding");
        return prev;
      }
      
      // Add the new post and mark as processing
      if (post.id) {
        setProcessingIds(prev => [...prev, post.id]);
      }
      
      return [post, ...prev];
    });
  };
  
  const loadMorePosts = async () => {
    if (posts.length === 0) return;
    
    try {
      // Only get posts that came before our oldest non-processing post
      const nonProcessingPosts = posts.filter(post => !processingIds.includes(post.id));
      if (nonProcessingPosts.length === 0) return;
      
      const lastPostDate = nonProcessingPosts[nonProcessingPosts.length - 1].createdAt;
      
      const { data: moreShoutoutData, error: moreShoutoutError } = await supabase
        .from('shoutouts')
        .select('id, content, created_at, user_id, media')
        .lt('created_at', lastPostDate)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (moreShoutoutError || !moreShoutoutData || moreShoutoutData.length === 0) {
        return;
      }
      
      const morePosts = await Promise.all(moreShoutoutData.map(async post => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', post.user_id)
          .single();
          
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
            avatar: blueProfileImage,
            verified: false,
            followers: 0,
            following: 0,
          }
        };
      }));
      
      setPosts(prevPosts => [...prevPosts, ...morePosts]);
      
    } catch (error) {
      console.error('Error loading more posts:', error);
    }
  };
  
  // Set up realtime subscription for new posts with better error handling
  useEffect(() => {
    const setupRealtimeSubscription = () => {
      console.log('Setting up realtime subscription for posts');
      
      const channel = supabase
        .channel('public:shoutouts')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'shoutouts'
          }, 
          async (payload) => {
            console.log('New post received via realtime:', payload);
            
            try {
              // Create a quick version of the post immediately
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
                  avatar: blueProfileImage,
                  verified: false,
                  followers: 0,
                  following: 0,
                }
              };
              
              // Add this post immediately - check for duplicates
              setPosts(prev => {
                // Check if we already have this exact post ID
                const postExists = prev.some(p => p.id === payload.new.id);
                if (postExists) return prev;
                
                // Check for posts with very similar content that might be duplicates
                const isDuplicate = prev.some(p => 
                  p.content === payload.new.content && 
                  p.userId === payload.new.user_id &&
                  !p.id // This would be a local optimistic post
                );
                
                if (isDuplicate) {
                  // Replace the optimistic post with the real one
                  return prev.map(p => 
                    (p.content === payload.new.content && 
                     p.userId === payload.new.user_id && 
                     !p.id) ? quickNewPost : p
                  );
                }
                
                return [quickNewPost, ...prev];
              });
              
              // Then fetch user details
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
            
              // Update the post with user details
              setPosts(prev => prev.map(post => 
                post.id === payload.new.id 
                  ? {
                      ...post,
                      user: {
                        id: payload.new.user_id,
                        name: profile.full_name || 'User',
                        username: displayUsername,
                        avatar: blueProfileImage,
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
        .subscribe((status) => {
          console.log('Subscription status:', status);
        });
        
      return channel;
    };
    
    const channel = setupRealtimeSubscription();
    
    return () => {
      console.log('Cleaning up realtime subscription');
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
  
  // Load posts when component mounts
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);
  
  return {
    posts: sortedPosts,
    loading,
    error,
    sortOption,
    setSortOption,
    refresh: fetchPosts,
    loadMore: loadMorePosts,
    addNewPost
  };
};
