
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, ChevronRight, Sun, Moon } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/theme-provider';
import { Switch } from '@/components/ui/switch';

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
  const { theme, setTheme } = useTheme();

  const settingsCategories = [
    {
      icon: Users,
      title: 'Privacy and safety',
      description: 'Manage what information you see and share on iblue',
      to: '/settings/privacy'
    }
  ];

  return (
    <AppLayout>
      <div className="bg-black min-h-screen">
        <div className="max-w-3xl mx-auto">
          <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md">
            <div className="p-4 flex items-center gap-6">
              <Link to="/" className="text-white">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-bold text-white">Settings</h1>
            </div>
            <Separator className="bg-xBorder" />
          </header>

          {/* Dark/Light Mode Toggle */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2">
                {theme === 'dark' ? (
                  <Moon className="h-6 w-6 text-white" />
                ) : (
                  <Sun className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-white font-medium text-lg">Theme</span>
                <span className="text-xGray-dark text-sm">Switch between dark and light mode</span>
              </div>
            </div>
            <Switch
              checked={theme === 'light'}
              onCheckedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="data-[state=checked]:bg-white data-[state=unchecked]:bg-xGray-dark"
            />
          </div>
          <Separator className="bg-xBorder" />

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
