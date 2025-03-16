import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, MessageCircle, UserCircle, Heart, Star, ThumbsUp, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/lib/data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/theme/theme-provider';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface ProfileHeaderProps {
  user: User;
  isCurrentUser?: boolean;
  stats?: {
    posts: number;
    replies: number;
    reactions: number;
    bluedify: number;
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
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const { theme } = useTheme();
  
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
    name: user.name,
    profession: user.profession || '',
  });
  
  const [userReactionsCount, setUserReactionsCount] = useState(stats.reactions || 0);
  const [userBludifyCount, setUserBludifyCount] = useState(stats.bluedify || 0);

  useEffect(() => {
    if (user?.id) {
      const reactionsChannel = supabase
        .channel('profile-reactions-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'post_reactions',
            filter: `user_id=eq.${user.id}`
          }, 
          () => {
            fetchUserReactions();
          }
        )
        .subscribe();

      const bludifiesChannel = supabase
        .channel('profile-bludifies-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'post_bludifies',
            filter: `user_id=eq.${user.id}`
          }, 
          () => {
            fetchUserBludifies();
          }
        )
        .subscribe();
        
      fetchUserReactions();
      fetchUserBludifies();
      
      return () => {
        supabase.removeChannel(reactionsChannel);
        supabase.removeChannel(bludifiesChannel);
      };
    }
  }, [user?.id]);
  
  const fetchUserReactions = async () => {
    if (!user?.id) return;
    
    try {
      const { count, error } = await (supabase as any)
        .from('post_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
        
      if (error) throw error;
      if (count !== null) setUserReactionsCount(count);
    } catch (error) {
      console.error('Error fetching user reactions count:', error);
    }
  };
  
  const fetchUserBludifies = async () => {
    if (!user?.id) return;
    
    try {
      const { count, error } = await supabase
        .from('post_bludifies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
        
      if (error) throw error;
      if (count !== null) setUserBludifyCount(count);
    } catch (error) {
      console.error('Error fetching user bludifies count:', error);
    }
  };
  
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
  
  const emojiReactions = [
    { icon: Heart, count: 425 },
    { icon: ThumbsUp, count: 362 },
    { icon: Star, count: 218 },
    { icon: Flame, count: 195 }
  ];

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
            <div 
              className="relative cursor-pointer" 
              onClick={handleProfilePictureClick}
            >
              <Avatar className={cn(
                "w-40 h-40 border-4",
                isLightMode ? "border-lightBeige" : "border-black"
              )}>
                <AvatarImage src={profileData.avatar} alt={profileDisplayName} className="object-cover" />
                <AvatarFallback>{profileDisplayName.charAt(0)}</AvatarFallback>
              </Avatar>
              {isCurrentUser && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
              )}
            </div>
          </div>
          
          <div className="px-6 pb-6 text-center">
            <h1 className={cn(
              "text-xl font-bold mt-2",
              isLightMode ? "text-black" : "text-white"
            )}>{profileDisplayName}</h1>
            
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
            
            <div className="mt-10">
              <div className="flex justify-center gap-4 mb-4">
                <div className={cn(
                  "backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 border",
                  isLightMode 
                    ? "bg-white/80 text-black border-gray-200/50" 
                    : "bg-black border-gray-800/50 text-white"
                )}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center">
                    <MessageCircle size={14} className={isLightMode ? "text-black" : "text-white"} />
                  </div>
                  <span className="text-sm font-medium font-heading tracking-wide">{stats.replies || 0} Replies</span>
                </div>
                
                <div className={cn(
                  "backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 border",
                  isLightMode 
                    ? "bg-white/80 text-black border-gray-200/50" 
                    : "bg-black border-gray-800/50 text-white"
                )}>
                  <div className="flex -space-x-1 mr-1">
                    {emojiReactions.slice(0, 4).map((reaction, index) => (
                      <div key={index} className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
                        <reaction.icon size={10} className="text-white" />
                      </div>
                    ))}
                  </div>
                  <span className="text-sm font-medium font-heading tracking-wide">{userReactionsCount || 0} Reactions</span>
                </div>
                
                <div className={cn(
                  "backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 border",
                  isLightMode 
                    ? "bg-white/80 text-black border-gray-200/50" 
                    : "bg-black border-gray-800/50 text-white"
                )}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center">
                    <Flame size={14} className={isLightMode ? "text-black" : "text-white"} />
                  </div>
                  <span className="text-sm font-medium font-heading tracking-wide">{userBludifyCount || 0} Bluedify</span>
                </div>
              </div>
            </div>
          </div>

          <div className={cn(
            "border-t",
            isLightMode ? "border-gray-200" : "border-gray-800"
          )}>
            <Tabs defaultValue="posts" onValueChange={handleTabChange} className="w-full">
              <TabsList className="w-full grid grid-cols-2 bg-transparent rounded-none h-14">
                <TabsTrigger 
                  value="posts" 
                  className={cn(
                    "rounded-none h-full data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-medium",
                    isLightMode 
                      ? "data-[state=active]:text-black text-gray-600" 
                      : "data-[state=active]:text-white text-gray-400"
                  )}
                >
                  Posts
                </TabsTrigger>
                <TabsTrigger 
                  value="replies" 
                  className={cn(
                    "rounded-none h-full data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-medium",
                    isLightMode 
                      ? "data-[state=active]:text-black text-gray-600" 
                      : "data-[state=active]:text-white text-gray-400"
                  )}
                >
                  Replies
                </TabsTrigger>
              </TabsList>
            </Tabs>
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
