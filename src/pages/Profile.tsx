
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ProfileHeader from '@/components/user/ProfileHeader';
import PostList from '@/components/feed/PostList';
import { getUserById, getPostsByUserId } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState("posts");
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Determine if this is the current user's profile
  const isCurrentUser = user && userId === user.id;
  
  // Fetch user profile data from Supabase
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // First try to get from profiles table
        let { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (error || !profile) {
          // If not in profiles table, get from auth.users via getUserById
          const fallbackUser = getUserById(userId || '1');
          if (fallbackUser) {
            setProfileData({
              ...fallbackUser,
              id: userId
            });
          } else {
            // Neither found, use current user data if available
            if (isCurrentUser && user) {
              setProfileData({
                id: user.id,
                name: user.user_metadata?.full_name || 'User',
                username: user.user_metadata?.username || 'user',
                bio: '',
                avatar: 'https://i.pravatar.cc/150?img=1',
                verified: false,
                followers: 0,
                following: 0
              });
            } else {
              setProfileData(null);
            }
          }
        } else {
          // Profile found in Supabase - map Supabase profile fields to our component's expected format
          setProfileData({
            id: profile.id,
            name: profile.full_name || 'User',
            username: profile.user_id?.substring(0, 8) || 'user',  // Use part of user_id as username if not available
            bio: profile.description || '',
            avatar: profile.avatar_url || 'https://i.pravatar.cc/150?img=1',
            verified: false, // Default to false as we don't have this field
            followers: 0,    // Default to 0 as we don't have this field yet
            following: 0     // Default to 0 as we don't have this field yet
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchProfileData();
    }
  }, [userId, user, isCurrentUser]);
  
  // Get posts by this user
  const userPosts = getPostsByUserId(userId || '1');
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-xBlue"></div>
        </div>
      </AppLayout>
    );
  }

  if (!profileData) {
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
      <ProfileHeader user={profileData} isCurrentUser={isCurrentUser} />
      
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
