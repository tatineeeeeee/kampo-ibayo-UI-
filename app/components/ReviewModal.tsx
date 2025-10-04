'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import ReviewSubmissionForm from './ReviewSubmissionForm';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: number;
  guestName?: string;
  guestEmail?: string;
  trigger?: 'post-booking' | 'prompt' | 'manual';
}

export default function ReviewModal({
  isOpen,
  onClose,
  bookingId,
  guestName,
  guestEmail,
  trigger = 'manual'
}: ReviewModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSuccess = () => {
    // Auto-close modal after successful submission
    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  if (!isOpen) return null;

  const getModalTitle = () => {
    switch (trigger) {
      case 'post-booking':
        return 'How was your stay?';
      case 'prompt':
        return 'Share your experience';
      default:
        return 'Leave a Review';
    }
  };

  const getModalSubtitle = () => {
    switch (trigger) {
      case 'post-booking':
        return 'We hope you had a wonderful time at Kampo Ibayo!';
      case 'prompt':
        return 'Your feedback helps us improve and helps future guests';
      default:
        return 'Tell us about your experience at our resort';
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white p-6 relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="pr-12">
            <h2 className="text-2xl font-bold mb-2">{getModalTitle()}</h2>
            <p className="text-blue-100 text-sm">{getModalSubtitle()}</p>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6">
            <ReviewSubmissionForm
              initialBookingId={bookingId}
              initialGuestName={guestName}
              initialGuestEmail={guestEmail}
              onSuccess={handleSuccess}
              isModal={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}