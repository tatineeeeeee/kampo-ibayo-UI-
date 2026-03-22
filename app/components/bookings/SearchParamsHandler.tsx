"use client";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Component that handles search params logic (wrapped in Suspense)
export function SearchParamsHandler({
  onPaymentUploaded,
}: {
  onPaymentUploaded: () => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasShownSuccessRef = useRef(false);

  useEffect(() => {
    const paymentUploaded = searchParams.get("payment_uploaded");
    if (paymentUploaded === "true" && !hasShownSuccessRef.current) {
      hasShownSuccessRef.current = true;
      onPaymentUploaded();

      // Clean up the URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("payment_uploaded");
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [searchParams, onPaymentUploaded, router]);

  return null;
}
