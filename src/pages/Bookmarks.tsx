
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Bookmark, Search, MoreHorizontal, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import PostCard from '@/components/feed/PostCard';
import { Post } from '@/lib/data';

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch bookmarks from Supabase
  useEffect(() => {
    const fetchBookmarks = async () => {
      setIsLoading(true);
      try {
        // Get bookmarked post IDs
        const { data: bookmarkData, error: bookmarkError } = await supabase
          .from('bookmarks')
          .select('post_id');
        
        if (bookmarkError) {
          console.error('Error fetching bookmarks:', bookmarkError);
          toast.error('Failed to load bookmarks');
          return;
        }

        if (!bookmarkData || bookmarkData.length === 0) {
          setBookmarks([]);
          setIsLoading(false);
          return;
        }

        // Get the post data from the sample data for now
        // In a real application, you would fetch the actual posts from a posts table
        const postIds = bookmarkData.map(bookmark => bookmark.post_id);
        
        // For demo purposes, we'll use the sampleBookmarks and filter by ID
        // This would be replaced with a proper Supabase query in a real app
        import('@/lib/data').then(({ samplePosts }) => {
          const bookmarkedPosts = samplePosts.filter(post => 
            postIds.includes(post.id)
          );
          setBookmarks(bookmarkedPosts);
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Error in bookmark fetching:', error);
        toast.error('An error occurred while loading bookmarks');
        setIsLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  const filteredBookmarks = searchQuery
    ? bookmarks.filter(bookmark => 
        bookmark.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.user?.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : bookmarks;

  const clearAllBookmarks = async () => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .neq('id', '0'); // Fixed: Changed from number to string
      
      if (error) {
        toast.error('Failed to clear bookmarks');
        console.error('Error clearing bookmarks:', error);
      } else {
        setBookmarks([]);
        toast.success('All bookmarks cleared');
      }
    } catch (error) {
      console.error('Error in clearing bookmarks:', error);
      toast.error('An error occurred while clearing bookmarks');
    }
  };

  const removeBookmark = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('post_id', postId);
      
      if (error) {
        toast.error('Failed to remove bookmark');
        console.error('Error removing bookmark:', error);
      } else {
        setBookmarks(bookmarks.filter(bookmark => bookmark.id !== postId));
        toast.success('Bookmark removed');
      }
    } catch (error) {
      console.error('Error in removing bookmark:', error);
      toast.error('An error occurred while removing the bookmark');
    }
  };

  return (
    <AppLayout>
      {/* Header - sticky */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md">
        <div className="px-4 py-3 border-b border-xExtraLightGray">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Bookmarks</h1>
              <p className="text-sm text-xGray">@johndoe</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-xExtraLightGray/50">
                  <MoreHorizontal size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={clearAllBookmarks} className="text-red-500 focus:text-red-500">
                  <Trash2 size={16} className="mr-2" />
                  Clear all Bookmarks
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Search */}
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-xGray" size={16} />
              <Input
                placeholder="Search Bookmarks"
                className="pl-10 bg-xExtraLightGray/50 border-none rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Bookmarks list */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-xBlue" />
          </div>
        ) : filteredBookmarks.length > 0 ? (
          <div className="space-y-4">
            {filteredBookmarks.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Bookmark size={40} className="text-xBlue mb-4" />
            <h2 className="text-2xl font-bold mb-2">Save posts for later</h2>
            <p className="text-xGray max-w-sm">
              Bookmark posts to easily find them again in the future.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Bookmarks;
