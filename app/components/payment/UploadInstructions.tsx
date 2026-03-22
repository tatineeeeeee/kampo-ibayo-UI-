"use client";

import React from "react";
import {
  CreditCard,
  Smartphone,
  Wallet,
  Copy,
  User,
  Phone,
  Info,
} from "lucide-react";

interface UploadInstructionsProps {
  handleCopyNumber: (number: string, method: string) => void;
}

export default function UploadInstructions({
  handleCopyNumber,
}: UploadInstructionsProps) {
  return (
    <div className="bg-gradient-to-br from-green-900/40 to-green-800/30 border border-green-500/50 rounded-xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-green-200 flex items-center gap-2 text-lg">
          <div className="bg-green-600/30 p-2 rounded-full">
            <Smartphone className="w-5 h-5 text-green-400" />
          </div>
          Send Payment Here
        </h2>
        <span className="bg-green-600/30 text-green-300 text-xs px-2 py-1 rounded-full">
          Step 1
        </span>
      </div>

      {/* Single Payment Card - Same number for both */}
      <div className="bg-card/70 rounded-xl p-4 sm:p-5 border border-border">
        {/* Logos */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="flex items-center gap-2 bg-primary/20 px-3 py-1.5 rounded-full">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-primary/80 text-sm font-medium">GCash</span>
          </div>
          <span className="text-muted-foreground">or</span>
          <div className="flex items-center gap-2 bg-green-600/20 px-3 py-1.5 rounded-full">
            <CreditCard className="w-4 h-4 text-green-400" />
            <span className="text-green-300 text-sm font-medium">Maya</span>
          </div>
        </div>

        {/* Phone Number - Large & Centered */}
        <div className="text-center py-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground text-xs uppercase tracking-wider">
              Mobile Number
            </span>
          </div>
          <p className="font-mono text-3xl sm:text-4xl font-bold text-foreground tracking-widest mb-3">
            0966 281 5123
          </p>
          <button
            type="button"
            onClick={() => handleCopyNumber("09662815123", "Payment")}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-foreground px-6 py-2.5 rounded-lg transition-colors font-medium"
          >
            <Copy className="w-4 h-4" />
            Copy Number
          </button>
        </div>

        {/* Account Name */}
        <div className="mt-4 pt-4 border-t border-border text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <User className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 text-xs">Account Name</span>
          </div>
          <p className="text-yellow-100 font-bold text-xl tracking-wide">
            KAMPO IBAYO
          </p>
        </div>
      </div>

      <p className="text-green-400/70 text-xs mt-3 text-center flex items-center justify-center gap-1">
        <Info className="w-3 h-3" /> Same number works for both GCash and
        Maya
      </p>
    </div>
  );
}
