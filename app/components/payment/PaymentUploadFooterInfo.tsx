"use client";

export default function PaymentUploadFooterInfo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground py-2">
      <span className="flex items-center gap-1.5">
        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
        Verified within 24hrs
      </span>
      <span className="flex items-center gap-1.5">
        <div className="w-2 h-2 bg-primary rounded-full"></div>
        Email confirmation
      </span>
      <span className="flex items-center gap-1.5">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        AI auto-fill enabled
      </span>
    </div>
  );
}
