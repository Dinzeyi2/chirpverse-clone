import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export type SortOption = 'latest' | 'popular' | 'commented';

export const usePosts = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [sortedPosts, setSortedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sortOption: SortOption = 'latest';
  
  const blueProfileImage = "/lovable-uploads/c82714a7-4f91-4b00-922a-4caee389e8b2.png";

  const fetchPosts = useCallback(async () => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError(null);
      
      const { data: basicShoutoutData, error: basicShoutoutError } = await supabase
        .from('shoutouts')
        .select('id, content, created_at, user_id, media')
        .order('created_at', { ascending: false })
        .limit(15);
        
      if (basicShoutoutError) {
        console.error('Error fetching shoutouts:', basicShoutoutError);
        setError('Could not load posts');
        setLoading(false);
        return;
      }
      
      if (basicShoutoutData && basicShoutoutData.length > 0) {
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
          return [...quickPosts];
        });
        
        setLoading(false);
        
        Promise.all(
          basicShoutoutData.map(async (post) => {
            try {
              const [likesResult, commentsResult, savesResult] = await Promise.all([
                supabase.from('likes').select('*', { count: 'exact', head: true }).eq('shoutout_id', post.id),
                supabase.from('comments').select('*', { count: 'exact', head: true }).eq('shoutout_id', post.id),
                supabase.from('saved_posts').select('*', { count: 'exact', head: true }).eq('shoutout_id', post.id)
              ]);
              
              const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('user_id', post.user_id)
                .single();
                
              return {
                id: post.id,
                content: post.content,
                createdAt: post.created_at,
                likes: likesResult.count || 0,
                comments: commentsResult.count || 0, 
                saves: savesResult.count || 0,
                reposts: 0,
                replies: commentsResult.count || 0,
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
            } catch (err) {
              console.error('Error enriching post:', err);
              return null;
            }
          })
        ).then(enrichedPosts => {
          const validPosts = enrichedPosts.filter(Boolean);
          
          if (validPosts.length > 0) {
            setPosts(prev => {
              const enrichedPostsMap = new Map(validPosts.map(post => [post.id, post]));
              
              return prev.map(existingPost => 
                enrichedPostsMap.has(existingPost.id) 
                  ? enrichedPostsMap.get(existingPost.id) 
                  : existingPost
              );
            });
          }
        }).catch(err => {
          console.error('Error in post enrichment:', err);
        });
      } else {
        setPosts([]);
        setLoading(false);
      }
      
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Could not load posts');
      setLoading(false);
    }
  }, []);
  
  const addNewPost = useCallback((post: any) => {
    console.log("Adding new post to feed immediately:", post);
    
    setPosts(prev => {
      const isDuplicate = prev.some(p => 
        p.content === post.content && 
        p.userId === post.userId &&
        Math.abs(new Date(p.createdAt).getTime() - new Date(post.createdAt).getTime()) < 3000
      );
      
      if (isDuplicate) {
        console.log("Duplicate post detected, not adding");
        return prev;
      }
      
      if (post.id) {
        setProcessingIds(prev => [...prev, post.id]);
      }
      
      return [post, ...prev];
    });
  }, []);
  
  const loadMorePosts = useCallback(async () => {
    if (posts.length === 0) return;
    
    try {
      setLoading(true);
      
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
        setLoading(false);
        return;
      }
      
      const quickMorePosts = moreShoutoutData.map(post => ({
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
      
      setPosts(prevPosts => [...prevPosts, ...quickMorePosts]);
      setLoading(false);
      
      Promise.all(
        moreShoutoutData.map(async (post) => {
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
              
            return {
              id: post.id,
              content: post.content,
              createdAt: post.created_at,
              likes: likesResult.count || 0,
              comments: commentsResult.count || 0,
              saves: savesResult.count || 0,
              reposts: 0,
              replies: commentsResult.count || 0,
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
          } catch (err) {
            console.error('Error enriching post:', err);
            return null;
          }
        })
      ).then(enrichedPosts => {
        const validPosts = enrichedPosts.filter(Boolean);
        
        if (validPosts.length > 0) {
          setPosts(prev => {
            const enrichedPostsMap = new Map(validPosts.map(post => [post.id, post]));
            
            return prev.map(existingPost => 
              enrichedPostsMap.has(existingPost.id) 
                ? enrichedPostsMap.get(existingPost.id) 
                : existingPost
            );
          });
        }
      });
      
    } catch (error) {
      console.error('Error loading more posts:', error);
      setLoading(false);
    }
  }, [posts, processingIds]);
  
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
            
            setPosts(prev => {
              if (prev.some(p => p.id === payload.new.id)) return prev;
              
              const optimisticPostIndex = prev.findIndex(p => 
                p.content === payload.new.content && 
                p.userId === payload.new.user_id &&
                !p.id
              );
              
              if (optimisticPostIndex >= 0) {
                const newPosts = [...prev];
                newPosts[optimisticPostIndex] = quickNewPost;
                return newPosts;
              }
              
              return [quickNewPost, ...prev];
            });
            
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', payload.new.user_id)
                .single();
                
              setPosts(prev => prev.map(post => 
                post.id === payload.new.id 
                  ? {
                      ...post,
                      user: {
                        ...post.user,
                        name: profileData?.full_name || 'User',
                      }
                    }
                  : post
              ));
            } catch (error) {
              console.error('Error fetching profile:', error);
            }
          }
        )
        .subscribe();
        
      return channel;
    };
    
    const channel = setupRealtimeSubscription();
    
    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, []);
  
  useEffect(() => {
    let sortedPosts = [...posts];
    
    switch ((sortOption as SortOption)) {
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
  
  useEffect(() => {
    fetchPosts();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchPosts]);
  
  return {
    posts: sortedPosts,
    loading,
    error,
    refresh: fetchPosts,
    loadMore: loadMorePosts,
    addNewPost
  };
};
