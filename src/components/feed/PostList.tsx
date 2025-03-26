
import React from 'react';
import { Post } from '@/lib/data';
import { Inbox } from 'lucide-react';
import PostCard from './PostCard';
import PostSkeleton from './PostSkeleton';

interface PostWithActions extends Post {
  actions?: React.ReactNode;
  languages?: string[];
}

interface PostListProps {
  posts: PostWithActions[];
  loading?: boolean;
}

// Standard profile image for all users - updated to the new blue smiley face
const standardProfileImage = "/lovable-uploads/325d2d74-ad68-4607-8fab-66f36f0e087e.png";

const PostList: React.FC<PostListProps> = ({ posts, loading = false }) => {
  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <PostSkeleton count={3} />
      </div>
    );
  }

  if (posts.length === 0) {
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
  const postsWithStandardAvatar = posts.map(post => ({
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
