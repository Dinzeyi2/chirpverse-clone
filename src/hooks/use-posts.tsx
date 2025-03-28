
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
      // Fetch comment counts with raw SQL approach for better performance
      const { data: commentsData, error: commentError } = await supabase
        .from('comments')
        .select('shoutout_id, count(*)')
        .in('shoutout_id', postIds)
        .then(result => {
          if (result.error) throw result.error;
          return { data: result.data, error: null };
        });
      
      if (commentError) throw commentError;
      
      // Fetch reaction counts with raw SQL approach
      const { data: reactionsData, error: reactionsError } = await supabase
        .from('post_reactions')
        .select('post_id, count(*)')
        .in('post_id', postIds)
        .then(result => {
          if (result.error) throw result.error;
          return { data: result.data, error: null };
        });
      
      if (reactionsError) throw reactionsError;
      
      // Fetch likes counts with raw SQL approach
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('shoutout_id, count(*)')
        .in('shoutout_id', postIds)
        .then(result => {
          if (result.error) throw result.error;
          return { data: result.data, error: null };
        });
      
      if (likesError) throw likesError;
      
      const engagementMap: Record<string, { comments: number, reactions: number, likes: number }> = {};
      
      postIds.forEach(id => {
        engagementMap[id] = { comments: 0, reactions: 0, likes: 0 };
      });
      
      commentsData?.forEach((item: any) => {
        if (item.shoutout_id && engagementMap[item.shoutout_id]) {
          engagementMap[item.shoutout_id].comments = parseInt(item.count || '0', 10);
        }
      });
      
      reactionsData?.forEach((item: any) => {
        if (item.post_id && engagementMap[item.post_id]) {
          engagementMap[item.post_id].reactions = parseInt(item.count || '0', 10);
        }
      });
      
      likesData?.forEach((item: any) => {
        if (item.shoutout_id && engagementMap[item.shoutout_id]) {
          engagementMap[item.shoutout_id].likes = parseInt(item.count || '0', 10);
        }
      });
      
      return engagementMap;
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
      console.log("Fetching posts and engagements...");
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
        
        // Immediately fetch engagement data
        const engagementPromise = fetchPostEngagementData(postIds);
        
        const formattedPosts = shoutoutData.map(post => {
          const metadata = post.metadata as Record<string, any> || {};
          const displayUsername = metadata.display_username || 
            (post.user_id ? post.user_id.substring(0, 8) : 'user');
          
          return {
            id: post.id,
            content: post.content,
            createdAt: post.created_at,
            likes: 0, // Will be updated with engagement data
            comments: 0, // Will be updated with engagement data
            saves: 0,
            reposts: 0,
            replies: 0,
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
        
        // Wait for engagement data
        const engagementData = await engagementPromise;
        
        const postsWithEngagement = formattedPosts.map(post => {
          const engagement = engagementData[post.id] || { comments: 0, reactions: 0, likes: 0 };
          return {
            ...post,
            likes: engagement.likes,
            comments: engagement.reactions,
            replies: engagement.comments
          };
        });
        
        // Combine with optimistic posts and ensure no duplicates
        const combinedPosts = [...optimisticPosts, ...postsWithEngagement]
          .filter((post, index, self) => 
            index === self.findIndex(p => p.id === post.id)
          )
          .sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
        setPosts(combinedPosts);
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
        
        // Immediately fetch engagement data for these posts
        const engagementData = await fetchPostEngagementData(postIds);
        
        const morePosts = moreData.map(post => {
          const engagement = engagementData[post.id] || { comments: 0, reactions: 0, likes: 0 };
          
          return {
            id: post.id,
            content: post.content,
            createdAt: post.created_at,
            likes: engagement.likes || 0,
            comments: engagement.reactions || 0,
            saves: 0,
            reposts: 0,
            replies: engagement.comments || 0,
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
        
        setPosts(prev => [...prev, ...morePosts]);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
      toast.error('Failed to load more posts');
    } finally {
      setLoading(false);
    }
  }, [posts, loading]);

  useEffect(() => {
    if (!realtimeChannelRef.current) {
      realtimeChannelRef.current = enableRealtimeForTables();
    }
    
    const handleRealtimeUpdate = () => {
      console.log('Received realtime update, refreshing posts');
      fetchPosts();
    };
    
    // Setup channel for more comprehensive table monitoring
    const channel = supabase
      .channel('public-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'shoutouts' 
      }, handleRealtimeUpdate)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments'
      }, handleRealtimeUpdate)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_reactions'
      }, handleRealtimeUpdate)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'likes'
      }, handleRealtimeUpdate)
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  // Initial data loading
  useEffect(() => {
    fetchUserLanguages();
    fetchPosts();
    
    // Setup interval for periodic refresh (fallback if realtime fails)
    const intervalId = setInterval(() => {
      console.log('Periodic refresh triggered');
      fetchPosts();
    }, 30000); // 30 seconds refresh interval as fallback
    
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
