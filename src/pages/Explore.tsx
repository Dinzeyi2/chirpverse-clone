
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import SwipeablePostView from '@/components/feed/SwipeablePostView';
import { Search, ArrowLeft, Loader2 } from 'lucide-react';
import { Post, MediaItem } from '@/lib/data';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PostList from '@/components/feed/PostList';

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('for-you');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showingTopicView, setShowingTopicView] = useState(false);
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const getRelatedPosts = (topicName: string): Post[] => {
    return [
      {
        id: `${topicName}-1`,
        content: `Amazing new developments about ${topicName} today! #trending`,
        createdAt: new Date().toISOString(),
        likes: 1200,
        reposts: 450,
        replies: 89,
        views: 14500,
        userId: 'user1',
        user: {
          id: 'user1',
          username: 'johndoe',
          email: 'john@example.com',
          avatar: 'https://i.pravatar.cc/150?img=1',
          verified: true,
          name: 'John Doe',
          followers: 5000,
          following: 750
        }
      },
      {
        id: `${topicName}-2`,
        content: `Just saw the latest on ${topicName} and I'm impressed! What do you all think?`,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        likes: 850,
        reposts: 210,
        replies: 45,
        views: 9200,
        userId: 'user2',
        user: {
          id: 'user2',
          username: 'janesmith',
          email: 'jane@example.com',
          avatar: 'https://i.pravatar.cc/150?img=2',
          verified: false,
          name: 'Jane Smith',
          followers: 3200,
          following: 420
        }
      },
      {
        id: `${topicName}-3`,
        content: `Breaking: New information on ${topicName} just dropped. This changes everything!`,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        likes: 1500,
        reposts: 730,
        replies: 112,
        views: 19800,
        userId: 'user3',
        user: {
          id: 'user3',
          username: 'markwilson',
          email: 'mark@example.com',
          avatar: 'https://i.pravatar.cc/150?img=3',
          verified: true,
          name: 'Mark Wilson',
          followers: 12000,
          following: 350
        }
      },
      {
        id: `${topicName}-4`,
        content: `My thoughts on ${topicName} after a week of research. Thread 🧵`,
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        likes: 2200,
        reposts: 1100,
        replies: 205,
        views: 32500,
        userId: 'user4',
        user: {
          id: 'user4',
          username: 'sarahj',
          email: 'sarah@example.com',
          avatar: 'https://i.pravatar.cc/150?img=4',
          verified: true,
          name: 'Sarah Johnson',
          followers: 25000,
          following: 410
        }
      },
      {
        id: `${topicName}-5`,
        content: `I can't believe what's happening with ${topicName} right now. Anyone else following this?`,
        createdAt: new Date(Date.now() - 14400000).toISOString(),
        likes: 970,
        reposts: 320,
        replies: 78,
        views: 11200,
        userId: 'user5',
        user: {
          id: 'user5',
          username: 'alexthompson',
          email: 'alex@example.com',
          avatar: 'https://i.pravatar.cc/150?img=5',
          verified: false,
          name: 'Alex Thompson',
          followers: 4800,
          following: 650
        }
      }
    ];
  };
  
  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic);
    setShowingTopicView(true);
    setShowSearchResults(false);
  };

  const handleBackToTopics = () => {
    setShowingTopicView(false);
    setSelectedTopic(null);
    setShowSearchResults(false);
  };

  const handleBackToSearch = () => {
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchResults(true);
    
    try {
      // Search for posts containing the search query in their content
      const { data: postsData, error: postsError } = await supabase
        .from('shoutouts')
        .select('id, content, created_at, user_id, media, metadata')
        .ilike('content', `%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (postsError) throw postsError;
      
      if (postsData && postsData.length > 0) {
        // Format the posts data
        const formattedPosts: Post[] = postsData.map(post => {
          const metadata = post.metadata && typeof post.metadata === 'object' ? 
            post.metadata : {};
          const displayUsername = typeof metadata === 'object' && 'display_username' in metadata ? 
            String(metadata.display_username) : 
            (post.user_id ? post.user_id.substring(0, 8) : 'user');
          
          // Safely handle media
          let formattedMedia: Array<string | MediaItem> = [];
          if (post.media && Array.isArray(post.media)) {
            formattedMedia = post.media.map(item => {
              if (typeof item === 'string') {
                return item;
              } else if (item && typeof item === 'object' && 'url' in item) {
                return {
                  type: 'type' in item ? String(item.type) : 'unknown',
                  url: String(item.url) || ''
                };
              }
              return '';
            }).filter(Boolean);
          }
          
          return {
            id: post.id,
            content: post.content,
            createdAt: post.created_at,
            likes: 0,
            replies: 0,
            reposts: 0,
            views: 0,
            userId: post.user_id,
            images: formattedMedia,
            metadata: metadata,
            user: {
              id: post.user_id,
              name: displayUsername,
              username: displayUsername,
              avatar: "/lovable-uploads/325d2d74-ad68-4607-8fab-66f36f0e087e.png",
              verified: false,
              email: '',
              followers: 0,
              following: 0
            }
          };
        });
        
        setSearchResults(formattedPosts);
      } else {
        // If no exact matches, search for similar posts
        const { data: similarPostsData, error: similarPostsError } = await supabase
          .from('shoutouts')
          .select('id, content, created_at, user_id, media, metadata')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (similarPostsError) throw similarPostsError;
        
        if (similarPostsData && similarPostsData.length > 0) {
          // Format the similar posts data
          const formattedSimilarPosts: Post[] = similarPostsData.map(post => {
            const metadata = post.metadata && typeof post.metadata === 'object' ? 
              post.metadata : {};
            const displayUsername = typeof metadata === 'object' && 'display_username' in metadata ? 
              String(metadata.display_username) : 
              (post.user_id ? post.user_id.substring(0, 8) : 'user');
            
            // Safely handle media
            let formattedMedia: Array<string | MediaItem> = [];
            if (post.media && Array.isArray(post.media)) {
              formattedMedia = post.media.map(item => {
                if (typeof item === 'string') {
                  return item;
                } else if (item && typeof item === 'object' && 'url' in item) {
                  return {
                    type: 'type' in item ? String(item.type) : 'unknown',
                    url: String(item.url) || ''
                  };
                }
                return '';
              }).filter(Boolean);
            }
            
            return {
              id: post.id,
              content: post.content,
              createdAt: post.created_at,
              likes: 0,
              replies: 0,
              reposts: 0,
              views: 0,
              userId: post.user_id,
              images: formattedMedia,
              metadata: metadata,
              user: {
                id: post.user_id,
                name: displayUsername,
                username: displayUsername,
                avatar: "/lovable-uploads/325d2d74-ad68-4607-8fab-66f36f0e087e.png",
                verified: false,
                email: '',
                followers: 0,
                following: 0
              }
            };
          });
          
          setSearchResults(formattedSimilarPosts);
        } else {
          setSearchResults([]);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <AppLayout>
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md pt-0.5">
        <div className="px-4 py-2">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search"
                className="bg-black h-12 pl-10 pr-4 py-2 w-full rounded-full border-none focus:ring-2 focus:ring-xBlue focus:bg-black transition-all text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  type="submit" 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xBlue"
                >
                  {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      
      {showSearchResults ? (
        <div className="pb-4">
          <div className="px-4 py-3 border-b border-xExtraLightGray">
            <button 
              onClick={handleBackToSearch}
              className="flex items-center text-xBlue mb-2"
            >
              <ArrowLeft size={18} className="mr-1" /> Back
            </button>
            <h2 className="font-bold text-xl">Search results</h2>
            <p className="text-sm text-xGray">For "{searchQuery}"</p>
          </div>
          
          {isSearching ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-xBlue" />
            </div>
          ) : searchResults.length > 0 ? (
            <PostList posts={searchResults} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <h2 className="text-xl font-bold mb-2">No results found</h2>
              <p className="text-xGray max-w-sm">
                Try searching for something else or check your spelling.
              </p>
            </div>
          )}
        </div>
      ) : showingTopicView && selectedTopic ? (
        <div className="pb-4">
          <div className="px-4 py-3 border-b border-xExtraLightGray">
            <button 
              onClick={handleBackToTopics}
              className="flex items-center text-xBlue mb-2"
            >
              <ArrowLeft size={18} className="mr-1" /> Back to Topics
            </button>
            <h2 className="font-bold text-xl">{selectedTopic}</h2>
            <p className="text-sm text-xGray">Trending posts about this topic</p>
          </div>
          
          <SwipeablePostView 
            posts={getRelatedPosts(selectedTopic)} 
          />
        </div>
      ) : (
        <div className="pb-4">
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <h2 className="text-xl font-bold mb-2">Search for content</h2>
            <p className="text-xGray max-w-sm">
              Use the search bar above to discover posts and topics.
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Explore;
