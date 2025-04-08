
import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import SwipeablePostView from '@/components/feed/SwipeablePostView';
import PostSkeleton from '@/components/feed/PostSkeleton';

const ForYou = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const fetchPosts = async () => {
      try {
        // Get user's preferred programming languages
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('programming_languages')
          .eq('user_id', user.id)
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

        const preferredLanguages = userData?.programming_languages || [];

        if (preferredLanguages.length === 0) {
          toast({
            title: "No language preferences found",
            description: "Add preferred languages in your profile settings to see personalized content",
            duration: 5000
          });
          setLoading(false);
          return;
        }

        // Fetch posts
        const { data: postsData, error: postsError } = await supabase
          .from('shoutouts')
          .select(`
            id,
            content,
            created_at,
            metadata,
            media,
            user_id
          `)
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

        // Filter posts by preferred languages
        const filteredPosts = postsData.filter(post => {
          const postMetadata = post.metadata as Record<string, any> || {};
          const postLanguages = postLanguages = postMetadata.languages || [];
          // Check if any of the post languages match user's preferred languages
          return Array.isArray(postLanguages) && postLanguages.some((lang: string) => 
            preferredLanguages.includes(lang.toLowerCase())
          );
        });

        // If no posts match, return early
        if (filteredPosts.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }

        // Now fetch the user profile information for these posts
        const postUserIds = [...new Set(filteredPosts.map(post => post.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, username, avatar_url')
          .in('user_id', postUserIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        // Create a map of profiles by user_id
        const profilesMap = new Map();
        if (profilesData) {
          profilesData.forEach(profile => {
            profilesMap.set(profile.user_id, profile);
          });
        }

        // Fetch reactions for these posts
        const postIds = filteredPosts.map(post => post.id);
        const { data: reactionsData, error: reactionsError } = await supabase
          .from('post_reactions')
          .select('*')
          .in('post_id', postIds);

        if (reactionsError) {
          console.error('Error fetching reactions:', reactionsError);
        }

        // Create a map of reactions by post_id
        const reactionsMap = new Map();
        if (reactionsData) {
          reactionsData.forEach(reaction => {
            if (!reactionsMap.has(reaction.post_id)) {
              reactionsMap.set(reaction.post_id, []);
            }
            reactionsMap.get(reaction.post_id).push(reaction);
          });
        }

        // Fetch comment counts
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('shoutout_id, count')
          .in('shoutout_id', postIds)
          .select('count(*)')
          .group('shoutout_id');

        if (commentsError) {
          console.error('Error fetching comment counts:', commentsError);
        }

        // Create a map of comment counts by post_id
        const commentsMap = new Map();
        if (commentsData) {
          commentsData.forEach(comment => {
            commentsMap.set(comment.shoutout_id, parseInt(comment.count));
          });
        }

        // Format posts to match the Post interface
        const formattedPosts: Post[] = filteredPosts.map(post => {
          const postReactions = reactionsMap.get(post.id) || [];
          const likes = postReactions.filter(r => r.emoji === 'like').length;
          const bookmarks = postReactions.filter(r => r.emoji === 'bookmark').length;
          const isLiked = postReactions.some(r => r.emoji === 'like' && r.user_id === user.id);
          const isBookmarked = postReactions.some(r => r.emoji === 'bookmark' && r.user_id === user.id);
          const profile = profilesMap.get(post.user_id);
          const postMetadata = post.metadata as Record<string, any> || {};
          
          return {
            id: post.id,
            content: post.content,
            userId: post.user_id,
            createdAt: post.created_at,
            user: {
              id: profile?.id || post.user_id,
              name: profile?.full_name || profile?.username || "User",
              image: profile?.avatar_url,
              username: profile?.username || "user",
              email: "",
              avatar: profile?.avatar_url || "",
              verified: false
            },
            images: post.media || [],
            languages: postMetadata.languages || [],
            likes: likes,
            bookmarks: bookmarks,
            comments: commentsMap.get(post.id) || 0,
            replies: 0,
            isLiked: isLiked,
            isBookmarked: isBookmarked,
          } as Post;
        });

        setPosts(formattedPosts);
        setLoading(false);
      } catch (error) {
        console.error('Error in ForYou page:', error);
        setLoading(false);
      }
    };

    fetchPosts();
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
