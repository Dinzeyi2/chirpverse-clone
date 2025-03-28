
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, enableRealtimeForTables } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type SortOption = 'latest' | 'popular' | 'commented';

export const usePosts = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLanguages, setUserLanguages] = useState<string[]>([]);
  const [optimisticPosts, setOptimisticPosts] = useState<any[]>([]);
  const isRefreshingRef = useRef(false);
  const realtimeChannelRef = useRef<any>(null);
  const engagementDataCache = useRef<Record<string, any>>({});
  
  const blueProfileImage = "/lovable-uploads/325d2d74-ad68-4607-8fab-66f36f0e087e.png";

  const fetchUserLanguages = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('programming_languages')
          .eq('user_id', user.id)
          .single();
          
        if (profileData?.programming_languages) {
          setUserLanguages(Array.isArray(profileData.programming_languages) ? 
            profileData.programming_languages : 
            []);
        }
      }
    } catch (error) {
      console.error('Error fetching user languages:', error);
    }
  }, []);

  const extractLanguagesFromContent = (content: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = [...(content.match(mentionRegex) || [])];
    return matches.map(match => match.substring(1).toLowerCase());
  };

  const fetchPostEngagementData = async (postIds: string[]) => {
    if (!postIds.length) return {};
    
    try {
      console.log("Fetching engagement data for posts:", postIds);
      
      // Fetch comment counts - fixed query syntax
      const { data: commentsData, error: commentError } = await supabase
        .from('comments')
        .select('shoutout_id, count')
        .in('shoutout_id', postIds)
        .select('shoutout_id, count(*)', { count: 'exact' });
      
      if (commentError) {
        console.error("Comments count error:", commentError);
        
        // Fallback method for comments count
        const commentsCountMap: Record<string, number> = {};
        
        for (const postId of postIds) {
          const { count, error } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('shoutout_id', postId);
            
          commentsCountMap[postId] = count || 0;
        }
        
        console.log("Fallback comments counts:", commentsCountMap);
        
        // Format data to match expected structure
        const formattedCommentsData = Object.entries(commentsCountMap).map(([postId, count]) => ({
          shoutout_id: postId,
          count
        }));
        
        // Fetch reaction counts - fixed query
        const { data: reactionsData, error: reactionsError } = await supabase
          .from('post_reactions')
          .select('post_id, count(*)', { count: 'exact' })
          .in('post_id', postIds);
          
        if (reactionsError) {
          console.error("Reactions count error:", reactionsError);
        }
        
        // Fetch likes counts - fixed query
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('shoutout_id, count(*)', { count: 'exact' })
          .in('shoutout_id', postIds);
          
        if (likesError) {
          console.error("Likes count error:", likesError);
        }
        
        const engagementMap: Record<string, { comments: number, reactions: number, likes: number }> = {};
        
        postIds.forEach(id => {
          engagementMap[id] = { comments: 0, reactions: 0, likes: 0 };
        });
        
        formattedCommentsData?.forEach((item: any) => {
          if (item.shoutout_id) {
            engagementMap[item.shoutout_id].comments = parseInt(item.count || '0', 10);
          }
        });
        
        reactionsData?.forEach((item: any) => {
          if (item.post_id) {
            engagementMap[item.post_id].reactions = parseInt(item.count || '0', 10);
          }
        });
        
        likesData?.forEach((item: any) => {
          if (item.shoutout_id) {
            engagementMap[item.shoutout_id].likes = parseInt(item.count || '0', 10);
          }
        });
        
        // Cache engagement data for instant access
        Object.assign(engagementDataCache.current, engagementMap);
        
        return engagementMap;
      } else {
        // Continue with other queries if comments succeeded
        // Fetch reaction counts - fixed query syntax
        const { data: reactionsData, error: reactionsError } = await supabase
          .from('post_reactions')
          .select('post_id, count(*)', { count: 'exact' })
          .in('post_id', postIds);
        
        if (reactionsError) console.error("Reactions error:", reactionsError);
        
        // Fetch likes counts - fixed query syntax
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('shoutout_id, count(*)', { count: 'exact' })
          .in('shoutout_id', postIds);
        
        if (likesError) console.error("Likes error:", likesError);
        
        const engagementMap: Record<string, { comments: number, reactions: number, likes: number }> = {};
        
        postIds.forEach(id => {
          engagementMap[id] = { comments: 0, reactions: 0, likes: 0 };
        });
        
        commentsData?.forEach((item: any) => {
          if (item.shoutout_id) {
            engagementMap[item.shoutout_id].comments = parseInt(item.count || '0', 10);
          }
        });
        
        reactionsData?.forEach((item: any) => {
          if (item.post_id) {
            engagementMap[item.post_id].reactions = parseInt(item.count || '0', 10);
          }
        });
        
        likesData?.forEach((item: any) => {
          if (item.shoutout_id) {
            engagementMap[item.shoutout_id].likes = parseInt(item.count || '0', 10);
          }
        });
        
        // Cache engagement data for instant access
        Object.assign(engagementDataCache.current, engagementMap);
        
        return engagementMap;
      }
    } catch (error) {
      console.error('Error fetching post engagement data:', error);
      return {};
    }
  };

  const fetchPosts = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }
    
    isRefreshingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching posts...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      // Fetch posts data
      const { data: shoutoutData, error: shoutoutError } = await supabase
        .from('shoutouts')
        .select('id, content, created_at, user_id, media, metadata')
        .order('created_at', { ascending: false })
        .limit(15);
      
      clearTimeout(timeoutId);
      
      if (shoutoutError) throw shoutoutError;
      
      if (shoutoutData && shoutoutData.length > 0) {
        const postIds = shoutoutData.map(post => post.id);
        
        // Use cached engagement data for immediate display
        const initialEngagementData = { ...engagementDataCache.current };
        
        // Format posts with cached engagement data first for immediate display
        const formattedPosts = shoutoutData.map(post => {
          const metadata = post.metadata as Record<string, any> || {};
          const displayUsername = metadata.display_username || 
            (post.user_id ? post.user_id.substring(0, 8) : 'user');
          
          // Use cached engagement data if available
          const cachedEngagement = initialEngagementData[post.id] || { comments: 0, reactions: 0, likes: 0 };
          
          return {
            id: post.id,
            content: post.content,
            createdAt: post.created_at,
            likes: cachedEngagement.likes || 0,
            comments: cachedEngagement.reactions || 0,
            saves: 0,
            reposts: 0,
            replies: cachedEngagement.comments || 0,
            views: 0,
            userId: post.user_id,
            images: post.media,
            languages: extractLanguagesFromContent(post.content),
            metadata: post.metadata,
            user: {
              id: post.user_id,
              name: displayUsername,
              username: displayUsername,
              avatar: blueProfileImage,
              verified: false,
              followers: 0,
              following: 0,
            }
          };
        });
        
        // Combine with optimistic posts and ensure no duplicates
        const initialCombinedPosts = [...optimisticPosts, ...formattedPosts]
          .filter((post, index, self) => 
            index === self.findIndex(p => p.id === post.id)
          )
          .sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        
        // Update state immediately with what we have
        setPosts(initialCombinedPosts);
        
        // Fetch fresh engagement data in the background
        fetchPostEngagementData(postIds).then(engagementData => {
          if (Object.keys(engagementData).length > 0) {
            // Update posts with fresh engagement data
            setPosts(currentPosts => {
              return currentPosts.map(post => {
                const freshEngagement = engagementData[post.id] || { comments: 0, reactions: 0, likes: 0 };
                
                return {
                  ...post,
                  likes: freshEngagement.likes || post.likes,
                  comments: freshEngagement.reactions || post.comments,
                  replies: freshEngagement.comments || post.replies
                };
              });
            });
          }
        });
      } else {
        setPosts(optimisticPosts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Could not load posts. Please try again.');
    } finally {
      setLoading(false);
      isRefreshingRef.current = false;
    }
  }, [optimisticPosts]);

  const addNewPost = useCallback((post: any) => {
    console.log("Adding new optimistic post:", post);
    
    const newOptimisticPost = {
      ...post,
      id: post.id || crypto.randomUUID(),
      createdAt: post.createdAt || new Date().toISOString(),
      likes: post.likes || 0,
      comments: post.comments || 0,
      saves: post.saves || 0,
      reposts: post.reposts || 0,
      replies: post.replies || 0,
      views: post.views || 0,
      languages: post.languages || extractLanguagesFromContent(post.content),
      user: post.user || {
        id: post.userId,
        name: 'You',
        username: post.userId?.substring(0, 8) || 'user',
        avatar: blueProfileImage,
        verified: false,
        followers: 0,
        following: 0,
      }
    };
    
    setOptimisticPosts(prev => {
      if (prev.some(p => p.id === newOptimisticPost.id)) {
        return prev;
      }
      
      return [newOptimisticPost, ...prev];
    });
    
    setTimeout(() => {
      fetchPosts();
    }, 500); // Reduced wait time for faster update
  }, [fetchPosts]);

  const loadMore = useCallback(async () => {
    if (posts.length === 0 || loading) return;
    
    setLoading(true);
    
    try {
      const lastPostDate = posts[posts.length - 1].createdAt;
      
      const { data: moreData, error: moreError } = await supabase
        .from('shoutouts')
        .select('id, content, created_at, user_id, media')
        .lt('created_at', lastPostDate)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (moreError) throw moreError;
      
      if (moreData && moreData.length > 0) {
        // Get post IDs for engagement data
        const postIds = moreData.map(post => post.id);
        
        // Use cached engagement data for immediate display
        const cachedEngagementData = { ...engagementDataCache.current };
        
        // Format posts with cached data for immediate display
        const morePosts = moreData.map(post => {
          const cachedEngagement = cachedEngagementData[post.id] || { comments: 0, reactions: 0, likes: 0 };
          
          return {
            id: post.id,
            content: post.content,
            createdAt: post.created_at,
            likes: cachedEngagement.likes || 0,
            comments: cachedEngagement.reactions || 0,
            saves: 0,
            reposts: 0,
            replies: cachedEngagement.comments || 0,
            views: 0,
            userId: post.user_id,
            images: post.media,
            languages: extractLanguagesFromContent(post.content),
            user: {
              id: post.user_id,
              name: 'User',
              username: post.user_id?.substring(0, 8) || 'user',
              avatar: blueProfileImage,
              verified: false,
              followers: 0,
              following: 0,
            }
          };
        });
        
        // Update state immediately
        setPosts(prev => [...prev, ...morePosts]);
        
        // Fetch fresh engagement data in background
        fetchPostEngagementData(postIds).then(freshEngagementData => {
          if (Object.keys(freshEngagementData).length > 0) {
            // Update with fresh data
            setPosts(currentPosts => {
              return currentPosts.map(post => {
                const engagement = freshEngagementData[post.id];
                if (!engagement) return post;
                
                return {
                  ...post,
                  likes: engagement.likes || post.likes,
                  comments: engagement.reactions || post.comments,
                  replies: engagement.comments || post.replies
                };
              });
            });
          }
        });
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
      toast.error('Failed to load more posts');
    } finally {
      setLoading(false);
    }
  }, [posts, loading]);

  // Listen for realtime updates on relevant tables
  useEffect(() => {
    if (!realtimeChannelRef.current) {
      realtimeChannelRef.current = enableRealtimeForTables();
    }
    
    // More aggressive realtime updates strategy
    const handleRealtimeUpdate = (payload: any) => {
      const { table } = payload;
      console.log(`Realtime update from table: ${table}`, payload);
      
      // For engagement tables, immediately update engagement data cache
      if (['comments', 'likes', 'post_reactions'].includes(table)) {
        // For new comment or reaction, update the view immediately
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const postId = payload.new.shoutout_id || payload.new.post_id;
          
          if (postId) {
            // Update UI immediately based on the type of engagement
            setPosts(currentPosts => {
              return currentPosts.map(post => {
                if (post.id !== postId) return post;
                
                // Update the specific engagement counter
                const updates: any = {};
                
                if (table === 'comments') {
                  updates.replies = post.replies + 1;
                } else if (table === 'likes') {
                  updates.likes = post.likes + 1;
                } else if (table === 'post_reactions') {
                  updates.comments = post.comments + 1;
                }
                
                return { ...post, ...updates };
              });
            });
          }
        }
      }
      
      // Also do a full refresh in the background
      if (!isRefreshingRef.current) {
        fetchPosts();
      }
    };
    
    // More specific channel subscriptions
    const channel = supabase
      .channel('real-time-posts')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'shoutouts' 
      }, (payload) => handleRealtimeUpdate({...payload, table: 'shoutouts'}))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments'
      }, (payload) => handleRealtimeUpdate({...payload, table: 'comments'}))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_reactions'
      }, (payload) => handleRealtimeUpdate({...payload, table: 'post_reactions'}))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'likes'
      }, (payload) => handleRealtimeUpdate({...payload, table: 'likes'}))
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });
    
    return () => {
      console.log('Removing realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  // Initial data loading
  useEffect(() => {
    fetchUserLanguages();
    fetchPosts();
    
    // More frequent refresh for better real-time experience
    const intervalId = setInterval(() => {
      if (!isRefreshingRef.current) {
        console.log('Periodic refresh triggered');
        fetchPosts();
      }
    }, 5000); // 5 seconds refresh interval as fallback
    
    return () => clearInterval(intervalId);
  }, [fetchUserLanguages, fetchPosts]);

  return {
    posts,
    loading,
    error,
    refresh: fetchPosts,
    loadMore,
    addNewPost,
    userLanguages
  };
};
