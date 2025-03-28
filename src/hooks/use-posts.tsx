import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, enableRealtimeForTables } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Post, Comment } from '@/lib/data';
import { PostEngagement } from '@/components/feed/PostList';

export type SortOption = 'latest' | 'popular' | 'commented';

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

  const fetchPostComments = useCallback(async (postId: string) => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('id, content, created_at, user_id, media, metadata')
        .eq('shoutout_id', postId)
        .order('created_at', { ascending: false });
        
      if (commentsError) throw commentsError;
      
      const formattedComments: Comment[] = (commentsData || []).map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        userId: comment.user_id,
        created_at: comment.created_at,
        user_id: comment.user_id,
        media: comment.media,
        metadata: comment.metadata
      }));
      
      return formattedComments;
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
      return [];
    }
  }, []);

  const fetchPostReactions = useCallback(async (postId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      const currentUserId = user.user?.id;
      
      const { data: reactionsData, error: reactionsError } = await supabase
        .from('post_reactions')
        .select('emoji, user_id')
        .eq('post_id', postId);
        
      if (reactionsError) throw reactionsError;
      
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

  const loadEngagementData = useCallback(async (postIdsToUpdate?: string[]) => {
    try {
      const postsToProcess = postIdsToUpdate || posts.map(post => post.id);
      
      const engagementPromises = postsToProcess.map(async (postId) => {
        const [comments, reactions] = await Promise.all([
          fetchPostComments(postId),
          fetchPostReactions(postId)
        ]);
        
        return {
          postId,
          comments,
          reactions
        } as PostEngagement;
      });
      
      const newEngagementData = await Promise.all(engagementPromises);
      
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
          const metadata = post.metadata as Record<string, any> || {};
          const displayUsername = metadata.display_username || 
            (post.user_id ? post.user_id.substring(0, 8) : 'user');
          
          const codeBlocks = post.media 
            ? post.media
                .filter((item: any) => item.type === 'code')
                .map((item: any) => {
                  try {
                    const parsed = JSON.parse(item.url);
                    return {
                      code: parsed.code,
                      language: parsed.language
                    };
                  } catch (e) {
                    console.error("Failed to parse code block:", e);
                    return null;
                  }
                })
                .filter(Boolean)
            : [];
          
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
            codeBlocks: codeBlocks,
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
        
        const combinedPosts = [...optimisticPosts, ...formattedPosts]
          .filter((post, index, self) => 
            index === self.findIndex(p => p.id === post.id)
          )
          .sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
        setPosts(combinedPosts);
        
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
        const morePosts = moreData.map(post => {
          const codeBlocks = post.media 
            ? post.media
                .filter((item: any) => item.type === 'code')
                .map((item: any) => {
                  try {
                    const parsed = JSON.parse(item.url);
                    return {
                      code: parsed.code,
                      language: parsed.language
                    };
                  } catch (e) {
                    console.error("Failed to parse code block:", e);
                    return null;
                  }
                })
                .filter(Boolean)
            : [];
          
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
            codeBlocks: codeBlocks,
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
          };
        });
        
        setPosts(prev => [...prev, ...morePosts]);
        
        await loadEngagementData(morePosts.map(post => post.id));
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
      toast.error('Failed to load more posts');
    } finally {
      setLoading(false);
    }
  }, [posts, loading, loadEngagementData]);

  useEffect(() => {
    if (!realtimeChannelRef.current) {
      realtimeChannelRef.current = enableRealtimeForTables();
    }
    
    const setupRealtimeSubscriptions = () => {
      const commentsChannel = supabase
        .channel('comments-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'comments'
        }, async (payload) => {
          console.log('Realtime comment update:', payload);
          
          const shoutoutId = payload.new && 'shoutout_id' in payload.new 
            ? payload.new.shoutout_id 
            : payload.old && 'shoutout_id' in payload.old 
              ? payload.old.shoutout_id 
              : null;
          
          if (shoutoutId) {
            await loadEngagementData([shoutoutId]);
            
            if (payload.eventType === 'INSERT' && payload.new) {
              const newComment: Comment = {
                id: payload.new.id,
                content: payload.new.content,
                createdAt: payload.new.created_at,
                userId: payload.new.user_id,
                created_at: payload.new.created_at,
                user_id: payload.new.user_id,
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
      
      const reactionsChannel = supabase
        .channel('post-reactions-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'post_reactions'
        }, async (payload) => {
          console.log('Realtime reaction update:', payload);
          
          const postId = payload.new && 'post_id' in payload.new 
            ? payload.new.post_id 
            : payload.old && 'post_id' in payload.old 
              ? payload.old.post_id 
              : null;
          
          if (postId) {
            const { data: user } = await supabase.auth.getUser();
            const currentUserId = user.user?.id;
            
            if (payload.eventType === 'INSERT' && payload.new) {
              setEngagementData(prev => {
                const newMap = new Map(prev);
                const postData = newMap.get(postId);
                
                if (postData) {
                  const existingReactionIndex = postData.reactions.findIndex(
                    r => r.emoji === payload.new.emoji
                  );
                  
                  let updatedReactions;
                  
                  if (existingReactionIndex >= 0) {
                    updatedReactions = [...postData.reactions];
                    updatedReactions[existingReactionIndex] = {
                      ...updatedReactions[existingReactionIndex],
                      count: updatedReactions[existingReactionIndex].count + 1,
                      reacted: currentUserId === payload.new.user_id ? true : updatedReactions[existingReactionIndex].reacted
                    };
                  } else {
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
            } else if (payload.eventType === 'DELETE' && payload.old) {
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
            
            await loadEngagementData([postId]);
          }
        })
        .subscribe();
        
      const commentReactionsChannel = supabase
        .channel('comment-reactions-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'comment_reactions'
        }, async (payload) => {
          console.log('Realtime comment reaction update:', payload);
          
          const commentId = payload.new && 'comment_id' in payload.new 
            ? payload.new.comment_id 
            : payload.old && 'comment_id' in payload.old 
              ? payload.old.comment_id 
              : null;
          
          if (commentId) {
            try {
              const { data: commentData } = await supabase
                .from('comments')
                .select('shoutout_id')
                .eq('id', commentId)
                .single();
                
              if (commentData?.shoutout_id) {
                await loadEngagementData([commentData.shoutout_id]);
              }
            } catch (error) {
              console.error('Error handling comment reaction update:', error);
            }
          }
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(commentsChannel);
        supabase.removeChannel(reactionsChannel);
        supabase.removeChannel(commentReactionsChannel);
      };
    };
    
    const cleanup = setupRealtimeSubscriptions();
    
    const refreshInterval = setInterval(() => {
      if (posts.length > 0) {
        loadEngagementData();
      }
    }, 15000);
    
    return () => {
      cleanup();
      clearInterval(refreshInterval);
    };
  }, [posts, loadEngagementData]);

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
