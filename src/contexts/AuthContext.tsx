
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Define the profile type
type Profile = {
  id?: string;
  user_id?: string;
  full_name?: string;
  avatar_url?: string;
  field?: string;
  company?: string;
  // Add other profile fields as needed
};

type AuthContextType = {
  session: Session | null;
  user: any | null;
  profile: Profile | null; // Add profile to the context type
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, username: string, field?: string, company?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  username: string | null;
  displayName: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
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

  // Function to fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Check for active session on initial load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Extract username from user metadata
      if (session?.user) {
        const userMeta = session.user.user_metadata;
        setUsername(userMeta?.username || userMeta?.preferred_username || null);
        
        // Generate privacy name based on user ID
        setDisplayName(generatePrivacyName(session.user.id));

        // Fetch user profile
        const profileData = await fetchUserProfile(session.user.id);
        setProfile(profileData);
      }
      
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Extract username from user metadata
      if (session?.user) {
        const userMeta = session.user.user_metadata;
        setUsername(userMeta?.username || userMeta?.preferred_username || null);
        
        // Generate privacy name based on user ID
        setDisplayName(generatePrivacyName(session.user.id));

        // Fetch user profile
        const profileData = await fetchUserProfile(session.user.id);
        setProfile(profileData);
      } else {
        setUsername(null);
        setDisplayName(null);
        setProfile(null);
      }
      
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

  const signUp = async (email: string, password: string, name: string, username: string, field: string = '', company: string = '') => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            username,
            field,
            company
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
      profile, // Add profile to the context value
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
