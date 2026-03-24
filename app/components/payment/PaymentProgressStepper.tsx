"use client";

import { Check } from "lucide-react";

interface PaymentProgressStepperProps {
  hasProofImage: boolean;
  uploadSuccess: boolean;
}

export default function PaymentProgressStepper({
  hasProofImage,
  uploadSuccess,
}: PaymentProgressStepperProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-foreground font-bold text-xs shadow-lg shadow-primary/30">
          <Check className="w-4 h-4" />
        </div>
        <span className="text-xs text-primary font-medium hidden sm:inline">
          Pay
        </span>
      </div>

      <div
        className={`w-8 sm:w-16 h-1 rounded-full transition-all duration-500 ${
          hasProofImage ? "bg-primary" : "bg-muted"
        }`}
      ></div>

      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
            hasProofImage
              ? "bg-primary text-foreground shadow-lg shadow-primary/30"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {hasProofImage ? <Check className="w-4 h-4" /> : "2"}
        </div>
        <span
          className={`text-xs font-medium hidden sm:inline ${
            hasProofImage ? "text-primary" : "text-muted-foreground"
          }`}
        >
          Upload
        </span>
      </div>

      <div
        className={`w-8 sm:w-16 h-1 rounded-full transition-all duration-500 ${
          uploadSuccess ? "bg-green-500" : "bg-muted"
        }`}
      ></div>

      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
            uploadSuccess
              ? "bg-green-600 text-foreground shadow-lg shadow-green-600/30"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {uploadSuccess ? <Check className="w-4 h-4" /> : "3"}
        </div>
        <span
          className={`text-xs font-medium hidden sm:inline ${
            uploadSuccess ? "text-green-400" : "text-muted-foreground"
          }`}
        >
          Done
        </span>
      </div>
    </div>
  );
}
