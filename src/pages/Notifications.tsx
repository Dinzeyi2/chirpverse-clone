import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Bell, ChevronDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";

interface NotificationType {
  id: string;
  type: 'like' | 'reply' | 'mention' | 'retweet' | 'bookmark' | 'reaction' | 'language_mention';
  user: {
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
  };
  content: string;
  post?: string;
  time: string;
  isRead: boolean;
  postId?: string;
}

const Notifications = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const getPostIdFromQueryParams = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('postId');
  };
  
  useEffect(() => {
    const postId = getPostIdFromQueryParams();
    
    if (postId) {
      console.log(`Found postId in query params: ${postId}, will navigate to post`);
      
      const timer = setTimeout(() => {
        navigate(`/post/${postId}`);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    const rememberedPostId = localStorage.getItem('notificationPostId');
    if (rememberedPostId) {
      console.log(`Found remembered postId: ${rememberedPostId}, will navigate to post`);
      
      localStorage.removeItem('notificationPostId');
      
      const timer = setTimeout(() => {
        navigate(`/post/${rememberedPostId}`);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [location.search, navigate]);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select(`
            id, 
            type, 
            content, 
            created_at, 
            is_read,
            metadata,
            sender_id,
            sender:profiles!sender_id (full_name, user_id, avatar_url)
          `)
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const now = new Date();
        localStorage.setItem(`notifications_last_visited_${user.id}`, now.toISOString());

        const unreadNotifications = data.filter(notification => !notification.is_read);
        if (unreadNotifications.length > 0) {
          const unreadIds = unreadNotifications.map(notification => notification.id);
          
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds);
            
          console.log(`Marked ${unreadIds.length} notifications as read`);
        }

        const formattedNotifications = data.map(notification => {
          let postExcerpt: string | undefined = undefined;
          let postId: string | undefined = undefined;
          
          if (notification.metadata && typeof notification.metadata === 'object' && !Array.isArray(notification.metadata)) {
            const metadataObj = notification.metadata as Record<string, any>;
            if (metadataObj.post_excerpt) {
              postExcerpt = String(metadataObj.post_excerpt);
            }
            if (metadataObj.post_id) {
              postId = String(metadataObj.post_id);
            }
          }

          return {
            id: notification.id,
            type: notification.type as 'like' | 'reply' | 'mention' | 'retweet' | 'bookmark' | 'reaction' | 'language_mention',
            user: {
              name: notification.sender?.full_name || 'Anonymous User',
              username: notification.sender?.user_id?.substring(0, 8) || 'user',
              avatar: notification.sender?.avatar_url || 'https://i.pravatar.cc/150?img=3',
              verified: Math.random() > 0.7,
            },
            content: notification.content,
            post: postExcerpt,
            postId: postId,
            time: formatTimeAgo(new Date(notification.created_at)),
            isRead: true,
          };
        });

        setNotifications(formattedNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast({
          title: "Error",
          description: "Failed to load notifications",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    const notificationsChannel = supabase
      .channel('notification-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${user.id}`,
      }, (payload) => {
        const newNotification = payload.new;
        
        supabase
          .from('profiles')
          .select('full_name, user_id, avatar_url')
          .eq('user_id', newNotification.sender_id)
          .single()
          .then(({ data: profile }) => {
            let postExcerpt: string | undefined = undefined;
            let postId: string | undefined = undefined;
            
            if (newNotification.metadata && typeof newNotification.metadata === 'object' && !Array.isArray(newNotification.metadata)) {
              const metadataObj = newNotification.metadata as Record<string, any>;
              if (metadataObj.post_excerpt) {
                postExcerpt = String(metadataObj.post_excerpt);
              }
              if (metadataObj.post_id) {
                postId = String(metadataObj.post_id);
              }
            }

            const formattedNotification = {
              id: newNotification.id,
              type: newNotification.type as 'like' | 'reply' | 'mention' | 'retweet' | 'bookmark' | 'reaction' | 'language_mention',
              user: {
                name: profile?.full_name || 'Anonymous User',
                username: profile?.user_id?.substring(0, 8) || 'user',
                avatar: profile?.avatar_url || 'https://i.pravatar.cc/150?img=3',
                verified: Math.random() > 0.7,
              },
              content: newNotification.content,
              post: postExcerpt,
              postId: postId,
              time: formatTimeAgo(new Date(newNotification.created_at)),
              isRead: false,
            };
            
            setNotifications(prev => [formattedNotification, ...prev]);
            
            toast({
              title: getNotificationTitle(newNotification.type),
              description: `${profile?.full_name || 'Someone'} ${newNotification.content}`,
              action: (
                <a 
                  onClick={() => navigate(postId ? `/post/${postId}` : '/notifications')}
                  className="cursor-pointer bg-blue-500 text-white px-2 py-1 rounded text-xs"
                >
                  View
                </a>
              )
            });
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  }, [user, navigate, location.search]);

  const getNotificationTitle = (type: string): string => {
    switch (type) {
      case 'like':
        return 'New Like';
      case 'reply':
        return 'New Reply';
      case 'mention':
        return 'New Mention';
      case 'retweet':
        return 'New Retweet';
      case 'bookmark':
        return 'New Bookmark';
      case 'reaction':
        return 'New Reaction';
      case 'language_mention':
        return 'Language Mention';
      default:
        return 'New Notification';
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    
    return date.toLocaleDateString();
  };

  const filterNotifications = (type: string) => {
    if (type === 'all') return notifications;
    return notifications.filter(notification => notification.type === type);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification: NotificationType) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    if (notification.postId) {
      navigate(`/post/${notification.postId}`);
    } else {
      toast({
        title: "Notification",
        description: "This notification doesn't link to a specific post"
      });
    }
  };

  return (
    <AppLayout>
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md">
        <div className="px-4 py-3 border-b border-xExtraLightGray">
          <h1 className="text-xl font-bold">Notifications</h1>
          
          <Tabs defaultValue="all" className="mt-2" onValueChange={setActiveTab}>
            <TabsList className="w-full bg-transparent border-b border-xExtraLightGray">
              <TabsTrigger 
                value="all" 
                className={cn(
                  "flex-1 rounded-none border-transparent data-[state=active]:border-b-2 data-[state=active]:border-xBlue data-[state=active]:shadow-none pb-3",
                  activeTab === 'all' ? "font-bold" : "text-xGray"
                )}
              >
                All
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse flex flex-col space-y-4 w-full">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-24 bg-xExtraLightGray/20 rounded-md"></div>
                    ))}
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Bell size={40} className="text-xGray mb-4" />
                  <p className="text-lg font-medium">No notifications yet</p>
                  <p className="text-xGray text-sm mt-1">When someone interacts with your posts, you'll see it here.</p>
                </div>
              ) : (
                <NotificationsList 
                  notifications={filterNotifications('all')} 
                  onNotificationClick={handleNotificationClick}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

interface NotificationsListProps {
  notifications: NotificationType[];
  onNotificationClick: (notification: NotificationType) => void;
}

const NotificationsList: React.FC<NotificationsListProps> = ({ 
  notifications, 
  onNotificationClick 
}) => {
  return (
    <div className="divide-y divide-xExtraLightGray">
      {notifications.map((notification) => (
        <div 
          key={notification.id} 
          className={cn(
            "p-4 hover:bg-xExtraLightGray/30 transition-colors cursor-pointer",
            !notification.isRead && "bg-xBlue/5"
          )}
          onClick={() => onNotificationClick(notification)}
          role="button"
          aria-label={`View notification about ${notification.content}`}
        >
          <Card className="border-0 shadow-none">
            <CardContent className="p-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-xGray">{notification.time}</span>
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    notification.type === 'like' && "bg-red-100 text-red-800",
                    notification.type === 'reply' && "bg-blue-100 text-blue-800",
                    notification.type === 'mention' && "bg-green-100 text-green-800",
                    notification.type === 'retweet' && "bg-purple-100 text-purple-800",
                    notification.type === 'bookmark' && "bg-yellow-100 text-yellow-800",
                    notification.type === 'reaction' && "bg-pink-100 text-pink-800",
                    notification.type === 'language_mention' && "bg-indigo-100 text-indigo-800"
                  )}>
                    {notification.type.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm font-medium">{notification.content}</p>
                {notification.post && (
                  <p className="text-xs text-xGray bg-gray-50 p-2 rounded-md">
                    {notification.post}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};

export default Notifications;
