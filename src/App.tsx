
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { enableRealtimeForTables, supabase } from "./integrations/supabase/client";
import { UrlHandler } from "./components/routing/UrlHandler";
import LoadingFallback from "./components/common/LoadingFallback";

// Use React lazy loading for all page components
const Index = lazy(() => import("./pages/Index"));
const Profile = lazy(() => import("./pages/Profile"));
const Explore = lazy(() => import("./pages/Explore"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PostPage = lazy(() => import("./pages/PostPage"));
const Auth = lazy(() => import("./pages/Auth"));
const Settings = lazy(() => import("./pages/Settings"));
const ForYou = lazy(() => import("./pages/ForYou"));

// Create a new query client with better cache settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false
      // Removed the 'suspense: true' property that was causing the error
    }
  }
});

const AppContent = () => {
  useEffect(() => {
    // Enable realtime updates when the app loads
    enableRealtimeForTables();
    
    // Test connectivity
    const testRealtime = async () => {
      try {
        console.log("Testing Supabase connectivity...");
        const { data, error } = await supabase.from('shoutouts').select('id').limit(1);
        if (error) {
          console.error("Supabase connectivity error:", error);
        } else {
          console.log("Supabase is connected. Sample data:", data);
        }
      } catch (err) {
        console.error("Supabase connection test failed:", err);
      }
    };
    
    testRealtime();
    
    // Prefetch critical data
    queryClient.prefetchQuery({
      queryKey: ['initial-posts'],
      queryFn: async () => {
        const { data } = await supabase.from('shoutouts').select('*').limit(5);
        return data;
      }
    });
  }, []);

  return (
    <>
      {/* UrlHandler component to manage URL normalization and persistence */}
      <UrlHandler />
      
      {/* Use Suspense for automatic loading states */}
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          
          {/* Public routes (accessible without login) */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/explore" 
            element={
              <ProtectedRoute>
                <Explore />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/post/:postId" 
            element={
              <ProtectedRoute>
                <PostPage />
              </ProtectedRoute>
            } 
          />
          
          {/* ForYou route */}
          <Route 
            path="/for-you" 
            element={
              <ProtectedRoute>
                <ForYou />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected routes (require login) */}
          <Route 
            path="/profile/:userId?" 
            element={
              <ProtectedRoute requireAuth={true}>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute requireAuth={true}>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bookmarks" 
            element={
              <ProtectedRoute requireAuth={true}>
                <Bookmarks />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute requireAuth={true}>
                <Settings />
              </ProtectedRoute>
            } 
          />
          
          {/* UUID routes - catch all patterns and redirect through UrlHandler */}
          <Route path="/:uuid" element={<NotFound />} />
          <Route path="/p/:uuid" element={<NotFound />} />
          <Route path="/posts/:uuid" element={<NotFound />} />
          
          {/* Catch-all 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-center" theme="dark" />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
