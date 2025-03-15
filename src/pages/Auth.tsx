
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';

const Auth = () => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* iblue Logo */}
      <div className="flex justify-center pt-8 pb-5">
        <span className="text-xBlue font-bold text-3xl tracking-tight">iblue</span>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold">
              {activeTab === 'signin' ? 'Sign in to iblue' : 'Join iblue today'}
            </h1>
          </div>

          {/* Auth Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex border-b border-gray-200">
              <button
                className={`w-1/2 py-4 text-center font-medium relative ${
                  activeTab === 'signin' ? 'text-black' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('signin')}
              >
                Sign in
                {activeTab === 'signin' && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-xBlue rounded-full" />
                )}
              </button>
              <button
                className={`w-1/2 py-4 text-center font-medium relative ${
                  activeTab === 'signup' ? 'text-black' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('signup')}
              >
                Sign up
                {activeTab === 'signup' && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-xBlue rounded-full" />
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
        <p>© 2023 iblue Corp.</p>
      </div>
    </div>
  );
};

export default Auth;
