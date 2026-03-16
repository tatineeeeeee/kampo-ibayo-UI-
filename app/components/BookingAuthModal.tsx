'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, CalendarHeart, LogIn, UserPlus } from 'lucide-react';

interface BookingAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingAuthModal({ isOpen, onClose }: BookingAuthModalProps) {
  const router = useRouter();

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  const handleCreateAccount = () => {
    handleClose();
    router.push('/auth?tab=signup');
  };

  const handleLogin = () => {
    handleClose();
    router.push('/auth?tab=login');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300"
      onClick={handleClose}
    >
      <div
        className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient bar */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <span className="text-white font-semibold text-sm tracking-wide uppercase">
            Kampo Ibayo Resort
          </span>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-8 text-center">
          {/* Icon */}
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/15 border border-blue-500/30 mx-auto mb-5">
            <CalendarHeart className="w-8 h-8 text-blue-400" />
          </div>

          {/* Headline */}
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-snug">
            One Step Away From<br />Your Kampo Ibayo Stay!
          </h2>

          {/* Description */}
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-8">
            Create a free account to manage your bookings, receive confirmation
            emails, and track your reservation status — all in one place.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCreateAccount}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-900/30"
            >
              <UserPlus className="w-4 h-4" />
              Create Account
            </button>
            <button
              onClick={handleLogin}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white hover:bg-gray-800 font-semibold rounded-xl transition-all duration-200"
            >
              <LogIn className="w-4 h-4" />
              Log In
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        .animate-modal-in {
          animation: modal-in 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
