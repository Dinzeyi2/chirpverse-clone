
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
import Notifications from "./pages/Notifications"; 
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useEffect } from "react";
import { enableRealtimeForTables, supabase } from "./integrations/supabase/client";

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

// UUID pattern for validating direct UUID routes
const UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

// Enhanced redirect component that handles all post URL formats
const PostRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname, hash, search } = location;
  
  useEffect(() => {
    // For /p/:uuid or /posts/:uuid or /:uuid paths, extract the UUID
    let uuid = "";
    let redirectPath = "";
    
    // Handle direct UUID path
    if (pathname.length > 30 && pathname.charAt(0) === '/' && UUID_PATTERN.test(pathname.substring(1))) {
      uuid = pathname.substring(1);
      redirectPath = `/post/${uuid}${hash || ''}${search || ''}`;
    } 
    // Handle /p/ or /posts/ format
    else if (pathname.startsWith('/p/') || pathname.startsWith('/posts/')) {
      const parts = pathname.split('/');
      if (parts.length > 2 && UUID_PATTERN.test(parts[2])) {
        uuid = parts[2];
        redirectPath = `/post/${uuid}${hash || ''}${search || ''}`;
      }
    } 
    // Check for UUID anywhere in the path (if no direct match)
    else {
      const uuidMatch = pathname.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
      if (uuidMatch) {
        uuid = uuidMatch[1];
        redirectPath = `/post/${uuid}${hash || ''}${search || ''}`;
      }
    }
    
    if (redirectPath) {
      console.log(`PostRedirect: Redirecting from ${pathname} to ${redirectPath}`);
      navigate(redirectPath, { replace: true });
    }
  }, [pathname, hash, search, navigate]);
  
  // This component will render while the redirect is happening
  return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
};

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
      
      {/* Direct UUID routes - handle all formats with a single component */}
      <Route path="/:uuid" element={<PostRedirect />} />
      <Route path="/p/:uuid" element={<PostRedirect />} />
      <Route path="/posts/:uuid" element={<PostRedirect />} />
      
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
      <Route 
        path="/notifications" 
        element={
          <ProtectedRoute requireAuth={true}>
            <Notifications />
          </ProtectedRoute>
        } 
      />
      
      {/* Catch-all 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
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
