import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

type AuthContextType = {
  session: Session | null;
  user: any | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, username: string, field?: string, company?: string, programmingLanguages?: string[], notificationsConsent?: boolean) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  username: string | null;
  displayName: string | null;
  subscribeToNotifications: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  const generatePrivacyName = (userId: string) => {
    if (!userId || userId.length < 4) return "blue";
    
    const first2 = userId.substring(0, 2);
    const last2 = userId.substring(userId.length - 2);
    
    return `blue${first2}${last2}`;
  };

  // Function to register service worker and subscribe to push notifications
  const subscribeToNotifications = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.error('Push notifications are not supported in this browser');
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered with scope:', registration.scope);

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.error('Notification permission denied');
        return;
      }

      // Get push subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Get VAPID public key from Supabase
        const { data, error } = await supabase.functions.invoke('get-vapid-public-key');
        
        if (error) {
          console.error('Error getting VAPID public key:', error);
          throw new Error('Could not retrieve VAPID public key');
        }
        
        const vapidPublicKey = data.vapidPublicKey;
        if (!vapidPublicKey) {
          throw new Error('VAPID public key not available');
        }
        
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        
        // Create subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      // Store subscription in Supabase if user is authenticated
      if (user) {
        try {
          // Direct insert using raw SQL instead of RPC function
          const subscriptionData = {
            user_id: user.id,
            subscription: JSON.stringify(subscription),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Try to insert the subscription data directly
          const { error: insertError } = await supabase
            .from('user_push_subscriptions' as any)
            .upsert(subscriptionData, {
              onConflict: 'user_id'
            });
            
          if (insertError) {
            console.error('Error saving subscription:', insertError);
            throw new Error('Failed to save push subscription');
          }
          
          toast.success('Successfully subscribed to notifications');
        } catch (dbError) {
          console.error('Database error saving subscription:', dbError);
          toast.error('Failed to store notification subscription');
        }
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast.error('Failed to subscribe to notifications');
    }
  };

  // Helper function to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
      
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
      
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        if (data.session?.user) {
          const userMeta = data.session.user.user_metadata;
          setUsername(userMeta?.username || userMeta?.preferred_username || null);
          
          setDisplayName(generatePrivacyName(data.session.user.id));
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const userMeta = session.user.user_metadata;
        setUsername(userMeta?.username || userMeta?.preferred_username || null);
        
        setDisplayName(generatePrivacyName(session.user.id));
      } else {
        setUsername(null);
        setDisplayName(null);
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

  const signUp = async (email: string, password: string, name: string, username: string, field?: string, company?: string, programmingLanguages?: string[], notificationsConsent?: boolean) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            username,
            company,
            programming_languages: programmingLanguages ?? [],
            notifications_consent: notificationsConsent ?? false
          }
        }
      });
      
      if (error) {
        toast.error(error.message);
        return { error };
      }
      
      // If user gave consent to notifications, subscribe them
      if (notificationsConsent) {
        setTimeout(() => {
          subscribeToNotifications();
        }, 1000);
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
      displayName,
      subscribeToNotifications
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
