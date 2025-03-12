
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ProfileHeader from '@/components/user/ProfileHeader';
import PostList from '@/components/feed/PostList';
import { getUserById, getPostsByUserId } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState("posts");
  
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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <AppLayout>
      <ProfileHeader user={user} isCurrentUser={userId === '1'} />
      
      <Tabs defaultValue="posts" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="w-full grid grid-cols-4 bg-transparent border-b rounded-none">
          <TabsTrigger 
            value="posts" 
            className="data-[state=active]:border-b-2 data-[state=active]:border-xBlue data-[state=active]:shadow-none rounded-none data-[state=active]:font-bold"
          >
            Posts
          </TabsTrigger>
          <TabsTrigger 
            value="replies" 
            className="data-[state=active]:border-b-2 data-[state=active]:border-xBlue data-[state=active]:shadow-none rounded-none data-[state=active]:font-bold"
          >
            Replies
          </TabsTrigger>
          <TabsTrigger 
            value="media" 
            className="data-[state=active]:border-b-2 data-[state=active]:border-xBlue data-[state=active]:shadow-none rounded-none data-[state=active]:font-bold"
          >
            Media
          </TabsTrigger>
          <TabsTrigger 
            value="likes" 
            className="data-[state=active]:border-b-2 data-[state=active]:border-xBlue data-[state=active]:shadow-none rounded-none data-[state=active]:font-bold"
          >
            Likes
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="mt-0">
          <PostList posts={userPosts} />
        </TabsContent>
        
        <TabsContent value="replies" className="mt-0">
          <div className="flex flex-col items-center justify-center py-12 text-xGray">
            <p>No replies yet</p>
          </div>
        </TabsContent>
        
        <TabsContent value="media" className="mt-0">
          <div className="flex flex-col items-center justify-center py-12 text-xGray">
            <p>No media posts yet</p>
          </div>
        </TabsContent>
        
        <TabsContent value="likes" className="mt-0">
          <div className="flex flex-col items-center justify-center py-12 text-xGray">
            <p>No liked posts yet</p>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Profile;
