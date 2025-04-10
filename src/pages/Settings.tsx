
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { X, Plus } from 'lucide-react';
import { Input } from "@/components/ui/input";

const Settings = () => {
  const [profile, setProfile] = useState<{
    full_name: string | null;
    avatar_url: string | null;
    email_notifications_enabled: boolean | null;
    programming_languages: string[] | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const [newLanguage, setNewLanguage] = useState('');
  const [savingLanguages, setSavingLanguages] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

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

        // Ensure email notifications are always enabled
        let profileData = data || { 
          full_name: null, 
          avatar_url: null, 
          email_notifications_enabled: true, 
          programming_languages: [] 
        };

        // Force email_notifications_enabled to true
        profileData.email_notifications_enabled = true;
        
        setProfile(profileData);

        // If user's setting was false, update it to true in the database
        if (data && data.email_notifications_enabled === false) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ email_notifications_enabled: true })
            .eq('user_id', user.id);
            
          if (updateError) {
            console.error('Error updating email notification settings:', updateError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  const handleAddLanguage = () => {
    if (!newLanguage.trim()) return;
    
    const updatedLanguages = [...(profile?.programming_languages || [])];
    if (!updatedLanguages.includes(newLanguage.trim())) {
      updatedLanguages.push(newLanguage.trim());
      
      setProfile(prev => prev ? { ...prev, programming_languages: updatedLanguages } : null);
      
      saveLanguages(updatedLanguages);
    }
    
    setNewLanguage('');
    setLanguageDialogOpen(false);
  };
  
  const handleRemoveLanguage = (language: string) => {
    const updatedLanguages = (profile?.programming_languages || []).filter(lang => lang !== language);
    
    setProfile(prev => prev ? { ...prev, programming_languages: updatedLanguages } : null);
    
    saveLanguages(updatedLanguages);
  };
  
  const saveLanguages = async (languages: string[]) => {
    if (!user) return;
    
    setSavingLanguages(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ programming_languages: languages })
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      toast({
        title: "Languages Updated",
        description: "Your programming languages have been updated",
      });
    } catch (error) {
      console.error('Error updating programming languages:', error);
      toast({
        title: "Error",
        description: "Failed to update programming languages",
        variant: "destructive"
      });
    } finally {
      setSavingLanguages(false);
    }
  };

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
            <div>
              <h3 className="font-medium">Email Notifications</h3>
              <p className="text-sm text-muted-foreground">
                You will receive email notifications when users post about programming languages you know
              </p>
              {user?.email ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Notifications will be sent to: {user.email}
                </p>
              ) : (
                <p className="text-xs text-red-500 mt-1">
                  No email address found. Please add an email to receive notifications.
                </p>
              )}
              <div className="mt-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Always enabled
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg border p-4">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Programming Languages</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLanguageDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Language
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                You'll receive notifications about posts mentioning these languages
              </p>
              
              <div className="flex flex-wrap gap-2">
                {profile?.programming_languages?.length ? (
                  profile.programming_languages.map((language) => (
                    <Badge key={language} variant="secondary" className="px-3 py-1 group flex items-center gap-1">
                      {language}
                      <button 
                        onClick={() => handleRemoveLanguage(language)}
                        className="ml-1 text-gray-500 hover:text-red-500 opacity-70 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No programming languages selected. Add languages to receive relevant notifications.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Dialog open={languageDialogOpen} onOpenChange={setLanguageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Programming Language</DialogTitle>
            <DialogDescription>
              Add a programming language you're interested in to receive notifications about relevant posts.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g. JavaScript, Python, Rust"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddLanguage();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLanguageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLanguage} disabled={!newLanguage.trim() || savingLanguages}>
              {savingLanguages ? "Adding..." : "Add Language"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Settings;
