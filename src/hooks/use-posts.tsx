import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, enableRealtimeForTables } from '@/integrations/supabase/client';
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
  const [userLanguages, setUserLanguages] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const [optimisticPosts, setOptimisticPosts] = useState<any[]>([]);
  const realTimeChannelRef = useRef<any>(null);
  const isRefreshingRef = useRef(false);
  
  const blueProfileImage = "/lovable-uploads/325d2d74-ad68-4607-8fab-66f36f0e087e.png";

  // Fetch the current user's programming languages
  const fetchUserLanguages = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('programming_languages')
          .eq('user_id', user.id)
          .single();
          
        if (profileError) {
          console.error('Error fetching user languages:', profileError);
          return;
        }
        
        if (profileData && profileData.programming_languages) {
          setUserLanguages(Array.isArray(profileData.programming_languages) ? 
            profileData.programming_languages : 
            []);
          console.log('User languages:', profileData.programming_languages);
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

  const fetchPosts = useCallback(async () => {
    // Prevent multiple refreshes happening at the same time
    if (isRefreshingRef.current) {
      console.log("A refresh is already in progress, skipping...");
      return;
    }
    
    isRefreshingRef.current = true;
    
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError(null);
      
      console.log("Fetching posts...");
      
      // Fetch posts with a timeout to ensure we don't wait forever
      const fetchPromise = supabase
        .from('shoutouts')
        .select('id, content, created_at, user_id, media')
        .order('created_at', { ascending: false })
        .limit(15);
        
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Fetch posts timed out')), 10000);
      });
      
      // Race the fetch against the timeout
      const { data: basicShoutoutData, error: basicShoutoutError } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as any;
        
      if (basicShoutoutError) {
        console.error('Error fetching shoutouts:', basicShoutoutError);
        setError('Could not load posts');
        setLoading(false);
        isRefreshingRef.current = false;
        return;
      }
      
      console.log(`Fetched ${basicShoutoutData?.length || 0} posts`);
      
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
          },
          languages: extractLanguagesFromContent(post.content)
        }));
        
        // Add optimistic posts to the fetched posts if they're not already there
        const combinedPosts = [...quickPosts];
        
        // Add any optimistic posts that aren't in the fetched data
        optimisticPosts.forEach(optimisticPost => {
          if (!combinedPosts.some(p => p.id === optimisticPost.id)) {
            combinedPosts.unshift(optimisticPost);
          }
        });
        
        // Sort by creation date to ensure newest posts are at the top
        combinedPosts.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setPosts(combinedPosts);
        setLoading(false);
        
        // Enrich posts with additional data in smaller batches
        const enrichPosts = async () => {
          const BATCH_SIZE = 5;
          const batches = [];
          
          for (let i = 0; i < basicShoutoutData.length; i += BATCH_SIZE) {
            batches.push(basicShoutoutData.slice(i, i + BATCH_SIZE));
          }
          
          for (const batch of batches) {
            try {
              const enrichedBatch = await Promise.all(
                batch.map(async (post) => {
                  try {
                    // Fetch like counts, comments counts, and saves counts in parallel
                    const [likesResult, commentsResult, savesResult] = await Promise.all([
                      supabase.from('likes').select('*', { count: 'exact', head: true }).eq('shoutout_id', post.id),
                      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('shoutout_id', post.id),
                      supabase.from('saved_posts').select('*', { count: 'exact', head: true }).eq('shoutout_id', post.id)
                    ]);
                    
                    // Fetch user profile data
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
                      languages: extractLanguagesFromContent(post.content),
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
              );
              
              const validEnrichedBatch = enrichedBatch.filter(Boolean);
              
              if (validEnrichedBatch.length > 0) {
                setPosts(prev => {
                  // Create a map for faster lookups
                  const enrichedPostsMap = new Map(validEnrichedBatch.map(post => [post.id, post]));
                  
                  // Keep optimistic posts that don't have a corresponding enriched post
                  const updatedPosts = prev.map(existingPost => 
                    enrichedPostsMap.has(existingPost.id) 
                      ? enrichedPostsMap.get(existingPost.id) 
                      : existingPost
                  );
                  
                  // Sort by creation date to ensure newest posts are at the top
                  return updatedPosts.sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  );
                });
              }
            } catch (batchError) {
              console.error('Error processing batch:', batchError);
            }
          }
        };
        
        // Enrich posts in the background
        enrichPosts().catch(err => {
          console.error('Error in post enrichment:', err);
        });
        
      } else {
        // Still keep optimistic posts even if no posts are fetched
        setPosts(optimisticPosts);
        setLoading(false);
      }
      
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Could not load posts');
      setLoading(false);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [optimisticPosts]);
  
  // Add new post with optimistic updates
  const addNewPost = useCallback((post: any) => {
    console.log("Adding new optimistic post to feed immediately:", post);
    
    // Create a full post object with all required fields
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
    setOptimisticPosts(prev => [newOptimisticPost, ...prev]);
    
    // Immediately update posts array for display
    setPosts(prev => {
      // Don't add duplicate posts
      if (prev.some(p => p.id === newOptimisticPost.id)) {
        return prev;
      }
      
      // Add the new post at the beginning
      const updatedPosts = [newOptimisticPost, ...prev];
      
      // Sort by creation date
      return updatedPosts.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, []);
  
  const loadMorePosts = useCallback(async () => {
    if (posts.length === 0 || loading) return;
    
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
        },
        languages: extractLanguagesFromContent(post.content)
      }));
      
      setPosts(prevPosts => [...prevPosts, ...quickMorePosts]);
      setLoading(false);
      
      // Enrich the additional posts
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
              languages: extractLanguagesFromContent(post.content),
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
  }, [posts, processingIds, loading]);
  
  // Setup enhanced realtime subscription
  useEffect(() => {
    const setupRealtimeSubscription = () => {
      console.log('Setting up realtime subscription for posts');
      
      if (realTimeChannelRef.current) {
        try {
          supabase.removeChannel(realTimeChannelRef.current);
        } catch (e) {
          console.error('Error removing existing channel:', e);
        }
      }
      
      try {
        const { shoutoutsChannel } = enableRealtimeForTables();
        realTimeChannelRef.current = shoutoutsChannel;
        
        // Set up a periodic check to verify our realtime connection
        const intervalId = setInterval(() => {
          const channel = realTimeChannelRef.current;
          if (channel && channel.state !== 'SUBSCRIBED') {
            console.log('Realtime connection lost, reconnecting...');
            try {
              supabase.removeChannel(channel);
            } catch (e) {
              console.error('Error removing channel during reconnect:', e);
            }
            const { shoutoutsChannel: newChannel } = enableRealtimeForTables();
            realTimeChannelRef.current = newChannel;
          }
        }, 30000); // Check every 30 seconds
        
        return () => {
          clearInterval(intervalId);
          if (shoutoutsChannel) {
            try {
              supabase.removeChannel(shoutoutsChannel);
            } catch (e) {
              console.error('Error removing channel during cleanup:', e);
            }
          }
        };
      } catch (error) {
        console.error('Error setting up realtime subscription:', error);
        return () => {};
      }
    };
    
    return setupRealtimeSubscription();
  }, []);
  
  // Set up listener for realtime updates to refresh posts
  useEffect(() => {
    const handleRealtimeUpdate = () => {
      console.log('Realtime update detected, refreshing posts...');
      fetchPosts();
    };
    
    // Listen for realtime events from Supabase
    const subscription = supabase
      .channel('custom-all-channel')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'shoutouts' 
      }, handleRealtimeUpdate)
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchPosts]);
  
  // Sort posts based on relevance and selected sort option
  useEffect(() => {
    let sortedPosts = [...posts];
    
    const sortByRelevance = (a: any, b: any) => {
      const aMatches = hasLanguageMatch(a.languages || [], userLanguages);
      const bMatches = hasLanguageMatch(b.languages || [], userLanguages);
      
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    };
    
    function hasLanguageMatch(postLanguages: string[], userLanguages: string[]): boolean {
      if (!postLanguages.length || !userLanguages.length) return false;
      
      return postLanguages.some(lang => 
        userLanguages.some(userLang => 
          userLang.toLowerCase() === lang.toLowerCase()
        )
      );
    }
    
    switch ((sortOption as SortOption)) {
      case 'latest':
        sortedPosts.sort(sortByRelevance);
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
        sortedPosts.sort(sortByRelevance);
    }
    
    setSortedPosts(sortedPosts);
  }, [posts, sortOption, userLanguages]);
  
  // Initial data fetching
  useEffect(() => {
    fetchUserLanguages();
    fetchPosts();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (realTimeChannelRef.current) {
        try {
          supabase.removeChannel(realTimeChannelRef.current);
        } catch (e) {
          console.error('Error removing channel during cleanup:', e);
        }
      }
    };
  }, [fetchPosts, fetchUserLanguages]);
  
  return {
    posts: sortedPosts,
    loading,
    error,
    refresh: fetchPosts,
    loadMore: loadMorePosts,
    addNewPost,
    userLanguages
  };
};
