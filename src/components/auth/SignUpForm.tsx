import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SignUpForm = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!name || !email) {
        setError('Please fill all required fields');
        return;
      }
      setStep(2);
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, name, username);
      if (error) {
        setError(error.message);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-900/50 border border-red-700 rounded-md flex items-center text-red-400 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-gray-400 hover:text-gray-300">
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {step === 1 ? (
          <>
            <div>
              <Input
                id="name"
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-3 border border-gray-700 bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-xBlue focus:border-transparent placeholder-gray-500"
              />
            </div>

            <div>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-3 border border-gray-700 bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-xBlue focus:border-transparent placeholder-gray-500"
              />
            </div>

            <div className="pt-4">
              <h3 className="font-bold text-lg text-white">Date of birth</h3>
              <p className="text-gray-400 text-sm mb-3">
                This will not be shown publicly. Confirm your own age, even if this account is for a business, a pet, or something else.
              </p>
              
              <div className="flex gap-2">
                <select className="w-full px-3 py-3 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-xBlue focus:border-transparent bg-black text-white placeholder-gray-500">
                  <option value="">Month</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  {/* Other months */}
                </select>
                
                <select className="w-full px-3 py-3 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-xBlue focus:border-transparent bg-black text-white placeholder-gray-500">
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                
                <select className="w-full px-3 py-3 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-xBlue focus:border-transparent bg-black text-white placeholder-gray-500">
                  <option value="">Year</option>
                  {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <Input
                id="username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-3 border border-gray-700 bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-xBlue focus:border-transparent placeholder-gray-500"
              />
            </div>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-3 border border-gray-700 bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-xBlue focus:border-transparent placeholder-gray-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="text-sm text-gray-400">
              <p>By signing up, you agree to the <a href="#" className="text-xBlue">Terms of Service</a> and <a href="#" className="text-xBlue">Privacy Policy</a>, including <a href="#" className="text-xBlue">Cookie Use</a>.</p>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-white text-black font-bold py-3 px-4 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-xBlue focus:ring-offset-2 focus:ring-offset-black disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {step === 1 ? "Next" : "Sign up"}
            </span>
          ) : (
            step === 1 ? "Next" : "Sign up"
          )}
        </button>

        {step === 2 && (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full mt-2 border border-gray-700 text-white font-bold py-3 px-4 rounded-full hover:bg-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-xBlue focus:ring-offset-2 focus:ring-offset-black"
          >
            Back
          </button>
        )}
      </form>
    </div>
  );
};

export default SignUpForm;
