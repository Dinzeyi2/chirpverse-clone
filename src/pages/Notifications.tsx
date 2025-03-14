
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Bell, AtSign, Heart, Repeat, MessageSquare, ChevronDown, Bookmark, Smile } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

interface NotificationType {
  id: string;
  type: 'like' | 'reply' | 'mention' | 'retweet' | 'bookmark' | 'reaction';
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
}

const Notifications = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch notifications from Supabase
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch notifications from the database
        // We need to explicitly specify the column names to avoid ambiguity
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

        // Transform the data
        const formattedNotifications = data.map(notification => ({
          id: notification.id,
          type: notification.type as 'like' | 'reply' | 'mention' | 'retweet' | 'bookmark' | 'reaction',
          user: {
            name: notification.sender?.full_name || 'Anonymous User',
            username: notification.sender?.user_id?.substring(0, 8) || 'user',
            avatar: notification.sender?.avatar_url || 'https://i.pravatar.cc/150?img=3',
            verified: Math.random() > 0.7, // Random verification for demo
          },
          content: notification.content,
          post: typeof notification.metadata === 'object' && notification.metadata 
                ? (notification.metadata.post_excerpt ? String(notification.metadata.post_excerpt) : undefined)
                : undefined,
          time: formatTimeAgo(new Date(notification.created_at)),
          isRead: notification.is_read,
        }));

        setNotifications(formattedNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up real-time subscription
    const notificationsChannel = supabase
      .channel('notification-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, (payload) => {
        // Handle new notification
        const newNotification = payload.new;
        
        // Fetch user data for the new notification
        supabase
          .from('profiles')
          .select('full_name, user_id, avatar_url')
          .eq('user_id', newNotification.sender_id)
          .single()
          .then(({ data: profile }) => {
            const formattedNotification = {
              id: newNotification.id,
              type: newNotification.type as 'like' | 'reply' | 'mention' | 'retweet' | 'bookmark' | 'reaction',
              user: {
                name: profile?.full_name || 'Anonymous User',
                username: profile?.user_id?.substring(0, 8) || 'user',
                avatar: profile?.avatar_url || 'https://i.pravatar.cc/150?img=3',
                verified: Math.random() > 0.7, // Random verification for demo
              },
              content: newNotification.content,
              post: typeof newNotification.metadata === 'object' && newNotification.metadata 
                    ? (newNotification.metadata.post_excerpt ? String(newNotification.metadata.post_excerpt) : undefined)
                    : undefined,
              time: formatTimeAgo(new Date(newNotification.created_at)),
              isRead: newNotification.is_read,
            };
            
            setNotifications(prev => [formattedNotification, ...prev]);
            toast(`New notification: ${newNotification.content}`);
          });
      })
      .subscribe();

    // Clean up subscription on component unmount
    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  }, []);

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
    return [];
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={16} className="text-red-500" />;
      case 'reply':
        return <MessageSquare size={16} className="text-blue-500" />;
      case 'mention':
        return <AtSign size={16} className="text-blue-500" />;
      case 'retweet':
        return <Repeat size={16} className="text-green-500" />;
      case 'bookmark':
        return <Bookmark size={16} className="text-purple-500" />;
      case 'reaction':
        return <Smile size={16} className="text-yellow-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      // Update local state
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
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Navigate to the post or relevant content
    // This would be implemented based on your app's routing
    toast.info('Viewing notification content');
  };

  return (
    <AppLayout>
      {/* Header - sticky */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md">
        <div className="px-4 py-3 border-b border-xExtraLightGray">
          <h1 className="text-xl font-bold">Notifications</h1>
          
          {/* Tabs - removed Verified and Mentions, keeping only All */}
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
                  getIcon={getNotificationIcon} 
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
  getIcon: (type: string) => JSX.Element;
  onNotificationClick: (notification: NotificationType) => void;
}

const NotificationsList: React.FC<NotificationsListProps> = ({ 
  notifications, 
  getIcon, 
  onNotificationClick 
}) => {
  return (
    <div className="divide-y divide-xExtraLightGray">
      {notifications.map((notification) => (
        <div 
          key={notification.id} 
          className={cn(
            "flex p-4 hover:bg-xExtraLightGray/30 transition-colors cursor-pointer",
            !notification.isRead && "bg-xBlue/5"
          )}
          onClick={() => onNotificationClick(notification)}
        >
          <div className="mr-3 mt-1">
            {getIcon(notification.type)}
          </div>
          <div className="flex-1">
            <div className="flex mb-1">
              <img 
                src={notification.user.avatar} 
                alt={notification.user.name} 
                className="w-10 h-10 rounded-full object-cover mr-3"
              />
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="font-bold">{notification.user.name}</span>
                  {notification.user.verified && (
                    <span className="ml-1 text-xBlue">
                      <svg viewBox="0 0 24 24" aria-label="Verified account" role="img" width="16" height="16" fill="currentColor">
                        <g>
                          <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"></path>
                        </g>
                      </svg>
                    </span>
                  )}
                  <span className="text-xGray ml-1">@{notification.user.username}</span>
                  <span className="text-xGray mx-1">·</span>
                  <span className="text-xGray">{notification.time}</span>
                </div>
                <p className="text-sm">
                  {notification.content}
                </p>
                {notification.post && (
                  <p className="mt-1 text-sm text-xGray">
                    {notification.post}
                  </p>
                )}
              </div>
              <button className="text-xGray hover:text-xDark transition-colors">
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Notifications;
