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
  const [userStats, setUserStats] = useState({
    posts: 0,
    replies: 0,
    reactions: 0,
    bluedify: 0
  });
  
  const isCurrentUser = user && userId === user.id;
  
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!userId) return;
      
      try {
        const { data: posts, error: postsError } = await supabase
          .from('shoutouts')
          .select('id', { count: 'exact' })
          .eq('user_id', userId);
          
        const { data: replies, error: repliesError } = await supabase
          .from('comments')
          .select('id', { count: 'exact' })
          .eq('user_id', userId);

        const { data: userShoutouts, error: shoutoutsError } = await supabase
          .from('shoutouts')
          .select('id')
          .eq('user_id', userId);

        let reactionsCount = 0;
        let bluedifyCount = 0;
        
        if (userShoutouts && userShoutouts.length > 0) {
          const shoutoutIds = userShoutouts.map(shoutout => shoutout.id);
          
          const { count: likesCount, error: likesError } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .in('shoutout_id', shoutoutIds);
            
          const { count: repostsCount, error: repostsError } = await supabase
            .from('reposts')
            .select('*', { count: 'exact', head: true })
            .in('shoutout_id', shoutoutIds);
            
          if (likesCount !== null) reactionsCount = likesCount;
          if (repostsCount !== null) bluedifyCount = repostsCount;
          
          if (likesError || repostsError) {
            console.error('Error counting interactions:', { likesError, repostsError });
          }
        }
          
        setUserStats({
          posts: posts?.length || 0,
          replies: replies?.length || 0,
          reactions: reactionsCount,
          bluedify: bluedifyCount
        });
        
        if (postsError || repliesError || shoutoutsError) {
          console.error('Error fetching user stats:', {
            postsError, repliesError, shoutoutsError
          });
        }
      } catch (err) {
        console.error('Error computing user stats:', err);
      }
    };
    
    fetchUserStats();
  }, [userId]);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        let { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (error || !profile) {
          const fallbackUser = getUserById(userId || '1');
          if (fallbackUser) {
            setProfileData({
              ...fallbackUser,
              id: userId
            });
          } else {
            if (isCurrentUser && user) {
              setProfileData({
                id: user.id,
                name: user.user_metadata?.full_name || 'User',
                username: user.user_metadata?.username || 'user',
                bio: '',
                profession: '',
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
          setProfileData({
            id: profile.id,
            name: profile.full_name || 'User',
            username: profile.user_id?.substring(0, 8) || 'user',
            bio: profile.description || '',
            profession: profile.profession || '',
            avatar: profile.avatar_url || 'https://i.pravatar.cc/150?img=1',
            verified: false,
            followers: 0,
            following: 0
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

  useEffect(() => {
    if (!userId) return;
    
    const profileChannel = supabase
      .channel('profile-changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles',
          filter: `id=eq.${userId}`
        }, 
        (payload) => {
          const updatedProfile = payload.new;
          setProfileData(current => {
            if (!current) return current;
            return {
              ...current,
              name: updatedProfile.full_name || current.name,
              bio: updatedProfile.description || current.bio,
              avatar: updatedProfile.avatar_url || current.avatar
            };
          });
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [userId]);
  
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
      <ProfileHeader 
        user={profileData} 
        isCurrentUser={isCurrentUser}
        stats={userStats}
      />
      
      <Tabs defaultValue="posts" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="w-full grid grid-cols-2 bg-transparent border-b rounded-none">
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
        </TabsList>
        
        <TabsContent value="posts" className="mt-0">
          <PostList posts={userPosts} />
        </TabsContent>
        
        <TabsContent value="replies" className="mt-0">
          <div className="flex flex-col items-center justify-center py-12 text-xGray">
            <p>No replies yet</p>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Profile;
