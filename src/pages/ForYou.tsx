
import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import SwipeablePostView from '@/components/feed/SwipeablePostView';
import PostSkeleton from '@/components/feed/PostSkeleton';
import { useNavigate } from 'react-router-dom';

const ForYou = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchUserLanguages = async () => {
      try {
        // Get user's preferred programming languages
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('programming_languages')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('Error fetching user languages:', userError);
          toast({
            title: "Couldn't load your preferences",
            description: "We couldn't load your preferred programming languages",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        const preferredLanguages = userData.programming_languages || [];

        if (preferredLanguages.length === 0) {
          toast({
            title: "No language preferences found",
            description: "Add preferred languages in your profile settings to see personalized content",
            duration: 5000
          });
          setLoading(false);
          return;
        }

        // Fetch posts that match user's languages
        const { data: postsData, error: postsError } = await supabase
          .from('shoutouts')
          .select(`
            *,
            profiles:user_id(id, full_name, username, avatar_url),
            reactions:reactions(id, reaction_type, user_id)
          `)
          .overlaps('languages', preferredLanguages)
          .order('created_at', { ascending: false })
          .limit(20);

        if (postsError) {
          console.error('Error fetching posts:', postsError);
          toast({
            title: "Couldn't load posts",
            description: "There was an error loading posts for you",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        const formattedPosts = postsData.map(post => ({
          id: post.id,
          user: {
            id: post.profiles.id,
            name: post.profiles.full_name || post.profiles.username,
            image: post.profiles.avatar_url
          },
          content: post.content,
          images: post.images || [],
          languages: post.languages || [],
          createdAt: new Date(post.created_at),
          likes: post.reactions.filter(r => r.reaction_type === 'like').length,
          bookmarks: post.reactions.filter(r => r.reaction_type === 'bookmark').length,
          comments: post.comment_count || 0,
          isLiked: post.reactions.some(r => r.reaction_type === 'like' && r.user_id === user.id),
          isBookmarked: post.reactions.some(r => r.reaction_type === 'bookmark' && r.user_id === user.id),
        }));

        setPosts(formattedPosts);
        setLoading(false);
      } catch (error) {
        console.error('Error in ForYou page:', error);
        setLoading(false);
      }
    };

    fetchUserLanguages();
  }, [user, toast]);

  return (
    <AppLayout>
      <div className="w-full max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">For You</h1>
        <p className="text-muted-foreground mb-8">
          Posts matching your programming language preferences
        </p>
        
        {loading ? (
          <PostSkeleton count={3} />
        ) : (
          <SwipeablePostView posts={posts} />
        )}
      </div>
    </AppLayout>
  );
};

export default ForYou;
