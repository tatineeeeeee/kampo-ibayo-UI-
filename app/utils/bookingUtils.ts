import { supabase } from "../supabaseClient";

export interface BookingExpiration {
  id: number;
  guest_name: string;
  guest_email: string | null;
  created_at: string | null;
  daysPending: number;
}

export interface BookingStats {
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  canCreatePending: boolean;
  message?: string;
}

/**
 * Get booking statistics for a specific user
 * @param userId - The user's ID
 * @returns Booking counts and limits
 */
export async function getUserBookingStats(userId: string): Promise<BookingStats> {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('status, created_at')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user booking stats:', error);
      return {
        pendingCount: 0,
        confirmedCount: 0,
        completedCount: 0,
        cancelledCount: 0,
        canCreatePending: false,
        message: 'Error fetching booking stats'
      };
    }

    const stats = {
      pendingCount: 0,
      confirmedCount: 0,
      completedCount: 0,
      cancelledCount: 0
    };

    bookings?.forEach(booking => {
      const status = booking.status?.toLowerCase() || 'pending';

      // Count by actual database status (no need for date logic anymore)
      switch (status) {
        case 'pending':
          stats.pendingCount++;
          break;
        case 'confirmed':
          stats.confirmedCount++;
          break;
        case 'completed':
          stats.completedCount++;
          break;
        case 'cancelled':
          stats.cancelledCount++;
          break;
      }
    });

    const canCreatePending = stats.pendingCount < 3;
    let message = '';

    if (!canCreatePending) {
      message = 'You have reached the maximum of 3 pending bookings. Please wait for confirmation or cancel existing pending bookings.';
    }

    return {
      ...stats,
      canCreatePending,
      message
    };

  } catch (error) {
    console.error('Error in getUserBookingStats:', error);
    return {
      pendingCount: 0,
      confirmedCount: 0,
      completedCount: 0,
      cancelledCount: 0,
      canCreatePending: false,
      message: 'Error fetching booking stats'
    };
  }
}

/**
 * Check and clean up old completed bookings (keep only 5 most recent)
 * @param userId - The user's ID
 * @returns Number of expired completed bookings
 */
export async function cleanupOldCompletedBookings(userId: string): Promise<number> {
  try {
    // Get all completed bookings for this user, ordered by creation date (newest first)
    const { data: completedBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching completed bookings:', fetchError);
      return 0;
    }

    if (!completedBookings || completedBookings.length <= 5) {
      return 0; // No cleanup needed
    }

    // Get bookings beyond the 5 most recent
    const bookingsToExpire = completedBookings.slice(5);
    const bookingIds = bookingsToExpire.map(booking => booking.id);

    // Update old completed bookings to "cancelled" status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: 'Auto-expired: Completed booking archived after 5 newer completions',
        cancelled_by: 'system',
        cancelled_at: new Date().toISOString()
      })
      .in('id', bookingIds);

    if (updateError) {
      console.error('Error expiring old completed bookings:', updateError);
      return 0;
    }

    console.log(`Expired ${bookingsToExpire.length} old completed bookings for user ${userId}`);
    return bookingsToExpire.length;

  } catch (error) {
    console.error('Error in cleanupOldCompletedBookings:', error);
    return 0;
  }
}

/**
 * Auto-complete confirmed bookings that have passed their checkout date
 * This calls the server-side API endpoint to safely update bookings
 * @returns Number of bookings auto-completed
 */
export async function autoCompleteFinishedBookings(): Promise<number> {
  try {
    // Call server-side API endpoint to handle the update with admin privileges
    const response = await fetch('/api/bookings/auto-complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to auto-complete bookings:', response.statusText);
      return 0;
    }

    const data = await response.json();
    return data.completedCount || 0;

  } catch (error) {
    console.error('Error in autoCompleteFinishedBookings:', error);
    return 0;
  }
}

/**
 * Check if user can create a new pending booking
 * @param userId - The user's ID
 * @returns Boolean and optional message
 */
export async function canUserCreatePendingBooking(userId: string): Promise<{ canCreate: boolean, message?: string }> {
  const stats = await getUserBookingStats(userId);

  if (!stats.canCreatePending) {
    return {
      canCreate: false,
      message: stats.message
    };
  }

  return { canCreate: true };
}

/**
 * Check for bookings that should be auto-expired (pending for 7+ days)
 * @returns Array of bookings that were expired
 */
export async function checkAndExpirePendingBookings(): Promise<BookingExpiration[]> {
  try {
    // Calculate 7 days ago for production
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find bookings that are pending and older than 7 days
    const { data: expiredBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, guest_name, guest_email, created_at, status')
      .eq('status', 'pending')
      .lt('created_at', sevenDaysAgo.toISOString());

    if (fetchError) {
      console.error('Error fetching expired bookings:', fetchError);
      return [];
    }

    if (!expiredBookings || expiredBookings.length === 0) {
      return [];
    }

    console.log('Found expired bookings:', expiredBookings.length, 'bookings to expire');

    // Update the expired bookings to "cancelled" status
    const bookingIds = expiredBookings.map(booking => booking.id);

    // Now we can add cancellation reason since we added the column
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: 'Auto-expired: No confirmation received within 7 days',
        cancelled_by: 'system',
        cancelled_at: new Date().toISOString()
      })
      .in('id', bookingIds);

    if (updateError) {
      console.error('Error updating cancelled bookings:', updateError);
      return [];
    }

    // Return the expired bookings with additional info
    const expiredBookingsInfo: BookingExpiration[] = expiredBookings.map(booking => {
      const createdDate = new Date(booking.created_at || new Date());
      const now = new Date();
      const daysPending = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: booking.id,
        guest_name: booking.guest_name,
        guest_email: booking.guest_email,
        created_at: booking.created_at,
        daysPending
      };
    });

    console.log(`Auto-cancelled ${expiredBookingsInfo.length} booking(s) that were pending for 7+ days`);
    return expiredBookingsInfo;

  } catch (error) {
    console.error('Error in checkAndExpirePendingBookings:', error);
    return [];
  }
}

/**
 * Get the number of days a booking has been pending
 * @param createdAt - The booking creation date
 * @returns Number of days pending
 */
export function getDaysPending(createdAt: string | null): number {
  if (!createdAt) return 0;
  const createdDate = new Date(createdAt);
  const now = new Date();
  return Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Check if a booking should show an expiration warning (5+ days pending)
 * @param createdAt - The booking creation date
 * @param status - The booking status
 * @returns Boolean indicating if warning should be shown
 */
export function shouldShowExpirationWarning(createdAt: string | null, status: string): boolean {
  if (status !== 'pending' || !createdAt) return false;
  return getDaysPending(createdAt) >= 5;
}

/**
 * Get expiration warning message for a booking
 * @param createdAt - The booking creation date
 * @returns Warning message string
 */
export function getExpirationWarningMessage(createdAt: string | null): string {
  if (!createdAt) return "";
  const daysPending = getDaysPending(createdAt);
  const daysLeft = Math.max(0, 7 - daysPending);

  if (daysLeft === 0) {
    return "⚠️ This booking will expire today";
  } else if (daysLeft === 1) {
    return "⚠️ This booking will expire tomorrow";
  } else {
    return `⚠️ This booking will expire in ${daysLeft} day(s)`;
  }
}

/**
 * Manual function to check and expire bookings (for admin use or testing)
 * @returns Summary of expired bookings
 */
export async function manuallyExpireBookings() {
  const expiredBookings = await checkAndExpirePendingBookings();

  if (expiredBookings.length > 0) {
    console.log('📋 Manual Expiration Summary:');
    expiredBookings.forEach(booking => {
      console.log(`- Booking #${booking.id} (${booking.guest_name}) - Pending for ${booking.daysPending} days`);
    });
    return `Successfully expired ${expiredBookings.length} booking(s)`;
  } else {
    console.log('✅ No bookings found that need to be expired');
    return 'No bookings found that need to be expired';
  }
}

/**
 * Diagnostic function to check what columns exist in bookings table
 */
export async function checkBookingTableColumns() {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error checking table structure:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('📋 Bookings table columns:', Object.keys(data[0]));
      console.log('📋 Sample booking data:', data[0]);
    } else {
      console.log('📋 No bookings found in table');
    }
  } catch (error) {
    console.error('Error in checkBookingTableColumns:', error);
  }
}