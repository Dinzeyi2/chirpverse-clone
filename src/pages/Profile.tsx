
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ProfileHeader from '@/components/user/ProfileHeader';
import PostList from '@/components/feed/PostList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Profile = () => {
  const { userId } = useParams<{ userId?: string }>();
  const [activeTab, setActiveTab] = useState("posts");
  const { user, username } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userReplies, setUserReplies] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({
    posts: 0,
    replies: 0,
    reactions: 0,
    bluedify: 0
  });
  
  const navigate = useNavigate();
  
  // If userId is not provided, use the current user's id
  const profileUserId = userId || (user ? user.id : null);
  const isCurrentUser = user && profileUserId === user.id;
  
  useEffect(() => {
    console.log("Profile component - User ID from URL:", userId);
    console.log("Profile component - Current user ID:", user?.id);
    console.log("Profile component - Using profile ID:", profileUserId);
    
    // If no profile user ID is available and user is not logged in, redirect to auth
    if (!profileUserId && !user) {
      navigate('/auth');
      return;
    }
    
    // If no profile user ID is available but user is logged in, redirect to their profile
    if (!profileUserId && user) {
      navigate(`/profile/${user.id}`);
      return;
    }
  }, [profileUserId, user, navigate, userId]);
  
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!profileUserId) return;
      
      try {
        const { data: posts, error: postsError } = await supabase
          .from('shoutouts')
          .select('id', { count: 'exact' })
          .eq('user_id', profileUserId);
          
        const { data: replies, error: repliesError } = await supabase
          .from('comments')
          .select('id', { count: 'exact' })
          .eq('user_id', profileUserId);

        const { data: userShoutouts, error: shoutoutsError } = await supabase
          .from('shoutouts')
          .select('id')
          .eq('user_id', profileUserId);

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
    
    if (profileUserId) {
      fetchUserStats();
    }
  }, [profileUserId]);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        if (!profileUserId) {
          if (!user) {
            navigate('/auth');
            return;
          }
          return;
        }
        
        console.log("Fetching profile data for user ID:", profileUserId);
        
        let { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileUserId)
          .single();
          
        if (error || !profile) {
          console.error("Error fetching profile or profile not found:", error);
          
          // If this is the current user, create a default profile
          if (isCurrentUser && user) {
            const usernameToUse = username || 
              user.user_metadata?.username || 
              user.id?.substring(0, 8) || 
              'user';
              
            setProfileData({
              id: user.id,
              name: user.user_metadata?.full_name || 'User',
              username: usernameToUse,
              bio: '',
              profession: '',
              avatar: 'https://i.pravatar.cc/150?img=1',
              verified: false,
              followers: 0,
              following: 0
            });
          } else {
            // Check if user exists in auth system
            try {
              const { data, error: userError } = await supabase.auth.admin.getUserById(profileUserId);
              
              if (userError || !data) {
                console.error("User not found in auth system:", userError);
                navigate('/not-found');
                return;
              }
              
              // User exists in auth but not in profiles, create minimal profile data
              setProfileData({
                id: profileUserId,
                name: 'User',
                username: profileUserId.substring(0, 8),
                bio: '',
                profession: '',
                avatar: 'https://i.pravatar.cc/150?img=1',
                verified: false,
                followers: 0,
                following: 0
              });
            } catch (authCheckError) {
              console.error("Error checking user in auth system:", authCheckError);
              // Fallback - try to show some profile
              setProfileData({
                id: profileUserId,
                name: 'User',
                username: profileUserId.substring(0, 8),
                bio: '',
                profession: '',
                avatar: 'https://i.pravatar.cc/150?img=1',
                verified: false,
                followers: 0,
                following: 0
              });
            }
          }
        } else {
          // Got profile data from database
          const usernameToUse = isCurrentUser ? 
            (username || profile.user_id?.substring(0, 8) || 'user') : 
            profile.user_id?.substring(0, 8) || 'user';
            
          setProfileData({
            id: profile.id,
            name: profile.full_name || 'User',
            username: usernameToUse,
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
    
    if (profileUserId) {
      fetchProfileData();
    }
  }, [profileUserId, user, isCurrentUser, navigate, username]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!profileUserId) return;
      
      try {
        const { data, error } = await supabase
          .from('shoutouts')
          .select(`
            *,
            profiles:user_id (*)
          `)
          .eq('user_id', profileUserId)
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        if (data) {
          const formattedPosts = data.map(post => {
            // Get username from context or provide a fallback
            const usernameToUse = isCurrentUser ? 
              (username || post.user_id.substring(0, 8) || 'user') : 
              post.user_id.substring(0, 8) || 'user';
              
            return {
              id: post.id,
              content: post.content,
              createdAt: post.created_at,
              likes: 0,
              reposts: 0,
              replies: 0,
              views: 0,
              userId: post.user_id,
              images: post.media,
              user: {
                id: post.profiles?.id || profileUserId,
                name: post.profiles?.full_name || 'User',
                username: usernameToUse,
                avatar: post.profiles?.avatar_url || 'https://i.pravatar.cc/150?img=1',
                verified: false,
                followers: 0,
                following: 0,
              }
            };
          });
          
          setUserPosts(formattedPosts);
        }
      } catch (error) {
        console.error('Error fetching user posts:', error);
      }
    };
    
    if (profileUserId) {
      fetchUserPosts();
    }
  }, [profileUserId, isCurrentUser, username]);

  useEffect(() => {
    if (!profileUserId) return;
    
    const profileChannel = supabase
      .channel('profile-changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles',
          filter: `id=eq.${profileUserId}`
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
  }, [profileUserId]);
  
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
