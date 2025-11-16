'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaHome, FaUser } from 'react-icons/fa';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import BookingSelector from '../components/BookingSelector';
import CategoryRatings from '../components/CategoryRatings';
import ReviewSubmissionForm from '../components/ReviewSubmissionForm';
import { useAuth } from '../contexts/AuthContext';

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

export default function ReviewPage() {
  const { user, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState({
    overall: 0,
    cleanliness: 0,
    service: 0,
    location: 0,
    value: 0,
    amenities: 0
  });

  useEffect(() => {
    // Component mounted
  }, []);

  const handleBookingSelect = (booking: Booking) => {
    setSelectedBooking(booking);
    setCurrentStep(2);
  };

  const handleRatingChange = (category: string, rating: number) => {
    setCategoryRatings(prev => ({
      ...prev,
      [category]: rating
    }));
  };

  const canProceedToStep3 = useMemo(() => {
    const canProceed = categoryRatings.overall > 0;
    return canProceed;
  }, [categoryRatings.overall]);

  const handleNext = () => {
    if (currentStep === 2 && canProceedToStep3) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReviewSuccess = () => {
    // Trigger refresh of booking data to show new review status
    setRefreshTrigger(prev => prev + 1);
    
    // Show success page instead of resetting immediately
    setShowSuccess(true);
    // Auto-reset after 5 seconds or user can manually return
    setTimeout(() => {
      setCurrentStep(1);
      setSelectedBooking(null);
      setShowSuccess(false);
      setCategoryRatings({
        overall: 0,
        cleanliness: 0,
        service: 0,
        location: 0,
        value: 0,
        amenities: 0
      });
    }, 5000);
  };

  const formatStayDates = (booking: Booking) => {
    const checkIn = new Date(booking.check_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const checkOut = new Date(booking.check_out_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${checkIn} - ${checkOut}`;
  };

  const getStepTitle = () => {
    if (showSuccess) return 'Thank You!';
    switch (currentStep) {
      case 1: return 'Select Your Stay';
      case 2: return 'Rate Your Experience';
      case 3: return 'Write Your Review';
      default: return 'Leave a Review';
    }
  };

  // Success Component
  const SuccessPage = () => (
    <div className="text-center py-6 sm:py-8 px-3 sm:px-0">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
        <Check className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Thank you for your review!</h2>
      <p className="text-gray-300 text-base sm:text-lg mb-4 sm:mb-6 max-w-md mx-auto px-2 sm:px-0">
        Your review has been published successfully and is now visible to other guests!
      </p>
      
      <div className="bg-green-900/30 border border-green-600/30 rounded-lg p-4 sm:p-6 max-w-lg mx-auto mb-4 sm:mb-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
          <h3 className="text-green-200 font-semibold text-sm sm:text-base">Your review is live!</h3>
        </div>
        <p className="text-green-100 text-xs sm:text-sm leading-relaxed">
          Your honest feedback helps future guests make informed decisions. 
          Thank you for sharing your experience at <strong>Kampo Ibayo Resort</strong>!
        </p>
      </div>

      <div className="space-y-3 px-2 sm:px-0">
        <button
          onClick={() => {
            setCurrentStep(1);
            setSelectedBooking(null);
            setShowSuccess(false);
            setCategoryRatings({
              overall: 0,
              cleanliness: 0,
              service: 0,
              location: 0,
              value: 0,
              amenities: 0
            });
          }}
          className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm sm:text-base"
        >
          Submit Another Review
        </button>
        <div className="text-gray-400 text-xs sm:text-sm">
          Redirecting to home in <span className="text-white">5 seconds</span>...
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Navigation Bar */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 z-20">
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
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Review Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/profile" 
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaUser className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              </Link>
              <div className="text-xs sm:text-sm text-gray-400 text-right">
                {loading ? (
                  <span className="inline-block bg-gray-600 text-gray-300 px-2 py-1 rounded-full text-xs font-medium">
                    ● Loading...
                  </span>
                ) : user ? (
                  <span className="inline-block bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    ● Signed In
                  </span>
                ) : (
                  <span className="inline-block bg-orange-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    ● Guest
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main
        className="min-h-screen bg-cover bg-center bg-fixed flex items-start sm:items-center justify-center p-3 sm:p-6 pt-20 sm:pt-24"
        style={{
          backgroundImage: "url('/pool.jpg')",
        }}
      >
        <div className="bg-gray-900/95 backdrop-blur-sm text-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl p-3 sm:p-6 lg:p-8 border border-gray-700/50 my-4 sm:my-8">
          {/* Header with Steps */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-block mb-3">
              <div className="w-12 sm:w-16 h-1 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 rounded-full mx-auto"></div>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent mb-2">
              {getStepTitle()}
            </h1>
            
            {currentStep === 1 && (
              <p className="text-gray-400 max-w-md mx-auto text-sm sm:text-base px-4 sm:px-0">
                Choose a completed stay to review. Your honest feedback will be published immediately to help future guests.
              </p>
            )}
            
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-4 mt-6 px-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-8 md:h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    step === currentStep 
                      ? 'bg-red-600 text-white' 
                      : step < currentStep 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-600 text-gray-300'
                  }`}>
                    {step < currentStep ? '✓' : step}
                  </div>
                  {step < 3 && (
                    <div className={`w-4 sm:w-6 md:w-8 h-0.5 ${
                      step < currentStep ? 'bg-green-600' : 'bg-gray-600'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-2 sm:gap-4 md:gap-8 mt-4 text-xs sm:text-sm px-2">
              <span className={`text-center flex-1 sm:flex-none ${currentStep === 1 ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
                Select Stay
              </span>
              <span className={`text-center flex-1 sm:flex-none ${currentStep === 2 ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
                Rate Experience
              </span>
              <span className={`text-center flex-1 sm:flex-none ${currentStep === 3 ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
                Write Review
              </span>
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[300px] sm:min-h-[400px]">
            {showSuccess ? (
              <SuccessPage />
            ) : (
              <>
                {currentStep === 1 && (
                  <BookingSelector
                    onBookingSelect={handleBookingSelect}
                    className="w-full"
                    refreshTrigger={refreshTrigger}
                  />
                )}

                {currentStep === 2 && selectedBooking && (
              <div>
                {/* Selected Booking Info */}
                <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-700/50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-sm sm:text-base">Reviewing: Kampo Ibayo Resort</h3>
                      <p className="text-gray-400 text-xs sm:text-sm">
                        {formatStayDates(selectedBooking)} • Booking #{selectedBooking.id}
                      </p>
                    </div>
                    <button
                      onClick={handleBack}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm w-full sm:w-auto"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Change Booking
                    </button>
                  </div>
                </div>

                <CategoryRatings
                  ratings={categoryRatings}
                  onRatingChange={handleRatingChange}
                  className="w-full"
                />
              </div>
            )}

            {currentStep === 3 && selectedBooking && (
              <div>
                {/* Selected Booking Info */}
                <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-700/50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-sm sm:text-base">Kampo Ibayo Resort</h3>
                      <p className="text-gray-400 text-xs sm:text-sm">
                        {formatStayDates(selectedBooking)} • Your ratings: {categoryRatings.overall}/5 overall
                      </p>
                    </div>
                    <button
                      onClick={handleBack}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm w-full sm:w-auto"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back to Ratings
                    </button>
                  </div>
                </div>

                <ReviewSubmissionForm
                  bookingId={selectedBooking.id}
                  initialGuestName={selectedBooking.guest_name}
                  prefilledData={{
                    guestName: selectedBooking.guest_name
                  }}
                  onSuccess={handleReviewSuccess}
                  className="w-full"
                  isModal={false}
                  // Pass category ratings as additional data
                  categoryRatings={categoryRatings}
                  stayDates={formatStayDates(selectedBooking)}
                />
              </div>
            )}
              </>
            )}
          </div>

          {/* Navigation Buttons - only show if on step 2 and not on success page */}
          {currentStep === 2 && !showSuccess && selectedBooking && (
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-600">
              <button
                onClick={handleBack}
                className="flex items-center justify-center gap-2 px-6 py-3 sm:py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm sm:text-sm font-medium min-h-[44px] sm:min-h-[48px] order-2 sm:order-1"
              >
                <ChevronLeft className="w-4 h-4 sm:w-4 sm:h-4" />
                Back to Selection
              </button>
              <button
                onClick={handleNext}
                disabled={!canProceedToStep3}
                className="flex items-center justify-center gap-2 px-6 py-3 sm:py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm sm:text-sm font-medium min-h-[44px] sm:min-h-[48px] order-1 sm:order-2"
              >
                Continue to Review
                <ChevronRight className="w-4 h-4 sm:w-4 sm:h-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}