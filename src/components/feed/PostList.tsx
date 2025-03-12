
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
                  <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                </div>
              </div>
            </div>
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
    <div className="divide-y divide-xExtraLightGray">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default PostList;
