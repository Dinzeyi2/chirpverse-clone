
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import PostCard from '@/components/feed/PostCard';
import { ArrowLeft } from 'lucide-react';
import { Post, posts, formatDate } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import CommentList from '@/components/feed/CommentList';
import { toast } from 'sonner';

const PostPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      username: string;
      avatar: string;
      verified?: boolean;
    };
  }[]>([
    {
      id: '1',
      content: 'This is amazing! Great work on the release.',
      createdAt: '2023-10-13T09:10:00Z',
      user: {
        id: '3',
        name: 'Alex Johnson',
        username: 'alexj',
        avatar: 'https://i.pravatar.cc/150?img=3',
        verified: true,
      },
    },
    {
      id: '2',
      content: 'Can't wait to try it out! Is there a demo available?',
      createdAt: '2023-10-13T10:25:00Z',
      user: {
        id: '4',
        name: 'Sarah Parker',
        username: 'sarahp',
        avatar: 'https://i.pravatar.cc/150?img=9',
      },
    },
  ]);
  
  // Find the post by ID
  const post = posts.find(p => p.id === postId);
  
  if (!post) {
    return (
      <AppLayout>
        <div className="p-4">
          <div className="flex items-center mb-4">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mr-2">
              <ArrowLeft size={18} />
            </Button>
            <h1 className="text-xl font-bold">Post</h1>
          </div>
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <h2 className="text-2xl font-bold mb-2">Post not found</h2>
            <p className="text-gray-500 mb-6">The post you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/')}>Go home</Button>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) return;
    
    // Add the new comment
    const newComment = {
      id: `comment-${Date.now()}`,
      content: comment,
      createdAt: new Date().toISOString(),
      user: {
        id: '1', // Assuming current user
        name: 'John Doe',
        username: 'johndoe',
        avatar: 'https://i.pravatar.cc/150?img=1',
        verified: true,
      },
    };
    
    setComments([newComment, ...comments]);
    setComment('');
    toast.success('Comment posted');
  };
  
  return (
    <AppLayout>
      <div className="border-b border-xExtraLightGray">
        <div className="p-4 flex items-center">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-xl font-bold">Post</h1>
        </div>
      </div>
      
      <div className="p-4">
        <PostCard post={post} isDetailView={true} />
        
        <div className="border-t border-b border-xExtraLightGray py-4 my-2">
          <span className="text-xGray text-sm">{comments.length} comments</span>
        </div>
        
        {/* Comment form */}
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex space-x-2">
            <div className="flex-shrink-0">
              <img
                src="https://i.pravatar.cc/150?img=1"
                alt="Your avatar"
                className="w-10 h-10 rounded-full"
              />
            </div>
            <div className="flex-grow">
              <Textarea
                placeholder="Post your reply"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full resize-none border-0 bg-transparent p-0 focus:ring-0 min-h-[80px] text-base"
              />
              <div className="flex justify-end mt-2">
                <Button 
                  type="submit"
                  disabled={!comment.trim()}
                  className="rounded-full bg-xBlue text-white px-4 py-1 text-sm font-bold hover:bg-blue-600"
                >
                  Reply
                </Button>
              </div>
            </div>
          </div>
        </form>
        
        <CommentList comments={comments} />
      </div>
    </AppLayout>
  );
};

export default PostPage;
