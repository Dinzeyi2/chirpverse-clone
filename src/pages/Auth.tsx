
import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { XIcon } from 'lucide-react';
import { toast } from 'sonner';

// Components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SignUpForm from '@/components/auth/SignUpForm';
import SignInForm from '@/components/auth/SignInForm';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // If user is already logged in, redirect to home
  if (session) {
    return <Navigate to="/" />;
  }

  const toggleForm = () => {
    setShowSignUp(!showSignUp);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - X Logo for large screens */}
      <div className="hidden md:flex md:w-[55%] bg-xBlue items-center justify-center">
        <XIcon className="text-white h-80 w-80" />
      </div>
      
      {/* Right side - Auth form */}
      <div className="w-full md:w-[45%] p-6 md:p-10 flex flex-col">
        <div className="mb-8 md:mb-10">
          <XIcon className="md:hidden h-9 w-9 mb-6" />
          <h1 className="text-2xl md:text-5xl font-bold mb-8 md:mb-12">Happening now</h1>
          <h2 className="text-xl md:text-3xl font-bold">
            {showSignUp ? "Create your account" : "Sign in to X"}
          </h2>
        </div>

        {showSignUp ? (
          <SignUpForm loading={loading} setLoading={setLoading} />
        ) : (
          <SignInForm loading={loading} setLoading={setLoading} />
        )}

        <div className="mt-8 border-t border-xExtraLightGray pt-4">
          <p className="text-gray-600 mb-4">
            {showSignUp ? "Already have an account?" : "Don't have an account?"}
          </p>
          <Button 
            variant="outline" 
            onClick={toggleForm} 
            className="w-full md:w-auto rounded-full border-gray-300 text-xBlue hover:bg-xBlue/5 hover:border-gray-300"
          >
            {showSignUp ? "Sign in" : "Sign up"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
