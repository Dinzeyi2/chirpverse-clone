
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Lock, Bell, Monitor, Globe, Accessibility, AtSign, Users, MessageCircle, Brush, ChevronRight } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const SettingsItem = ({ icon: Icon, title, description, to }: {
  icon: React.ElementType;
  title: string;
  description: string;
  to: string;
}) => (
  <Link to={to} className="w-full">
    <div className="flex items-center justify-between p-4 hover:bg-xSecondary transition-colors">
      <div className="flex items-start gap-3">
        <div className="p-2">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-white font-medium text-lg">{title}</span>
          <span className="text-xGray-dark text-sm">{description}</span>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-xGray-dark" />
    </div>
    <Separator className="bg-xBorder" />
  </Link>
);

const Settings = () => {
  const { user } = useAuth();

  const settingsCategories = [
    {
      icon: User,
      title: 'Your account',
      description: 'See information about your account, change your password',
      to: '/settings/account'
    },
    {
      icon: Lock,
      title: 'Security and account access',
      description: 'Manage your account\'s security and keep track of your account\'s usage',
      to: '/settings/security'
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Select the kinds of notifications you get about your activities, interests',
      to: '/settings/notifications'
    },
    {
      icon: Monitor,
      title: 'Display',
      description: 'Manage your font size, color, and background',
      to: '/settings/display'
    },
    {
      icon: Accessibility,
      title: 'Accessibility, display and languages',
      description: 'Manage how content is displayed to you',
      to: '/settings/accessibility'
    },
    {
      icon: Users,
      title: 'Privacy and safety',
      description: 'Manage what information you see and share on iblue',
      to: '/settings/privacy'
    },
    {
      icon: AtSign,
      title: 'Monetization',
      description: 'Manage your account\'s monetization options',
      to: '/settings/monetization'
    },
    {
      icon: MessageCircle,
      title: 'Additional resources',
      description: 'Check out other places for helpful information',
      to: '/settings/resources'
    }
  ];

  return (
    <AppLayout>
      <div className="bg-black min-h-screen">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md">
            <div className="p-4 flex items-center gap-6">
              <Link to="/" className="text-white">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-bold text-white">Settings</h1>
            </div>
            <Separator className="bg-xBorder" />
          </header>

          {/* User Info */}
          {user && (
            <div className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-full">
                  <img 
                    src={user.avatar_url || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'} 
                    alt={user.username || 'User'} 
                    className="h-full w-full object-cover" 
                  />
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-bold text-white">{user.display_name || user.username}</span>
                  <span className="text-xGray-dark">@{user.username}</span>
                </div>
              </div>
            </div>
          )}

          {/* Settings Categories */}
          <Card className={cn(
            "rounded-none bg-transparent border-none",
            "divide-y divide-xBorder"
          )}>
            {settingsCategories.map((category, index) => (
              <SettingsItem 
                key={index}
                icon={category.icon}
                title={category.title}
                description={category.description}
                to={category.to}
              />
            ))}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
