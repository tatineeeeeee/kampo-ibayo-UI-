"use client";

import { Lightbulb, CreditCard, Smartphone, Upload, CheckCircle2 } from "lucide-react";

export function PaymentProcessInfo() {
  return (
    <div className="bg-primary/15 border border-primary/50 rounded-lg p-3 sm:p-4">
      <h3 className="text-foreground font-semibold text-sm mb-2 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-primary/80" />
        Complete Your Booking
      </h3>
      <p className="text-primary text-xs sm:text-sm mb-2">
        Your bookings are <strong>pending</strong> until you upload payment proof. Here&apos;s how:
      </p>
      <div className="space-y-1 text-primary text-xs">
        <div className="flex items-center gap-2">
          <CreditCard className="w-3 h-3 text-primary flex-shrink-0" />
          <p>Pay 50% down payment via GCash or Maya</p>
        </div>
        <div className="flex items-center gap-2">
          <Smartphone className="w-3 h-3 text-primary flex-shrink-0" />
          <p>Take a screenshot/photo of your payment receipt</p>
        </div>
        <div className="flex items-center gap-2">
          <Upload className="w-3 h-3 text-primary flex-shrink-0" />
          <p>Click &quot;Upload Payment Proof&quot; on your booking</p>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
          <p>Admin will review and confirm your booking within 24 hours</p>
        </div>
      </div>
    </div>
  );
}
