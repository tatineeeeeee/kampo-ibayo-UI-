// Receipt Management Component for Kampo Ibayo Resort
import React, { useState } from 'react';
import { Download, Mail, Loader2 } from 'lucide-react';
import { useToast } from './Toast';
import { Tables } from '../../database.types';

type Booking = Tables<'bookings'>;

interface ReceiptManagerProps {
  booking: Booking;
  userEmail: string;
  userName: string;
  hasVerifiedPayment: boolean;
}

export function ReceiptManager({ booking, userEmail, userName, hasVerifiedPayment }: ReceiptManagerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const { showToast } = useToast();

  // Enhanced validation: Only show for confirmed bookings with verified payment
  if (!hasVerifiedPayment || booking.status !== 'confirmed') {
    return null;
  }

  const handleDownloadReceipt = async () => {
    setIsDownloading(true);
    
    try {
      console.log(`📄 Downloading receipt for booking ${booking.id}...`);
      
      const response = await fetch('/api/user/download-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          userEmail,
          userName
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error occurred' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to download receipt`);
      }

      // Handle PDF download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Kampo-Ibayo-Receipt-${booking.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast({
        type: 'success',
        title: 'Receipt Downloaded!',
        message: 'Your payment receipt has been downloaded successfully.',
        duration: 4000
      });

      console.log(`✅ Receipt downloaded successfully for booking ${booking.id}`);

    } catch (error) {
      console.error('Receipt download error:', error);
      showToast({
        type: 'error',
        title: 'Download Failed',
        message: error instanceof Error ? error.message : 'Failed to download receipt. Please try again.',
        duration: 5000
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEmailReceipt = async () => {
    setIsEmailing(true);
    
    try {
      console.log(`📧 Emailing receipt for booking ${booking.id} to ${userEmail}...`);
      
      const response = await fetch('/api/user/generate-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          userEmail,
          userName
        }),
      });

      const result = await response.json().catch(() => ({ success: false, error: 'Network error occurred' }));

      if (!result.success) {
        throw new Error(result.error || `HTTP ${response.status}: Failed to send receipt via email`);
      }

      showToast({
        type: 'success',
        title: 'Receipt Sent!',
        message: `Your payment receipt has been sent to ${userEmail}. Please check your inbox.`,
        duration: 5000
      });

      console.log(`✅ Receipt emailed successfully for booking ${booking.id} to ${userEmail}`);

    } catch (error) {
      console.error('Email receipt error:', error);
      showToast({
        type: 'error',
        title: 'Email Failed',
        message: error instanceof Error ? error.message : 'Failed to send receipt via email. Please try again.',
        duration: 5000
      });
    } finally {
      setIsEmailing(false);
    }
  };

  return (
    <>
      {/* Download Receipt Button */}
      <button
        onClick={handleDownloadReceipt}
        disabled={isDownloading || isEmailing}
        className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
        title="Download official receipt as PDF"
      >
        {isDownloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="hidden sm:inline">Downloading...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Receipt</span>
          </>
        )}
      </button>

      {/* Email Receipt Button */}
      <button
        onClick={handleEmailReceipt}
        disabled={isDownloading || isEmailing}
        className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
        title="Email official receipt to your registered email"
      >
        {isEmailing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="hidden sm:inline">Sending...</span>
          </>
        ) : (
          <>
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Email</span>
          </>
        )}
      </button>
    </>
  );
}

export default ReceiptManager;