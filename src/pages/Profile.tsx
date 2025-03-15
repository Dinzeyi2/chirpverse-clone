
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ProfileHeader from '@/components/user/ProfileHeader';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PostList from '@/components/feed/PostList';
import { Post } from '@/lib/data';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';

const Profile = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user, username } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    posts: 0,
    replies: 0,
    reactions: 0,
    bluedify: 0
  });
  
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<Post[]>([]);
  const [postsPage, setPostsPage] = useState(1);
  const [repliesPage, setRepliesPage] = useState(1);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  
  const postsPerPage = 10;
  
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

  // Fetch posts by the user
  useEffect(() => {
    const fetchPosts = async () => {
      if (!profileUserId) return;
      
      try {
        setLoadingPosts(true);
        
        // Fetch posts created by the user
        const { data, error } = await supabase
          .from('shoutouts')
          .select(`
            id,
            content,
            created_at,
            media,
            user_id,
            profiles:user_id (full_name, avatar_url)
          `)
          .eq('user_id', profileUserId)
          .order('created_at', { ascending: false })
          .range((postsPage - 1) * postsPerPage, postsPage * postsPerPage - 1);
          
        if (error) {
          console.error('Error fetching posts:', error);
          return;
        }
        
        // Format posts to match the Post type
        const formattedPosts: Post[] = data.map((post: any) => ({
          id: post.id,
          content: post.content,
          author: {
            id: post.user_id,
            name: post.profiles?.full_name || 'Unknown User',
            username: post.user_id,
            avatar: post.profiles?.avatar_url || 'https://i.pravatar.cc/150?img=1',
            verified: false
          },
          media: post.media,
          createdAt: new Date(post.created_at),
          stats: {
            replies: 0,
            likes: 0,
            reposts: 0,
            views: 0
          }
        }));
        
        setPosts(formattedPosts);
      } catch (err) {
        console.error('Error in fetchPosts:', err);
        toast.error('Failed to load posts');
      } finally {
        setLoadingPosts(false);
      }
    };
    
    if (profileUserId && activeTab === 'posts') {
      fetchPosts();
    }
  }, [profileUserId, postsPage, activeTab]);

  // Fetch replies by the user
  useEffect(() => {
    const fetchReplies = async () => {
      if (!profileUserId) return;
      
      try {
        setLoadingReplies(true);
        
        // Fetch comments (replies) created by the user
        const { data, error } = await supabase
          .from('comments')
          .select(`
            id,
            content,
            created_at,
            media,
            user_id,
            shoutout_id,
            profiles:user_id (full_name, avatar_url)
          `)
          .eq('user_id', profileUserId)
          .order('created_at', { ascending: false })
          .range((repliesPage - 1) * postsPerPage, repliesPage * postsPerPage - 1);
          
        if (error) {
          console.error('Error fetching replies:', error);
          return;
        }
        
        // Format replies to match the Post type
        const formattedReplies: Post[] = data.map((reply: any) => ({
          id: reply.id,
          content: reply.content,
          author: {
            id: reply.user_id,
            name: reply.profiles?.full_name || 'Unknown User',
            username: reply.user_id,
            avatar: reply.profiles?.avatar_url || 'https://i.pravatar.cc/150?img=1',
            verified: false
          },
          media: reply.media,
          createdAt: new Date(reply.created_at),
          stats: {
            replies: 0,
            likes: 0,
            reposts: 0,
            views: 0
          },
          isReply: true,
          parentId: reply.shoutout_id
        }));
        
        setReplies(formattedReplies);
      } catch (err) {
        console.error('Error in fetchReplies:', err);
        toast.error('Failed to load replies');
      } finally {
        setLoadingReplies(false);
      }
    };
    
    if (profileUserId && activeTab === 'replies') {
      fetchReplies();
    }
  }, [profileUserId, repliesPage, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'posts') {
      setPostsPage(1);
    } else if (value === 'replies') {
      setRepliesPage(1);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    );
  }

  if (!profileData) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-2xl font-bold mb-4">User not found</h2>
          <p className="text-gray-500">The user you're looking for doesn't exist or was removed.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="bg-white dark:bg-gray-950 min-h-screen">
        <ProfileHeader 
          user={profileData} 
          isCurrentUser={isCurrentUser}
          stats={userStats}
          onTabChange={handleTabChange}
        />
        
        <div className="px-4 py-6">
          {activeTab === 'posts' && (
            <>
              <PostList 
                posts={posts} 
                loading={loadingPosts} 
              />
              {posts.length > 0 && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setPostsPage(prev => Math.max(prev - 1, 1))}
                        className={postsPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink isActive>{postsPage}</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setPostsPage(prev => prev + 1)}
                        className={posts.length < postsPerPage ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
          
          {activeTab === 'replies' && (
            <>
              <PostList 
                posts={replies} 
                loading={loadingReplies} 
              />
              {replies.length > 0 && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setRepliesPage(prev => Math.max(prev - 1, 1))}
                        className={repliesPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink isActive>{repliesPage}</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setRepliesPage(prev => prev + 1)}
                        className={replies.length < postsPerPage ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
