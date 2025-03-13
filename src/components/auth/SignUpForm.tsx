
import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

interface SignUpFormProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ loading, setLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleNextStep = () => {
    if (!name.trim() || !email.trim()) {
      toast.error('Please fill out all fields');
      return;
    }
    setStep(2);
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreeTerms) {
      toast.error('You must agree to the terms to continue');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        }
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Signup successful! Check your email for verification.');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {step === 1 ? (
        <div className="space-y-4">
          <div>
            <Input
              id="name"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-md border px-4 py-2 h-14"
              required
            />
          </div>
          <div>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border px-4 py-2 h-14"
              required
            />
          </div>
          <Button
            onClick={handleNextStep}
            className="w-full rounded-full bg-black hover:bg-gray-800 text-white h-10 mt-4"
            disabled={loading}
          >
            Next
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            Step 2 of 2
          </div>
          <div>
            <Input
              value={name}
              disabled
              className="rounded-md border px-4 py-2 h-14 bg-gray-100"
            />
          </div>
          <div>
            <Input
              value={email}
              disabled
              className="rounded-md border px-4 py-2 h-14 bg-gray-100"
            />
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border px-4 py-2 h-14 pr-10"
              required
            />
            <button
              type="button"
              onClick={toggleShowPassword}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          <div className="flex items-start space-x-2 mt-4">
            <Checkbox
              id="terms"
              checked={agreeTerms}
              onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
              className="mt-1"
            />
            <label
              htmlFor="terms"
              className="text-sm text-gray-600 cursor-pointer"
            >
              I agree to the Terms of Service, Privacy Policy, and Cookie Use.
            </label>
          </div>
          <Button
            type="submit"
            className="w-full rounded-full bg-black hover:bg-gray-800 text-white h-10 mt-4"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign up"}
          </Button>
        </form>
      )}
    </div>
  );
};

export default SignUpForm;
