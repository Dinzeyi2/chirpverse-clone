
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

  // Fetch the current user's programming languages
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

  // Extract programming languages from post content
  const extractLanguagesFromContent = (content: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = [...(content.match(mentionRegex) || [])];
    return matches.map(match => match.substring(1).toLowerCase());
  };

  // Fetch posts from Supabase
  const fetchPosts = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }
    
    isRefreshingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      // Simple fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const { data: shoutoutData, error: shoutoutError } = await supabase
        .from('shoutouts')
        .select('id, content, created_at, user_id, media')
        .order('created_at', { ascending: false })
        .limit(15);
      
      clearTimeout(timeoutId);
      
      if (shoutoutError) throw shoutoutError;
      
      if (shoutoutData && shoutoutData.length > 0) {
        // Map posts to UI format
        const formattedPosts = shoutoutData.map(post => ({
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
        }));
        
        // Include any optimistic posts
        const combinedPosts = [...optimisticPosts, ...formattedPosts]
          .filter((post, index, self) => 
            index === self.findIndex(p => p.id === post.id)
          )
          .sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
        setPosts(combinedPosts);
      } else {
        // Use optimistic posts if no data
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
  
  // Add new post with optimistic updates
  const addNewPost = useCallback((post: any) => {
    console.log("Adding new optimistic post:", post);
    
    // Create a complete post object
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
    
    // Add to optimistic posts collection
    setOptimisticPosts(prev => {
      // Don't add duplicate posts
      if (prev.some(p => p.id === newOptimisticPost.id)) {
        return prev;
      }
      
      return [newOptimisticPost, ...prev];
    });
    
    // Auto-refresh after a short delay to get the actual post from the server
    setTimeout(() => {
      fetchPosts();
    }, 2000);
  }, [fetchPosts]);
  
  // Load more posts
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
        const morePosts = moreData.map(post => ({
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
        }));
        
        setPosts(prev => [...prev, ...morePosts]);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
      toast.error('Failed to load more posts');
    } finally {
      setLoading(false);
    }
  }, [posts, loading]);
  
  // Setup realtime subscription
  useEffect(() => {
    if (!realtimeChannelRef.current) {
      realtimeChannelRef.current = enableRealtimeForTables();
    }
    
    // Set up event listener for realtime updates
    const handleRealtimeUpdate = () => {
      console.log('Received realtime update, refreshing posts');
      fetchPosts();
    };
    
    // Listen for "shoutouts" table changes
    const channel = supabase
      .channel('public-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'shoutouts' 
      }, handleRealtimeUpdate)
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);
  
  // Initial data loading
  useEffect(() => {
    fetchUserLanguages();
    fetchPosts();
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
