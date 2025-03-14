import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PostList from '@/components/feed/PostList';
import SwipeablePostView from '@/components/feed/SwipeablePostView';
import { Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const Index = () => {
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [feedView, setFeedView] = useState<'swipeable' | 'list'>('swipeable');
  const { user, username } = useAuth();
  const [loading, setLoading] = useState(true);
  
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
    
    const channel = supabase
      .channel('public:shoutouts')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'shoutouts'
        }, 
        async (payload) => {
          const { data, error } = await supabase
            .from('shoutouts')
            .select(`
              *,
              profiles:user_id (*)
            `)
            .eq('id', payload.new.id)
            .single();
            
          if (error || !data) return;
          
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
  }, [username]);
  
  const handlePostCreated = (content: string, media?: {type: string, url: string}[]) => {
    if (!user) return;
    
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
      } catch (error) {
        console.error('Error creating post:', error);
      }
    };
    
    createPost();
  };

  return (
    <AppLayout>
      <div className="sticky top-0 z-20 bg-black backdrop-blur-md">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex-1"></div>
          <div className="flex items-center gap-2">
            <button 
              className={cn(
                "p-2 rounded-full transition-colors",
                feedView === 'swipeable' 
                  ? "bg-neutral-800 text-white" 
                  : "hover:bg-neutral-800/50 text-neutral-400"
              )}
              onClick={() => setFeedView('swipeable')}
            >
              <span className="sr-only">Gallery View</span>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
            <button 
              className={cn(
                "p-2 rounded-full transition-colors",
                feedView === 'list' 
                  ? "bg-neutral-800 text-white" 
                  : "hover:bg-neutral-800/50 text-neutral-400"
              )}
              onClick={() => setFeedView('list')}
            >
              <span className="sr-only">List View</span>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-full hover:bg-neutral-800/50 transition-colors">
                  <Settings size={20} />
                  <span className="sr-only">Settings</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.location.href = "/settings"}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = `/profile/${user?.id}`}>
                  My Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {user && (
              <Avatar className="w-8 h-8 cursor-pointer" onClick={() => window.location.href = `/profile/${user?.id}`}>
                <AvatarImage src="https://i.pravatar.cc/150?img=1" alt="Profile" />
                <AvatarFallback>{user.user_metadata?.username?.[0] || user.email?.[0] || 'U'}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </div>
      
      {loading && (
        <div className="p-4 space-y-6 bg-black">
          {[1, 2, 3].map((item) => (
            <div key={item} className="animate-pulse">
              <div className="flex space-x-4">
                <div className="rounded-full bg-gray-800 h-12 w-12"></div>
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-800 rounded"></div>
                    <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                  </div>
                  <div className="h-40 bg-gray-800 rounded"></div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-800 rounded w-1/5"></div>
                    <div className="h-4 bg-gray-800 rounded w-1/5"></div>
                    <div className="h-4 bg-gray-800 rounded w-1/5"></div>
                    <div className="h-4 bg-gray-800 rounded w-1/5"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && (
        <div className="pt-0 bg-black">
          {feedView === 'swipeable' ? (
            <SwipeablePostView posts={feedPosts} />
          ) : (
            <PostList posts={feedPosts} />
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default Index;
