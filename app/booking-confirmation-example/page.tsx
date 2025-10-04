'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, Star, MessageCircleHeart, ArrowRight, Calendar, MapPin, Users } from 'lucide-react';
import ReviewModal from '../components/ReviewModal';
import { useReviewModal } from '../hooks/useReviewModal';

// Example booking confirmation page showing both modal and page approaches
export default function BookingConfirmationExample() {
  const { isOpen, modalProps, openModal, closeModal } = useReviewModal();
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);

  // Simulate post-checkout review prompt
  useEffect(() => {
    // Show review prompt after 3 seconds (simulating post-checkout)
    const timer = setTimeout(() => {
      setShowReviewPrompt(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Example booking data
  const booking = {
    id: 123,
    guestName: 'John Doe',
    guestEmail: 'john@example.com',
    checkIn: '2024-03-15',
    checkOut: '2024-03-17',
    guests: 2,
    totalAmount: 5999
  };

  const handleQuickReview = () => {
    openModal({
      bookingId: booking.id,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      trigger: 'post-booking'
    });
  };

  const handleReviewPrompt = () => {
    openModal({
      bookingId: booking.id,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      trigger: 'prompt'
    });
    setShowReviewPrompt(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Booking Confirmation */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-8">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-8 h-8 mr-3" />
              <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
            </div>
            <p className="text-green-100">
              Thank you for choosing Kampo Ibayo Resort. We can&apos;t wait to welcome you!
            </p>
          </div>

          <div className="p-8">
            {/* Booking Details */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{booking.checkIn} - {booking.checkOut}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{booking.guests} guests</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>Booking ID: #{booking.id}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Guest Information</h3>
                <div className="space-y-2">
                  <p className="text-gray-600">{booking.guestName}</p>
                  <p className="text-gray-600">{booking.guestEmail}</p>
                  <p className="text-2xl font-bold text-green-600">₱{booking.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Review Options */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Your Experience</h3>
              <p className="text-gray-600 mb-6">
                Help future guests and help us improve by sharing your experience at Kampo Ibayo Resort.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Modal Approach - Quick Review */}
                <button
                  onClick={handleQuickReview}
                  className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <Star className="w-5 h-5 mr-2" />
                  Quick Review
                </button>

                {/* Page Approach - Detailed Review */}
                <Link
                  href="/review"
                  className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <MessageCircleHeart className="w-5 h-5 mr-2" />
                  Detailed Review
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Review Prompt (Example of contextual prompt) */}
        {showReviewPrompt && (
          <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl p-6 max-w-sm border border-gray-200 animate-slide-up">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <MessageCircleHeart className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900">Enjoyed your stay?</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Share your experience to help other travelers!
                </p>
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={handleReviewPrompt}
                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 transition-colors"
                  >
                    Review Now
                  </button>
                  <button
                    onClick={() => setShowReviewPrompt(false)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-full hover:bg-gray-300 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isOpen}
        onClose={closeModal}
        bookingId={modalProps.bookingId}
        guestName={modalProps.guestName}
        guestEmail={modalProps.guestEmail}
        trigger={modalProps.trigger}
      />

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}