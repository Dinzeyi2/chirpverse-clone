import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Repeat, Share, Bookmark, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CodeBlock from '@/components/code/CodeBlock';

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  verified: boolean;
  followers: number;
  following: number;
}

interface Post {
  id: string;
  content: string;
  createdAt: string;
  likes: number;
  comments: number;
  saves: number;
  reposts: number;
  replies: number;
  views: number;
  userId: string;
  images?: { type: string; url: string }[];
  code_blocks?: { code: string; language: string }[];
  user: User;
}

interface PostCardProps {
  post: Post;
  onDelete?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onDelete }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [saveCount, setSaveCount] = useState(post.saves || 0);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      checkIfLiked();
      checkIfSaved();
    }
  }, [user, post.id]);
  
  const checkIfLiked = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('post_reactions')
        .select('*')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .eq('reaction_type', 'like')
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking like status:', error);
      }
      
      setLiked(!!data);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };
  
  const checkIfSaved = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('post_bookmarks')
        .select('*')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking bookmark status:', error);
      }
      
      setSaved(!!data);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };
  
  const handleLike = async () => {
    if (!user) {
      toast.error('You must be logged in to like posts');
      return;
    }
    
    try {
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .eq('reaction_type', 'like');
          
        if (error) {
          console.error('Error unliking post:', error);
          toast.error('Failed to unlike post');
          return;
        }
        
        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        const { error } = await supabase
          .from('post_reactions')
          .insert({
            post_id: post.id,
            user_id: user.id,
            reaction_type: 'like'
          });
          
        if (error) {
          console.error('Error liking post:', error);
          toast.error('Failed to like post');
          return;
        }
        
        setLiked(true);
        setLikeCount(prev => prev + 1);
        
        // Create notification for the post owner
        if (user.id !== post.userId) {
          await supabase
            .from('notifications')
            .insert({
              type: 'like',
              recipient_id: post.userId,
              sender_id: user.id,
              content: 'liked your post',
              metadata: {
                post_id: post.id,
                post_excerpt: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : '')
              },
              is_read: false
            });
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('An error occurred. Please try again.');
    }
  };
  
  const handleSave = async () => {
    if (!user) {
      toast.error('You must be logged in to save posts');
      return;
    }
    
    try {
      if (saved) {
        // Unsave
        const { error } = await supabase
          .from('post_bookmarks')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
          
        if (error) {
          console.error('Error unsaving post:', error);
          toast.error('Failed to unsave post');
          return;
        }
        
        setSaved(false);
        setSaveCount(prev => Math.max(0, prev - 1));
      } else {
        // Save
        const { error } = await supabase
          .from('post_bookmarks')
          .insert({
            post_id: post.id,
            user_id: user.id
          });
          
        if (error) {
          console.error('Error saving post:', error);
          toast.error('Failed to save post');
          return;
        }
        
        setSaved(true);
        setSaveCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('An error occurred. Please try again.');
    }
  };
  
  const handleDelete = async () => {
    if (!user || user.id !== post.userId) {
      toast.error('You can only delete your own posts');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('shoutouts')
        .delete()
        .eq('id', post.id);
        
      if (error) {
        console.error('Error deleting post:', error);
        toast.error('Failed to delete post');
        return;
      }
      
      toast.success('Post deleted successfully');
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('An error occurred. Please try again.');
    }
  };
  
  const handleReport = async () => {
    if (!user) {
      toast.error('You must be logged in to report posts');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          post_id: post.id,
          user_id: user.id,
          reason: 'inappropriate content'
        });
        
      if (error) {
        console.error('Error reporting post:', error);
        toast.error('Failed to report post');
        return;
      }
      
      toast.success('Post reported. Thank you for helping keep our community safe.');
    } catch (error) {
      console.error('Error reporting post:', error);
      toast.error('An error occurred. Please try again.');
    }
  };
  
  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'some time ago';
    }
  };
  
  const renderMedia = () => {
    if (!post.images || post.images.length === 0) return null;
    
    return (
      <div className={`mt-2 mb-4 grid ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 rounded-2xl overflow-hidden`}>
        {post.images.map((media, index) => (
          <div key={index} className="relative rounded-2xl overflow-hidden">
            {media.type === 'image' ? (
              <img 
                src={media.url} 
                alt={`Post media ${index}`}
                className="w-full h-64 object-cover"
              />
            ) : (
              <video 
                src={media.url} 
                className="w-full h-64 object-cover" 
                controls
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="px-4 py-3 border-b border-xExtraLightGray hover:bg-xExtraLightGray/30 transition-colors">
      <div className="flex">
        <div className="mr-3">
          <Link to={`/profile/${post.userId}`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.user.avatar} alt={post.user.name} />
              <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to={`/profile/${post.userId}`} className="font-semibold hover:underline">
                {post.user.name}
              </Link>
              {post.user.verified && (
                <span className="ml-1 text-xBlue">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
              <span className="text-xGray ml-2">@{post.user.username}</span>
              <span className="text-xGray mx-1">·</span>
              <span className="text-xGray">{formatTimeAgo(post.createdAt)}</span>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-xGray hover:text-xBlue hover:bg-xBlue/10 rounded-full">
                  <MoreHorizontal size={16} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="end">
                <div className="py-1">
                  {user && user.id === post.userId ? (
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 rounded-none px-3 py-2 h-auto"
                      onClick={handleDelete}
                    >
                      Delete post
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 rounded-none px-3 py-2 h-auto"
                      onClick={handleReport}
                    >
                      <AlertTriangle size={16} className="mr-2" />
                      Report post
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <Link to={`/post/${post.id}`}>
            {post.content && (
              <div className="post-content mb-3 whitespace-pre-wrap break-words">
                {post.content.split(/\[CODE_BLOCK_(\d+)\]/).map((part, index) => {
                  // If it's an odd index, it's a code block reference
                  if (index % 2 === 1) {
                    const blockIndex = parseInt(part, 10);
                    const codeBlock = post.code_blocks && post.code_blocks[blockIndex];
                    
                    return codeBlock ? (
                      <CodeBlock 
                        key={`code-${index}`}
                        code={codeBlock.code} 
                        language={codeBlock.language} 
                      />
                    ) : null;
                  }
                  
                  // Regular text content
                  return part ? (
                    <span key={`text-${index}`}>{part}</span>
                  ) : null;
                })}
              </div>
            )}
            
            {renderMedia()}
          </Link>
          
          <div className="flex justify-between mt-2 text-xGray">
            <button 
              className={`flex items-center space-x-1 hover:text-xBlue ${liked ? 'text-red-500 hover:text-red-600' : ''}`}
              onClick={handleLike}
            >
              <Heart size={18} className={liked ? 'fill-current' : ''} />
              <span>{likeCount > 0 ? likeCount : ''}</span>
            </button>
            
            <Link to={`/post/${post.id}`} className="flex items-center space-x-1 hover:text-xBlue">
              <MessageCircle size={18} />
              <span>{post.comments > 0 ? post.comments : ''}</span>
            </Link>
            
            <button className="flex items-center space-x-1 hover:text-xBlue">
              <Repeat size={18} />
              <span>{post.reposts > 0 ? post.reposts : ''}</span>
            </button>
            
            <button 
              className={`flex items-center space-x-1 hover:text-xBlue ${saved ? 'text-yellow-500 hover:text-yellow-600' : ''}`}
              onClick={handleSave}
            >
              <Bookmark size={18} className={saved ? 'fill-current' : ''} />
              <span>{saveCount > 0 ? saveCount : ''}</span>
            </button>
            
            <button className="flex items-center space-x-1 hover:text-xBlue">
              <Share size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
