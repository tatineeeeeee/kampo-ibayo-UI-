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
  const [loading, setLoading] = useState(true);

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
    fetchNotifications();
    
    // Set up real-time subscriptions for live updates
    const bookingsSubscription = supabase
      .channel('admin-notifications-bookings')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    const usersSubscription = supabase
      .channel('admin-notifications-users')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'users' },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    // Refresh every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);

    return () => {
      bookingsSubscription.unsubscribe();
      usersSubscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return {
    notifications,
    loading,
    refreshNotifications: fetchNotifications
  };
}