
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

        // Fetch posts with user profile information
        const { data: postsData, error: postsError } = await supabase
          .from('shoutouts')
          .select(`
            id,
            content,
            created_at,
            metadata,
            media,
            user_id,
            profiles(id, full_name, username, avatar_url)
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

        // Filter posts by preferred languages (using metadata)
        const filteredPosts = postsData.filter(post => {
          const postMetadata = post.metadata as Record<string, any> || {};
          const postLanguages = postMetadata.languages || [];
          return postLanguages.some((lang: string) => 
            preferredLanguages.includes(lang.toLowerCase())
          );
        });

        // Get reactions for the filtered posts
        const postIds = filteredPosts.map(post => post.id);
        
        // Early return if no matching posts
        if (postIds.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }
        
        // Fetch reactions
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

        // Get comment counts for posts
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('shoutout_id, count(*)')
          .in('shoutout_id', postIds)
          .groupBy('shoutout_id');

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
        const formattedPosts = filteredPosts.map(post => {
          const postReactions = reactionsMap.get(post.id) || [];
          const likes = postReactions.filter(r => r.emoji === 'like').length;
          const bookmarks = postReactions.filter(r => r.emoji === 'bookmark').length;
          const isLiked = postReactions.some(r => r.emoji === 'like' && r.user_id === user.id);
          const isBookmarked = postReactions.some(r => r.emoji === 'bookmark' && r.user_id === user.id);
          const postMetadata = post.metadata as Record<string, any> || {};
          
          return {
            id: post.id,
            content: post.content,
            userId: post.user_id,
            createdAt: post.created_at,
            user: {
              id: post.profiles?.id,
              name: post.profiles?.full_name || post.profiles?.username,
              image: post.profiles?.avatar_url,
            },
            images: post.media || [],
            languages: postMetadata.languages || [],
            likes: likes,
            bookmarks: bookmarks,
            comments: commentsMap.get(post.id) || 0,
            replies: 0, // Required by Post type
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
