"use client";

import { FaLightbulb } from "react-icons/fa";

interface PaymentTypeSelectorProps {
  paymentType: "half" | "full";
  setPaymentType: (type: "half" | "full") => void;
  estimatedPrice: number | null;
}

export default function PaymentTypeSelector({
  paymentType,
  setPaymentType,
  estimatedPrice,
}: PaymentTypeSelectorProps) {
  return (
    <>
      <label className="block text-sm font-semibold mb-3 text-foreground">
        Payment Option <span className="text-destructive">*</span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        {/* 50% Down */}
        <button
          type="button"
          onClick={() => setPaymentType("half")}
          className={`p-3 rounded-xl border-2 transition-all duration-200 text-left ${
            paymentType === "half"
              ? "bg-primary border-primary shadow-md shadow-primary/25"
              : "bg-muted/30 border-border hover:border-primary"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                paymentType === "half" ? "border-white bg-white" : "border-muted-foreground/50"
              }`}
            >
              {paymentType === "half" && <div className="w-2 h-2 bg-primary rounded-full" />}
            </div>
            <span
              className={`font-bold text-sm ${
                paymentType === "half" ? "text-white" : "text-foreground"
              }`}
            >
              50% Down
            </span>
          </div>
          <p className={`text-xs ml-6 ${paymentType === "half" ? "text-white/75" : "text-muted-foreground"}`}>
            Pay half now
          </p>
          {estimatedPrice !== null && estimatedPrice > 0 && (
            <div className={`text-base font-bold ml-6 mt-1 ${paymentType === "half" ? "text-white" : "text-primary"}`}>
              ₱{Math.round(estimatedPrice * 0.5).toLocaleString()}
            </div>
          )}
        </button>

        {/* Full Payment */}
        <button
          type="button"
          onClick={() => setPaymentType("full")}
          className={`p-3 rounded-xl border-2 transition-all duration-200 text-left ${
            paymentType === "full"
              ? "bg-success border-success shadow-md shadow-success/25"
              : "bg-muted/30 border-border hover:border-success"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                paymentType === "full" ? "border-white bg-white" : "border-muted-foreground/50"
              }`}
            >
              {paymentType === "full" && <div className="w-2 h-2 bg-success rounded-full" />}
            </div>
            <span
              className={`font-bold text-sm ${
                paymentType === "full" ? "text-white" : "text-foreground"
              }`}
            >
              Full Payment
            </span>
          </div>
          <p className={`text-xs ml-6 ${paymentType === "full" ? "text-white/75" : "text-muted-foreground"}`}>
            Pay in full upfront
          </p>
          {estimatedPrice !== null && estimatedPrice > 0 && (
            <div className={`text-base font-bold ml-6 mt-1 ${paymentType === "full" ? "text-white" : "text-success"}`}>
              ₱{estimatedPrice.toLocaleString()}
            </div>
          )}
        </button>
      </div>

      <p className="text-xs text-muted-foreground flex items-start gap-2 mt-3">
        <FaLightbulb className="w-3.5 h-3.5 text-warning mt-0.5 flex-shrink-0" />
        <span>
          {paymentType === "half"
            ? "Down payment secures your booking. Settle the balance on arrival."
            : "Full payment — no additional payments needed on arrival!"}
        </span>
      </p>
    </>
  );
}
