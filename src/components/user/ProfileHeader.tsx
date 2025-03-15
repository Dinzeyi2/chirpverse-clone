import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, MessageCircle, UserCircle, Grid } from 'lucide-react';
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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
    'https://i.pravatar.cc/150?img=4',
    'https://i.pravatar.cc/150?img=5',
    'https://i.pravatar.cc/150?img=6',
    'https://i.pravatar.cc/150?img=7',
    'https://i.pravatar.cc/150?img=8',
  ];
  
  const galleryImages = [
    'https://images.unsplash.com/photo-1682685797828-d3b2561deef4?q=80&w=2070',
    'https://images.unsplash.com/photo-1682685797661-9e0c87f59c60?q=80&w=2070',
    'https://images.unsplash.com/photo-1498036882173-b41c28a8ba34?q=80&w=2070',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070',
    'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=2070',
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

  const handleProfilePictureClick = () => {
    if (isCurrentUser) {
      setIsAvatarDialogOpen(true);
    }
  };

  const handleSelectAvatar = async (avatarUrl: string) => {
    if (!authUser) return;

    try {
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

  return (
    <div className="animate-fade-in">
      {/* Cream/beige grid pattern background */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-48 bg-[#f0ece1] z-0" 
             style={{
               backgroundImage: `linear-gradient(rgba(240, 236, 225, 0.8) 1px, transparent 1px), 
                                linear-gradient(90deg, rgba(240, 236, 225, 0.8) 1px, #f5f2e9 1px)`,
               backgroundSize: '40px 40px',
               backgroundPosition: '-1px -1px'
             }}>
        </div>
        
        {/* Header with back button and grid button */}
        <div className="relative z-10 flex justify-between items-center p-4">
          <button
            onClick={handleBackClick}
            className="p-2 rounded-full bg-white/70 text-gray-800 hover:bg-white/90 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <button 
            className="p-2 rounded-full bg-white/70 text-gray-800 hover:bg-white/90 transition-colors"
            aria-label="View grid"
          >
            <Grid size={20} />
          </button>
        </div>
        
        {/* Profile picture - positioned to sit on top of the boundary */}
        <div className="relative z-20 flex justify-center">
          <div 
            className="relative cursor-pointer mt-4" 
            onClick={handleProfilePictureClick}
          >
            <Avatar className="w-40 h-40 border-4 border-white dark:border-white">
              <AvatarImage src={profileData.avatar} alt={profileData.name} className="object-cover" />
              <AvatarFallback>{profileData.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {isCurrentUser && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </div>
            )}
          </div>
        </div>
        
        {/* Profile card with dark background - starts lower to accommodate the avatar */}
        <div className="relative z-10 mx-0 mt-20 bg-gray-950 dark:bg-gray-950 shadow-lg overflow-hidden">
          {/* Profile info */}
          <div className="px-6 pt-6 pb-6 text-center">
            <h1 className="text-xl font-bold mt-2 text-white">{profileData.name}</h1>
            
            <p className="text-gray-400 text-sm mt-2 px-6">
              {profileData.bio || "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
            </p>
            
            <div className="mt-6 flex justify-center gap-2">
              {isCurrentUser ? (
                <Button
                  variant="outline"
                  onClick={handleEditProfile}
                  className="rounded-full px-8 py-2 text-white bg-transparent border-gray-700 hover:bg-gray-800"
                >
                  Edit profile
                </Button>
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
                    className="rounded-full p-2 aspect-square border-gray-300 dark:border-gray-700"
                  >
                    <MessageCircle size={18} />
                  </Button>
                </>
              )}
            </div>
            
            {/* Stats section */}
            <div className="mt-10">
              <h2 className="font-bold text-left mb-4 text-white">Friends</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col items-center bg-gray-800 dark:bg-gray-800 rounded-xl p-4">
                  <span className="text-2xl font-bold text-white">10K</span>
                  <span className="text-gray-400 text-sm">Likes</span>
                </div>
                <div className="flex flex-col items-center bg-gray-800 dark:bg-gray-800 rounded-xl p-4">
                  <span className="text-2xl font-bold text-white">528</span>
                  <span className="text-gray-400 text-sm">Following</span>
                </div>
                <div className="flex flex-col items-center bg-gray-800 dark:bg-gray-800 rounded-xl p-4">
                  <span className="text-2xl font-bold text-white">1.2K</span>
                  <span className="text-gray-400 text-sm">Followers</span>
                </div>
                <div className="flex flex-col items-center bg-gray-800 dark:bg-gray-800 rounded-xl p-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Avatar key={i} className="w-8 h-8 border-2 border-gray-800 dark:border-gray-800">
                        <AvatarImage src={`https://i.pravatar.cc/150?img=${i}`} alt="Friend" />
                        <AvatarFallback>F{i}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-gray-400 text-sm mt-1">Gallery</span>
                </div>
              </div>
              
              {/* Gallery grid */}
              <div className="grid grid-cols-2 gap-2">
                {galleryImages.map((image, index) => (
                  <div 
                    key={index} 
                    className={`overflow-hidden rounded-xl ${index >= 4 ? 'hidden md:block' : ''}`}
                    style={{aspectRatio: '1'}}
                  >
                    <img 
                      src={image} 
                      alt={`Gallery image ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit profile dialog */}
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
              className="rounded-full font-bold text-sm px-4 bg-black text-white dark:bg-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
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
              
              <div className="space-y-1 mb-6">
                <Label htmlFor="bio" className="text-gray-500 text-sm">Bio</Label>
                <Textarea 
                  id="bio" 
                  name="bio" 
                  value={formData.bio} 
                  onChange={handleChange}
                  className="border-none bg-gray-100 dark:bg-gray-800 focus-visible:ring-blue-500 resize-none h-24"
                />
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Avatar selection dialog */}
      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-6 rounded-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold">Choose your profile picture</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-4 gap-4">
            {platformAvatars.map((avatar, index) => (
              <button
                key={index}
                className="relative rounded-full overflow-hidden transition-all hover:ring-2 hover:ring-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                onClick={() => handleSelectAvatar(avatar)}
              >
                <img
                  src={avatar}
                  alt={`Avatar option ${index + 1}`}
                  className="w-20 h-20 object-cover"
                />
                {avatar === profileData.avatar && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-white">✓</div>
                  </div>
                )}
              </button>
            ))}
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
