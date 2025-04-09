
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/theme-provider";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
import Bookmarks from "./pages/Bookmarks";
import NotFound from "./pages/NotFound";
import PostPage from "./pages/PostPage";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import ForYou from "./pages/ForYou"; // Import the new ForYou page
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useEffect } from "react";
import { enableRealtimeForTables, supabase } from "./integrations/supabase/client";
import { UrlHandler } from "./components/routing/UrlHandler";
import AppLayout from "./components/layout/AppLayout";

// Create a new query client with better cache settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false
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
  }, []);

  return (
    <>
      {/* UrlHandler component to manage URL normalization and persistence */}
      <UrlHandler />
      
      <Routes>
        <Route path="/auth" element={<Auth />} />
        
        {/* Public routes (accessible without login) */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
          <Route path="/post/:postId" element={<ProtectedRoute><PostPage /></ProtectedRoute>} />
          <Route path="/for-you" element={<ProtectedRoute><ForYou /></ProtectedRoute>} />
          
          {/* Protected routes (require login) */}
          <Route path="/profile/:userId?" element={<ProtectedRoute requireAuth={true}><Profile /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute requireAuth={true}><Profile /></ProtectedRoute>} />
          <Route path="/bookmarks" element={<ProtectedRoute requireAuth={true}><Bookmarks /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute requireAuth={true}><Settings /></ProtectedRoute>} />
        </Route>
        
        {/* UUID routes - catch all patterns and redirect through UrlHandler */}
        <Route path="/:uuid" element={<NotFound />} />
        <Route path="/p/:uuid" element={<NotFound />} />
        <Route path="/posts/:uuid" element={<NotFound />} />
        
        {/* Catch-all 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
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
