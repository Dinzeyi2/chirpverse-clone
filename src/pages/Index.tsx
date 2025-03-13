
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import PostList from '@/components/feed/PostList';
import CreatePost from '@/components/feed/CreatePost';
import { useAuth } from '@/context/AuthContext';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { posts } from '@/lib/data';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-xBlue"></div>
      </div>
    );
  }

  // If user is not authenticated, show landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        {/* Landing Header */}
        <header className="flex justify-between items-center p-4 border-b">
          <XIcon className="h-8 w-8" />
          <div className="space-x-2">
            <Button 
              variant="outline" 
              className="rounded-full border-gray-300 text-xBlue hover:bg-xBlue/5 hover:border-gray-300"
              onClick={() => navigate('/auth')}
            >
              Log in
            </Button>
            <Button 
              className="rounded-full bg-black hover:bg-gray-800 text-white"
              onClick={() => navigate('/auth')}
            >
              Sign up
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2 flex items-center justify-center p-8 md:p-16">
            <XIcon className="h-80 w-80 text-xBlue" />
          </div>
          <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-10">Happening now</h1>
            <h2 className="text-2xl md:text-3xl font-bold mb-8">Join today.</h2>
            <div className="space-y-4 max-w-xs">
              <Button 
                className="w-full rounded-full bg-xBlue hover:bg-xBlue/90 text-white"
                onClick={() => navigate('/auth')}
              >
                Create account
              </Button>
              <p className="text-sm text-gray-500">
                By signing up, you agree to the Terms of Service and Privacy Policy, including Cookie Use.
              </p>
              <div className="mt-8">
                <p className="font-bold mb-2">Already have an account?</p>
                <Button 
                  variant="outline" 
                  className="w-full rounded-full border-gray-300 text-xBlue hover:bg-xBlue/5 hover:border-gray-300"
                  onClick={() => navigate('/auth')}
                >
                  Sign in
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated, show the normal timeline
  return (
    <AppLayout>
      <div className="border-b border-xExtraLightGray px-4 py-3 sticky top-0 bg-white/80 backdrop-blur-sm z-10">
        <h1 className="font-bold text-xl">Home</h1>
      </div>
      
      <CreatePost />
      
      <PostList posts={posts} />
    </AppLayout>
  );
};

export default Index;
