
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/lib/data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/theme/theme-provider';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ProfileHeaderProps {
  user: User;
  isCurrentUser?: boolean;
  stats?: {
    posts: number;
    replies: number;
    reactions: number;
    bluedify?: number; // Make bluedify optional
  };
  onTabChange?: (value: string) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  user, 
  isCurrentUser = false,
  stats = { posts: 0, replies: 0, reactions: 0, bluedify: 0 },
  onTabChange
}) => {
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const { user: authUser, displayName: authDisplayName } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  
  const getPrivacyName = (userId: string) => {
    if (!userId || userId.length < 4) return "blue";
    const first2 = userId.substring(0, 2);
    const last2 = userId.substring(userId.length - 2);
    return `blue${first2}${last2}`;
  };
  
  const profileDisplayName = getPrivacyName(user.id);
  
  const [profileData, setProfileData] = useState({
    ...user,
    profession: user.profession || ''
  });
  
  const [formData, setFormData] = useState({
    name: user.name || '',
    profession: user.profession || '',
  });
  
  // Fixed profile image URL - using the new uploaded smiley face image
  const standardProfileImage = "/lovable-uploads/5bceb609-e538-4faa-85e7-8ef76f451d95.png";

  const handleFollow = async () => {
    if (!authUser) {
      toast.error('You need to be logged in to follow users');
      return;
    }
    
    setIsFollowing(!isFollowing);
    
    if (!isFollowing) {
      try {
        toast.success(`You are now following @${profileDisplayName}`);
      } catch (error: any) {
        console.error('Error following user:', error);
        setIsFollowing(false);
        toast.error('Failed to follow user');
      }
    } else {
      try {
        toast.info(`You have unfollowed @${profileDisplayName}`);
      } catch (error: any) {
        console.error('Error unfollowing user:', error);
        setIsFollowing(true);
        toast.error('Failed to unfollow user');
      }
    }
  };
  
  const handleBackClick = () => {
    navigate(-1);
  };
  
  const handleEditProfile = () => {
    setFormData({
      name: profileData.name,
      profession: profileData.profession || '',
    });
    setIsDialogOpen(true);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSaveProfile = async () => {
    try {
      if (authUser) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.name,
            profession: formData.profession,
          })
          .eq('id', authUser.id);
          
        if (error) throw error;
      }
      
      setProfileData(prev => ({
        ...prev,
        name: formData.name,
        profession: formData.profession
      }));
      
      toast.success('Profile updated successfully');
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleTabChange = (value: string) => {
    if (onTabChange) {
      onTabChange(value);
    }
  };

  const isLightMode = theme === 'light';

  return (
    <div className="animate-fade-in">
      <div className="relative">
        <div 
          className="absolute top-0 left-0 right-0 h-64 z-0"
          style={{
            backgroundImage: "url('/lovable-uploads/277fe9dc-aa4e-4bea-a5bf-8fc5409a7564.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>
        
        <div className="relative z-10 flex justify-between items-center p-4">
          <button
            onClick={handleBackClick}
            className={cn(
              "p-2 rounded-full transition-colors",
              isLightMode 
                ? "bg-black/60 text-white hover:bg-black/70" 
                : "bg-black/60 text-white hover:bg-black/70"
            )}
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
        
        <div className={cn(
          "relative z-10 mx-0 mt-16 pt-20 rounded-t-3xl shadow-lg overflow-hidden",
          isLightMode ? "bg-lightBeige text-black" : "bg-black text-white"
        )}>
          <div className="flex flex-col items-center mt-[-80px] mb-4">
            <div className="relative">
              <Avatar className={cn(
                "w-40 h-40 border-4",
                isLightMode ? "border-lightBeige" : "border-black"
              )}>
                <AvatarImage 
                  src={standardProfileImage} 
                  alt={profileDisplayName} 
                  className="object-cover" 
                />
                <AvatarFallback>{profileDisplayName.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
          
          <div className="px-6 pb-6 text-center">
            <h1 className="text-xl font-bold mt-2 text-[#4285F4] font-heading tracking-wide">{profileDisplayName}</h1>
            
            <p className={cn(
              "text-sm mt-2 px-6",
              isLightMode ? "text-gray-600" : "text-gray-400"
            )}>
              {profileData.profession || ""}
            </p>
            
            <div className="mt-6 flex justify-center">
              {isCurrentUser ? (
                <></>
              ) : (
                <>
                  <Button
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8 py-1"
                    onClick={handleFollow}
                  >
                    Follow
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(
                      "rounded-full p-2 aspect-square",
                      isLightMode ? "border-gray-300" : "border-gray-700"
                    )}
                  >
                    <MessageCircle size={18} />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[650px] p-0 border-none rounded-2xl">
          <div className="flex justify-between items-center p-4 border-b">
            <div className="flex items-center">
              <DialogClose className="mr-4 p-2 rounded-full hover:bg-xExtraLightGray/50 transition-colors">
                <ArrowLeft size={18} />
              </DialogClose>
              <DialogTitle className="text-xl font-bold">Edit profile</DialogTitle>
            </div>
            <Button 
              onClick={handleSaveProfile}
              className={cn(
                "rounded-full font-bold text-sm px-4",
                isLightMode 
                  ? "bg-blue-500 text-white hover:bg-blue-600" 
                  : "bg-black text-white dark:bg-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
              )}
            >
              Save
            </Button>
          </div>
          
          <ScrollArea className="max-h-[70vh]">
            <div className="p-4 space-y-4 mt-4">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-gray-500 text-sm">Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange}
                  className="border-none bg-gray-100 dark:bg-gray-800 focus-visible:ring-blue-500"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="profession" className="text-gray-500 text-sm">Profession</Label>
                <Input 
                  id="profession" 
                  name="profession" 
                  value={formData.profession} 
                  onChange={handleChange}
                  placeholder="Software Engineer, Designer, etc."
                  className="border-none bg-gray-100 dark:bg-gray-800 focus-visible:ring-blue-500"
                />
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileHeader;
