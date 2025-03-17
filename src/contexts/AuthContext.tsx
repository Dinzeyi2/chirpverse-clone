
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

type AuthContextType = {
  session: Session | null;
  user: any | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, username: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  username: string | null;
  displayName: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Function to generate privacy-focused display name
  const generatePrivacyName = (userId: string) => {
    if (!userId || userId.length < 4) return "blue";
    
    // Extract first 2 and last 2 characters from the user ID
    const first2 = userId.substring(0, 2);
    const last2 = userId.substring(userId.length - 2);
    
    return `blue${first2}${last2}`;
  };

  useEffect(() => {
    // Check for active session on initial load
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        // Extract username from user metadata
        if (data.session?.user) {
          const userMeta = data.session.user.user_metadata;
          setUsername(userMeta?.username || userMeta?.preferred_username || null);
          
          // Generate privacy name based on user ID
          setDisplayName(generatePrivacyName(data.session.user.id));
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        // Always set loading to false, even if there's no session
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Extract username from user metadata
      if (session?.user) {
        const userMeta = session.user.user_metadata;
        setUsername(userMeta?.username || userMeta?.preferred_username || null);
        
        // Generate privacy name based on user ID
        setDisplayName(generatePrivacyName(session.user.id));
      } else {
        setUsername(null);
        setDisplayName(null);
      }
      
      // Always set loading to false after auth state changes
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        return { error };
      }
      toast.success('Signed in successfully');
      return { error: null };
    } catch (error: any) {
      toast.error(error.message);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string, username: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            username
          }
        }
      });
      
      if (error) {
        toast.error(error.message);
        return { error };
      }
      
      toast.success('Signed up successfully! Check your email for verification.');
      return { error: null };
    } catch (error: any) {
      toast.error(error.message);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      signIn, 
      signUp, 
      signOut, 
      loading, 
      username,
      displayName 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
