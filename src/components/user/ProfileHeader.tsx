import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Link as LinkIcon, CheckCircle, X, Camera } from 'lucide-react';
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

interface ProfileHeaderProps {
  user: User;
  isCurrentUser?: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, isCurrentUser = false }) => {
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const { user: authUser } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    bio: user.bio || '',
    location: 'San Francisco, CA',
    website: 'example.com'
  });
  
  const handleFollow = async () => {
    if (!authUser) {
      toast.error('You need to be logged in to follow users');
      return;
    }
    
    setIsFollowing(!isFollowing);
    
    if (!isFollowing) {
      // Follow user logic
      try {
        // The following would be the actual implementation if your Supabase has followers table
        /*
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: authUser.id,
            following_id: user.id
          });
          
        if (error) throw error;
        */
        
        toast.success(`You are now following @${user.username}`);
      } catch (error: any) {
        console.error('Error following user:', error);
        setIsFollowing(false); // Revert UI state
        toast.error('Failed to follow user');
      }
    } else {
      // Unfollow user logic
      try {
        // The following would be the actual implementation if your Supabase has followers table
        /*
        const { error } = await supabase
          .from('followers')
          .delete()
          .match({
            follower_id: authUser.id,
            following_id: user.id
          });
          
        if (error) throw error;
        */
        
        toast.info(`You have unfollowed @${user.username}`);
      } catch (error: any) {
        console.error('Error unfollowing user:', error);
        setIsFollowing(true); // Revert UI state
        toast.error('Failed to unfollow user');
      }
    }
  };
  
  const handleBackClick = () => {
    navigate(-1);
  };
  
  const handleEditProfile = () => {
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
      // The following would be the actual implementation for Supabase
      /*
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.name,
          description: formData.bio,
          // Add other fields as needed
        })
        .eq('id', user.id);
        
      if (error) throw error;
      */
      
      toast.success('Profile updated successfully');
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header with back button */}
      <div className="flex items-center p-4 sticky top-0 z-10 bg-background/90 backdrop-blur-md">
        <button
          onClick={handleBackClick}
          className="mr-6 p-2 rounded-full hover:bg-xExtraLightGray/50 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="font-bold text-xl">{user.name}</h2>
          <p className="text-xGray text-sm">{user.followers.toLocaleString()} followers</p>
        </div>
      </div>
      
      {/* Cover Image */}
      <div className="h-48 bg-xExtraLightGray relative">
        <div className="h-full w-full bg-gradient-to-br from-xBlue/20 to-purple-500/20"></div>
      </div>
      
      {/* Avatar and Follow/Edit Button */}
      <div className="px-4 pb-4 relative">
        <div className="flex justify-between items-start">
          {/* Avatar */}
          <div className="relative -mt-16">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-background"
            />
          </div>
          
          {/* Action Button */}
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
        
        {/* User Info */}
        <div className="mt-4">
          <div className="flex items-center">
            <h1 className="text-xl font-bold mr-1">{user.name}</h1>
            {user.verified && (
              <span className="text-xBlue">
                <CheckCircle size={20} className="fill-xBlue text-white" />
              </span>
            )}
          </div>
          <p className="text-xGray">@{user.username}</p>
          
          {user.bio && <p className="mt-3">{user.bio}</p>}
          
          {/* Additional Info */}
          <div className="flex flex-wrap mt-3 text-xGray">
            <div className="flex items-center mr-4 mb-2">
              <MapPin size={18} className="mr-1" />
              <span>San Francisco, CA</span>
            </div>
            <div className="flex items-center mr-4 mb-2">
              <LinkIcon size={18} className="mr-1" />
              <a href="#" className="text-xBlue hover:underline">example.com</a>
            </div>
            <div className="flex items-center mr-4 mb-2">
              <Calendar size={18} className="mr-1" />
              <span>Joined June 2023</span>
            </div>
          </div>
          
          {/* Followers/Following */}
          <div className="flex mt-3">
            <Link to={`/profile/${user.id}/following`} className="mr-4 hover:underline">
              <span className="font-bold">{user.following.toLocaleString()}</span>
              <span className="text-xGray"> Following</span>
            </Link>
            <Link to={`/profile/${user.id}/followers`} className="hover:underline">
              <span className="font-bold">{user.followers.toLocaleString()}</span>
              <span className="text-xGray"> Followers</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Twitter/X style Edit Profile Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-2xl border-none">
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
          
          {/* Cover Photo */}
          <div className="h-48 bg-xExtraLightGray relative">
            <div className="h-full w-full bg-gradient-to-br from-xBlue/20 to-purple-500/20"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white">
                <Camera size={20} />
              </button>
            </div>
          </div>
          
          {/* Avatar */}
          <div className="px-4 relative">
            <div className="relative -mt-16 mb-6">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-background"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white">
                  <Camera size={20} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Form Fields */}
          <div className="p-4 space-y-4">
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
              <Label htmlFor="bio" className="text-xGray text-sm">Bio</Label>
              <Textarea 
                id="bio" 
                name="bio" 
                value={formData.bio} 
                onChange={handleChange}
                className="border-none bg-xExtraLightGray/50 focus-visible:ring-xBlue resize-none h-24"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="location" className="text-xGray text-sm">Location</Label>
              <Input 
                id="location" 
                name="location" 
                value={formData.location} 
                onChange={handleChange}
                className="border-none bg-xExtraLightGray/50 focus-visible:ring-xBlue"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="website" className="text-xGray text-sm">Website</Label>
              <Input 
                id="website" 
                name="website" 
                value={formData.website} 
                onChange={handleChange}
                className="border-none bg-xExtraLightGray/50 focus-visible:ring-xBlue"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileHeader;
