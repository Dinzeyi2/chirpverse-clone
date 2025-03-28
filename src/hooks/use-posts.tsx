
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, enableRealtimeForTables } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Post, Comment } from '@/lib/data';

export type SortOption = 'latest' | 'popular' | 'commented';

interface PostEngagement {
  postId: string;
  comments: Comment[];
  reactions: {emoji: string, count: number, reacted: boolean}[];
}

export const usePosts = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLanguages, setUserLanguages] = useState<string[]>([]);
  const [optimisticPosts, setOptimisticPosts] = useState<any[]>([]);
  const [engagementData, setEngagementData] = useState<Map<string, PostEngagement>>(new Map());
  const isRefreshingRef = useRef(false);
  const realtimeChannelRef = useRef<any>(null);
  
  const blueProfileImage = "/lovable-uploads/325d2d74-ad68-4607-8fab-66f36f0e087e.png";

  // Fetch user's languages for personalized feed
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

  // Extract language mentions from post content
  const extractLanguagesFromContent = (content: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = [...(content.match(mentionRegex) || [])];
    return matches.map(match => match.substring(1).toLowerCase());
  };

  // Fetch comments for a specific post
  const fetchPostComments = useCallback(async (postId: string) => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('id, content, created_at, user_id, media, metadata')
        .eq('shoutout_id', postId)
        .order('created_at', { ascending: false });
        
      if (commentsError) throw commentsError;
      
      return commentsData || [];
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
      return [];
    }
  }, []);

  // Fetch reactions for a specific post
  const fetchPostReactions = useCallback(async (postId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      const currentUserId = user.user?.id;
      
      const { data: reactionsData, error: reactionsError } = await supabase
        .from('post_reactions')
        .select('emoji, user_id')
        .eq('post_id', postId);
        
      if (reactionsError) throw reactionsError;
      
      // Process reactions data
      const reactionCounts: Record<string, { count: number, reacted: boolean }> = {};
      
      if (reactionsData) {
        reactionsData.forEach((reaction) => {
          if (!reactionCounts[reaction.emoji]) {
            reactionCounts[reaction.emoji] = {
              count: 0,
              reacted: false
            };
          }
          
          reactionCounts[reaction.emoji].count += 1;
          
          if (currentUserId && reaction.user_id === currentUserId) {
            reactionCounts[reaction.emoji].reacted = true;
          }
        });
      }
      
      const formattedReactions = Object.entries(reactionCounts).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        reacted: data.reacted
      }));
      
      return formattedReactions;
    } catch (error) {
      console.error(`Error fetching reactions for post ${postId}:`, error);
      return [];
    }
  }, []);

  // Load engagement data (comments and reactions) for all posts
  const loadEngagementData = useCallback(async (postIdsToUpdate?: string[]) => {
    try {
      const postsToProcess = postIdsToUpdate || posts.map(post => post.id);
      
      // Process each post in parallel using Promise.all
      const engagementPromises = postsToProcess.map(async (postId) => {
        const [comments, reactions] = await Promise.all([
          fetchPostComments(postId),
          fetchPostReactions(postId)
        ]);
        
        return {
          postId,
          comments,
          reactions
        };
      });
      
      const newEngagementData = await Promise.all(engagementPromises);
      
      // Update the engagement data map
      setEngagementData(prevData => {
        const newMap = new Map(prevData);
        
        newEngagementData.forEach(data => {
          newMap.set(data.postId, data);
        });
        
        return newMap;
      });
    } catch (error) {
      console.error('Error loading engagement data:', error);
    }
  }, [posts, fetchPostComments, fetchPostReactions]);

  // Main function to fetch posts
  const fetchPosts = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }
    
    isRefreshingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const { data: shoutoutData, error: shoutoutError } = await supabase
        .from('shoutouts')
        .select('id, content, created_at, user_id, media, metadata')
        .order('created_at', { ascending: false })
        .limit(15);
      
      clearTimeout(timeoutId);
      
      if (shoutoutError) throw shoutoutError;
      
      if (shoutoutData && shoutoutData.length > 0) {
        const formattedPosts = shoutoutData.map(post => {
          // Get display username from metadata if available, otherwise use a truncated user_id
          const metadata = post.metadata as Record<string, any> || {};
          const displayUsername = metadata.display_username || 
            (post.user_id ? post.user_id.substring(0, 8) : 'user');
          
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
            languages: extractLanguagesFromContent(post.content),
            metadata: post.metadata, // Preserve the full metadata
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
        
        const combinedPosts = [...optimisticPosts, ...formattedPosts]
          .filter((post, index, self) => 
            index === self.findIndex(p => p.id === post.id)
          )
          .sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
        setPosts(combinedPosts);
        
        // Immediately load engagement data for new posts
        await loadEngagementData(combinedPosts.map(post => post.id));
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
  }, [optimisticPosts, loadEngagementData]);

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
    
    // Set empty engagement data for the new post
    setEngagementData(prev => {
      const newMap = new Map(prev);
      newMap.set(newOptimisticPost.id, {
        postId: newOptimisticPost.id,
        comments: [],
        reactions: []
      });
      return newMap;
    });
    
    setTimeout(() => {
      fetchPosts();
    }, 1000);
  }, [fetchPosts]);

  const loadMore = useCallback(async () => {
    if (posts.length === 0 || loading) return;
    
    setLoading(true);
    
    try {
      const lastPostDate = posts[posts.length - 1].createdAt;
      
      const { data: moreData, error: moreError } = await supabase
        .from('shoutouts')
        .select('id, content, created_at, user_id, media, metadata')
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
          metadata: post.metadata,
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
        
        // Load engagement data for new posts
        await loadEngagementData(morePosts.map(post => post.id));
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
      toast.error('Failed to load more posts');
    } finally {
      setLoading(false);
    }
  }, [posts, loading, loadEngagementData]);

  // Setup realtime subscriptions
  useEffect(() => {
    // Set up realtime channel for posts
    if (!realtimeChannelRef.current) {
      realtimeChannelRef.current = enableRealtimeForTables();
    }
    
    // Set up realtime subscriptions for comments and reactions
    const setupRealtimeSubscriptions = () => {
      // Comments channel
      const commentsChannel = supabase
        .channel('comments-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'comments'
        }, async (payload) => {
          console.log('Realtime comment update:', payload);
          
          // Extract the post ID from the payload
          const shoutoutId = payload.new?.shoutout_id || payload.old?.shoutout_id;
          
          if (shoutoutId) {
            // Update only the affected post's comments
            await loadEngagementData([shoutoutId]);
            
            // Update the UI immediately for new comments
            if (payload.eventType === 'INSERT') {
              const newComment = {
                id: payload.new.id,
                content: payload.new.content,
                createdAt: payload.new.created_at,
                userId: payload.new.user_id,
                media: payload.new.media,
                metadata: payload.new.metadata
              };
              
              setEngagementData(prev => {
                const newMap = new Map(prev);
                const postData = newMap.get(shoutoutId);
                
                if (postData) {
                  const updatedComments = [newComment, ...postData.comments];
                  newMap.set(shoutoutId, {
                    ...postData,
                    comments: updatedComments
                  });
                }
                
                return newMap;
              });
            }
          }
        })
        .subscribe();
      
      // Post reactions channel
      const reactionsChannel = supabase
        .channel('post-reactions-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'post_reactions'
        }, async (payload) => {
          console.log('Realtime reaction update:', payload);
          
          // Extract the post ID from the payload
          const postId = payload.new?.post_id || payload.old?.post_id;
          
          if (postId) {
            // Immediate UI update for reactions
            const { data: user } = await supabase.auth.getUser();
            const currentUserId = user.user?.id;
            
            if (payload.eventType === 'INSERT') {
              setEngagementData(prev => {
                const newMap = new Map(prev);
                const postData = newMap.get(postId);
                
                if (postData) {
                  // Check if emoji already exists
                  const existingReactionIndex = postData.reactions.findIndex(
                    r => r.emoji === payload.new.emoji
                  );
                  
                  let updatedReactions;
                  
                  if (existingReactionIndex >= 0) {
                    // Update existing reaction
                    updatedReactions = [...postData.reactions];
                    updatedReactions[existingReactionIndex] = {
                      ...updatedReactions[existingReactionIndex],
                      count: updatedReactions[existingReactionIndex].count + 1,
                      reacted: currentUserId === payload.new.user_id ? true : updatedReactions[existingReactionIndex].reacted
                    };
                  } else {
                    // Add new reaction
                    updatedReactions = [
                      ...postData.reactions,
                      {
                        emoji: payload.new.emoji,
                        count: 1,
                        reacted: currentUserId === payload.new.user_id
                      }
                    ];
                  }
                  
                  newMap.set(postId, {
                    ...postData,
                    reactions: updatedReactions
                  });
                }
                
                return newMap;
              });
            } else if (payload.eventType === 'DELETE') {
              setEngagementData(prev => {
                const newMap = new Map(prev);
                const postData = newMap.get(postId);
                
                if (postData) {
                  const updatedReactions = postData.reactions.map(reaction => {
                    if (reaction.emoji === payload.old.emoji) {
                      return {
                        ...reaction,
                        count: Math.max(0, reaction.count - 1),
                        reacted: currentUserId === payload.old.user_id ? false : reaction.reacted
                      };
                    }
                    return reaction;
                  }).filter(reaction => reaction.count > 0);
                  
                  newMap.set(postId, {
                    ...postData,
                    reactions: updatedReactions
                  });
                }
                
                return newMap;
              });
            }
            
            // Also fetch the updated data to ensure consistency
            await loadEngagementData([postId]);
          }
        })
        .subscribe();
        
      // Comment reactions channel
      const commentReactionsChannel = supabase
        .channel('comment-reactions-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'comment_reactions'
        }, async (payload) => {
          console.log('Realtime comment reaction update:', payload);
          
          // For comment reactions, we need to find which post contains this comment
          const commentId = payload.new?.comment_id || payload.old?.comment_id;
          
          if (commentId) {
            try {
              // Find which post this comment belongs to
              const { data: commentData } = await supabase
                .from('comments')
                .select('shoutout_id')
                .eq('id', commentId)
                .single();
                
              if (commentData?.shoutout_id) {
                // Update engagement data for this post
                await loadEngagementData([commentData.shoutout_id]);
              }
            } catch (error) {
              console.error('Error handling comment reaction update:', error);
            }
          }
        })
        .subscribe();
      
      // Clean up function
      return () => {
        supabase.removeChannel(commentsChannel);
        supabase.removeChannel(reactionsChannel);
        supabase.removeChannel(commentReactionsChannel);
      };
    };
    
    const cleanup = setupRealtimeSubscriptions();
    
    // Also set up a periodic refresh to ensure data consistency
    const refreshInterval = setInterval(() => {
      if (posts.length > 0) {
        loadEngagementData();
      }
    }, 15000); // Refresh every 15 seconds
    
    return () => {
      cleanup();
      clearInterval(refreshInterval);
    };
  }, [posts, loadEngagementData]);

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
    userLanguages,
    engagementData
  };
};
