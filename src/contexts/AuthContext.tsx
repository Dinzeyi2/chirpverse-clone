
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
        toast.error('Push notifications are not supported in this browser');
        return;
      }

      if (!user) {
        console.error('User not authenticated');
        toast.error('Please log in to enable notifications');
        return;
      }

      console.log('Subscribing to notifications for user:', user.id);

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.error('Notification permission denied');
        toast.error('Notification permission was denied');
        return;
      }

      console.log('Notification permission granted');

      // Register service worker
      try {
        // Attempt to unregister any existing service workers first
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
          console.log('Unregistered existing service worker');
        }
        
        // Register a new service worker
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/'
        });
        console.log('Service Worker registered with scope:', registration.scope);
        
        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('Service worker is ready');
      } catch (swError) {
        console.error('Service Worker registration failed:', swError);
        toast.error('Failed to register notification service');
        return;
      }

      // Get push subscription
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      
      console.log('Existing subscription:', subscription);
      
      if (subscription) {
        // If there's an existing subscription, unsubscribe first
        await subscription.unsubscribe();
        console.log('Unsubscribed from existing push subscription');
      }
      
      try {
        // Get VAPID public key from Supabase function
        const { data, error } = await supabase.functions.invoke('get-vapid-public-key');
        
        if (error) {
          console.error('Error getting VAPID public key:', error);
          throw new Error('Could not retrieve VAPID public key');
        }
        
        const vapidPublicKey = data?.vapidPublicKey;
        if (!vapidPublicKey) {
          toast.error('Server configuration error: VAPID key not available');
          throw new Error('VAPID public key not available');
        }
        
        console.log('Retrieved VAPID public key:', vapidPublicKey);
        
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
        
        console.log('Created new push subscription:', subscription);
      } catch (subscribeError) {
        console.error('Error creating push subscription:', subscribeError);
        toast.error('Failed to create notification subscription');
        return;
      }

      // Store subscription in Supabase
      try {
        // Format subscription object for storage
        const subscriptionData = {
          user_id: user.id,
          subscription: JSON.stringify(subscription),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('Saving subscription to database:', subscriptionData);
        
        // Try to insert the subscription data
        const { error: insertError } = await supabase
          .from('user_push_subscriptions')
          .upsert(subscriptionData, {
            onConflict: 'user_id'
          });
          
        if (insertError) {
          console.error('Error saving subscription:', insertError);
          throw new Error('Failed to save push subscription');
        }
        
        console.log('Successfully saved subscription to database');
        
        // Send a test notification
        await supabase.functions.invoke('send-push-notification', {
          body: {
            userId: user.id,
            title: 'Notifications Enabled',
            body: 'You have successfully enabled push notifications!',
            url: '/notifications',
            tag: 'test-subscription'
          }
        });
        
        toast.success('Successfully subscribed to notifications');
      } catch (dbError) {
        console.error('Database error saving subscription:', dbError);
        toast.error('Failed to store notification subscription');
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
