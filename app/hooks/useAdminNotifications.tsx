"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

interface NotificationData {
  pendingBookings: number;
  newUsers: number;
  recentCancellations: number;
  totalNotifications: number;
  lastChecked: string;
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<NotificationData>({
    pendingBookings: 0,
    newUsers: 0,
    recentCancellations: 0,
    totalNotifications: 0,
    lastChecked: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false); // Don't block UI while loading notifications

  const fetchNotifications = async () => {
    try {
      // Get pending bookings count
      const { data: pendingBookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('status', 'pending');

      // Get new users from last 24 hours
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);
      
      const { data: newUsers, error: userError } = await supabase
        .from('users')
        .select('id')
        .gte('created_at', yesterday.toISOString());

      // Get recent cancellations (last 7 days)
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const { data: recentCancellations, error: cancelError } = await supabase
        .from('bookings')
        .select('id')
        .eq('status', 'cancelled')
        .gte('cancelled_at', lastWeek.toISOString());

      if (bookingError || userError || cancelError) {
        console.error('Error fetching notifications:', { bookingError, userError, cancelError });
        return;
      }

      const pendingCount = pendingBookings?.length || 0;
      const newUserCount = newUsers?.length || 0;
      const cancellationCount = recentCancellations?.length || 0;
      
      const notificationData: NotificationData = {
        pendingBookings: pendingCount,
        newUsers: newUserCount,
        recentCancellations: cancellationCount,
        totalNotifications: pendingCount + newUserCount + cancellationCount,
        lastChecked: new Date().toISOString()
      };

      setNotifications(notificationData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Delayed initial fetch to not block navigation
    const initialTimer = setTimeout(() => {
      fetchNotifications();
    }, 100);
    
    // Set up real-time subscriptions for live updates with debouncing
    let fetchTimeout: NodeJS.Timeout | null = null;
    const debouncedFetch = () => {
      if (fetchTimeout) clearTimeout(fetchTimeout);
      fetchTimeout = setTimeout(fetchNotifications, 500); // Debounce 500ms
    };

    const bookingsSubscription = supabase
      .channel(`admin-notifications-bookings-${Date.now()}`) // Unique channel names
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        debouncedFetch
      )
      .subscribe();

    const usersSubscription = supabase
      .channel(`admin-notifications-users-${Date.now()}`) // Unique channel names
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'users' },
        debouncedFetch
      )
      .subscribe();

    // Refresh every 5 minutes but don't block
    const interval = setInterval(() => {
      if (!document.hidden) { // Only fetch when tab is active
        fetchNotifications();
      }
    }, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      if (fetchTimeout) clearTimeout(fetchTimeout);
      
      // Properly cleanup subscriptions
      supabase.removeChannel(bookingsSubscription);
      supabase.removeChannel(usersSubscription);
      clearInterval(interval);
    };
  }, []);

  return {
    notifications,
    loading,
    refreshNotifications: fetchNotifications
  };
}