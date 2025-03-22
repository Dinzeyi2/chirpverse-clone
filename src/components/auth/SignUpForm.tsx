
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const SignUpForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  
  // Programming languages list
  const programmingLanguages = [
    "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "C", "PHP", "Go",
    "Ruby", "Swift", "Kotlin", "Rust", "Dart", "Scala", "R", "MATLAB", "Perl",
    "Haskell", "Elixir", "Clojure", "Groovy", "Lua", "Objective-C", "Shell",
    "SQL", "PL/SQL", "Assembly", "Julia", "F#", "COBOL", "Fortran", "Ada",
    "Lisp", "Prolog", "Erlang", "Scheme", "Apex", "SAS", "Crystal", "Hack", 
    "ABAP", "Solidity", "Visual Basic", "Delphi", "Bash", "PowerShell", "VBA",
    "Elm", "OCaml", "Racket", "CoffeeScript", "Tcl", "Verilog", "VHDL", "HTML", 
    "CSS", "SCSS", "Less", "Stylus", "XML", "JSON", "YAML", "Markdown", "LaTeX",
    "ReasonML", "PureScript", "Zig", "WebAssembly", "Ballerina", "Nix", "Raku",
    "Nim", "Io", "Factor", "Q", "APL", "J", "K", "Pony", "Ur", "BlitzBasic",
    "ActionScript", "CFML", "D", "Elm", "Forth", "Haxe", "Idris", "Inform",
    "Rexx", "Xojo", "Logo", "ML", "Smalltalk", "Standard ML", "Vala",
    "Agda", "T-SQL", "Pascal", "Embedded SQL", "MongoDB Query Language", 
    "GraphQL", "React", "Angular", "Vue.js", "Next.js", "Svelte", "jQuery"
  ];

  // All months for the date of birth dropdown
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!name || !email || selectedLanguages.length === 0) {
        setError('Please fill all required fields');
        return;
      }
      
      if (selectedLanguages.length > 5) {
        setError('Please select maximum 5 programming languages');
        return;
      }
      
      setStep(2);
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      if (!password) {
        setError('Please fill all required fields');
        setIsLoading(false);
        return;
      }
      
      // Generate a random username to ensure uniqueness and security
      const randomUsername = `user${Math.random().toString(36).substring(2, 10)}`;
      
      const { error } = await signUp(email, password, name, randomUsername, undefined, undefined, selectedLanguages);
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

  const handleLanguageSelect = (language: string) => {
    if (selectedLanguages.includes(language)) {
      setSelectedLanguages(selectedLanguages.filter(lang => lang !== language));
    } else {
      if (selectedLanguages.length < 5) {
        setSelectedLanguages([...selectedLanguages, language]);
      }
    }
  };

  // Helper function to render required field indicator
  const RequiredIndicator = () => (
    <span className="text-red-500 ml-1">*</span>
  );

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

      <div className="mb-4">
        <p className="text-sm text-gray-400">
          Fields marked with <span className="text-red-500">*</span> are required
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {step === 1 ? (
          <>
            <div>
              <Label htmlFor="name" className="text-white mb-2 block">
                Name <RequiredIndicator />
              </Label>
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
              <Label htmlFor="email" className="text-white mb-2 block">
                Email <RequiredIndicator />
              </Label>
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
              <h3 className="font-bold text-lg text-white">Date of birth <RequiredIndicator /></h3>
              <p className="text-gray-400 text-sm mb-3">
                This will not be shown publicly. Confirm your own age, even if this account is for a business, a pet, or something else.
              </p>
              
              <div className="flex gap-2">
                <select className="w-full px-3 py-3 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-xBlue focus:border-transparent bg-black text-white placeholder-gray-500" required>
                  <option value="">Month</option>
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
                
                <select className="w-full px-3 py-3 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-xBlue focus:border-transparent bg-black text-white placeholder-gray-500" required>
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                
                <select className="w-full px-3 py-3 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-xBlue focus:border-transparent bg-black text-white placeholder-gray-500" required>
                  <option value="">Year</option>
                  {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4">
              <h3 className="font-bold text-lg text-white">Programming Languages <RequiredIndicator /></h3>
              <p className="text-gray-400 text-sm mb-3">
                Select up to 5 programming languages you know or want to learn. This helps us show you relevant content.
              </p>
              
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedLanguages.map(language => (
                  <Badge key={language} variant="secondary" className="px-3 py-1.5">
                    {language}
                    <button 
                      type="button" 
                      className="ml-2 text-gray-400 hover:text-white"
                      onClick={() => handleLanguageSelect(language)}
                    >
                      <X size={14} />
                    </button>
                  </Badge>
                ))}
              </div>
              
              <div className="h-72 overflow-y-auto border border-gray-700 rounded-md p-3 bg-black">
                <div className="grid grid-cols-3 gap-2">
                  {programmingLanguages.map(language => (
                    <Button
                      key={language}
                      type="button"
                      variant={selectedLanguages.includes(language) ? "default" : "outline"}
                      className={`
                        w-full h-10 text-sm font-normal 
                        ${selectedLanguages.includes(language) 
                          ? "bg-xBlue text-white hover:bg-xBlue/90" 
                          : "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"}
                      `}
                      onClick={() => handleLanguageSelect(language)}
                      disabled={selectedLanguages.length >= 5 && !selectedLanguages.includes(language)}
                    >
                      {language}
                    </Button>
                  ))}
                </div>
              </div>
              
              <p className="text-gray-400 text-sm mt-2">
                Selected: {selectedLanguages.length}/5
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="relative">
              <Label htmlFor="password" className="text-white mb-2 block">
                Password <RequiredIndicator />
              </Label>
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
                className="absolute right-3 top-11 transform -translate-y-1/2 text-gray-500"
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

