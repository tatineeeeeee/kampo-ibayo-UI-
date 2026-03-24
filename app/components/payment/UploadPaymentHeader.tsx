"use client";

import { ArrowLeft, CreditCard } from "lucide-react";

interface UploadPaymentHeaderProps {
  bookingId?: number;
  onBack: () => void;
}

export default function UploadPaymentHeader({
  bookingId,
  onBack,
}: UploadPaymentHeaderProps) {
  return (
    <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/50 z-10">
      <div className="px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-card hover:bg-muted rounded-lg transition-colors"
              title="Back to Bookings"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            </button>
            <div className="text-foreground">
              <h1 className="text-lg sm:text-xl font-bold">
                Upload Payment Proof
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Booking #{bookingId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <span className="hidden sm:inline text-sm text-muted-foreground">
              Secure Upload
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
