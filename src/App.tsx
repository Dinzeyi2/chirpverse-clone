
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/theme-provider";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
import Bookmarks from "./pages/Bookmarks";
import NotFound from "./pages/NotFound";
import PostPage from "./pages/PostPage";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import ForYou from "./pages/ForYou";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useEffect, Suspense, lazy } from "react";
import { enableRealtimeForTables, supabase } from "./integrations/supabase/client";
import { UrlHandler } from "./components/routing/UrlHandler";
import ErrorBoundary from "./components/error/ErrorBoundary";

// Create a new query client with better performance settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute (increased from 30 seconds)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Avoid refetching when component mounts
      cacheTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Loading component for suspense fallbacks
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div className="h-8 w-8 bg-xBlue rounded-full animate-pulse"></div>
  </div>
);

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
  }, []);

  return (
    <ErrorBoundary>
      {/* UrlHandler component to manage URL normalization and persistence */}
      <UrlHandler />
      
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
        
        {/* Add ForYou route */}
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
    </ErrorBoundary>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <Sonner position="top-center" theme="dark" />
            <Suspense fallback={<LoadingFallback />}>
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </Suspense>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
