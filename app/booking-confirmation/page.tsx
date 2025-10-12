'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Calendar, Users, CreditCard, ArrowRight, Phone, Mail } from 'lucide-react';
import { FaHome } from 'react-icons/fa';
import { supabase } from '@/app/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';
import { CancellationPolicy } from '@/app/components/CancellationPolicy';

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

function BookingConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'success' | 'failed' | 'pending'>('checking');

  // Get URL parameters
  const bookingId = searchParams.get('booking_id');
  const paymentIntentId = searchParams.get('payment_intent_id'); // For future webhook validation

  useEffect(() => {
    if (!bookingId) {
      setError('No booking ID provided');
      setLoading(false);
      return;
    }

    // Log payment intent ID for debugging
    if (paymentIntentId) {
      console.log('Payment Intent ID:', paymentIntentId);
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
          // If payment is pending, immediately check PayMongo status
          setPaymentStatus('checking');
          
          // First, try to get fresh status from PayMongo if we have payment_intent_id
          if (data.payment_intent_id || paymentIntentId) {
            const checkPaymentIntentId = data.payment_intent_id || paymentIntentId;
            
            console.log('🔍 Immediately checking PayMongo status for:', checkPaymentIntentId);
            
            try {
              const statusResponse = await fetch('/api/paymongo/check-payment-status', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  payment_intent_id: checkPaymentIntentId
                }),
              });

              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                console.log('✅ Initial PayMongo status check:', statusData);
                
                if (statusData.booking) {
                  setBooking(statusData.booking);
                  
                  if (statusData.payment_status === 'paid') {
                    setPaymentStatus('success');
                    return; // Exit early - payment is confirmed
                  } else if (statusData.payment_status === 'failed') {
                    setPaymentStatus('failed');
                    return; // Exit early - payment failed
                  }
                }
              }
            } catch (error) {
              console.error('❌ Initial status check failed:', error);
            }
          }
          
          setPaymentStatus('pending');
          
          // Poll for payment status updates - longer timeout for test payments
          let pollCount = 0;
          const maxPolls = 30; // 60 seconds with 2-second intervals (better for test payments)
          
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
                // After timeout, check PayMongo directly before giving up
                console.log('⏰ Payment timeout - checking PayMongo directly');
                
                try {
                  const statusResponse = await fetch('/api/paymongo/check-payment-status', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      payment_intent_id: updatedData?.payment_intent_id
                    }),
                  });

                  if (statusResponse.ok) {
                    const statusData = await statusResponse.json();
                    console.log('✅ Got direct PayMongo status:', statusData);
                    
                    if (statusData.booking) {
                      setBooking(statusData.booking);
                      setPaymentStatus(statusData.payment_status === 'paid' ? 'success' : 
                                     statusData.payment_status === 'failed' ? 'failed' : 
                                     statusData.payment_status === 'processing' ? 'pending' : 'pending');
                    }
                  } else {
                    console.warn('⚠️ PayMongo status check failed, keeping current status');
                    // Don't automatically fail - let user check manually or wait longer
                    setPaymentStatus('pending');
                  }
                } catch (statusError) {
                  console.error('❌ Status check error:', statusError);
                  // Don't automatically fail on error - keep as pending
                  setPaymentStatus('pending');
                }
                
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
  }, [bookingId, paymentIntentId]);

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
        return <CheckCircle className="w-20 h-20 text-green-400 drop-shadow-lg" />;
      case 'failed':
        return <XCircle className="w-20 h-20 text-red-400 drop-shadow-lg" />;
      case 'checking':
      case 'pending':
        return <Loader2 className="w-20 h-20 text-white animate-spin drop-shadow-lg" />;
      default:
        return <Loader2 className="w-20 h-20 text-gray-400 drop-shadow-lg" />;
    }
  };

  const getStatusTitle = () => {
    switch (paymentStatus) {
      case 'success':
        if (booking?.status === 'confirmed') {
          return 'Booking Confirmed!';
        } else {
          return 'Payment Successful - Pending Approval';
        }
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
        if (booking?.status === 'confirmed') {
          return 'Your booking has been confirmed by our admin team and payment processed successfully. You will receive a confirmation email shortly.';
        } else {
          return 'Payment successful! Your booking is now pending admin approval. You will be notified once confirmed.';
        }
      case 'failed':
        return 'Your payment could not be processed. This might be due to insufficient funds, expired test card, or payment timeout. Please try booking again.';
      case 'checking':
        return 'Please wait while we verify your payment status with PayMongo...';
      case 'pending':
        return 'Your payment is still being processed. For test payments, this may take a bit longer. Please wait while we check the status or refresh the page.';
      default:
        return 'Processing your request...';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        {/* Pool Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/pool.jpg)' }}
        />
        <div className="absolute inset-0 bg-black/70" />
        
        <div className="relative text-center">
          <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-red-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-base sm:text-lg">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        {/* Pool Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/pool.jpg)' }}
        />
        <div className="absolute inset-0 bg-black/70" />
        
        <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md text-center border border-white/20">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">Booking Not Found</h1>
          <p className="text-gray-300 mb-8">{error || 'The booking could not be located'}</p>
          <button
            onClick={() => router.push('/book')}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg"
          >
            Back to Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Pool Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/pool.jpg)' }}
      />
      <div className="absolute inset-0 bg-black/70" />
      
      {/* Navigation Bar */}
      <div className="sticky top-0 bg-black/40 backdrop-blur-md border-b border-white/20 z-20">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                href="/" 
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaHome className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              </Link>
              <div className="text-white">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 relative">
                    <Image
                      src="/logo.png"
                      alt="Kampo Ibayo Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold">Kampo Ibayo</h1>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Booking Confirmation</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/bookings"
                className="px-3 py-2 text-sm text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                My Bookings
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative px-3 py-6 sm:px-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Status Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 mb-6 sm:mb-8">
            <div className={`p-4 sm:p-8 text-center rounded-t-2xl ${
              paymentStatus === 'success' ? 'bg-gradient-to-r from-green-600/30 to-green-700/30 border-green-400/40' :
              paymentStatus === 'failed' ? 'bg-gradient-to-r from-red-600/30 to-red-700/30 border-red-400/40' :
              'bg-gradient-to-r from-blue-600/30 to-blue-700/30 border-blue-400/40'
            } border-b`}>
              <div className="flex justify-center mb-4 sm:mb-6">
                {getStatusIcon()}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-white">{getStatusTitle()}</h1>
              <p className="text-base sm:text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed px-2">{getStatusMessage()}</p>
            </div>

            {/* Booking Details */}
            <div className="p-4 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8">Booking Details</h2>
            
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-500/30 rounded-lg flex items-center justify-center">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 text-red-300" />
                    </div>
                    Guest Information
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-black/20 rounded-lg">
                      <span className="text-gray-300 text-xs sm:text-sm min-w-[50px] sm:min-w-[60px]">Name:</span>
                      <span className="text-white font-medium text-sm sm:text-base">{booking.guest_name}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-black/20 rounded-lg">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300 flex-shrink-0" />
                      <span className="text-white text-xs sm:text-sm break-all">{booking.guest_email || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-black/20 rounded-lg">
                      <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300 flex-shrink-0" />
                      <span className="text-white text-xs sm:text-sm">{booking.guest_phone || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-500/30 rounded-lg flex items-center justify-center">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-red-300" />
                    </div>
                    Stay Details
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-black/20 rounded-lg border border-white/10">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-300" />
                      </div>
                      <div>
                        <p className="text-gray-300 text-xs sm:text-sm">Check-in</p>
                        <p className="text-white font-semibold text-sm sm:text-base">{formatDate(booking.check_in_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-black/20 rounded-lg border border-white/10">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-red-300" />
                      </div>
                      <div>
                        <p className="text-gray-300 text-xs sm:text-sm">Check-out</p>
                        <p className="text-white font-semibold text-sm sm:text-base">{formatDate(booking.check_out_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gray-800/40 rounded-lg border border-gray-600/20">
                      <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Total Guests</p>
                        <p className="text-white font-semibold">{booking.number_of_guests} {booking.number_of_guests === 1 ? 'guest' : 'guests'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="bg-gray-700/30 backdrop-blur-sm rounded-xl p-6 border border-gray-600/30">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-600/20 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-red-400" />
                    </div>
                    Payment Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                      <span className="text-gray-400 text-sm">Booking ID:</span>
                      <span className="font-semibold text-white">#{booking.id}</span>
                    </div>
                    {booking.payment_intent_id && (
                      <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <span className="text-gray-400 text-sm">Payment ID:</span>
                        <span className="font-mono text-sm text-white">{booking.payment_intent_id.slice(-8)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                      <span className="text-gray-400 text-sm">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        booking.status === 'confirmed' ? 'bg-green-600/20 text-green-400 border border-green-500/30' :
                        booking.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-gray-600/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Pending'}
                      </span>
                    </div>
                    <div className="border-t border-gray-600/30 pt-4 mt-4">
                      <div className="flex items-center justify-between text-xl font-bold p-4 bg-gradient-to-r from-red-600/10 to-red-700/10 rounded-lg border border-red-500/20">
                        <span className="text-white">Total Amount:</span>
                        <span className="text-red-400">₱{booking.total_amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {paymentStatus === 'success' && (
                  <div className={`border rounded-xl p-4 ${
                    booking?.status === 'confirmed' 
                      ? 'bg-green-600/10 border-green-500/30' 
                      : 'bg-yellow-600/10 border-yellow-500/30'
                  }`}>
                    <div className="flex items-center mb-2">
                      <CreditCard className={`w-5 h-5 mr-2 ${
                        booking?.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'
                      }`} />
                      <span className={`font-semibold ${
                        booking?.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {booking?.status === 'confirmed' ? 'Booking Confirmed' : 'Payment Confirmed - Awaiting Approval'}
                      </span>
                    </div>
                    <p className={`text-sm ${
                      booking?.status === 'confirmed' ? 'text-green-300' : 'text-yellow-300'
                    }`}>
                      {booking?.status === 'confirmed' 
                        ? 'Your booking has been approved and payment processed. You will receive a confirmation email shortly.'
                        : 'Your payment has been successfully processed. Your booking is now pending admin approval. You will be notified once confirmed.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>

              {/* Cancellation Policy - Only show for successful payments */}
              {(paymentStatus === 'success' || paymentStatus === 'pending') && booking && (
                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/20">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-500/30 rounded-lg flex items-center justify-center">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-red-300" />
                      </div>
                      Cancellation Policy
                    </h3>
                    <div className="bg-white rounded-xl p-4 sm:p-6">
                      <CancellationPolicy
                        checkInDate={booking.check_in_date}
                        totalAmount={booking.total_amount}
                      />
                    </div>
                    <div className="mt-4 p-3 sm:p-4 bg-blue-900/30 rounded-lg border border-blue-400/30">
                      <p className="text-blue-200 text-xs sm:text-sm leading-relaxed">
                        <strong>Good to know:</strong> You can cancel your booking anytime from your bookings page. 
                        Refunds are automatically processed based on the timing shown above, and you&apos;ll receive 
                        confirmation via email once processed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/20">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <button
                    onClick={() => router.push('/bookings')}
                    className="flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg text-sm sm:text-base"
                  >
                    View My Bookings
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
                  </button>
                  
                  {paymentStatus === 'pending' && (
                    <button
                      onClick={() => window.location.reload()}
                      className="flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg text-sm sm:text-base"
                    >
                      Check Payment Status
                    </button>
                  )}
                  
                  {paymentStatus === 'failed' && (
                    <button
                      onClick={() => router.push('/book')}
                      className="flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg text-sm sm:text-base"
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
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative">
        <div className="fixed inset-0 z-0">
          <Image
            src="/pool.jpg"
            alt="Kampo Ibayo Pool"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#4b0f12]/90 via-[#7c1f23]/85 to-[#2c0a0c]/90"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-16 h-16 animate-spin text-red-500 mx-auto mb-4 drop-shadow-lg" />
            <p className="text-white text-xl font-semibold drop-shadow">Loading booking details...</p>
          </div>
        </div>
      </div>
    }>
      <BookingConfirmationContent />
    </Suspense>
  );
}