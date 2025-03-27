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
  const [userLanguages, setUserLanguages] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const [optimisticPosts, setOptimisticPosts] = useState<any[]>([]);
  const realTimeChannelRef = useRef<any>(null);
  const loadingRef = useRef<boolean>(true);
  const lastRefreshRef = useRef<number>(0);
  
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
    try {
      // Implement debouncing - don't refresh if we just did
      const now = Date.now();
      if (now - lastRefreshRef.current < 2000) {
        console.log("Skipping refresh - too soon after last refresh");
        return;
      }
      lastRefreshRef.current = now;
      
      // Cancel any existing fetch request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      // Set loading state
      setLoading(true);
      loadingRef.current = true;
      setError(null);
      
      console.log("Fetching posts...");
      
      // Fetch basic post data
      const { data: basicShoutoutData, error: basicShoutoutError } = await supabase
        .from('shoutouts')
        .select('id, content, created_at, user_id, media')
        .order('created_at', { ascending: false })
        .limit(15);
        
      if (basicShoutoutError) {
        console.error('Error fetching shoutouts:', basicShoutoutError);
        setError('Could not load posts');
        setLoading(false);
        loadingRef.current = false;
        return;
      }
      
      console.log(`Fetched ${basicShoutoutData?.length || 0} posts`);
      
      if (basicShoutoutData && basicShoutoutData.length > 0) {
        // Transform database posts into UI-ready format
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
        
        // Integrate database posts with optimistic posts
        const databasePostIds = new Set(quickPosts.map(post => post.id));
        const validOptimisticPosts = optimisticPosts.filter(post => !databasePostIds.has(post.id));
        
        // Clear optimistic posts that are now in the database
        setOptimisticPosts(validOptimisticPosts);
        
        // Combine and sort posts
        const combinedPosts = [...quickPosts, ...validOptimisticPosts];
        combinedPosts.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setPosts(combinedPosts);
        setLoading(false);
        loadingRef.current = false;
        
        // Only enrich posts if they're visible (performance optimization)
        setTimeout(() => {
          Promise.all(
            basicShoutoutData.slice(0, 5).map(async (post) => {
              try {
                // Fetch counts and user data in parallel
                const [likesResult, commentsResult, savesResult, profileResult] = await Promise.all([
                  supabase.from('likes').select('*', { count: 'exact', head: true }).eq('shoutout_id', post.id),
                  supabase.from('comments').select('*', { count: 'exact', head: true }).eq('shoutout_id', post.id),
                  supabase.from('saved_posts').select('*', { count: 'exact', head: true }).eq('shoutout_id', post.id),
                  supabase.from('profiles').select('full_name, avatar_url').eq('user_id', post.user_id).single()
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
                    name: profileResult.data?.full_name || 'User',
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
                // Create a map for faster lookups
                const enrichedPostsMap = new Map(validPosts.map(post => [post.id, post]));
                
                // Update the posts with enriched data and keep optimistic posts
                const updatedPosts = prev.map(existingPost => 
                  enrichedPostsMap.has(existingPost.id) 
                    ? enrichedPostsMap.get(existingPost.id) 
                    : existingPost
                );
                
                // Sort by creation date
                return updatedPosts.sort((a, b) => 
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
              });
            }
          }).catch(err => {
            console.error('Error in post enrichment:', err);
          });
        }, 100);
      } else {
        // Still keep optimistic posts even if no posts are fetched
        setPosts(optimisticPosts);
        setLoading(false);
        loadingRef.current = false;
      }
      
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Could not load posts');
      setLoading(false);
      loadingRef.current = false;
    }
  }, [optimisticPosts]);
  
  // Add a new post directly with a real database ID
  const addNewPost = useCallback((post: any) => {
    console.log("Adding post to feed:", post);
    
    if (!post.id) {
      console.error("Post must have an ID");
      return;
    }
    
    // Create a full post object with all required fields
    const newPost = {
      ...post,
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
    
    // Update posts state for immediate UI update
    setPosts(prev => {
      // Check if post already exists
      const existingPostIndex = prev.findIndex(p => p.id === newPost.id);
      
      if (existingPostIndex >= 0) {
        // Replace existing post
        const updatedPosts = [...prev];
        updatedPosts[existingPostIndex] = newPost;
        return updatedPosts;
      } else {
        // Add new post at the beginning
        const newPosts = [newPost, ...prev];
        // Sort by created date to ensure proper order
        return newPosts.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    });
  }, []);
  
  // Load more posts
  const loadMorePosts = useCallback(async () => {
    if (posts.length === 0 || loadingRef.current) return;
    
    try {
      setLoading(true);
      loadingRef.current = true;
      
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
        loadingRef.current = false;
        return;
      }
      
      // Quick post display
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
      loadingRef.current = false;
      
      // Enrich the additional posts with more data
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
      loadingRef.current = false;
    }
  }, [posts, processingIds]);
  
  // Setup realtime subscription for new posts
  useEffect(() => {
    const setupRealtimeSubscription = () => {
      console.log('Setting up realtime subscription for posts');
      
      if (realTimeChannelRef.current) {
        try {
          supabase.removeChannel(realTimeChannelRef.current);
        } catch (err) {
          console.error('Error removing channel:', err);
        }
      }
      
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
            
            // Check if we already have this post in the posts state
            if (posts.some(p => p.id === payload.new.id)) {
              console.log('Post already exists in state, skipping', payload.new.id);
              return;
            }
            
            // Add the new post to the posts state with complete data
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
              languages: extractLanguagesFromContent(payload.new.content),
              user: {
                id: payload.new.user_id,
                name: 'User', // Will be updated after profile fetch
                username: payload.new.user_id?.substring(0, 8) || 'user',
                avatar: blueProfileImage,
                verified: false,
                followers: 0,
                following: 0,
              }
            };
            
            // Add the new post ensuring no duplicates
            setPosts(prev => {
              if (prev.some(p => p.id === newPost.id)) {
                return prev;
              }
              
              const updatedPosts = [newPost, ...prev];
              return updatedPosts.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
            });
            
            toast.success("New post received!");
            
            // Fetch user profile data to enrich the post
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
        .subscribe(status => {
          console.log(`Realtime subscription status: ${status}`);
        });
        
      realTimeChannelRef.current = channel;
      return channel;
    };
    
    const channel = setupRealtimeSubscription();
    
    return () => {
      console.log('Cleaning up realtime subscription');
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (err) {
          console.error('Error removing channel during cleanup:', err);
        }
      }
    };
  }, [posts]);
  
  // Sort posts based on relevance and selected sort option
  useEffect(() => {
    if (posts.length === 0) return;
    
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
    
    // Add a small delay to avoid race conditions
    const timer = setTimeout(() => {
      fetchPosts();
    }, 100);
    
    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (realTimeChannelRef.current) {
        try {
          supabase.removeChannel(realTimeChannelRef.current);
        } catch (err) {
          console.error('Error removing channel during cleanup:', err);
        }
      }
    };
  }, [fetchPosts, fetchUserLanguages]);
  
  return {
    posts: sortedPosts.length > 0 ? sortedPosts : posts,
    loading,
    error,
    refresh: fetchPosts,
    loadMore: loadMorePosts,
    addNewPost,
    userLanguages
  };
};
