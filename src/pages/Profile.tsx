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
import PostActionMenu from '@/components/feed/PostActionMenu';
import SwipeablePostView from '@/components/feed/SwipeablePostView';
import { useTheme } from '@/components/theme/theme-provider';
import { cn } from '@/lib/utils';

const Profile = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user, username } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<Post[]>([]);
  const [postsPage, setPostsPage] = useState(1);
  const [repliesPage, setRepliesPage] = useState(1);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  
  const postsPerPage = 10;
  
  const navigate = useNavigate();
  
  const profileUserId = userId || (user ? user.id : null);
  const isCurrentUser = user && profileUserId === user.id;
  
  useEffect(() => {
    console.log("Profile component - User ID from URL:", userId);
    console.log("Profile component - Current user ID:", user?.id);
    console.log("Profile component - Using profile ID:", profileUserId);
    
    if (!profileUserId && !user) {
      navigate('/auth');
      return;
    }
    
    if (!profileUserId && user) {
      navigate(`/profile/${user.id}`);
      return;
    }
  }, [profileUserId, user, navigate, userId]);
  
  const fetchUserStats = async () => {
    if (!profileUserId) return;
    
    try {
      const { data: posts, error: postsError } = await supabase
        .from('shoutouts')
        .select('id', { count: 'exact' })
        .eq('user_id', profileUserId);
      
      const { data: userShoutouts, error: shoutoutsError } = await supabase
        .from('shoutouts')
        .select('id')
        .eq('user_id', profileUserId);
        
      let repliesCount = 0;
      let reactionsCount = 0;
      let bluedifyCount = 0;
      
      const { count: userReactionsCount, error: reactionsError } = await (supabase as any)
        .from('post_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profileUserId);
        
      if (userReactionsCount !== null) reactionsCount = userReactionsCount;
      
      if (reactionsError) {
        console.error('Error counting user reactions:', reactionsError);
      }
      
      const { count: userBludifiesCount, error: bludifiesError } = await supabase
        .from('post_bludifies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profileUserId);
        
      if (userBludifiesCount !== null) bluedifyCount = userBludifiesCount;
      
      if (bludifiesError) {
        console.error('Error counting user bludifies:', bludifiesError);
      }
      
      if (userShoutouts && userShoutouts.length > 0) {
        const shoutoutIds = userShoutouts.map(shoutout => shoutout.id);
        
        const { count: repliesTotal, error: repliesError } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .in('shoutout_id', shoutoutIds);
          
        if (repliesTotal !== null) repliesCount = repliesTotal;
        
        if (repliesError) {
          console.error('Error counting replies:', repliesError);
        }
      }
        
      setUserStats({
        posts: posts?.length || 0,
        replies: repliesCount,
        reactions: reactionsCount,
        bluedify: bluedifyCount
      });
      
      if (postsError || shoutoutsError) {
        console.error('Error fetching user stats:', {
          postsError, shoutoutsError
        });
      }
    } catch (err) {
      console.error('Error computing user stats:', err);
    }
  };
  
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
            try {
              const { data, error: userError } = await supabase.auth.admin.getUserById(profileUserId);
              
              if (userError || !data) {
                console.error("User not found in auth system:", userError);
                navigate('/not-found');
                return;
              }
              
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
      fetchUserStats();
    }
  }, [profileUserId, user, isCurrentUser, navigate, username]);

  useEffect(() => {
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
      
    const reactionsChannel = supabase
      .channel('profile-reactions-stats')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'post_reactions',
          filter: `user_id=eq.${profileUserId}`
        }, 
        () => {
          console.log('Reactions updated, refreshing stats');
          fetchUserStats();
        }
      )
      .subscribe();
      
    const bludifiesChannel = supabase
      .channel('profile-bludifies-stats')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'post_bludifies',
          filter: `user_id=eq.${profileUserId}`
        }, 
        () => {
          console.log('Bludifies updated, refreshing stats');
          fetchUserStats();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(reactionsChannel);
      supabase.removeChannel(bludifiesChannel);
    };
  }, [profileUserId]);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!profileUserId) return;
      
      try {
        setLoadingPosts(true);
        
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
        
        const formattedPosts: Post[] = data.map((post: any) => ({
          id: post.id,
          content: post.content,
          images: post.media?.url ? [post.media.url] : undefined,
          createdAt: post.created_at,
          likes: 0,
          reposts: 0,
          replies: 0,
          views: 0,
          userId: post.user_id,
          user: {
            id: post.user_id,
            name: post.profiles?.full_name || 'Unknown User',
            username: post.user_id.substring(0, 8),
            avatar: post.profiles?.avatar_url || 'https://i.pravatar.cc/150?img=1',
            following: 0,
            followers: 0,
            verified: false
          },
          isOwner: isCurrentUser
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
  }, [profileUserId, postsPage, activeTab, isCurrentUser]);

  useEffect(() => {
    const fetchReplies = async () => {
      if (!profileUserId) return;
      
      try {
        setLoadingReplies(true);
        
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
        
        const formattedReplies: Post[] = data.map((reply: any) => ({
          id: reply.id,
          content: reply.content,
          images: reply.media?.url ? [reply.media.url] : undefined,
          createdAt: reply.created_at,
          likes: 0,
          reposts: 0,
          replies: 0,
          views: 0,
          userId: reply.user_id,
          user: {
            id: reply.user_id,
            name: reply.profiles?.full_name || 'Unknown User',
            username: reply.user_id.substring(0, 8),
            avatar: reply.profiles?.avatar_url || 'https://i.pravatar.cc/150?img=1',
            following: 0,
            followers: 0,
            verified: false
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

  useEffect(() => {
    if (!profileUserId) return;
    
    const fetchPostIds = async () => {
      const { data: userShoutouts } = await supabase
        .from('shoutouts')
        .select('id')
        .eq('user_id', profileUserId);
        
      if (!userShoutouts || userShoutouts.length === 0) return [];
      return userShoutouts.map(post => post.id);
    };
    
    fetchPostIds().then(postIds => {
      if (postIds.length === 0) return;
      
      const likesChannel = supabase
        .channel('profile-likes-changes')
        .on('postgres_changes', 
          {
            event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'likes',
            filter: `shoutout_id=in.(${postIds.join(',')})`
          },
          () => {
            fetchUserStats();
          }
        )
        .subscribe();
        
      const repostsChannel = supabase
        .channel('profile-reposts-changes')
        .on('postgres_changes', 
          {
            event: '*', // Listen for all events
            schema: 'public',
            table: 'reposts',
            filter: `shoutout_id=in.(${postIds.join(',')})`
          },
          () => {
            fetchUserStats();
          }
        )
        .subscribe();
        
      const commentsChannel = supabase
        .channel('profile-comments-changes')
        .on('postgres_changes', 
          {
            event: '*',
            schema: 'public',
            table: 'comments',
            filter: `shoutout_id=in.(${postIds.join(',')})`
          },
          () => {
            fetchUserStats();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(likesChannel);
        supabase.removeChannel(repostsChannel);
        supabase.removeChannel(commentsChannel);
      };
    });
  }, [profileUserId]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'posts') {
      setPostsPage(1);
    } else if (value === 'replies') {
      setRepliesPage(1);
    }
  };

  const handlePostDeleted = async () => {
    if (activeTab === 'posts') {
      setPostsPage(1);
      await fetchUserStats();
    } else if (activeTab === 'replies') {
      setRepliesPage(1);
      await fetchUserStats();
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
      <div className={cn(
        "min-h-screen",
        isLightMode ? "bg-lightBeige" : "bg-black"
      )}>
        <ProfileHeader 
          user={profileData} 
          isCurrentUser={isCurrentUser}
          stats={userStats}
          onTabChange={handleTabChange}
        />
        
        <div className="px-4 py-6">
          {activeTab === 'posts' && (
            <>
              {loadingPosts ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-10">
                  <p className={cn(
                    isLightMode ? "text-gray-600" : "text-gray-500"
                  )}>No posts to display</p>
                </div>
              ) : (
                <SwipeablePostView 
                  posts={posts.map(post => ({
                    ...post,
                    actions: (
                      <PostActionMenu
                        postId={post.id}
                        isOwner={post.userId === user?.id}
                        onPostDeleted={handlePostDeleted}
                      />
                    )
                  }))} 
                />
              )}
              
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
              {loadingReplies ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : replies.length === 0 ? (
                <div className="text-center py-10">
                  <p className={cn(
                    isLightMode ? "text-gray-600" : "text-gray-500"
                  )}>No replies to display</p>
                </div>
              ) : (
                <SwipeablePostView 
                  posts={replies.map(reply => ({
                    ...reply,
                    actions: (
                      <PostActionMenu
                        postId={reply.id}
                        isOwner={reply.userId === user?.id}
                        onPostDeleted={handlePostDeleted}
                      />
                    )
                  }))} 
                />
              )}
              
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
