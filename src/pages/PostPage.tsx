
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { getPostById, getCommentsByPostId, Comment as CommentType } from '@/lib/data';
import CommentList from '@/components/comments/CommentList';
import CommentForm from '@/components/comments/CommentForm';
import PostCard from '@/components/feed/PostCard';

const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  
  const [post, setPost] = useState(postId ? getPostById(postId) : undefined);
  const [comments, setComments] = useState<CommentType[]>([]);
  
  useEffect(() => {
    if (postId) {
      // Simulate API call to fetch post and comments
      const fetchedPost = getPostById(postId);
      if (fetchedPost) {
        setPost(fetchedPost);
        setComments(getCommentsByPostId(postId));
      }
    }
  }, [postId]);
  
  const handleCommentAdded = (content: string) => {
    // Create a new comment
    const newComment: CommentType = {
      id: `temp-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      userId: '1', // Current user ID (hardcoded for demo)
      postId: postId || '',
      likes: 0,
      user: {
        id: '1',
        name: 'John Doe',
        username: 'johndoe',
        avatar: 'https://i.pravatar.cc/150?img=1',
        followers: 1453,
        following: 234,
        verified: true,
      }
    };
    
    // Add the comment to the list
    setComments([newComment, ...comments]);
    
    // Update the post reply count if post exists
    if (post) {
      setPost({
        ...post,
        replies: post.replies + 1
      });
    }
  };
  
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
      {/* Header */}
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
      
      {/* Original Post */}
      <div className="border-b border-xExtraLightGray">
        <PostCard post={post} />
      </div>
      
      {/* Comment Form */}
      <CommentForm 
        postId={post.id} 
        currentUser={{
          id: '1',
          name: 'John Doe',
          username: 'johndoe',
          avatar: 'https://i.pravatar.cc/150?img=1',
          followers: 1453,
          following: 234,
          verified: true,
        }}
        onCommentAdded={handleCommentAdded}
      />
      
      {/* Comments */}
      <CommentList comments={comments} />
    </AppLayout>
  );
};

export default PostPage;
