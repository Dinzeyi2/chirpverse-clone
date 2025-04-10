
import React, { useState, useEffect } from 'react';
import { Post, Comment } from '@/lib/data';
import { Inbox } from 'lucide-react';
import PostCard from './PostCard';
import PostSkeleton from './PostSkeleton';

interface PostWithActions extends Post {
  actions?: React.ReactNode;
  languages?: string[];
}

// Define the PostEngagement interface
export interface PostEngagement {
  postId: string;
  comments: Comment[];
  reactions: {emoji: string, count: number, reacted: boolean}[];
}

interface PostListProps {
  posts: PostWithActions[];
  loading?: boolean;
  engagementData?: Map<string, PostEngagement>; // Add engagementData prop
}

// Standard profile image for all users - updated to the new blue smiley face
const standardProfileImage = "/lovable-uploads/325d2d74-ad68-4607-8fab-66f36f0e087e.png";

const PostList: React.FC<PostListProps> = ({ posts, loading = false, engagementData }) => {
  const [displayPosts, setDisplayPosts] = useState<PostWithActions[]>([]);

  useEffect(() => {
    // Initialize displayPosts with the provided posts
    setDisplayPosts(posts);
    
    // Listen for post deletion events
    const handlePostDeleted = (event: CustomEvent) => {
      const deletedPostId = event.detail.postId;
      setDisplayPosts(currentPosts => 
        currentPosts.filter(post => post.id !== deletedPostId)
      );
    };
    
    document.addEventListener('post-deleted', handlePostDeleted as EventListener);
    
    return () => {
      document.removeEventListener('post-deleted', handlePostDeleted as EventListener);
    };
  }, [posts]);

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <PostSkeleton count={3} />
      </div>
    );
  }

  if (displayPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 mb-4 text-neutral-500">
          <Inbox className="w-full h-full" />
        </div>
        <h3 className="text-2xl font-bold mb-2">No posts yet</h3>
        <p className="text-neutral-500 mb-6 max-w-md">When posts are published, they'll show up here.</p>
      </div>
    );
  }

  // Ensure all posts use the standard profile image
  const postsWithStandardAvatar = displayPosts.map(post => ({
    ...post,
    user: {
      ...post.user,
      avatar: standardProfileImage
    }
  }));

  return (
    <div className="space-y-4 p-4">
      {postsWithStandardAvatar.map(post => (
        <div key={post.id} className="max-w-xl mx-auto">
          <PostCard post={post} />
        </div>
      ))}
    </div>
  );
};

export default PostList;
