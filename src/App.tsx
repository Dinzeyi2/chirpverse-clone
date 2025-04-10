
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

// Create a new query client with better cache settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes (modern replacement for cacheTime)
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="mb-4">The application encountered an error. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.href = '/'} 
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Go to Homepage
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Domain detection for proper routing
const checkDomain = () => {
  const hostname = window.location.hostname;
  // Log the hostname for debugging
  console.log("Current hostname:", hostname);
  
  // Clear service worker cache if on custom domain
  if (hostname !== "preview--chirpverse-clone.lovable.app" && 
      hostname !== "localhost" && 
      !hostname.includes("lovable.app")) {
    console.log("Custom domain detected:", hostname);
    // Try to clear any problematic caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }
  }
  
  return hostname;
};

const AppContent = () => {
  useEffect(() => {
    // Check current domain
    const currentDomain = checkDomain();
    console.log(`App running on domain: ${currentDomain}`);
    
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
    
    // Add window error handler for debugging
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
    });
    
    // Record successful application load
    console.log("Application successfully loaded at:", new Date().toISOString());
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
