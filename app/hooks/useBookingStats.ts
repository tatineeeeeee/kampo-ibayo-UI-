import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchBookingStats() {
      try {
        setLoading(true);
        setError(null);

        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch all bookings for the user
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

        // Calculate statistics
        const totalBookings = bookings?.length || 0;
        let totalNights = 0;
        let totalSpent = 0;
        let completedBookings = 0;
        let upcomingBookings = 0;
        let cancelledBookings = 0;
        let pendingBookings = 0;

        bookings?.forEach(booking => {
          const checkIn = new Date(booking.check_in_date);
          const checkOut = new Date(booking.check_out_date);
          const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
          const status = booking.status || 'pending';
          
          if (status === 'cancelled') {
            cancelledBookings++;
          } else if (status === 'confirmed') {
            // Only count spending for confirmed bookings
            totalSpent += booking.total_amount || 0;
            
            if (checkOut < now) {
              // Only count as completed if: confirmed by admin AND checkout date has passed
              completedBookings++;
              totalNights += nights; // Only add nights for actually completed stays
            } else {
              // Confirmed but upcoming/active
              upcomingBookings++;
            }
          } else {
            // Status is 'pending' - admin hasn't confirmed yet
            pendingBookings++;
          }
        });

        // Determine loyalty status based on COMPLETED bookings and actual spending (non-cancelled)
        let loyaltyStatus: 'New' | 'Regular' | 'VIP' | 'Elite' = 'New';
        if (completedBookings >= 10 || totalSpent >= 50000) {
          loyaltyStatus = 'Elite';
        } else if (completedBookings >= 5 || totalSpent >= 25000) {
          loyaltyStatus = 'VIP';
        } else if (completedBookings >= 2 || totalSpent >= 10000) {
          loyaltyStatus = 'Regular';
        }

        // Get recent bookings (last 3)
        const recentBookings = bookings?.slice(0, 3) || [];

        setStats({
          totalBookings,
          totalNights,
          totalSpent,
          completedBookings,
          upcomingBookings,
          cancelledBookings,
          pendingBookings,
          recentBookings,
          memberSince,
          loyaltyStatus
        });

      } catch (err) {
        console.error('Error in fetchBookingStats:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchBookingStats();
  }, [user]);

  return { stats, loading, error, refetch: () => {
    if (user) {
      setLoading(true);
      // Re-trigger the effect by updating a dependency
    }
  }};
}