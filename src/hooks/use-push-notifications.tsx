
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [supported, setSupported] = useState<boolean>(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if browser supports push notifications
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setSupported(false);
      return;
    }
    
    setSupported(true);
    setPermission(Notification.permission);
    
    // Check if service worker is already registered
    navigator.serviceWorker.ready.then(registration => {
      registration.pushManager.getSubscription().then(subscription => {
        setSubscription(subscription);
      });
    });
  }, []);

  // Request permission to show notifications
  const requestPermission = async () => {
    if (!supported) {
      toast({
        title: "Push Notifications Not Supported",
        description: "Your browser doesn't support push notifications.",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        await subscribeToPushNotifications();
        return true;
      } else {
        toast({
          title: "Permission Denied",
          description: "You need to allow notifications to receive updates.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Subscribe to push notifications
  const subscribeToPushNotifications = async () => {
    if (!user || !supported || permission !== 'granted') return;
    
    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Get public VAPID key from the server
      const vapidResponse = await supabase.functions.invoke('get-vapid-public-key');
      
      if (vapidResponse.error || !vapidResponse.data?.vapidPublicKey) {
        throw new Error('Failed to get VAPID public key');
      }
      
      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidResponse.data.vapidPublicKey);
      
      // Subscribe to push notifications
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      
      setSubscription(pushSubscription);
      
      // Save subscription to database using direct insert/update
      const { error: upsertError } = await supabase
        .from('user_push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: JSON.stringify(pushSubscription),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });
      
      if (upsertError) {
        throw new Error('Failed to save subscription to database');
      }
      
      toast({
        title: "Notifications Enabled",
        description: "You'll now receive notifications about new posts and activity.",
      });
      
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: "Subscription Failed",
        description: "Could not enable push notifications. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Unsubscribe from push notifications
  const unsubscribeFromPushNotifications = async () => {
    if (!subscription || !user) return;
    
    try {
      await subscription.unsubscribe();
      setSubscription(null);
      
      // Remove subscription from database
      const { error } = await supabase
        .from('user_push_subscriptions')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error removing subscription from database:', error);
      }
      
      toast({
        title: "Notifications Disabled",
        description: "You will no longer receive push notifications.",
      });
      
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast({
        title: "Error",
        description: "Failed to disable push notifications.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Helper function to convert base64 to Uint8Array
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

  return {
    supported,
    permission,
    subscription,
    subscribed: !!subscription,
    requestPermission,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
  };
}
