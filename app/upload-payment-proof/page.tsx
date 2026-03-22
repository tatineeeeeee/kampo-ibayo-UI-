"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import Image from "next/image";
import {
  Upload,
  FileImage,
  CreditCard,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Check,
  Camera,
  Zap,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import { useToastHelpers } from "../components/Toast";
import type { BookingWithPayment, PaymentHistoryEntry, PaymentSummary, PaymentValidation, EnhancedOCRResult, OCRProgress, ExtractedPaymentData, ValidationResult } from "../lib/types";
import OCRResultDisplay from "../components/payment/OCRResultDisplay";
import PaymentHistoryList from "../components/payment/PaymentHistoryList";
import PaymentMethodSelector from "../components/payment/PaymentMethodSelector";
import UploadInstructions from "../components/payment/UploadInstructions";
import BookingDetailsSummary from "../components/payment/BookingDetailsSummary";

function UploadPaymentProofContent() {
  const toast = useToastHelpers();
  const [booking, setBooking] = useState<BookingWithPayment | null>(null);
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isResubmission, setIsResubmission] = useState(false);
  const [ocrResult, setOcrResult] = useState<EnhancedOCRResult | null>(null);
  const [ocrProgress, setOcrProgress] = useState<OCRProgress>({
    stage: "idle",
    progress: 0,
    detected: {},
  });
  const [showOCREditor, setShowOCREditor] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);

  // Copy to clipboard with toast
  const handleCopyNumber = (number: string, method: string) => {
    navigator.clipboard.writeText(number);
    setCopyToast(`${method} number copied!`);
    setTimeout(() => setCopyToast(null), 2000);
  };

  // Payment history state
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[]>(
    []
  );
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    totalPaid: 0,
    pendingAmount: 0,
    totalSubmissions: 0,
  });
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [isManualAmountSet, setIsManualAmountSet] = useState(false); // Track if user manually set amount

  // Payment validation state
  const [paymentValidation, setPaymentValidation] = useState<PaymentValidation>(
    {
      level: "none",
      message: "",
      allowSubmission: true,
    }
  );
  const [confirmUnusualAmount, setConfirmUnusualAmount] = useState(false);
  const [confirmUnrecognizedImage, setConfirmUnrecognizedImage] = useState(false);

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  // Get booking ID directly from search params (support multiple parameter names)
  const bookingId =
    searchParams.get("bookingId") ||
    searchParams.get("booking_id") ||
    searchParams.get("booking");

  // Debug logging

  // Calculate remaining balance after verified payments only
  // Pending proofs are NOT subtracted — they're unverified and user should still be able to submit
  const verifiedPaidAmount = paymentSummary.totalPaid;
  const pendingAmount = paymentSummary.pendingAmount;
  // Use payment_amount (the amount they need to pay based on payment type) instead of total_amount
  const expectedPaymentAmount =
    booking?.payment_amount || booking?.total_amount || 0;
  const remainingAmount = booking
    ? Math.max(0, expectedPaymentAmount - verifiedPaidAmount)
    : 0;

  // Enhanced OCR preprocessing function
  const preprocessImage = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new globalThis.Image();

      img.onload = () => {
        // Set optimal size for OCR (1200-2000px width works best)
        const maxWidth = 1600;
        const scale = Math.min(maxWidth / img.width, maxWidth / img.height, 2); // Cap at 2x upscaling

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // Apply image enhancements for better OCR
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Enhance contrast and reduce noise for better text recognition
        ctx.filter = "contrast(1.3) brightness(1.1) saturate(0.7) blur(0.3px)";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(
                new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: file.lastModified,
                })
              );
            } else {
              resolve(file); // Fallback to original if preprocessing fails
            }
          },
          "image/jpeg",
          0.92
        );
      };

      img.onerror = () => resolve(file); // Fallback to original on error
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Enhanced pattern matching for different payment services
  const extractPaymentDataEnhanced = useCallback(
    (ocrText: string): ExtractedPaymentData | null => {
      const patterns = {
        gcash: {
          amount:
            /(?:amount|total|you\s+sent|php|₱)\s*:?\s*₱?\s*([\d,]+\.?\d*)/gi,
          reference:
            /(?:reference|ref|transaction|trx)\s*(?:no|number|id)?\s*:?\s*([A-Z0-9]{8,})/gi,
        },
        maya: {
          amount: /(?:you\s+paid|amount|total|sent|[-–—]\s*₱|₱)\s*:?\s*₱?\s*([\d,]+\.?\d*)/gi,
          reference:
            /(?:reference|receipt|transaction)\s*(?:number|no|id)?\s*:?\s*([A-Z0-9]{6,})/gi,
        },
        bank: {
          amount: /(?:amount|php|₱|credit)\s*:?\s*₱?\s*([\d,]+\.?\d*)/gi,
          reference:
            /(?:reference|confirmation|transaction|trace)\s*(?:number|no|code|id)?\s*:?\s*([A-Z0-9]{6,})/gi,
        },
      };

      const results = [];
      for (const [service, servicePatterns] of Object.entries(patterns)) {
        let amountMatch;
        let refMatch;
        let confidence = 0;

        // Try multiple matches for amount
        const amounts: number[] = [];
        while ((amountMatch = servicePatterns.amount.exec(ocrText)) !== null) {
          const amount = parseFloat(amountMatch[1].replace(/,/g, ""));
          if (amount > 0 && amount < 1000000) {
            // Reasonable range check
            amounts.push(amount);
            confidence += 25;
          }
        }

        // Try multiple matches for reference
        const references: string[] = [];
        while ((refMatch = servicePatterns.reference.exec(ocrText)) !== null) {
          if (refMatch[1].length >= 6) {
            references.push(refMatch[1]);
            confidence += 25;
          }
        }

        if (amounts.length > 0 || references.length > 0) {
          results.push({
            service,
            amount: amounts.length > 0 ? amounts[0] : null, // Take first valid amount
            reference: references.length > 0 ? references[0] : null, // Take first valid reference
            confidence: Math.min(confidence, 100),
          });
        }
      }

      return results.sort((a, b) => b.confidence - a.confidence)[0] || null;
    },
    []
  );

  // Smart validation against booking data
  const validateOCRResult = useCallback(
    (
      result: ExtractedPaymentData | null,
      booking: BookingWithPayment
    ): ValidationResult => {
      const warnings: string[] = [];
      const suggestions: Array<{ type: string; expectedAmount?: number }> = [];

      if (!result || !booking) {
        return {
          isValid: false,
          warnings: ["Invalid data for validation"],
          suggestions: [],
        };
      }

      // Validate amount against expected payment
      if (result.amount && typeof result.amount === "number") {
        const expectedAmount =
          booking.payment_amount || booking.total_amount * 0.5;
        const difference = Math.abs(result.amount - expectedAmount);
        const percentDiff = (difference / expectedAmount) * 100;

        if (percentDiff > 50) {
          warnings.push(
            `Detected amount (₱${result.amount.toLocaleString()}) differs significantly from expected (₱${expectedAmount.toLocaleString()})`
          );
          suggestions.push({ type: "amount", expectedAmount });
        }
        // Note: Minor differences (10-50%) are handled by payment validation, not here

        // Check for common amount mistakes
        if (result.amount < 100) {
          warnings.push("Detected amount seems unusually low");
        }
        if (result.amount > booking.total_amount * 2) {
          warnings.push("Detected amount seems unusually high");
        }
      }

      // Validate reference number format
      if (result.reference && typeof result.reference === "string") {
        const refPattern = /^[A-Z0-9]{6,}$/;
        if (!refPattern.test(result.reference)) {
          warnings.push("Reference number format may be incorrect");
        }
        if (result.reference.length < 6) {
          warnings.push("Reference number seems too short");
        }
      }

      return {
        isValid: warnings.length === 0,
        warnings,
        suggestions,
      };
    },
    []
  );

  // Smart payment amount validation
  const validatePaymentAmount = useCallback(
    (enteredAmount: number): PaymentValidation => {
      if (!booking || enteredAmount <= 0) {
        return {
          level: "error",
          message: "Amount must be greater than zero",
          allowSubmission: false,
        };
      }

      const expectedAmount = booking.payment_amount || booking.total_amount;
      const totalBookingAmount = booking.total_amount;
      const verifiedPaid = paymentSummary.totalPaid;
      const actualRemaining = Math.max(
        0,
        expectedAmount - verifiedPaid
      );

      // Compare against remaining balance when there are verified payments, otherwise full expected amount
      const compareTarget = verifiedPaid > 0 ? actualRemaining : expectedAmount;
      const difference = Math.abs(enteredAmount - compareTarget);
      const percentDiff =
        compareTarget > 0 ? (difference / compareTarget) * 100 : 0;

      // Critical errors that block submission
      if (enteredAmount > totalBookingAmount * 3) {
        return {
          level: "error",
          message: `Amount (₱${enteredAmount.toLocaleString()}) is unreasonably high. Maximum allowed: ₱${(
            totalBookingAmount * 2
          ).toLocaleString()}`,
          allowSubmission: false,
        };
      }

      if (enteredAmount > totalBookingAmount && percentDiff > 20) {
        return {
          level: "error",
          message: `Amount exceeds total booking cost of ₱${totalBookingAmount.toLocaleString()}. Please verify.`,
          allowSubmission: false,
        };
      }

      // Strong warnings that require confirmation
      if (enteredAmount < 100 && expectedAmount > 1000) {
        return {
          level: "warning",
          message:
            "Payment amount seems unusually small. Please confirm this is correct.",
          allowSubmission: true,
          suggestions: [
            {
              type: "expectedAmount" as const,
              amount: expectedAmount,
              label: `Expected: ₱${expectedAmount.toLocaleString()}`,
            },
          ],
        };
      }

      // UNDERPAYMENT WARNING - Any amount less than required needs confirmation
      if (enteredAmount < actualRemaining && actualRemaining > 0) {
        const shortfall = actualRemaining - enteredAmount;
        return {
          level: "warning",
          message: `You're paying ₱${shortfall.toLocaleString()} less than required (₱${actualRemaining.toLocaleString()}). Confirm this is a partial payment.`,
          allowSubmission: true,
          suggestions: [
            {
              type: "expectedAmount" as const,
              amount: actualRemaining,
              label: `Pay Full: ₱${actualRemaining.toLocaleString()}`,
            },
          ],
        };
      }

      if (percentDiff > 80) {
        const suggestions: Array<{
          type: "expectedAmount" | "partialPayment" | "fullPayment";
          amount: number;
          label: string;
        }> = [];

        if (booking.payment_type === "half") {
          suggestions.push({
            type: "partialPayment" as const,
            amount: booking.total_amount / 2,
            label: `50% Payment: ₱${(
              booking.total_amount / 2
            ).toLocaleString()}`,
          });
        }

        suggestions.push({
          type: "fullPayment" as const,
          amount: booking.total_amount,
          label: `Full Payment: ₱${booking.total_amount.toLocaleString()}`,
        });

        if (actualRemaining > 0 && actualRemaining !== expectedAmount) {
          suggestions.push({
            type: "expectedAmount" as const,
            amount: actualRemaining,
            label: `Remaining: ₱${actualRemaining.toLocaleString()}`,
          });
        }

        return {
          level: "warning",
          message: `Amount differs significantly from expected ₱${expectedAmount.toLocaleString()}. Please confirm this is correct.`,
          allowSubmission: true,
          suggestions,
        };
      }

      // Minor warnings (informational) - Still require confirmation for safety
      if (percentDiff > 25) {
        return {
          level: "warning",
          message: `Amount differs from expected ₱${expectedAmount.toLocaleString()}. Please verify this is correct.`,
          allowSubmission: true,
          suggestions: [
            {
              type: "expectedAmount" as const,
              amount: expectedAmount,
              label: `Expected: ₱${expectedAmount.toLocaleString()}`,
            },
          ],
        };
      }

      // Even small differences should trigger warning for amounts that don't match common patterns
      if (percentDiff > 10 && percentDiff <= 25) {
        // Check if it's not a common payment pattern (50%, 100%, or remaining balance)
        const isHalfPayment =
          Math.abs(enteredAmount - totalBookingAmount / 2) < 100;
        const isFullPayment =
          Math.abs(enteredAmount - totalBookingAmount) < 100;
        const isRemainingBalance =
          actualRemaining > 0 &&
          Math.abs(enteredAmount - actualRemaining) < 100;

        if (!isHalfPayment && !isFullPayment && !isRemainingBalance) {
          return {
            level: "warning",
            message: `Amount (₱${enteredAmount.toLocaleString()}) doesn't match expected ₱${expectedAmount.toLocaleString()}. Please confirm.`,
            allowSubmission: true,
            suggestions: [
              {
                type: "expectedAmount" as const,
                amount: expectedAmount,
                label: `Expected: ₱${expectedAmount.toLocaleString()}`,
              },
            ],
          };
        }
      }

      // Check against remaining balance
      if (actualRemaining > 0 && enteredAmount > actualRemaining * 1.5) {
        return {
          level: "warning",
          message: `Amount is higher than remaining balance of ₱${actualRemaining.toLocaleString()}. Please confirm.`,
          allowSubmission: true,
          suggestions: [
            {
              type: "expectedAmount" as const,
              amount: actualRemaining,
              label: `Remaining: ₱${actualRemaining.toLocaleString()}`,
            },
          ],
        };
      }

      return {
        level: "none",
        message: "",
        allowSubmission: true,
      };
    },
    [booking, paymentSummary]
  );

  // Function to fetch payment history - now optional with graceful degradation
  const fetchPaymentHistory = useCallback(
    async (bookingId: string) => {
      if (!user?.id) return;

      try {
        const { getFreshSession } = await import("../utils/apiTimeout");
        const session = await getFreshSession(supabase);
        const response = await fetch(
          `/api/user/payment-history/${bookingId}`,
          {
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
            },
          }
        );

        if (!response.ok) {
          console.warn(
            "⚠️ Payment history API returned error:",
            response.status,
            response.statusText
          );

          // If it's a 404, the API route might not exist - that's ok for basic functionality
          if (response.status === 404) {
            return;
          }

          // For other errors, try to get more details but don't fail the entire page
          try {
            const errorText = await response.text();
            console.error(
              "🔍 Payment history API error details:",
              errorText.substring(0, 200)
            );
          } catch (textError) {
            console.warn("Could not read error response text:", textError);
          }
          return;
        }

        // Check if response is actually JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.warn(
            "⚠️ Payment history API returned non-JSON response:",
            contentType
          );
          const text = await response.text();
          console.warn(
            "Response text (first 200 chars):",
            text.substring(0, 200)
          );
          return;
        }

        const data = await response.json();

        if (data.success) {
          setPaymentHistory(data.paymentHistory || []);
          setPaymentSummary(
            data.paymentSummary || {
              totalPaid: 0,
              pendingAmount: 0,
              totalSubmissions: 0,
            }
          );
        } else {
          console.warn(
            "⚠️ Payment history API returned success=false:",
            data.error
          );
        }
      } catch (error) {
        console.warn(
          "⚠️ Non-critical error fetching payment history (page will continue):",
          error
        );
        if (error instanceof SyntaxError && error.message.includes("JSON")) {
          console.warn(
            "💡 JSON parsing failed - server may have returned HTML error page or malformed JSON"
          );
        }

        // Don't propagate this error - payment history is optional for core functionality
      }
    },
    [user?.id]
  );

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) return;

      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", parseInt(bookingId || "0"))
          .eq("user_id", user?.id || "") // Ensure user can only access their own bookings
          .single();

        if (error) {
          setError("Booking not found or access denied");
          return;
        }

        setBooking(data);

        // Fetch existing payment proofs for this booking
        const { data: proofs, error: proofsError } = await supabase
          .from("payment_proofs")
          .select(
            "id, status, admin_notes, uploaded_at, reference_number, payment_method, amount"
          )
          .eq("booking_id", parseInt(bookingId || "0"))
          .eq("user_id", user?.id || "")
          .order("uploaded_at", { ascending: false });

        if (proofsError) {
          console.warn("Could not fetch existing proofs:", proofsError);
        } else {
          // Payment history loaded successfully

          // Check if this is a resubmission (has rejected proofs)
          const hasRejectedProofs = proofs?.some(
            (proof) => proof.status === "rejected"
          );
          setIsResubmission(hasRejectedProofs || false);
        }

        // Don't auto-set amount on booking load - let it start empty for OCR workflow
        // const calculatedPaymentAmount = data.payment_amount || (data.total_amount * 0.5);
        // setAmount(calculatedPaymentAmount.toString());

        // Try to fetch payment history for balance calculations (non-critical)
        try {
          await fetchPaymentHistory(bookingId);
        } catch (historyError) {
          console.warn(
            "⚠️ Payment history failed to load (non-critical):",
            historyError
          );
          // Continue without payment history - core functionality still works
        }
      } catch (error) {
        setError("Failed to fetch booking details");
        console.error("Error fetching booking:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (authLoading) return;
    if (!user) {
      router.push("/auth");
      return;
    }

    if (bookingId) {
      fetchBookingDetails();
    } else {
      console.error("No booking ID found in URL parameters");
      setError("No booking ID provided");
      setIsLoading(false);

      // Auto-redirect to bookings after 3 seconds if no booking ID
      setTimeout(() => {
        router.replace("/bookings");
      }, 3000);
    }
  }, [bookingId, user, authLoading, router, fetchPaymentHistory]);

  // Auto-populate amount from OCR detection when available
  // This triggers after OCR processing completes
  useEffect(() => {
    if (ocrResult?.amount && !isManualAmountSet) {
      setAmount(ocrResult.amount.toString());
    }
  }, [ocrResult?.amount, isManualAmountSet]); // More specific dependency

  // Validate payment amount whenever it changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0 && booking) {
      const validation = validatePaymentAmount(parseFloat(amount));
      setPaymentValidation(validation);
      // Reset confirmation when amount changes
      setConfirmUnusualAmount(false);
    } else {
      setPaymentValidation({
        level: "none",
        message: "",
        allowSubmission: true,
      });
      setConfirmUnusualAmount(false);
    }
  }, [amount, booking, validatePaymentAmount]);

  // Cleanup OCR worker on unmount
  useEffect(() => {
    return () => {
      // Cleanup the enhanced OCR service worker
      import("../utils/ocrService")
        .then(({ OCRService }) => {
          OCRService.terminateWorker().catch(console.warn);
        })
        .catch(() => {
          // Ignore import errors during cleanup
        });
    };
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File Too Large", "File size must be less than 5MB.");
        return;
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid File Type", "Only JPG, PNG, and GIF files are allowed.");
        return;
      }

      setProofImage(file);
      setError("");

      // Reset OCR state for new image
      setOcrResult(null);
      setAmount("");
      setReferenceNumber("");
      setPaymentMethod("");
      setIsManualAmountSet(false);
      setShowOCREditor(false);
      setConfirmUnrecognizedImage(false);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Start enhanced OCR processing
      setOcrProgress({
        stage: "preprocessing",
        progress: 10,
        detected: {},
        message: "Enhancing image quality...",
      });

      const startTime = Date.now();

      // Step 1: Preprocess image for better OCR accuracy
      const processedImage = await preprocessImage(file);
      setOcrProgress({
        stage: "analyzing",
        progress: 30,
        detected: {},
        message: "Analyzing payment details...",
      });

      // Step 2: Enhanced OCR Processing using professional OCR service
      let ocrResult: EnhancedOCRResult = {
        referenceNumber: null,
        amount: null,
        confidence: 0,
        method: "unknown",
        warnings: [],
        suggestions: [],
        processingTime: 0,
      };

      try {
        // Import and use the enhanced OCR service
        const { OCRService } = await import("../utils/ocrService");

        // Set up progress tracking for the advanced OCR
        setOcrProgress((prev) => ({
          ...prev,
          progress: 35,
          message: "Starting advanced OCR analysis...",
        }));

        // Use the professional OCR service for better accuracy
        const ocrServiceResult = await OCRService.processPaymentImage(
          processedImage
        );

        // Map OCR service result to our interface
        ocrResult = {
          referenceNumber: ocrServiceResult.referenceNumber,
          amount: ocrServiceResult.amount,
          confidence: ocrServiceResult.confidence,
          method: ocrServiceResult.method,
          warnings: ocrServiceResult.warnings || [],
          suggestions: ocrServiceResult.suggestions || [],
          processingTime:
            ocrServiceResult.processingTime || Date.now() - startTime,
        };

      } catch (ocrError) {
        console.error(
          "❌ Enhanced OCR service failed, falling back to basic processing:",
          ocrError
        );

        // Fallback to basic OCR if the enhanced service fails
        try {
          const { createWorker } = await import("tesseract.js");
          const worker = await createWorker("eng", 1, {
            logger: (m: { status: string; progress?: number }) => {
              if (m.status === "recognizing text") {
                const progress = Math.round((m.progress || 0) * 100);
                setOcrProgress((prev) => ({
                  ...prev,
                  progress: 30 + progress * 0.4,
                  message: `Fallback processing... ${progress}%`,
                }));
              }
            },
          });

          const {
            data: { text },
          } = await worker.recognize(processedImage);
          await worker.terminate();

          // Extract payment data using basic pattern matching
          const extracted = extractPaymentDataEnhanced(text);

          ocrResult = {
            referenceNumber: extracted?.reference || null,
            amount: extracted?.amount || null,
            confidence: extracted?.confidence || 0,
            method: extracted?.service || "unknown",
            warnings: ["Using fallback OCR processing"],
            suggestions: [],
            processingTime: Date.now() - startTime,
          };
        } catch (fallbackError) {
          console.error("❌ Fallback OCR also failed:", fallbackError);
          ocrResult.warnings = [
            "OCR processing failed - please enter details manually",
          ];
        }
      }

      setOcrProgress({
        stage: "validating",
        progress: 70,
        detected: {
          amount: ocrResult.amount ?? undefined,
          reference: ocrResult.referenceNumber ?? undefined,
          method: ocrResult.method !== "unknown" ? ocrResult.method : undefined,
        },
        message: "Validating detected information...",
      });

      // Step 3: Validate results against booking data
      if (booking && ocrResult) {
        const extractedData: ExtractedPaymentData = {
          service: ocrResult.method || "unknown",
          amount: ocrResult.amount,
          reference: ocrResult.referenceNumber,
          confidence: ocrResult.confidence,
        };
        const validation = validateOCRResult(extractedData, booking);
        ocrResult.warnings = [
          ...(ocrResult.warnings || []),
          ...validation.warnings,
        ];
        ocrResult.suggestions = [
          ...(ocrResult.suggestions || []),
          ...validation.suggestions,
        ];
      }

      // Step 4: Update progress with detected data
      const detectedData: {
        amount?: number;
        reference?: string;
        method?: string;
      } = {};
      if (ocrResult.amount) detectedData.amount = ocrResult.amount;
      if (ocrResult.referenceNumber)
        detectedData.reference = ocrResult.referenceNumber;
      if (ocrResult.method && ocrResult.method !== "unknown")
        detectedData.method = ocrResult.method;

      setOcrProgress({
        stage: "complete",
        progress: 100,
        detected: detectedData,
        message:
          Object.keys(detectedData).length > 0
            ? `Successfully detected ${
                Object.keys(detectedData).length
              } field(s)`
            : "Analysis complete - please fill details manually",
      });

      // Step 5: Auto-populate form fields
      let fieldsUpdated = 0;

      if (
        ocrResult.referenceNumber &&
        typeof ocrResult.referenceNumber === "string"
      ) {
        setReferenceNumber(ocrResult.referenceNumber);
        fieldsUpdated++;
      }

      if (
        ocrResult.amount &&
        typeof ocrResult.amount === "number" &&
        ocrResult.amount > 0
      ) {
        setAmount(ocrResult.amount.toString());
        setIsManualAmountSet(false);
        fieldsUpdated++;
      }

      if (ocrResult.method && ocrResult.method !== "unknown") {
        const methodMap: { [key: string]: string } = {
          gcash: "gcash",
          maya: "maya",
        };
        const mappedMethod = methodMap[ocrResult.method.toLowerCase()];
        if (mappedMethod) {
          setPaymentMethod(mappedMethod);
          fieldsUpdated++;
        }
      }

      // Store final result
      setOcrResult(ocrResult);

    } catch (error) {
      console.error("OCR processing failed:", error);
      setOcrProgress({
        stage: "error",
        progress: 0,
        detected: {},
        message: "Processing failed - please enter details manually",
      });
      setOcrResult({
        referenceNumber: null,
        amount: null,
        confidence: 0,
        method: "unknown",
        warnings: ["Processing failed - please enter details manually"],
        suggestions: [],
        processingTime: 0,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!proofImage || !paymentMethod || !amount || !booking) {
      toast.warning("Missing Fields", "Please fill all required fields and upload an image.");
      return;
    }

    // Check if reference number is required for selected payment method
    const requiresReference = ["gcash", "maya"].includes(paymentMethod);
    if (requiresReference && !referenceNumber.trim()) {
      const methodName = paymentMethod === "gcash" ? "GCash" : "Maya";
      toast.warning("Reference Required", `Reference number is required for ${methodName} payments.`);
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.warning("Invalid Amount", "Amount must be greater than 0.");
      return;
    }

    setIsUploading(true);
    setError("");

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      setIsUploading(false);
      setError("Upload timeout. Please try again.");
    }, 30000); // 30 second timeout

    try {

      // Import timeout utility
      const { withTimeout } = await import("../utils/apiTimeout");

      // Upload image to Supabase storage
      const fileExt = proofImage.name.split(".").pop();
      const fileName = `proof_${bookingId}_${Date.now()}.${fileExt}`;


      const { error: uploadError } = await withTimeout(
        supabase.storage.from("payment-proofs").upload(fileName, proofImage),
        30000, // 30 second timeout for file uploads
        "File upload timed out"
      );

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }


      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("payment-proofs").getPublicUrl(fileName);

      // Save payment proof record with validation context - Use auth.uid() which matches our database structure
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      // Prepare validation context for admin review
      const submissionAmount = parseFloat(amount);
      const fullExpectedAmount = booking.payment_amount || booking.total_amount;
      // Compare against remaining balance when there are verified payments
      const expectedAmount = paymentSummary.totalPaid > 0
        ? Math.max(0, fullExpectedAmount - paymentSummary.totalPaid)
        : fullExpectedAmount;
      const amountDifference = Math.abs(submissionAmount - expectedAmount);
      const percentDifference =
        expectedAmount > 0 ? (amountDifference / expectedAmount) * 100 : 0;

      // Create admin notes with validation context
      let adminValidationNotes = "";
      if (paymentValidation.level === "warning") {
        adminValidationNotes = `VALIDATION WARNING: ${paymentValidation.message}. User confirmed amount. `;
        adminValidationNotes += `Expected: ₱${expectedAmount.toLocaleString()}, Submitted: ₱${submissionAmount.toLocaleString()}, `;
        adminValidationNotes += `Difference: ₱${amountDifference.toLocaleString()} (${percentDifference.toFixed(
          1
        )}%)`;
      } else if (percentDifference > 5) {
        adminValidationNotes = `Amount differs from expected by ${percentDifference.toFixed(
          1
        )}%. `;
        adminValidationNotes += `Expected: ₱${expectedAmount.toLocaleString()}, Submitted: ₱${submissionAmount.toLocaleString()}`;
      }

      // Flag if OCR couldn't detect payment details from the image
      if (confirmUnrecognizedImage) {
        adminValidationNotes += adminValidationNotes ? " | " : "";
        adminValidationNotes += "OCR WARNING: Image not recognized as payment receipt. User confirmed manually.";
      }

      const { error: insertError } = await supabase
        .from("payment_proofs")
        .insert({
          booking_id: parseInt(bookingId || "0"),
          user_id: authUser?.id || "", // Use auth user ID which is what we store
          proof_image_url: publicUrl,
          reference_number: referenceNumber || null,
          payment_method: paymentMethod,
          amount: submissionAmount,
          status: "pending",
          // Add validation context for admin (if your schema supports it)
          admin_notes: adminValidationNotes || null,
        });

      if (insertError) {
        throw new Error(`Database error: ${insertError.message}`);
      }


      // CRITICAL: Update booking to trigger real-time admin updates
      try {

        const { data: updateData, error: updateError } = await supabase
          .from("bookings")
          .update({
            // Keep status as 'pending' but update payment_status to indicate payment proof uploaded
            payment_status: "payment_review", // This will trigger admin real-time subscription
            updated_at: new Date().toISOString(),
          })
          .eq("id", parseInt(bookingId || "0"))
          .eq("user_id", authUser?.id || "") // Ensure user can only update their own booking
          .select(); // Add select to return updated data for verification

        if (updateError) {
          console.error(
            "❌ Booking payment status update failed:",
            updateError
          );
          console.warn(
            "⚠️ Could not update booking payment status, but payment proof was uploaded successfully:",
            updateError
          );
          // This is not critical - admin can update status manually when reviewing proof
        } else {
        }
      } catch (updateErr) {
        console.warn(
          "⚠️ Booking payment status update failed, but payment proof upload was successful:",
          updateErr
        );
        // Continue with success flow - payment proof is the important part
      }

      // Success - Show success state briefly, then redirect
      clearTimeout(timeoutId); // Clear timeout on success
      setUploadSuccess(true);

      // Add a small delay to show success state, then redirect
      setTimeout(() => {
        router.push("/bookings?payment_uploaded=true");
      }, 1500);
    } catch (err) {
      console.error("Upload error:", err);
      clearTimeout(timeoutId); // Clear timeout on error
      setError(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
    } finally {
      if (!uploadSuccess) {
        setIsUploading(false);
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Please log in to continue</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card p-8 rounded-lg shadow-md text-center max-w-md border border-border">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Access Error
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-muted-foreground text-sm mb-6">
            Please select a booking from your bookings page to upload payment
            proof.
          </p>
          <button
            onClick={() => {
              // Use replace instead of push to prevent back button issues
              router.replace("/bookings");
            }}
            className="bg-gradient-to-r from-primary to-blue-500 text-foreground px-6 py-2 rounded-lg hover:from-primary/90 hover:to-primary transition-colors flex items-center gap-2 mx-auto"
          >
            <CreditCard className="w-4 h-4" /> Go to My Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header - Match bookings page style */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/50 z-10">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  router.replace("/bookings");
                }}
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
                  Booking #{booking?.id}
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

      {/* Copy Toast Notification */}
      {copyToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-green-600 text-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">{copyToast}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6 max-w-6xl mx-auto">
        {/* Progress Stepper - Minimal */}
        <div className="flex items-center justify-center gap-2 py-2">
          {/* Step 1: Pay */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-foreground font-bold text-xs shadow-lg shadow-primary/30">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-xs text-primary font-medium hidden sm:inline">
              Pay
            </span>
          </div>

          {/* Line 1-2 */}
          <div
            className={`w-8 sm:w-16 h-1 rounded-full transition-all duration-500 ${
              proofImage ? "bg-primary" : "bg-muted"
            }`}
          ></div>

          {/* Step 2: Upload */}
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                proofImage
                  ? "bg-primary text-foreground shadow-lg shadow-primary/30"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {proofImage ? <Check className="w-4 h-4" /> : "2"}
            </div>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                proofImage ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Upload
            </span>
          </div>

          {/* Line 2-3 */}
          <div
            className={`w-8 sm:w-16 h-1 rounded-full transition-all duration-500 ${
              uploadSuccess ? "bg-green-500" : "bg-muted"
            }`}
          ></div>

          {/* Step 3: Done */}
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

        {/* STEP 1: Amount to Pay - Hero Section */}
        {booking && (
          <div className="bg-primary/8 border border-primary/30 rounded-xl p-4 sm:p-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-1">
                {remainingAmount <= 0
                  ? "Fully Paid"
                  : paymentSummary.totalPaid > 0
                  ? "Remaining Balance"
                  : booking.payment_type === "half"
                  ? "50% Down Payment Required"
                  : "Total Amount to Pay"}
              </p>
              <div className="text-4xl sm:text-5xl font-bold text-foreground mb-2">
                ₱{remainingAmount.toLocaleString()}
              </div>
              {paymentSummary.totalPaid > 0 && (
                <p className="text-green-400 text-sm flex items-center justify-center gap-1">
                  <Check className="w-4 h-4" /> ₱
                  {paymentSummary.totalPaid.toLocaleString()} already paid
                </p>
              )}
              {paymentSummary.totalPaid > 0 && remainingAmount > 0 && (
                <p className="text-muted-foreground text-xs">
                  Total booking: ₱{(booking.payment_amount || booking.total_amount).toLocaleString()}
                </p>
              )}
              {pendingAmount > 0 && remainingAmount > 0 && (
                <p className="text-amber-400 text-xs mt-1">
                  ₱{pendingAmount.toLocaleString()} under review — you can still submit a new proof
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: Payment Methods - Now at Top */}
        <UploadInstructions handleCopyNumber={handleCopyNumber} />

        {/* Payment Balance & History */}
        <PaymentHistoryList
          booking={booking}
          paymentHistory={paymentHistory}
          paymentSummary={paymentSummary}
          showPaymentHistory={showPaymentHistory}
          setShowPaymentHistory={setShowPaymentHistory}
          remainingAmount={remainingAmount}
        />

        {/* Collapsible Booking Details - Compact Summary */}
        {booking && (
          <BookingDetailsSummary
            booking={booking}
            showBookingDetails={showBookingDetails}
            setShowBookingDetails={setShowBookingDetails}
            paymentSummary={paymentSummary}
            remainingAmount={remainingAmount}
          />
        )}

        {/* Upload Form - Full Width */}
        <div className="bg-card rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-green-600/30">
                <Upload className="w-4 h-4 text-green-500" />
              </div>
              {isResubmission ? "Resubmit Payment Proof" : "Upload Screenshot"}
            </h2>
            <span className="bg-primary/30 text-primary/80 text-xs px-2 py-1 rounded-full">
              Step 2
            </span>
          </div>

          {isResubmission && (
            <div className="mb-4 p-3 bg-orange-900/30 border border-orange-600/50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <p className="text-orange-200 text-sm">
                  <strong>Resubmission:</strong> Please address the rejection
                  reason above when uploading your new payment proof.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {
              /* File Upload - Dark Theme */
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Payment Screenshot/Receipt{" "}
                  <span className="text-red-400">*</span>
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors bg-muted/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="proof-upload"
                  />
                  <label htmlFor="proof-upload" className="cursor-pointer">
                    {previewUrl ? (
                      <div className="space-y-2">
                        <Image
                          src={previewUrl}
                          alt="Payment proof preview"
                          width={200}
                          height={150}
                          className="mx-auto rounded-lg shadow-md max-h-40 object-contain border border-border"
                        />
                        <p className="text-sm text-green-400 font-medium flex items-center justify-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Image uploaded -
                          Click to change
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FileImage className="w-12 h-12 text-muted-foreground mx-auto" />
                        <div>
                          <Upload className="w-6 h-6 text-primary mx-auto mb-2" />
                          <p className="text-muted-foreground flex items-center justify-center gap-1">
                            <Camera className="w-4 h-4" /> Click to upload
                            payment screenshot
                          </p>
                          <p className="text-xs text-muted-foreground">
                            JPG, PNG, GIF up to 5MB
                          </p>
                          <p className="text-xs text-primary mt-1 flex items-center justify-center gap-1">
                            <Zap className="w-3 h-3" /> Smart auto-fill enabled
                          </p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
                {!previewUrl && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> Clear screenshots help AI
                    detect payment details
                  </p>
                )}
              </div>
            }
            {/* Error Message - Dark Theme (positioned right after upload for visibility) */}
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-600/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Enhanced OCR Progress and Results */}
            <OCRResultDisplay
              ocrProgress={ocrProgress}
              ocrResult={ocrResult}
              proofImage={proofImage}
              showOCREditor={showOCREditor}
              setShowOCREditor={setShowOCREditor}
              setOcrResult={setOcrResult}
              setReferenceNumber={setReferenceNumber}
              setAmount={setAmount}
              setIsManualAmountSet={setIsManualAmountSet}
            />

            <PaymentMethodSelector
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              referenceNumber={referenceNumber}
              setReferenceNumber={setReferenceNumber}
              amount={amount}
              setAmount={setAmount}
              ocrResult={ocrResult}
              setIsManualAmountSet={setIsManualAmountSet}
              paymentValidation={paymentValidation}
              remainingAmount={remainingAmount}
              confirmUnusualAmount={confirmUnusualAmount}
              setConfirmUnusualAmount={setConfirmUnusualAmount}
              paymentSummary={paymentSummary}
              booking={booking}
            />

            {/* OCR Unrecognized Image Warning */}
            {ocrResult && ocrProgress.stage === "complete" && !ocrResult.amount && !ocrResult.referenceNumber && ocrResult.method === "unknown" && (
              <div className="p-3 bg-amber-900/30 border border-amber-600/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-amber-200 text-sm font-medium">
                      No payment details detected
                    </p>
                    <p className="text-amber-300/80 text-xs mt-1">
                      The uploaded image doesn&apos;t appear to be a payment receipt. Please upload a clear screenshot of your GCash or Maya confirmation.
                    </p>
                    <div className="pt-2 mt-2 border-t border-amber-700/50">
                      <label
                        htmlFor="confirm-unrecognized-image"
                        className="flex items-center gap-3 cursor-pointer group py-1"
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            confirmUnrecognizedImage
                              ? "bg-amber-500 border-amber-500"
                              : "border-border group-hover:border-amber-400"
                          }`}
                        >
                          {confirmUnrecognizedImage && (
                            <Check className="w-3 h-3 text-foreground" />
                          )}
                        </div>
                        <input
                          type="checkbox"
                          id="confirm-unrecognized-image"
                          checked={confirmUnrecognizedImage}
                          onChange={(e) =>
                            setConfirmUnrecognizedImage(e.target.checked)
                          }
                          className="sr-only"
                        />
                        <span
                          className={`text-sm transition-colors ${
                            confirmUnrecognizedImage
                              ? "text-amber-200"
                              : "text-muted-foreground group-hover:text-muted-foreground"
                          }`}
                        >
                          I confirm this is a valid payment receipt
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button - Enhanced with Validation */}
            <button
              type="submit"
              disabled={
                isUploading ||
                !proofImage ||
                uploadSuccess ||
                remainingAmount <= 0 ||
                !paymentValidation.allowSubmission ||
                (paymentValidation.level === "warning" && !confirmUnusualAmount) ||
                !!(ocrResult && ocrProgress.stage === "complete" && !ocrResult.amount && !ocrResult.referenceNumber && ocrResult.method === "unknown" && !confirmUnrecognizedImage)
              }
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg transform ${
                !paymentValidation.allowSubmission ||
                (paymentValidation.level === "warning" && !confirmUnusualAmount) ||
                !!(ocrResult && ocrProgress.stage === "complete" && !ocrResult.amount && !ocrResult.referenceNumber && ocrResult.method === "unknown" && !confirmUnrecognizedImage)
                  ? "bg-muted text-muted-foreground cursor-not-allowed scale-100"
                  : "bg-gradient-to-r from-primary to-blue-500 text-foreground hover:from-primary/90 hover:to-primary hover:scale-105 active:scale-95"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : uploadSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Uploaded Successfully!
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Submit Payment Proof
                </>
              )}
            </button>

            {/* Dynamic helper text */}
            {!proofImage ? (
              <p className="text-xs text-muted-foreground text-center">
                Please upload an image before submitting
              </p>
            ) : !paymentValidation.allowSubmission ? (
              <p className="text-xs text-red-400 text-center">
                Please correct the amount before submitting
              </p>
            ) : paymentValidation.level === "warning" &&
              !confirmUnusualAmount ? (
              <p className="text-xs text-yellow-400 text-center">
                Please confirm the amount is correct before submitting
              </p>
            ) : (
              <p className="text-xs text-muted-foreground text-center">
                Ready to submit your payment proof
              </p>
            )}
          </form>
        </div>

        {/* Compact Footer Info */}
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
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function UploadPaymentProof() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-foreground text-xl font-semibold">
              Loading payment page...
            </div>
          </div>
        </div>
      }
    >
      <UploadPaymentProofContent />
    </Suspense>
  );
}
