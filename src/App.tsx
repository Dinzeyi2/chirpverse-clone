
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { enableRealtimeForTables, supabase } from "./integrations/supabase/client";
import { UrlHandler } from "./components/routing/UrlHandler";
import LoadingFallback from "./components/common/LoadingFallback";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { toast } from "sonner";

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
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);

  useEffect(() => {
    // Initialize app with error handling
    const initializeApp = async () => {
      try {
        // Enable realtime updates when the app loads
        enableRealtimeForTables();
        
        // Test connectivity
        console.log("Testing Supabase connectivity...");
        const { data, error } = await supabase.from('shoutouts').select('id').limit(1);
        
        if (error) {
          console.error("Supabase connectivity error:", error);
          setConnectionError(new Error(`Connection error: ${error.message}`));
          toast.error("Unable to connect to the server. Please check your connection.");
        } else {
          console.log("Supabase is connected. Sample data:", data);
          
          // Prefetch critical data
          await queryClient.prefetchQuery({
            queryKey: ['initial-posts'],
            queryFn: async () => {
              const { data } = await supabase.from('shoutouts').select('*').limit(5);
              return data;
            }
          });
          
          // Prefetch routes that are likely to be visited
          if ('connection' in navigator && navigator.connection) {
            // @ts-ignore - connection property exists but TypeScript doesn't know about it
            const effectiveType = navigator.connection.effectiveType;
            
            // Only prefetch on fast connections
            if (effectiveType === '4g') {
              console.log("Prefetching route: /explore");
              import("./pages/Explore");
              console.log("Prefetching route: /for-you");
              import("./pages/ForYou");
            }
          }
        }
      } catch (err) {
        console.error("App initialization error:", err);
        setConnectionError(err instanceof Error ? err : new Error('Unknown initialization error'));
        toast.error("Failed to initialize the application. Please try again.");
      } finally {
        setIsInitialized(true);
      }
    };
    
    initializeApp();
  }, []);

  // Show a dedicated loading state during initialization
  if (!isInitialized) {
    return <LoadingFallback />;
  }

  // Show a specific error message if we have connection issues
  if (connectionError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-black text-white">
        <img 
          src="/lovable-uploads/3466f833-541a-44f1-86a1-5e3f5ed4d8ed.png" 
          alt="iblue logo" 
          className="w-20 h-20 mb-6"
        />
        <h1 className="text-2xl font-bold mb-4">Connection Error</h1>
        <p className="mb-6 max-w-md">We're having trouble connecting to our servers. Please check your internet connection and try again.</p>
        <pre className="text-xs p-4 bg-gray-800 rounded mb-4 overflow-auto max-w-md w-full text-left">
          {connectionError.message}
        </pre>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-xBlue text-white rounded-md flex items-center gap-2 hover:bg-blue-600 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <>
      {/* UrlHandler component to manage URL normalization and persistence */}
      <UrlHandler />
      
      {/* Use Suspense for automatic loading states */}
      <ErrorBoundary>
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
      </ErrorBoundary>
    </>
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
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
