// Receipt Management Component for Kampo Ibayo Resort
import React, { useState } from "react";
import { Download, Mail, Loader2 } from "lucide-react";
import { useToast } from "./Toast";
import { supabase } from "@/app/supabaseClient";
import { Tables } from "../../database.types";

type Booking = Tables<"bookings">;

interface ReceiptManagerProps {
  booking: Booking;
  userEmail: string;
  userName: string;
  hasVerifiedPayment: boolean;
}

export function ReceiptManager({
  booking,
  userEmail,
  userName,
  hasVerifiedPayment,
}: ReceiptManagerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const { showToast } = useToast();

  // Enhanced validation: Only show for confirmed bookings with verified payment
  if (!hasVerifiedPayment || booking.status !== "confirmed") {
    return null;
  }

  const handleDownloadReceipt = async () => {
    setIsDownloading(true);

    try {
      const { getFreshSession } = await import("../utils/apiTimeout");
      const session = await getFreshSession(supabase);
      if (!session?.access_token) {
        showToast({
          type: "error",
          title: "Authentication Error",
          message: "You must be logged in to download a receipt.",
          duration: 5000,
        });
        return;
      }

      const response = await fetch("/api/user/download-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          userEmail,
          userName,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Network error occurred" }));
        throw new Error(
          errorData.error ||
            `HTTP ${response.status}: Failed to download receipt`
        );
      }

      // Handle PDF download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Kampo-Ibayo-Receipt-${booking.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast({
        type: "success",
        title: "Receipt Downloaded!",
        message: "Your payment receipt has been downloaded successfully.",
        duration: 4000,
      });

    } catch (error) {
      console.error("Receipt download error:", error);
      showToast({
        type: "error",
        title: "Download Failed",
        message:
          error instanceof Error
            ? error.message
            : "Failed to download receipt. Please try again.",
        duration: 5000,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEmailReceipt = async () => {
    setIsEmailing(true);

    try {
      const { getFreshSession } = await import("../utils/apiTimeout");
      const session = await getFreshSession(supabase);
      if (!session?.access_token) {
        showToast({
          type: "error",
          title: "Authentication Error",
          message: "You must be logged in to email a receipt.",
          duration: 5000,
        });
        return;
      }

      const response = await fetch("/api/user/generate-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          userEmail,
          userName,
        }),
      });

      const result = await response
        .json()
        .catch(() => ({ success: false, error: "Network error occurred" }));

      if (!result.success) {
        throw new Error(
          result.error ||
            `HTTP ${response.status}: Failed to send receipt via email`
        );
      }

      showToast({
        type: "success",
        title: "Receipt Sent!",
        message: `Your payment receipt has been sent to ${userEmail}. Please check your inbox.`,
        duration: 5000,
      });

    } catch (error) {
      console.error("Email receipt error:", error);
      showToast({
        type: "error",
        title: "Email Failed",
        message:
          error instanceof Error
            ? error.message
            : "Failed to send receipt via email. Please try again.",
        duration: 5000,
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
        className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 min-h-[44px] w-full sm:w-auto"
        title="Download official receipt as PDF"
      >
        {isDownloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="inline sm:inline">Downloading...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span className="inline sm:inline">Receipt</span>
          </>
        )}
      </button>

      {/* Email Receipt Button */}
      <button
        onClick={handleEmailReceipt}
        disabled={isDownloading || isEmailing}
        className="flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 min-h-[44px] w-full sm:w-auto"
        title="Email official receipt to your registered email"
      >
        {isEmailing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="inline sm:inline">Sending...</span>
          </>
        ) : (
          <>
            <Mail className="w-4 h-4" />
            <span className="inline sm:inline">Email</span>
          </>
        )}
      </button>
    </>
  );
}

export default ReceiptManager;
