'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Calendar, Users, CreditCard, ArrowRight } from 'lucide-react';
import { supabase } from '@/app/supabaseClient';

interface BookingDetails {
  id: number;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  total_amount: number;
  status: string | null;
  payment_status: string | null;
  payment_intent_id: string | null;
}

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'success' | 'failed' | 'pending'>('checking');

  // Get URL parameters
  const bookingId = searchParams.get('booking_id');
  const paymentIntentId = searchParams.get('payment_intent_id');

  useEffect(() => {
    if (!bookingId) {
      setError('No booking ID provided');
      setLoading(false);
      return;
    }

    const fetchBookingDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', parseInt(bookingId))
          .single();

        if (error) {
          throw error;
        }

        setBooking(data);

        // Check payment status
        if (data.payment_status === 'paid') {
          setPaymentStatus('success');
        } else if (data.payment_status === 'failed') {
          setPaymentStatus('failed');
        } else {
          setPaymentStatus('pending');
          
          // Poll for payment status updates for up to 30 seconds
          let pollCount = 0;
          const maxPolls = 15; // 30 seconds with 2-second intervals
          
          const pollPaymentStatus = setInterval(async () => {
            pollCount++;
            
            const { data: updatedData } = await supabase
              .from('bookings')
              .select('*')
              .eq('id', parseInt(bookingId))
              .single();

            if (updatedData) {
              setBooking(updatedData);
              
              if (updatedData.payment_status === 'paid') {
                setPaymentStatus('success');
                clearInterval(pollPaymentStatus);
              } else if (updatedData.payment_status === 'failed') {
                setPaymentStatus('failed');
                clearInterval(pollPaymentStatus);
              } else if (pollCount >= maxPolls) {
                // Stop polling after 30 seconds
                setPaymentStatus('pending');
                clearInterval(pollPaymentStatus);
              }
            }
          }, 2000);

          // Cleanup interval on component unmount
          return () => clearInterval(pollPaymentStatus);
        }

      } catch (err) {
        console.error('Error fetching booking:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'failed':
        return <XCircle className="w-12 h-12 text-red-500" />;
      case 'checking':
      case 'pending':
        return <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />;
      default:
        return <Loader2 className="w-12 h-12 text-gray-500" />;
    }
  };

  const getStatusTitle = () => {
    switch (paymentStatus) {
      case 'success':
        return 'Payment Successful!';
      case 'failed':
        return 'Payment Failed';
      case 'checking':
        return 'Checking Payment Status...';
      case 'pending':
        return 'Payment Pending';
      default:
        return 'Processing...';
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'success':
        return 'Your booking has been confirmed and payment processed successfully. You will receive a confirmation email shortly.';
      case 'failed':
        return 'Your payment could not be processed. Please try booking again or contact support.';
      case 'checking':
        return 'Please wait while we verify your payment status...';
      case 'pending':
        return 'Your payment is still being processed. We will update you once it\'s complete.';
      default:
        return 'Processing your request...';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Booking not found'}</p>
          <button
            onClick={() => router.push('/book')}
            className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Back to Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className={`p-8 text-center ${
            paymentStatus === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600' :
            paymentStatus === 'failed' ? 'bg-gradient-to-r from-red-500 to-red-600' :
            'bg-gradient-to-r from-blue-500 to-blue-600'
          } text-white`}>
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <h1 className="text-3xl font-bold mb-2">{getStatusTitle()}</h1>
            <p className="text-lg opacity-90">{getStatusMessage()}</p>
          </div>

          {/* Booking Details */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Booking Details</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Guest Information</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600"><span className="font-medium">Name:</span> {booking.guest_name}</p>
                    <p className="text-gray-600"><span className="font-medium">Email:</span> {booking.guest_email || 'Not provided'}</p>
                    <p className="text-gray-600"><span className="font-medium">Phone:</span> {booking.guest_phone || 'Not provided'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Stay Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-5 h-5 mr-3 text-blue-500" />
                      <div>
                        <p className="font-medium">Check-in</p>
                        <p>{formatDate(booking.check_in_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-5 h-5 mr-3 text-red-500" />
                      <div>
                        <p className="font-medium">Check-out</p>
                        <p>{formatDate(booking.check_out_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="w-5 h-5 mr-3 text-green-500" />
                      <div>
                        <p className="font-medium">Guests</p>
                        <p>{booking.number_of_guests} {booking.number_of_guests === 1 ? 'guest' : 'guests'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Booking ID:</span>
                      <span className="font-semibold">#{booking.id}</span>
                    </div>
                    {booking.payment_intent_id && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Payment ID:</span>
                        <span className="font-mono text-sm">{booking.payment_intent_id.slice(-8)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Pending'}
                      </span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex items-center justify-between text-xl font-bold">
                        <span>Total Amount:</span>
                        <span className="text-green-600">₱{booking.total_amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {paymentStatus === 'success' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CreditCard className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-semibold text-green-800">Payment Confirmed</span>
                    </div>
                    <p className="text-green-700 text-sm">
                      Your payment has been successfully processed. You will receive a confirmation email shortly.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/bookings')}
                  className="flex items-center justify-center px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                >
                  View My Bookings
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
                
                {paymentStatus === 'failed' && (
                  <button
                    onClick={() => router.push('/book')}
                    className="flex items-center justify-center px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}