import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Post } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PostCard from '@/components/feed/PostCard';
import CommentList from '@/components/comments/CommentList';
import CommentForm from '@/components/comments/CommentForm';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const PostPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [viewRecorded, setViewRecorded] = useState(false);

  // Fetch the post with user data
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      if (!postId) return null;
      
      const { data, error } = await supabase
        .from('shoutouts')
        .select(`
          *,
          user:profiles!inner(*)
        `)
        .eq('id', postId)
        .single();
        
      if (error) {
        throw error;
      }
      
      // Format the data to match our Post interface
      const formattedPost: Post = {
        id: data.id,
        content: data.content,
        createdAt: data.created_at,
        userId: data.user_id,
        likes: 0, // Will fetch counts separately
        replies: 0,
        user: {
          id: data.user.user_id,
          username: data.user.username || '',
          name: data.user.full_name,
          avatar: data.user.avatar_url || '',
          email: data.user.email || '',
          verified: !!data.user.verified,
          profession: data.user.profession
        },
        images: data.media?.images || [],
        metadata: data.metadata || {},
        liked: false,
        bookmarked: false,
        isOwner: user?.id === data.user_id
      };
      
      return formattedPost;
    },
    retry: 1,
    enabled: !!postId
  });

  // Fetch like counts
  const { data: likeCounts } = useQuery({
    queryKey: ['likeCounts', postId],
    queryFn: async () => {
      if (!postId) return null;
      
      const { data, error } = await supabase
        .from('shoutout_likes')
        .select('count(*)')
        .eq('shoutout_id', postId);
        
      if (error) {
        console.error("Error fetching like counts:", error);
        return 0;
      }
      
      return parseInt(data?.[0]?.count || '0', 10);
    },
    retry: 1,
    enabled: !!postId
  });

  // Fetch reply counts
  const { data: replyCounts } = useQuery({
    queryKey: ['replyCounts', postId],
    queryFn: async () => {
      if (!postId) return null;
      
      const { data, error } = await supabase
        .from('comments')
        .select('count(*)')
        .eq('shoutout_id', postId);
        
      if (error) {
        console.error("Error fetching reply counts:", error);
        return 0;
      }
      
      return parseInt(data?.[0]?.count || '0', 10);
    },
    retry: 1,
    enabled: !!postId
  });

  // Fetch if the post is liked by the current user
  const { data: likedByUser } = useQuery({
    queryKey: ['likedByUser', postId, user?.id],
    queryFn: async () => {
      if (!postId || !user?.id) return false;
      
      const { data, error } = await supabase
        .from('shoutout_likes')
        .select('count(*)')
        .eq('shoutout_id', postId)
        .eq('user_id', user.id);
        
      if (error) {
        console.error("Error fetching liked by user:", error);
        return false;
      }
      
      return parseInt(data?.[0]?.count || '0', 10) > 0;
    },
    retry: 1,
    enabled: !!postId && !!user?.id
  });

  // Fetch if the post is bookmarked by the current user
  const { data: bookmarkedByUser } = useQuery({
    queryKey: ['bookmarkedByUser', postId, user?.id],
    queryFn: async () => {
      if (!postId || !user?.id) return false;
      
      const { data, error } = await supabase
        .from('bookmarks')
        .select('count(*)')
        .eq('shoutout_id', postId)
        .eq('user_id', user.id);
        
      if (error) {
        console.error("Error fetching bookmarked by user:", error);
        return false;
      }
      
      return parseInt(data?.[0]?.count || '0', 10) > 0;
    },
    retry: 1,
    enabled: !!postId && !!user?.id
  });

  useEffect(() => {
    if (post && likeCounts !== undefined) {
      // Update the post object with the fetched data
      queryClient.setQueryData(['post', postId], {
        ...post,
        likes: likeCounts,
        replies: replyCounts,
        liked: likedByUser,
        bookmarked: bookmarkedByUser
      });
    }
  }, [post, likeCounts, replyCounts, likedByUser, bookmarkedByUser, queryClient, postId]);

  // Record view count
  useEffect(() => {
    if (post && !viewRecorded) {
      const recordView = async () => {
        try {
          const { error } = await supabase.rpc('increment_view_count', {
            row_id: postId,
            table_name: 'shoutouts',
            column_name: 'views'
          });
          
          if (error) {
            console.error("Error incrementing view count:", error);
          } else {
            setViewRecorded(true);
          }
        } catch (err) {
          console.error("Error in increment_view_count:", err);
        }
      };
      
      recordView();
    }
  }, [post, postId, viewRecorded]);

  // Component rendering
  if (isLoading) {
    return (
      <div className="container max-w-2xl py-4">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Skeleton className="h-[300px] w-full rounded-lg" />
        <div className="space-y-4 mt-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container max-w-2xl py-4">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="p-4 border border-red-300 rounded-md bg-red-50">
          <h2 className="text-lg font-semibold text-red-800">Error Loading Post</h2>
          <p className="text-red-600">{error?.message || 'Post not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-4">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      
      <PostCard post={post} expanded={true} />
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>
        
        {user ? (
          <CommentForm 
            postId={post.id} 
            postAuthorId={post.userId} // Pass the post author ID to CommentForm
          />
        ) : (
          <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-md">
            Sign in to leave a comment
          </p>
        )}
        
        <div className="mt-6">
          <CommentList postId={post.id} />
        </div>
      </div>
    </div>
  );
};

export default PostPage;
