
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Bookmark, Search, MoreHorizontal, Trash2, BookmarkX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/lib/data';
import PostList from '@/components/feed/PostList';
import { toast } from 'sonner';

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setBookmarks([]);
        setLoading(false);
        return;
      }

      // Fetch bookmarks for the current user
      const { data: bookmarksData, error } = await supabase
        .from('post_bookmarks')
        .select('post_id, created_at')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!bookmarksData || bookmarksData.length === 0) {
        setBookmarks([]);
        setLoading(false);
        return;
      }

      // Extract the post IDs
      const postIds = bookmarksData.map(bookmark => bookmark.post_id);

      // For this example, we'll use the sample data as we don't have a direct API
      // In a real app, you would fetch the actual posts from your API
      // This is just for demonstration purposes
      const sampleData = postIds.map((id, index) => {
        return {
          id: id,
          content: `Bookmarked post #${index + 1}`,
          user: {
            name: 'User Name',
            username: 'username',
            avatar: `https://i.pravatar.cc/150?img=${(index % 10) + 1}`,
            verified: index % 3 === 0
          },
          createdAt: new Date().toISOString(),
          likes: Math.floor(Math.random() * 100),
          replies: Math.floor(Math.random() * 50),
          bookmarked: true,
          images: index % 2 === 0 ? [`https://picsum.photos/500/300?random=${index}`] : []
        };
      });

      setBookmarks(sampleData);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();

    // Subscribe to changes in bookmarks
    const bookmarksSubscription = supabase
      .channel('public:post_bookmarks')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'post_bookmarks' }, 
        () => {
          fetchBookmarks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookmarksSubscription);
    };
  }, []);

  const filteredBookmarks = searchQuery
    ? bookmarks.filter(bookmark => 
        bookmark.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.user.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : bookmarks;

  const clearAllBookmarks = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        toast.error('You must be logged in to remove bookmarks');
        return;
      }

      const { error } = await supabase
        .from('post_bookmarks')
        .delete()
        .eq('user_id', userData.user.id);

      if (error) throw error;
      
      setBookmarks([]);
      toast.success('All bookmarks removed');
    } catch (error) {
      console.error('Error clearing bookmarks:', error);
      toast.error('Failed to clear bookmarks');
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
            {bookmarks.length > 0 && (
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
            )}
          </div>
          
          {/* Search */}
          {bookmarks.length > 0 && (
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
          )}
        </div>
      </div>
      
      {/* Bookmarks list */}
      {loading ? (
        <div className="p-4">
          <div className="animate-pulse">
            {[1, 2, 3].map((item) => (
              <div key={item} className="mb-4 h-24 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      ) : bookmarks.length > 0 ? (
        <div className="divide-y divide-xExtraLightGray">
          <PostList posts={filteredBookmarks} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <BookmarkX size={40} className="text-xGray mb-4" />
          <h2 className="text-2xl font-bold mb-2">No bookmarks yet</h2>
          <p className="text-xGray max-w-sm">
            Save posts for later by clicking the bookmark icon on posts you'd like to revisit.
          </p>
        </div>
      )}
    </AppLayout>
  );
};

export default Bookmarks;
