
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const SignInForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-600 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="Phone, email, or username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-xBlue focus:border-transparent placeholder-gray-400"
            />
          </div>
        </div>

        <div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-xBlue focus:border-transparent placeholder-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black text-white font-bold py-3 px-4 rounded-full hover:bg-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-xBlue focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <div className="text-center">
        <Link to="#" className="text-xBlue hover:underline text-sm">
          Forgot password?
        </Link>
      </div>

      <div className="pt-4 text-center">
        <p className="text-gray-600 text-sm">
          Don't have an account?{' '}
          <Link to="/auth?tab=signup" className="text-xBlue hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignInForm;
