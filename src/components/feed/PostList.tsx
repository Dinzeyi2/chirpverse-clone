
import React from 'react';
import PostCard from './PostCard';
import { Post } from '@/lib/data';

interface PostListProps {
  posts: Post[];
  loading?: boolean;
}

const PostList: React.FC<PostListProps> = ({ posts, loading = false }) => {
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
        <div className="w-16 h-16 mb-4 text-xGray">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-full h-full fill-current">
            <g>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
            </g>
          </svg>
        </div>
        <h3 className="text-2xl font-bold mb-2">No posts yet</h3>
        <p className="text-xGray mb-6 max-w-md">When posts are published, they'll show up here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {posts.map((post) => (
        <div key={post.id} className="max-w-sm mx-auto w-full">
          <PostCard post={post} />
        </div>
      ))}
    </div>
  );
};

export default PostList;
