
import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Bell, AtSign, Heart, Repeat, MessageSquare, ChevronDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';

const Notifications = () => {
  const [activeTab, setActiveTab] = useState('all');
  
  // Sample notification data - in a real app, this would come from an API
  const notifications = [
    { 
      id: 1, 
      type: 'like', 
      user: {
        name: 'Jane Smith',
        username: 'janesmith',
        avatar: 'https://i.pravatar.cc/150?img=5'
      },
      content: 'liked your post',
      post: 'This is an amazing app design! Love how it looks exactly like Twitter/X.',
      time: '2h'
    },
    { 
      id: 2, 
      type: 'retweet', 
      user: {
        name: 'Tom Wilson',
        username: 'tomwilson',
        avatar: 'https://i.pravatar.cc/150?img=8'
      },
      content: 'reposted your post',
      post: 'Just launched my new website!',
      time: '5h'
    },
    { 
      id: 3, 
      type: 'mention', 
      user: {
        name: 'Alex Johnson',
        username: 'alexj',
        avatar: 'https://i.pravatar.cc/150?img=3'
      },
      content: 'mentioned you',
      post: 'Hey @johndoe check out this awesome new feature!',
      time: '1d'
    },
    { 
      id: 4, 
      type: 'reply', 
      user: {
        name: 'Emma Davis',
        username: 'emmad',
        avatar: 'https://i.pravatar.cc/150?img=9'
      },
      content: 'replied to your post',
      post: 'Totally agree with your thoughts on this topic!',
      time: '2d'
    },
    { 
      id: 5, 
      type: 'like', 
      user: {
        name: 'Michael Brown',
        username: 'michaelb',
        avatar: 'https://i.pravatar.cc/150?img=12'
      },
      content: 'liked your post',
      post: 'Here\'s my take on the latest tech trends...',
      time: '3d'
    },
  ];

  const filterNotifications = (type) => {
    if (type === 'all') return notifications;
    if (type === 'mentions') return notifications.filter(n => n.type === 'mention');
    if (type === 'verified') return notifications.filter(n => Math.random() > 0.5); // Just a random selection for demo
    return [];
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart size={16} className="text-red-500" />;
      case 'retweet':
        return <Repeat size={16} className="text-green-500" />;
      case 'mention':
        return <AtSign size={16} className="text-blue-500" />;
      case 'reply':
        return <MessageSquare size={16} className="text-blue-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  return (
    <AppLayout>
      {/* Header - sticky */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md">
        <div className="px-4 py-3 border-b border-xExtraLightGray">
          <h1 className="text-xl font-bold">Notifications</h1>
          
          {/* Tabs */}
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
              <TabsTrigger 
                value="verified" 
                className={cn(
                  "flex-1 rounded-none border-transparent data-[state=active]:border-b-2 data-[state=active]:border-xBlue data-[state=active]:shadow-none pb-3",
                  activeTab === 'verified' ? "font-bold" : "text-xGray"
                )}
              >
                Verified
              </TabsTrigger>
              <TabsTrigger 
                value="mentions" 
                className={cn(
                  "flex-1 rounded-none border-transparent data-[state=active]:border-b-2 data-[state=active]:border-xBlue data-[state=active]:shadow-none pb-3",
                  activeTab === 'mentions' ? "font-bold" : "text-xGray"
                )}
              >
                Mentions
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              <NotificationsList notifications={filterNotifications('all')} getIcon={getNotificationIcon} />
            </TabsContent>
            
            <TabsContent value="verified" className="mt-0">
              <NotificationsList notifications={filterNotifications('verified')} getIcon={getNotificationIcon} />
            </TabsContent>
            
            <TabsContent value="mentions" className="mt-0">
              <NotificationsList notifications={filterNotifications('mentions')} getIcon={getNotificationIcon} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

const NotificationsList = ({ notifications, getIcon }) => {
  return (
    <div className="divide-y divide-xExtraLightGray">
      {notifications.map((notification) => (
        <div key={notification.id} className="flex p-4 hover:bg-xExtraLightGray/30 transition-colors cursor-pointer">
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
                  <span className="text-xGray ml-1">@{notification.user.username}</span>
                  <span className="text-xGray mx-1">·</span>
                  <span className="text-xGray">{notification.time}</span>
                </div>
                <p className="text-sm text-xGray">
                  {notification.content}
                </p>
                <p className="mt-1 text-sm text-xGray">
                  {notification.post}
                </p>
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
