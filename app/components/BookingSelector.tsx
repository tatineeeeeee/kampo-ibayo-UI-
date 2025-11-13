'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Users, CheckCircle, Clock, Star, XCircle } from 'lucide-react';

interface Booking {
  id: number;
  check_in_date: string;
  check_out_date: string;
  guest_name: string;
  number_of_guests: number;
  status: string | null;
  created_at: string | null;
  total_amount: number;
}

interface BookingWithReview extends Booking {
  hasReview: boolean;
  reviewStatus?: 'pending' | 'approved' | 'rejected' | 'blocked';
  reviewRating?: number;
  resubmissionCount?: number;
  rejectionReason?: string;
}

interface BookingSelectorProps {
  onBookingSelect: (booking: Booking) => void;
  className?: string;
  refreshTrigger?: number;
}

const BookingSelector = ({ onBookingSelect, className = "", refreshTrigger }: BookingSelectorProps) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserBookings = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);

      // Fetch completed bookings that could be reviewed
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['confirmed', 'completed'])
        .order('check_out_date', { ascending: false })
        .limit(10);

      if (fetchError) {
        throw fetchError;
      }

      // Filter to only show past stays (check-out date has passed)
      const now = new Date();
      const pastStays = (data || []).filter(booking => {
        const checkoutDate = new Date(booking.check_out_date);
        return checkoutDate < now;
      });

      // Fetch review information for these bookings with real-time data
      const bookingIds = pastStays.map(booking => booking.id);
      let reviewData: { 
        booking_id: number | null; 
        approved: boolean | null; 
        rating: number; 
        resubmission_count: number | null;
        rejection_reason: string | null;
      }[] = [];
      
      if (bookingIds.length > 0) {
        // Always fetch fresh data from database
        const { data: reviews, error: reviewError } = await supabase
          .from('guest_reviews')
          .select('booking_id, approved, rating, resubmission_count, rejection_reason')
          .eq('user_id', user.id)
          .in('booking_id', bookingIds);

        if (reviewError) {
          console.error('Error fetching reviews:', reviewError);
        } else {
          reviewData = reviews || [];
        }
      }

      // Combine booking data with review status
      const bookingsWithReviewStatus: BookingWithReview[] = pastStays.map(booking => {
        const existingReview = reviewData.find(review => review.booking_id === booking.id);
        const resubmissionCount = existingReview?.resubmission_count || 0;
        const isBlocked = resubmissionCount >= 2; // Block after 2 attempts
        
        return {
          ...booking,
          hasReview: !!existingReview,
          reviewRating: existingReview?.rating || undefined,
          resubmissionCount,
          rejectionReason: existingReview?.rejection_reason || undefined,
          reviewStatus: existingReview 
            ? isBlocked && existingReview.approved === false ? 'blocked' :
              (existingReview.approved === true ? 'approved' : 
               existingReview.approved === false ? 'rejected' : 'pending')  // null = pending
            : undefined
        };
      });

      setBookings(bookingsWithReviewStatus);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserBookings();

    // Set up real-time subscription for review status updates
    if (!user?.id) return;

    const channel = supabase
      .channel('review_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'guest_reviews',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Refetch bookings when a review is updated (approved/rejected)
          fetchUserBookings();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'guest_reviews',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Refetch bookings when a new review is submitted
          fetchUserBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUserBookings, user?.id]);

  // Refresh when external trigger changes (e.g., after successful review submission)
  useEffect(() => {
    if (refreshTrigger) {
      fetchUserBookings();
    }
  }, [refreshTrigger, fetchUserBookings]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysBetween = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStayStatus = (booking: BookingWithReview) => {
    const checkoutDate = new Date(booking.check_out_date);
    const now = new Date();
    const daysSinceStay = Math.floor((now.getTime() - checkoutDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceStay <= 30) {
      return { label: 'Recent Stay', color: 'text-green-400', bgColor: 'bg-green-900/20 border-green-500/30' };
    } else if (daysSinceStay <= 90) {
      return { label: 'Past Stay', color: 'text-blue-400', bgColor: 'bg-blue-900/20 border-blue-500/30' };
    } else {
      return { label: 'Older Stay', color: 'text-gray-400', bgColor: 'bg-gray-900/20 border-gray-500/30' };
    }
  };

  const getReviewStatusDisplay = (booking: BookingWithReview) => {
    if (!booking.hasReview) {
      return {
        icon: Star,
        text: 'Leave Review',
        color: 'text-red-400 group-hover:text-red-300',
        bgColor: 'bg-red-900/20 border-red-500/30',
        clickable: true
      };
    }

    switch (booking.reviewStatus) {
      case 'approved':
        return {
          icon: CheckCircle,
          text: `Review Published (${booking.reviewRating}/5)`,
          color: 'text-green-400',
          bgColor: 'bg-green-900/20 border-green-500/30',
          clickable: false
        };
      case 'pending':
        return {
          icon: Clock,
          text: 'Quality Review in Progress',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-900/20 border-yellow-500/30',
          clickable: false
        };
      case 'rejected':
        return {
          icon: XCircle,
          text: `Submit Revised Review (${(booking.resubmissionCount || 0) + 1}/2)`,
          color: 'text-red-400',
          bgColor: 'bg-red-900/20 border-red-500/30',
          clickable: true // Allow re-submission
        };
      case 'blocked':
        return {
          icon: XCircle,
          text: 'Review Limit Reached',
          color: 'text-gray-400',
          bgColor: 'bg-gray-900/20 border-gray-500/30',
          clickable: false // No more submissions allowed
        };
      default:
        return {
          icon: Star,
          text: 'Leave Review',
          color: 'text-red-400 group-hover:text-red-300',
          bgColor: 'bg-red-900/20 border-red-500/30',
          clickable: true
        };
    }
  };

  if (loading) {
    return (
      <div className={`${className} text-center py-12`}>
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
        <p className="text-gray-400">Loading your stays...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} text-center py-12`}>
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchUserBookings}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className={`${className} text-center py-12`}>
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Past Stays Found</h3>
        <p className="text-gray-400 mb-6">
          You need to have completed a stay at Kampo Ibayo to leave a review.
        </p>
        <a
          href="/book"
          className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Book Your Stay
        </a>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Which stay would you like to review?
        </h2>
        <p className="text-gray-400">
          Select from your completed stays at Kampo Ibayo
        </p>
      </div>

      <div className="space-y-4">
        {bookings.map((booking) => {
          const nights = getDaysBetween(booking.check_in_date, booking.check_out_date);
          const status = getStayStatus(booking);
          const reviewStatus = getReviewStatusDisplay(booking);
          
          return (
            <div
              key={booking.id}
              className={`${status.bgColor} border rounded-lg p-6 transition-all ${
                reviewStatus.clickable 
                  ? 'hover:border-red-500/50 cursor-pointer group' 
                  : 'cursor-default opacity-75'
              }`}
              onClick={() => reviewStatus.clickable && onBookingSelect(booking)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      Kampo Ibayo Resort
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`${status.color} font-medium`}>
                        {status.label}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-400">
                        Booking #{booking.id}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">
                    ₱{booking.total_amount.toLocaleString()}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {nights} night{nights !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Check-in</p>
                    <p className="text-gray-400 text-xs">
                      {formatDate(booking.check_in_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Check-out</p>
                    <p className="text-gray-400 text-xs">
                      {formatDate(booking.check_out_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Guests</p>
                    <p className="text-gray-400 text-xs">
                      {booking.number_of_guests} guest{booking.number_of_guests !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-600/30">
                <p className="text-gray-400 text-sm">
                  Guest: {booking.guest_name}
                </p>
                <div className={`flex items-center gap-2 ${reviewStatus.color} transition-colors`}>
                  <reviewStatus.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{reviewStatus.text}</span>
                </div>
              </div>

              {/* Review Status Indicator */}
              {booking.hasReview && (
                <div className={`mt-4 p-3 rounded-lg ${
                  booking.reviewStatus === 'approved' ? 'bg-green-900/30 border border-green-600/30' :
                  booking.reviewStatus === 'pending' ? 'bg-yellow-900/30 border border-yellow-600/30' :
                  booking.reviewStatus === 'blocked' ? 'bg-gray-900/30 border border-gray-600/30' :
                  'bg-red-900/30 border border-red-600/30'
                }`}>
                  <div className={`text-sm ${
                    booking.reviewStatus === 'approved' ? 'text-green-200' :
                    booking.reviewStatus === 'pending' ? 'text-yellow-200' :
                    booking.reviewStatus === 'blocked' ? 'text-gray-200' :
                    'text-red-200'
                  }`}>
                    {booking.reviewStatus === 'approved' && 
                      `✅ Your review has been published and is visible to other guests.`}
                    {booking.reviewStatus === 'pending' && 
                      `⏳ Your review is under quality review and will be published once approved (rare cases only).`}
                    {booking.reviewStatus === 'rejected' && (
                      <div className="space-y-2">
                        <div>
                          🔄 <strong>Review not approved</strong> - You can submit a revised review (Attempt {(booking.resubmissionCount || 0) + 1}/2)
                        </div>
                        {booking.rejectionReason && (
                          <div className="mt-2 p-2 bg-red-800/30 rounded border-l-2 border-red-500">
                            <div className="text-xs text-red-300 font-medium mb-1">Admin Feedback:</div>
                            <div className="text-xs text-red-100">{booking.rejectionReason}</div>
                          </div>
                        )}
                        <div className="text-xs text-red-300 mt-2">
                          💡 Please address the feedback above when resubmitting your review.
                        </div>
                      </div>
                    )}
                    {booking.reviewStatus === 'blocked' && (
                      <div className="space-y-2">
                        <div>
                          🚫 <strong>Review limit reached</strong> - No more submissions allowed for this booking
                        </div>
                        {booking.rejectionReason && (
                          <div className="mt-2 p-2 bg-gray-800/30 rounded border-l-2 border-gray-500">
                            <div className="text-xs text-gray-400 font-medium mb-1">Last Rejection Reason:</div>
                            <div className="text-xs text-gray-200">{booking.rejectionReason}</div>
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-2">
                          You had 2 attempts to submit a review for this booking. Contact support if you believe this was an error.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center space-y-2">
        <p className="text-gray-400 text-sm">
          Don&apos;t see your stay? Only completed bookings are available for review.
        </p>
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-red-400" />
            <span className="text-gray-400">Can review</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-yellow-400" />
            <span className="text-gray-400">Under review</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-400" />
            <span className="text-gray-400">Published</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSelector;