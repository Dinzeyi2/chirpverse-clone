
import React from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ProfileHeader from '@/components/user/ProfileHeader';
import PostList from '@/components/feed/PostList';
import { getUserById, getPostsByUserId } from '@/lib/data';

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  
  // In a real app, you would fetch this data from an API
  const user = getUserById(userId || '1');
  const userPosts = getPostsByUserId(userId || '1');
  
  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-2xl font-bold mb-4">User not found</h2>
          <p className="text-xGray">The user you're looking for doesn't exist or was removed.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ProfileHeader user={user} isCurrentUser={userId === '1'} />
      <PostList posts={userPosts} />
    </AppLayout>
  );
};

export default Profile;
