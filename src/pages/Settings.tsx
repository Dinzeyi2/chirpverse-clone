
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Lock, Bell, Monitor, Accessibility, 
  Languages, UserPlus, Users, MessageCircle, Brush, AtSign
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

const SettingsItem = ({ 
  icon: Icon, 
  title, 
  description, 
  onClick 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  onClick?: () => void;
}) => (
  <div 
    className="flex items-start gap-4 p-4 hover:bg-accent/50 cursor-pointer transition-colors" 
    onClick={onClick}
  >
    <div className="mt-0.5">
      <Icon size={22} />
    </div>
    <div className="flex-1">
      <h3 className="font-medium text-base">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <div className="text-muted-foreground">
      <ArrowLeft className="rotate-180" size={18} />
    </div>
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const settingsSections = [
    {
      icon: User,
      title: "Your account",
      description: "See information about your account, download your data, or learn about your account deactivation options",
      onClick: () => navigate("/settings/account")
    },
    {
      icon: Lock,
      title: "Security and account access",
      description: "Manage your account's security and keep track of your account's usage including connected apps",
      onClick: () => navigate("/settings/security")
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Select the kinds of notifications you get about your activities and recommendations",
      onClick: () => navigate("/settings/notifications")
    },
    {
      icon: Monitor,
      title: "Accessibility, display, and languages",
      description: "Manage how content is displayed to you",
      onClick: () => navigate("/settings/display")
    },
    {
      icon: UserPlus,
      title: "Privacy and safety",
      description: "Manage what information you see and share on the platform",
      onClick: () => navigate("/settings/privacy")
    },
    {
      icon: Brush,
      title: "Personalization and data",
      description: "Manage your personalization and data settings",
      onClick: () => navigate("/settings/personalization")
    },
    {
      icon: Users,
      title: "Additional resources",
      description: "Check out other places for helpful information to learn more about our products and services",
      onClick: () => navigate("/settings/resources")
    },
    {
      icon: MessageCircle,
      title: "Monetization",
      description: "Learn ways to earn on the platform and manage your monetization options",
      onClick: () => navigate("/settings/monetization")
    }
  ];

  return (
    <AppLayout>
      <div className="container max-w-3xl px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                {user.email?.charAt(0).toUpperCase() || <User size={16} />}
              </div>
              <span className="text-sm font-medium">{user.email?.split('@')[0]}</span>
            </div>
          )}
        </div>

        <Card className="border-none shadow-none">
          <CardContent className="p-0">
            {settingsSections.map((section, index) => (
              <React.Fragment key={section.title}>
                <SettingsItem {...section} />
                {index < settingsSections.length - 1 && (
                  <Separator className="my-0" />
                )}
              </React.Fragment>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Settings;
