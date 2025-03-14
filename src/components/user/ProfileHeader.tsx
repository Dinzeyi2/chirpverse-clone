import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, X, Camera, UserCircle, Smile, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/lib/data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProfileHeaderProps {
  user: User;
  isCurrentUser?: boolean;
  stats?: {
    posts: number;
    replies: number;
    reactions: number;
    bluedify: number;
  };
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  user, 
  isCurrentUser = false,
  stats = { posts: 0, replies: 0, reactions: 0, bluedify: 0 }
}) => {
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const { user: authUser } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    ...user,
    profession: user.profession || ''
  });
  const [formData, setFormData] = useState({
    name: user.name,
    bio: user.bio || '',
    profession: user.profession || '',
  });
  
  const platformAvatars = [
    'https://i.pravatar.cc/150?img=1',
    'https://i.pravatar.cc/150?img=2',
    'https://i.pravatar.cc/150?img=3',
    '/lovable-uploads/de7444c4-ade8-4cdc-b7ba-27f567f84ffb.png'
  ];
  
  const [avatarErrors, setAvatarErrors] = useState<{[key: string]: boolean}>({});
  
  useEffect(() => {
    platformAvatars.forEach(avatar => {
      const img = new Image();
      img.onload = () => {
        console.log('Successfully loaded image:', avatar);
      };
      img.onerror = () => {
        console.error('Failed to load image:', avatar);
        setAvatarErrors(prev => ({...prev, [avatar]: true}));
      };
      img.src = avatar;
    });
  }, []);
  
  const coverPhotoInputRef = useRef<HTMLInputElement>(null);

  const handleFollow = async () => {
    if (!authUser) {
      toast.error('You need to be logged in to follow users');
      return;
    }
    
    setIsFollowing(!isFollowing);
    
    if (!isFollowing) {
      try {
        toast.success(`You are now following @${user.username}`);
      } catch (error: any) {
        console.error('Error following user:', error);
        setIsFollowing(false);
        toast.error('Failed to follow user');
      }
    } else {
      try {
        toast.info(`You have unfollowed @${user.username}`);
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
      bio: profileData.bio || '',
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
            description: formData.bio,
            profession: formData.profession,
          })
          .eq('id', authUser.id);
          
        if (error) throw error;
      }
      
      setProfileData(prev => ({
        ...prev,
        name: formData.name,
        bio: formData.bio,
        profession: formData.profession
      }));
      
      toast.success('Profile updated successfully');
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleProfilePictureClick = () => {
    setIsAvatarDialogOpen(true);
  };

  const handleCoverPhotoClick = () => {
    coverPhotoInputRef.current?.click();
  };

  const handleSelectAvatar = async (avatarUrl: string) => {
    if (!authUser) return;

    try {
      console.log('Selected avatar URL:', avatarUrl);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl
        })
        .eq('id', authUser.id);

      if (error) throw error;

      setProfileData(prev => ({
        ...prev,
        avatar: avatarUrl
      }));

      setIsAvatarDialogOpen(false);
      toast.success('Profile picture updated successfully');
    } catch (error: any) {
      console.error('Error updating profile picture:', error);
      toast.error('Failed to update profile picture');
    }
  };

  const handleCoverPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;

    toast.info('Cover photo update feature will be implemented soon');
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center p-4 sticky top-0 z-10 bg-background/90 backdrop-blur-md">
        <button
          onClick={handleBackClick}
          className="mr-6 p-2 rounded-full hover:bg-xExtraLightGray/50 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="font-bold text-xl">{profileData.name}</h2>
          <p className="text-xGray text-sm">{stats.posts + stats.replies} total interactions</p>
        </div>
      </div>
      
      <div className="h-48 bg-xExtraLightGray relative">
        <div className="h-full w-full bg-gradient-to-br from-xBlue/20 to-purple-500/20"></div>
        {isCurrentUser && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button 
              className="p-2 rounded-full bg-black/50 text-white"
              onClick={handleCoverPhotoClick}
              aria-label="Change cover photo"
            >
              <Camera size={20} />
            </button>
            <input
              type="file"
              ref={coverPhotoInputRef}
              onChange={handleCoverPhotoChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        )}
      </div>
      
      <div className="px-4 pb-4 relative">
        <div className="flex justify-between items-start">
          <div className="relative -mt-16">
            <div className="relative">
              <img
                src={profileData.avatar}
                alt={profileData.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-background"
              />
              {isCurrentUser && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button 
                    className="bg-black/60 rounded-full p-2 text-white"
                    aria-label="Change profile picture"
                    onClick={handleProfilePictureClick}
                  >
                    <Camera size={20} />
                  </button>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={coverPhotoInputRef}
              onChange={handleCoverPhotoChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          
          <div className="mt-4">
            {isCurrentUser ? (
              <Button
                variant="outline"
                onClick={handleEditProfile}
                className="font-bold text-sm rounded-full px-4 py-1.5 h-9 bg-background hover:bg-black/5 dark:hover:bg-white/10 border border-gray-300 dark:border-gray-700 transition-colors"
              >
                Edit profile
              </Button>
            ) : (
              <Button
                variant={isFollowing ? 'outline' : 'default'}
                onClick={handleFollow}
                className={cn(
                  "rounded-full font-bold",
                  isFollowing && "hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200"
                )}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center mb-1">
            <h1 className="text-xl font-bold mr-1">{profileData.name}</h1>
            {profileData.verified && (
              <span className="text-xBlue">
                <CheckCircle size={20} className="fill-xBlue text-white" />
              </span>
            )}
          </div>
          
          {profileData.profession && (
            <p className="text-gray-600 dark:text-gray-400 mb-2">{profileData.profession}</p>
          )}
          
          {profileData.bio && <p className="mt-3">{profileData.bio}</p>}
          
          <div className="flex mt-3 flex-wrap">
            <div className="mr-4 hover:underline flex items-center">
              <span className="text-red-500 mr-1">🔥</span>
              <span className="font-bold">{stats.reactions}</span>
            </div>
            <div className="hover:underline flex items-center">
              <img 
                src="/lovable-uploads/574535bb-701a-4bd6-9e65-e462c713c41d.png" 
                alt="Bluedify Bot" 
                className="w-6 h-6 mr-1.5 rounded-full object-cover border border-blue-300"
              />
              <span className="font-bold">{stats.bluedify}</span>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[650px] p-0 border-none rounded-2xl">
          <div className="flex justify-between items-center p-4 border-b">
            <div className="flex items-center">
              <DialogClose className="mr-4 p-2 rounded-full hover:bg-xExtraLightGray/50 transition-colors">
                <X size={18} />
              </DialogClose>
              <DialogTitle className="text-xl font-bold">Edit profile</DialogTitle>
            </div>
            <Button 
              onClick={handleSaveProfile}
              className="rounded-full font-bold text-sm px-4 bg-black text-white dark:bg-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
            >
              Save
            </Button>
          </div>
          
          <ScrollArea className="max-h-[70vh]">
            <div className="h-48 bg-xExtraLightGray relative">
              <div className="h-full w-full bg-gradient-to-br from-xBlue/20 to-purple-500/20"></div>
            </div>
            
            <div className="p-4 space-y-4 mt-4">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xGray text-sm">Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange}
                  className="border-none bg-xExtraLightGray/50 focus-visible:ring-xBlue"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="profession" className="text-xGray text-sm">Profession</Label>
                <Input 
                  id="profession" 
                  name="profession" 
                  value={formData.profession} 
                  onChange={handleChange}
                  placeholder="Software Engineer, Designer, etc."
                  className="border-none bg-xExtraLightGray/50 focus-visible:ring-xBlue"
                />
              </div>
              
              <div className="space-y-1 mb-6">
                <Label htmlFor="bio" className="text-xGray text-sm">Bio</Label>
                <Textarea 
                  id="bio" 
                  name="bio" 
                  value={formData.bio} 
                  onChange={handleChange}
                  className="border-none bg-xExtraLightGray/50 focus-visible:ring-xBlue resize-none h-24"
                />
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-6 rounded-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold">Choose your profile picture</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Select one of the available avatars below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-4">
            {platformAvatars.map((avatar, index) => {
              const isErrorImage = avatarErrors[avatar];
              return (
                <button
                  key={index}
                  className="relative rounded-full overflow-hidden transition-all hover:ring-4 hover:ring-xBlue focus:ring-4 focus:ring-xBlue focus:outline-none w-32 h-32 mx-auto"
                  onClick={() => handleSelectAvatar(avatar)}
                  disabled={isErrorImage}
                >
                  {isErrorImage ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <X className="text-gray-400 h-8 w-8" />
                    </div>
                  ) : (
                    <img
                      src={avatar}
                      alt={`Avatar option ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Error loading avatar image:', avatar);
                        setAvatarErrors(prev => ({...prev, [avatar]: true}));
                      }}
                    />
                  )}
                  {avatar === profileData.avatar && !isErrorImage && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <CheckCircle className="text-white h-8 w-8" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setIsAvatarDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileHeader;
