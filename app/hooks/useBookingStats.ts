import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { Database } from '../../database.types';

type Booking = Database['public']['Tables']['bookings']['Row'];

export interface BookingStats {
  totalBookings: number;
  totalNights: number;
  totalSpent: number;
  completedBookings: number;
  upcomingBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  recentBookings: Booking[];
  memberSince: string;
  loyaltyStatus: 'New' | 'Regular' | 'VIP' | 'Elite';
}

export function useBookingStats(user: User | null) {
  const [stats, setStats] = useState<BookingStats>({
    totalBookings: 0,
    totalNights: 0,
    totalSpent: 0,
    completedBookings: 0,
    upcomingBookings: 0,
    cancelledBookings: 0,
    pendingBookings: 0,
    recentBookings: [],
    memberSince: '',
    loyaltyStatus: 'New'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookingStats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        setError('Failed to load booking statistics');
        return;
      }

      const now = new Date();
      const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });

      let totalNights = 0, totalSpent = 0, completedBookings = 0,
          upcomingBookings = 0, cancelledBookings = 0, pendingBookings = 0;

      bookings?.forEach(booking => {
        const checkIn = new Date(booking.check_in_date);
        const checkOut = new Date(booking.check_out_date);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const status = booking.status || 'pending';

        if (status === 'cancelled') {
          cancelledBookings++;
        } else if (status === 'confirmed') {
          totalSpent += booking.total_amount || 0;
          if (checkOut < now) {
            completedBookings++;
            totalNights += nights;
          } else {
            upcomingBookings++;
          }
        } else {
          pendingBookings++;
        }
      });

      let loyaltyStatus: 'New' | 'Regular' | 'VIP' | 'Elite' = 'New';
      if (completedBookings >= 10 || totalSpent >= 50000) loyaltyStatus = 'Elite';
      else if (completedBookings >= 5 || totalSpent >= 25000) loyaltyStatus = 'VIP';
      else if (completedBookings >= 2 || totalSpent >= 10000) loyaltyStatus = 'Regular';

      setStats({
        totalBookings: bookings?.length || 0, totalNights, totalSpent,
        completedBookings, upcomingBookings, cancelledBookings, pendingBookings,
        recentBookings: bookings?.slice(0, 3) || [], memberSince, loyaltyStatus
      });
    } catch (err) {
      console.error('Error in fetchBookingStats:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookingStats();
  }, [fetchBookingStats]);

  return { stats, loading, error, refetch: fetchBookingStats };
}