
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin';
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialTab);
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, show a button to go back to home
  if (user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">You're already signed in</h1>
        <button 
          className="bg-xBlue text-white font-bold py-2 px-4 rounded-full hover:bg-blue-600 transition-colors"
          onClick={() => navigate('/')}
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col text-white">
      {/* iblue Logo */}
      <div className="flex justify-center pt-8 pb-5">
        <img src="/lovable-uploads/550cef80-c9ad-4c13-b56c-c73480dddf87.png" alt="i-blue logo" className="h-16 w-16" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white">
              {activeTab === 'signin' ? 'Sign in to i-blue' : 'Join i-blue today'}
            </h1>
          </div>

          {/* Auth Tabs */}
          <div className="bg-xBlack rounded-lg shadow-md border border-gray-800">
            <div className="flex border-b border-gray-800">
              <button
                className={`w-1/2 py-4 text-center font-medium relative ${
                  activeTab === 'signin' ? 'text-white' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('signin')}
              >
                Sign in
                {activeTab === 'signin' && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-[#4285F4] to-[#8AB4F8] rounded-full" />
                )}
              </button>
              <button
                className={`w-1/2 py-4 text-center font-medium relative ${
                  activeTab === 'signup' ? 'text-white' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('signup')}
              >
                Sign up
                {activeTab === 'signup' && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-[#4285F4] to-[#8AB4F8] rounded-full" />
                )}
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'signin' ? <SignInForm /> : <SignUpForm />}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-xs text-gray-500">
        <p>© 2023 i-blue Corp.</p>
      </div>
    </div>
  );
};

export default Auth;
