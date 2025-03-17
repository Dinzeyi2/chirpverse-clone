
import React from 'react';
import { Post } from '@/lib/data';
import { Inbox } from 'lucide-react';
import SwipeablePostView from './SwipeablePostView';

interface PostWithActions extends Post {
  actions?: React.ReactNode;
}

interface PostListProps {
  posts: PostWithActions[];
  loading?: boolean;
  onRefresh?: () => void;
}

const PostList: React.FC<PostListProps> = ({ posts, loading = false, onRefresh }) => {
  if (loading) {
    return (
      <div className="p-4 space-y-6">
        {[1, 2, 3].map((item) => (
          <div key={item} className="animate-pulse">
            <div className="aspect-square max-w-md mx-auto bg-neutral-800 rounded-xl"></div>
          </div>
        ))}
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

  return <SwipeablePostView posts={posts} onRefresh={onRefresh} />;
};

export default PostList;
