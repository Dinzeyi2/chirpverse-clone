
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [programmingLanguages, setProgrammingLanguages] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState('');
  const [notificationsConsent, setNotificationsConsent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        
        setProfile(data);
        setName(data.full_name || '');
        setEmail(data.email || user.email || '');
        setCompany(data.company || '');
        setProgrammingLanguages(data.programming_languages || []);
        
        // Get notifications consent from user metadata
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        const metadata = userData.user?.user_metadata;
        setNotificationsConsent(metadata?.notifications_consent || false);
        
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      // Update profile in the database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: name,
          email: email,
          company: company,
          programming_languages: programmingLanguages,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      if (profileError) throw profileError;
      
      // Update user metadata for notifications consent
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { 
          notifications_consent: notificationsConsent
        }
      });
      
      if (metadataError) throw metadataError;
      
      toast.success('Profile settings saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddLanguage = () => {
    if (languageInput.trim() && !programmingLanguages.includes(languageInput.trim())) {
      setProgrammingLanguages([...programmingLanguages, languageInput.trim()]);
      setLanguageInput('');
    }
  };

  const handleRemoveLanguage = (language: string) => {
    setProgrammingLanguages(programmingLanguages.filter(lang => lang !== language));
  };
  
  const handleTestEmailNotification = async () => {
    if (!user) return;
    
    try {
      setIsTestingNotification(true);
      
      const response = await supabase.functions.invoke('send-email-notification', {
        body: {
          userId: user.id,
          title: 'Test Email Notification',
          body: 'This is a test email notification. If you can see this, email notifications are working correctly!',
          postId: null
        }
      });
      
      if (response.error) throw new Error(response.error.message);
      
      toast.success('Test email notification sent! Check your inbox.');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setIsTestingNotification(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6 max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Your full name" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="Your email address" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input 
                    id="company" 
                    value={company} 
                    onChange={(e) => setCompany(e.target.value)} 
                    placeholder="Your company" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Programming Languages</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={languageInput} 
                      onChange={(e) => setLanguageInput(e.target.value)} 
                      placeholder="Add a programming language" 
                      onKeyDown={(e) => e.key === 'Enter' && handleAddLanguage()}
                    />
                    <Button onClick={handleAddLanguage} type="button">Add</Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {programmingLanguages.map((language) => (
                      <div 
                        key={language} 
                        className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        <span>{language}</span>
                        <button 
                          onClick={() => handleRemoveLanguage(language)}
                          className="text-secondary-foreground/70 hover:text-secondary-foreground"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications" className="block text-base font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Receive notifications about new posts directly to your email
                    </p>
                  </div>
                  <Switch 
                    id="email-notifications"
                    checked={notificationsConsent}
                    onCheckedChange={(checked) => setNotificationsConsent(checked)}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <Label className="block text-base font-medium mb-2">
                    Language Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get notified when new posts mention your selected programming languages
                  </p>
                  
                  {programmingLanguages.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {programmingLanguages.map((language) => (
                        <div 
                          key={language} 
                          className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                        >
                          {language}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-4">
                      No programming languages selected. Add them in the Profile tab.
                    </p>
                  )}
                  
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/settings', { state: { activeTab: 'profile' } })}
                  >
                    Manage Languages
                  </Button>
                </div>
                
                <div className="pt-4">
                  <Button 
                    variant="secondary" 
                    onClick={handleTestEmailNotification} 
                    disabled={isTestingNotification || !notificationsConsent}
                  >
                    {isTestingNotification ? 'Sending...' : 'Send Test Email'}
                  </Button>
                  {!notificationsConsent && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Enable email notifications to send a test email
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input 
                    id="current-password" 
                    type="password" 
                    placeholder="Enter your current password" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    placeholder="Enter your new password" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    placeholder="Confirm your new password" 
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => navigate('/profile')}>
                  View Profile
                </Button>
                <Button>Update Password</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
