
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
        console.log('User preferred languages:', preferredLanguages);

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
            profiles(id, full_name, avatar_url)
          `)
          .order('created_at', { ascending: false });

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

        console.log('Total posts fetched:', postsData.length);

        // Filter posts by preferred languages (using metadata)
        const filteredPosts = postsData.filter(post => {
          const postMetadata = post.metadata as Record<string, any> || {};
          const postLanguages = postMetadata.languages || [];
          console.log('Post ID:', post.id, 'Languages:', postLanguages);
          
          // Convert everything to lowercase for case-insensitive comparison
          return postLanguages.some((lang: string) => 
            preferredLanguages.some(prefLang => 
              prefLang.toLowerCase() === lang.toLowerCase()
            )
          );
        });

        console.log('Filtered posts count:', filteredPosts.length);

        // Get reactions for the filtered posts
        const postIds = filteredPosts.map(post => post.id);
        
        // Early return if no matching posts
        if (postIds.length === 0) {
          setPosts([]);
          setLoading(false);
          console.log('No posts match your language preferences');
          return;
        }
        
        // Fetch reactions using separate queries instead of JOINs to avoid schema errors
        const likesPromises = postIds.map(postId => 
          supabase
            .from('post_reactions')
            .select('*')
            .eq('post_id', postId.toString()) // Ensure postId is a string
            .eq('emoji', 'like')
        );

        const bookmarksPromises = postIds.map(postId => 
          supabase
            .from('post_reactions')
            .select('*')
            .eq('post_id', postId.toString()) // Ensure postId is a string
            .eq('emoji', 'bookmark')
        );

        const commentsPromises = postIds.map(postId => 
          supabase
            .from('comments')
            .select('count')
            .eq('shoutout_id', postId.toString()) // Fix here: Ensure postId is a string
        );

        // Resolve all promises
        const likesResults = await Promise.all(likesPromises);
        const bookmarksResults = await Promise.all(bookmarksPromises);
        const commentsResults = await Promise.all(commentsPromises);

        // Create maps for likes, bookmarks, and comments counts
        const likesMap = new Map();
        const bookmarksMap = new Map();
        const commentsMap = new Map();
        const userLikedMap = new Map();
        const userBookmarkedMap = new Map();

        // Process likes results
        likesResults.forEach((result, index) => {
          if (!result.error) {
            const postId = postIds[index];
            likesMap.set(postId, result.data.length);
            userLikedMap.set(postId, result.data.some(like => like.user_id === user.id));
          }
        });

        // Process bookmarks results
        bookmarksResults.forEach((result, index) => {
          if (!result.error) {
            const postId = postIds[index];
            bookmarksMap.set(postId, result.data.length);
            userBookmarkedMap.set(postId, result.data.some(bookmark => bookmark.user_id === user.id));
          }
        });

        // Process comments results
        commentsResults.forEach((result, index) => {
          if (!result.error && result.data.length > 0) {
            const postId = postIds[index];
            commentsMap.set(postId, parseInt(result.data[0].count) || 0);
          }
        });

        // Format posts to match the Post interface
        const formattedPosts = filteredPosts.map(post => {
          const postMetadata = post.metadata as Record<string, any> || {};
          const postLanguages = postMetadata.languages || [];
          
          const postId = post.id; // Use the post.id directly, Maps can use any type as keys
          
          return {
            id: postId.toString(), // Ensure id is a string for the Post interface
            content: post.content,
            userId: post.user_id,
            createdAt: post.created_at,
            user: {
              id: post.profiles?.id || '',
              name: post.profiles?.full_name || 'User',
              username: post.user_id?.substring(0, 8) || '', // Required by User type
              email: '', // Required by User type
              avatar: post.profiles?.avatar_url || '',
              verified: false
            },
            images: post.media || [],
            languages: postLanguages,
            likes: likesMap.get(postId) || 0,
            bookmarks: bookmarksMap.get(postId) || 0,
            comments: commentsMap.get(postId) || 0,
            replies: 0, // Required by Post type
            isLiked: userLikedMap.get(postId) || false,
            isBookmarked: userBookmarkedMap.get(postId) || false,
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
        ) : posts.length > 0 ? (
          <SwipeablePostView posts={posts} />
        ) : (
          <div className="p-6 text-center bg-muted rounded-lg">
            <p className="text-lg font-medium mb-2">No matching posts found</p>
            <p className="text-muted-foreground">
              No posts with your preferred programming languages were found. Try adding more languages 
              in your profile settings or check back later.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ForYou;
