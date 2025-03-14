
import React, { useState } from 'react';
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
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  
  // Updated array with Unsplash images and existing avatars
  const platformAvatars = [
    // Unsplash images
    'https://images.unsplash.com/photo-1582562124811-c09040d0a901', // orange and white tabby cat
    'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9', // brown fruit on wooden plate
    'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1', // grey tabby kitten
    'https://images.unsplash.com/photo-1441057206919-63d19fac2369', // two penguins
    'https://images.unsplash.com/photo-1501286353178-1ec881214838', // monkey with banana
    // Original avatars
    '/lovable-uploads/a72f2c4e-2c65-4947-bb68-1e05dfaba4a7.png',
    '/lovable-uploads/9f76599d-59dd-4311-9fb9-4ff1755fd69e.png',
    '/lovable-uploads/65a8cce4-ba15-44b1-b458-1ab068dfce39.png',
    '/lovable-uploads/bca1a3b3-49f1-49c4-937c-1a7a8174f3e0.png',
    'https://i.pravatar.cc/150?img=1',
    'https://i.pravatar.cc/150?img=3',
    'https://i.pravatar.cc/150?img=4',
  ];

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

  const handleAvatarClick = () => {
    if (isCurrentUser) {
      setIsAvatarDialogOpen(true);
    }
  };

  const handleSelectAvatar = (avatarUrl: string) => {
    if (authUser) {
      setProfileData(prev => ({
        ...prev,
        avatar: avatarUrl
      }));
      
      supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', authUser.id)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating avatar:', error);
            toast.error('Failed to update avatar');
          } else {
            toast.success('Profile picture updated');
          }
          setIsAvatarDialogOpen(false);
        });
    }
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
      
      <div className="h-48 bg-black relative">
        <div className="h-full w-full bg-black"></div>
        
        <div className="absolute left-0 right-0 -bottom-16 flex justify-center">
          <div className="relative">
            <Avatar 
              className="w-32 h-32 border-4 border-background cursor-pointer"
              onClick={handleAvatarClick}
            >
              <AvatarImage src={profileData.avatar} alt={profileData.name} />
              <AvatarFallback>{profileData.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {isCurrentUser && (
              <div 
                className="absolute bottom-0 right-0 bg-background p-1.5 rounded-full border border-border cursor-pointer"
                onClick={handleAvatarClick}
              >
                <Camera size={16} />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-4 pb-4 relative mt-20">
        <div className="flex justify-end items-start">
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
        
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center mb-1">
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
          
          <div className="flex mt-3 justify-center flex-wrap">
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
            <div className="h-48 bg-black relative">
              <div className="h-full w-full bg-black"></div>
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
        <DialogContent className="sm:max-w-[500px] p-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold mb-4">Choose a profile picture</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            {platformAvatars.map((avatar, index) => (
              <div 
                key={index}
                className="aspect-square overflow-hidden rounded-full border-2 hover:border-xBlue transition-all cursor-pointer"
                onClick={() => handleSelectAvatar(avatar)}
              >
                <img 
                  src={avatar} 
                  alt={`Avatar option ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          
          <DialogClose className="mt-4 w-full">
            <Button variant="outline" className="w-full">Cancel</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileHeader;
