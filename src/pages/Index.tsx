import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PostList from '@/components/feed/PostList';
import SwipeablePostView from '@/components/feed/SwipeablePostView';
import { Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [feedView, setFeedView] = useState<'swipeable' | 'list'>('swipeable');
  const { user, username } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Fetch all posts for the feed
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('shoutouts')
          .select(`
            *,
            profiles:user_id (*)
          `)
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        if (data) {
          const formattedPosts = data.map(post => {
            // Get username from user metadata or provide a fallback
            const userMetadata = post.profiles.user_id ? 
              supabase.auth.admin.getUserById(post.profiles.user_id) : null;
            
            const usernameToUse = username || 
              post.profiles.user_id?.substring(0, 8) || 
              'user';
            
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
                id: post.profiles.id,
                name: post.profiles.full_name || 'User',
                username: usernameToUse,
                avatar: post.profiles.avatar_url || 'https://i.pravatar.cc/150?img=1',
                verified: false,
                followers: 0,
                following: 0,
              }
            };
          });
          
          setFeedPosts(formattedPosts);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
    
    // Set up real-time subscription for new posts
    const channel = supabase
      .channel('public:shoutouts')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'shoutouts'
        }, 
        async (payload) => {
          // Fetch the complete data with user info
          const { data, error } = await supabase
            .from('shoutouts')
            .select(`
              *,
              profiles:user_id (*)
            `)
            .eq('id', payload.new.id)
            .single();
            
          if (error || !data) return;
          
          // Get username from user metadata or provide a fallback
          const usernameToUse = username || 
            data.profiles.user_id?.substring(0, 8) || 
            'user';
          
          const newPost = {
            id: data.id,
            content: data.content,
            createdAt: data.created_at,
            likes: 0,
            reposts: 0,
            replies: 0,
            views: 0,
            userId: data.user_id,
            images: data.media,
            user: {
              id: data.profiles.id,
              name: data.profiles.full_name || 'User',
              username: usernameToUse,
              avatar: data.profiles.avatar_url || 'https://i.pravatar.cc/150?img=1',
              verified: false,
              followers: 0,
              following: 0,
            }
          };
          
          setFeedPosts(prev => [newPost, ...prev]);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [username]); // Add username as a dependency
  
  const handlePostCreated = (content: string, media?: {type: string, url: string}[]) => {
    if (!user) return;
    
    // Create a new post in Supabase
    const createPost = async () => {
      try {
        const { data, error } = await supabase
          .from('shoutouts')
          .insert({
            content,
            user_id: user.id,
            media: media || null
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // The real-time subscription will handle adding this to the UI
      } catch (error) {
        console.error('Error creating post:', error);
      }
    };
    
    createPost();
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md">
        <div className="flex justify-between items-center px-4 py-3">
          <h1 className="text-xl font-bold">Home</h1>
          <div className="flex items-center">
            <button 
              className="p-2 mr-2 rounded-full hover:bg-xExtraLightGray/50 transition-colors text-xs font-medium"
              onClick={() => setFeedView(feedView === 'swipeable' ? 'list' : 'swipeable')}
            >
              {feedView === 'swipeable' ? 'Switch to List View' : 'Switch to Swipe View'}
            </button>
            <button className="p-2 rounded-full hover:bg-xExtraLightGray/50 transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>
        
        {/* Tabs - Removed Following tab, keeping only "For You" title with styling */}
        <div className="flex border-b border-xExtraLightGray">
          <div className="flex-1 py-4 font-bold text-center relative">
            For you
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-xBlue rounded-full" />
          </div>
        </div>
      </div>
      
      {/* Removed CreatePost component from here */}
      
      {/* Loading State */}
      {loading && (
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
      )}
      
      {/* Posts */}
      {!loading && (
        feedView === 'swipeable' ? (
          <SwipeablePostView posts={feedPosts} />
        ) : (
          <PostList posts={feedPosts} />
        )
      )}
    </AppLayout>
  );
};

export default Index;
