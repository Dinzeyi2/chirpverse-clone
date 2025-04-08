import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePushNotifications } from '@/hooks/use-push-notifications';

const Settings = () => {
  const [profile, setProfile] = useState<{
    full_name: string | null;
    avatar_url: string | null;
    email_notifications_enabled: boolean | null;
    programming_languages: string[] | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const pushNotifications = usePushNotifications();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, email_notifications_enabled, programming_languages')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: "Error",
            description: "Failed to load profile settings",
            variant: "destructive"
          });
        }

        setProfile(data || { full_name: null, avatar_url: null, email_notifications_enabled: null, programming_languages: null });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Settings</h1>
          <p>Loading settings...</p>
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Settings</h1>
          <p>No profile found. Please create one.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Notification Settings</h2>
          
          <div className="bg-card rounded-lg border p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Email Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications when users post about programming languages you know
                </p>
              </div>
              <Switch 
                checked={profile?.email_notifications_enabled || false}
                onCheckedChange={async (checked) => {
                  try {
                    const { error } = await supabase
                      .from('profiles')
                      .update({ email_notifications_enabled: checked })
                      .eq('user_id', user.id);
                      
                    if (error) throw error;
                    
                    setProfile(prev => prev ? { ...prev, email_notifications_enabled: checked } : null);
                    
                    toast({
                      title: checked ? "Email Notifications Enabled" : "Email Notifications Disabled",
                      description: checked 
                        ? "You'll receive email notifications for relevant activity" 
                        : "You won't receive email notifications anymore",
                    });
                  } catch (error) {
                    console.error('Error updating email notification settings:', error);
                    toast({
                      title: "Error",
                      description: "Failed to update notification settings",
                      variant: "destructive"
                    });
                  }
                }}
                aria-label="Toggle email notifications"
              />
            </div>
          </div>
          
          <div className="bg-card rounded-lg border p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Push Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive browser push notifications for new activity
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={async () => {
                  if (pushNotifications.subscribed) {
                    await pushNotifications.unsubscribeFromPushNotifications();
                  } else {
                    await pushNotifications.requestPermission();
                  }
                }}
              >
                {pushNotifications.subscribed ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>
          
          <div className="bg-card rounded-lg border p-4">
            <div className="flex flex-col gap-4">
              <h3 className="font-medium">Programming Languages</h3>
              <p className="text-sm text-muted-foreground">
                You'll receive notifications about posts mentioning these languages
              </p>
              
              <div className="flex flex-wrap gap-2">
                {profile?.programming_languages?.map((language) => (
                  <Badge key={language} variant="secondary" className="px-3 py-1">
                    {language}
                  </Badge>
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={() => {
                  // Open programming languages editor
                }}
                size="sm"
              >
                Edit Languages
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
