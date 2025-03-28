import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import CommentList from '@/components/comments/CommentList';
import CommentForm from '@/components/comments/CommentForm';
import PostCard from '@/components/feed/PostCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const blueProfileImage = "/lovable-uploads/325d2d74-ad68-4607-8fab-66f36f0e087e.png";
  
  useEffect(() => {
    const fetchPostAndComments = async () => {
      if (!postId) return;
      
      try {
        setLoading(true);
        
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
          return;
        }
        
        if (postData) {
          // Get the display username from metadata if available
          const metadata = postData.metadata || {};
          // Check if metadata is an object and has display_username property
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
            metadata: postData.metadata, // Include metadata in the post object
            user: {
              id: postData.profiles.id,
              name: displayUsername, // Use display_username from metadata
              username: displayUsername, // Use display_username from metadata
              avatar: blueProfileImage,
              verified: false,
              followers: 0,
              following: 0,
            }
          };
          
          setPost(formattedPost);
          
          // ... keep existing code (Promise.all for fetching likes, comments, etc.)
          Promise.all([
            supabase.from('likes').select('*', { count: 'exact' }).eq('shoutout_id', postId),
            supabase.from('comments').select('*', { count: 'exact' }).eq('shoutout_id', postId),
            supabase.from('comments')
              .select(`
                *,
                profiles:user_id (*)
              `)
              .eq('shoutout_id', postId)
              .order('created_at', { ascending: false })
          ]).then(([likesResponse, commentsCountResponse, commentsResponse]) => {
            const likesCount = likesResponse.count || 0;
            const commentsCount = commentsCountResponse.count || 0;
            
            setPost(prev => ({
              ...prev,
              likes: likesCount,
              replies: commentsCount
            }));
            
            if (!commentsResponse.error && commentsResponse.data) {
              const formattedComments = commentsResponse.data.map(comment => ({
                id: comment.id,
                content: comment.content,
                createdAt: comment.created_at,
                userId: comment.user_id,
                postId: comment.shoutout_id,
                likes: 0,
                media: comment.media || [],
                user: {
                  id: comment.profiles.id,
                  name: comment.profiles.full_name || 'User',
                  username: comment.profiles.user_id?.substring(0, 8) || 'user',
                  avatar: blueProfileImage,
                  verified: false,
                  followers: 0,
                  following: 0,
                }
              }));
              
              setComments(formattedComments);
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
  }, [postId]);
  
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
  
  const handleCommentAdded = async (content: string, media?: {type: string, url: string}[]) => {
    if (!user || !postId) return;
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          content,
          user_id: user.id,
          shoutout_id: postId,
          media: media || null
        })
        .select(`
          *,
          profiles:user_id (*)
        `)
        .single();
        
      if (error) throw error;
      
      if (data) {
        const newComment = {
          id: data.id,
          content: data.content,
          createdAt: data.created_at,
          userId: data.user_id,
          postId: data.shoutout_id,
          likes: 0,
          media: data.media || [],
          user: {
            id: data.profiles.id,
            name: data.profiles.full_name || 'User',
            username: data.profiles.user_id?.substring(0, 8) || 'user',
            avatar: blueProfileImage,
            verified: false,
            followers: 0,
            following: 0,
          }
        };
        
        setComments(prevComments => [newComment, ...prevComments]);
        
        setPost(prevPost => ({
          ...prevPost,
          replies: (prevPost?.replies || 0) + 1
        }));
        
        toast.success('Comment added successfully');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };
  
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
        <PostCard post={post} />
      </div>
      
      <div className="comment-container">
        {user && (
          <CommentForm 
            currentUser={{
              id: user.id,
              name: user.user_metadata?.full_name || 'User',
              username: user.user_metadata?.username || user.id.substring(0, 8),
              avatar: blueProfileImage,
              followers: 0,
              following: 0,
              verified: false,
            }}
            postAuthorId={post?.userId}
            onCommentAdded={handleCommentAdded}
          />
        )}
        
        <CommentList comments={comments} />
      </div>
    </AppLayout>
  );
};

export default PostPage;
