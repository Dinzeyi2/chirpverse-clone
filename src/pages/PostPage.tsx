import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import CommentList from '@/components/comments/CommentList';
import CommentForm from '@/components/comments/CommentForm';
import PostCard from '@/components/feed/PostCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface SupabaseComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  shoutout_id: string;
  media?: any;
  profiles: any;
  metadata?: {
    display_username?: string;
    is_ai_generated?: boolean;
    reply_to?: {
      comment_id: string;
      username: string;
    };
    [key: string]: any;
  };
}

const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<{commentId: string, username: string} | null>(null);
  
  const processedCommentIdsRef = useRef<Set<string>>(new Set());
  const commentsChannelRef = useRef<any>(null);
  const blueProfileImage = "/lovable-uploads/325d2d74-ad68-4607-8fab-66f36f0e087e.png";
  
  const addUniqueComments = (newComments: any[], existingComments: any[]) => {
    const existingCommentMap = new Map(existingComments.map(c => [c.id, c]));
    
    const uniqueNewComments = newComments.filter(comment => {
      if (processedCommentIdsRef.current.has(comment.id)) {
        console.log('Duplicate comment filtered:', comment.id);
        return false;
      }
      
      processedCommentIdsRef.current.add(comment.id);
      
      return !existingCommentMap.has(comment.id);
    });
    
    if (uniqueNewComments.length === 0) {
      return existingComments;
    }
    
    return [...uniqueNewComments, ...existingComments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };
  
  const formatComment = (commentData: SupabaseComment) => {
    const commentMetadata = commentData.metadata || {};
    
    const commentUsername = typeof commentMetadata === 'object' && 
      commentMetadata !== null && 
      'display_username' in commentMetadata
        ? commentMetadata.display_username
        : commentData.profiles?.user_id?.substring(0, 8) || 'user';
    
    return {
      id: commentData.id,
      content: commentData.content,
      createdAt: commentData.created_at,
      userId: commentData.user_id,
      postId: commentData.shoutout_id,
      likes: 0,
      media: commentData.media || [],
      metadata: commentData.metadata || {},
      user: {
        id: commentData.profiles?.id || commentData.user_id,
        name: commentUsername,
        username: commentUsername,
        avatar: blueProfileImage,
        verified: false,
        followers: 0,
        following: 0,
      }
    };
  };
  
  useEffect(() => {
    processedCommentIdsRef.current.clear();
    
    const fetchPostAndComments = async () => {
      if (!postId) return;
      
      try {
        setLoading(true);
        console.log('Fetching post data for ID:', postId);
        
        const { data: postData, error: postError } = await supabase
          .from('shoutouts')
          .select(`
            *,
            profiles:user_id (*)
          `)
          .eq('id', postId)
          .single();
          
        if (postError) {
          console.error('Error fetching post:', postError);
          setLoading(false);
          return;
        }
        
        if (postData) {
          const metadata = postData.metadata || {};
          const displayUsername = typeof metadata === 'object' && metadata !== null && 'display_username' in metadata
            ? (metadata as { display_username?: string }).display_username
            : (postData.profiles?.user_id?.substring(0, 8) || 'user');
          
          const formattedPost = {
            id: postData.id,
            content: postData.content,
            createdAt: postData.created_at,
            likes: 0,
            reposts: 0,
            replies: 0,
            views: 0,
            userId: postData.user_id,
            images: postData.media,
            metadata: postData.metadata,
            user: {
              id: postData.profiles.id,
              name: displayUsername,
              username: displayUsername,
              avatar: blueProfileImage,
              verified: false,
              followers: 0,
              following: 0,
            }
          };
          
          setPost(formattedPost);
          
          console.log('Fetching comments for post:', postId);
          
          const { data: commentsData, error: commentsError } = await supabase
            .from('comments')
            .select(`
              *,
              profiles:user_id (*)
            `)
            .eq('shoutout_id', postId)
            .order('created_at', { ascending: false });
            
          if (commentsError) {
            console.error('Error fetching comments:', commentsError);
          } else {
            console.log('Found comments:', commentsData?.length || 0);
          }
          
          Promise.all([
            supabase.from('likes').select('*', { count: 'exact' }).eq('shoutout_id', postId),
            supabase.from('comments').select('*', { count: 'exact' }).eq('shoutout_id', postId)
          ]).then(([likesResponse, commentsCountResponse]) => {
            const likesCount = likesResponse.count || 0;
            const commentsCount = commentsCountResponse.count || 0;
            
            console.log(`Post has ${likesCount} likes and ${commentsCount} comments`);
            
            setPost(prev => ({
              ...prev,
              likes: likesCount,
              replies: commentsCount
            }));
            
            if (commentsData && commentsData.length > 0) {
              const formattedComments = commentsData.map((comment: any) => {
                const typedComment = comment as SupabaseComment;
                const formattedComment = formatComment(typedComment);
                processedCommentIdsRef.current.add(formattedComment.id);
                return formattedComment;
              });
              
              const sortedComments = formattedComments.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              
              setComments(sortedComments);
            } else {
              console.log('No comments found for this post');
              setComments([]);
            }
          }).catch((error) => {
            console.error('Error fetching additional data:', error);
          }).finally(() => {
            setLoading(false);
          });
        }
      } catch (error) {
        console.error('Error in fetchPostAndComments:', error);
        toast.error('Failed to load post');
        setLoading(false);
      }
    };
    
    fetchPostAndComments();
    
    if (commentsChannelRef.current) {
      supabase.removeChannel(commentsChannelRef.current);
    }
    
    commentsChannelRef.current = supabase
      .channel(`comments-channel-${postId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `shoutout_id=eq.${postId}`
      }, async (payload) => {
        console.log('New comment received via realtime:', payload);
        
        if (processedCommentIdsRef.current.has(payload.new.id)) {
          console.log('Ignoring duplicate comment received via realtime:', payload.new.id);
          return;
        }
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', payload.new.user_id)
          .single();
        
        const newCommentData = {
          ...payload.new,
          profiles: profileData || { user_id: payload.new.user_id }
        } as SupabaseComment;
        
        const formattedComment = formatComment(newCommentData);
        
        processedCommentIdsRef.current.add(formattedComment.id);
        
        setComments(prevComments => {
          if (prevComments.some(c => c.id === formattedComment.id)) {
            return prevComments;
          }
          return [formattedComment, ...prevComments];
        });
        
        setPost(prev => ({
          ...prev,
          replies: (prev?.replies || 0) + 1
        }));
      })
      .subscribe();
      
    return () => {
      if (commentsChannelRef.current) {
        supabase.removeChannel(commentsChannelRef.current);
      }
    };
  }, [postId]);
  
  const handleCommentAdded = async (content: string, media?: {type: string, url: string}[]) => {
    if (!user || !postId) return;
    
    // We don't need to manually insert the comment here because the realtime
    // subscription will handle it. This function is mainly for optimistic updates
    // or additional actions.
    
    // Clear reply state after comment is added
    setReplyingTo(null);
  };

  const handleReplyToComment = (commentId: string, username: string) => {
    setReplyingTo({ commentId, username });
    // Scroll to comment form
    const commentFormElement = document.querySelector('.comment-form');
    if (commentFormElement) {
      commentFormElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const clearReplyingTo = () => {
    setReplyingTo(null);
  };
  
  const formatTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    if (!text) return '';

    const parts = text.split(urlRegex);
    const matches = text.match(urlRegex) || [];
    
    return parts.map((part, index) => {
      const isUrl = matches.some(match => match === part);
      
      if (isUrl) {
        return (
          <a 
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xBlue hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };
  
  // Prepare the currentUser object for comments
  const currentUserForComments = user ? {
    id: user.id,
    name: user.user_metadata?.full_name || 'User',
    username: user.user_metadata?.username || user.id.substring(0, 8),
    avatar: blueProfileImage,
    followers: 0,
    following: 0,
    verified: false,
  } : null;
  
  if (loading) {
    return (
      <AppLayout>
        <div className="p-4">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-xExtraLightGray/50 transition-colors mr-4"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Post</h1>
          </div>
          <div className="py-10 flex justify-center">
            <div className="animate-pulse w-full max-w-2xl">
              <div className="flex space-x-4">
                <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                  <div className="h-40 bg-gray-200 rounded"></div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  if (!post) {
    return (
      <AppLayout>
        <div className="p-4">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-xExtraLightGray/50 transition-colors mr-4"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Post</h1>
          </div>
          <div className="py-10 text-center">
            <p className="text-lg font-bold">This post doesn't exist</p>
            <p className="text-xGray mt-1">The post may have been deleted or the URL might be incorrect.</p>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <div className="flex items-center p-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-xExtraLightGray/50 transition-colors mr-4"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Post</h1>
        </div>
      </div>
      
      <div className="border-b border-xExtraLightGray">
        {post && <PostCard post={post} />}
      </div>
      
      <div className="comment-container">
        {user ? (
          <div className="comment-form">
            {replyingTo && (
              <div className="flex items-center justify-between px-4 py-2 bg-gray-100/10 dark:bg-gray-800/20 border-b border-xExtraLightGray">
                <div className="flex items-center gap-1">
                  <span className="text-sm">Replying to</span>
                  <span className="text-sm font-semibold text-xBlue">@{replyingTo.username}</span>
                </div>
                <button 
                  onClick={clearReplyingTo}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            )}
            <CommentForm 
              currentUser={currentUserForComments}
              postAuthorId={post.id}
              onCommentAdded={handleCommentAdded}
              replyToMetadata={replyingTo ? {
                reply_to: {
                  comment_id: replyingTo.commentId,
                  username: replyingTo.username
                }
              } : undefined}
              placeholderText={replyingTo ? `Reply to @${replyingTo.username}...` : undefined}
            />
          </div>
        ) : (
          <div className="p-4 border-b border-xExtraLightGray">
            <div className="flex items-center justify-center py-3 px-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Sign in</span> to join the conversation
              </p>
            </div>
          </div>
        )}
        
        <CommentList 
          comments={comments} 
          isLoading={loading} 
          onReplyClick={handleReplyToComment}
          postId={post.id}
          currentUser={currentUserForComments}
        />
      </div>
    </AppLayout>
  );
};

export default PostPage;
