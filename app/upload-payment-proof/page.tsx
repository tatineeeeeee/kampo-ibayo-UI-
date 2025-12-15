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
  Smartphone,
  Wallet,
  Copy,
  User,
  Phone,
  Check,
  ChevronDown,
  Calendar,
  Users,
  Bot,
  Sparkles,
  Camera,
  Zap,
  Lightbulb,
  Info,
  AlertTriangle,
} from "lucide-react";

interface Booking {
  id: number;
  guest_name: string;
  guest_email: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  total_amount: number;
  status: string | null;
  payment_status: string | null;
  payment_type: string | null; // 'half' or 'full'
  payment_amount: number | null; // Amount to be paid based on payment_type
}

interface PaymentHistoryEntry {
  id: number;
  attemptNumber: number;
  amount: number;
  paymentMethod: string;
  referenceNumber: string | null;
  status: string;
  uploadedAt: string;
  verifiedAt: string | null;
  adminNotes: string | null;
  isLatest: boolean;
}

interface PaymentSummary {
  totalPaid: number;
  pendingAmount: number;
  totalSubmissions: number;
}

interface EnhancedOCRResult {
  referenceNumber: string | null;
  amount: number | null;
  confidence: number;
  method: string;
  warnings: string[];
  suggestions: Array<{ type: string; expectedAmount?: number }>;
  processingTime?: number;
}

interface OCRProgress {
  stage:
    | "idle"
    | "preprocessing"
    | "analyzing"
    | "extracting"
    | "validating"
    | "complete"
    | "error";
  progress: number;
  detected: {
    amount?: number;
    reference?: string;
    method?: string;
  };
  message?: string;
}

interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  suggestions: Array<{ type: string; expectedAmount?: number }>;
}

interface ExtractedPaymentData {
  service: string;
  amount: number | null;
  reference: string | null;
  confidence: number;
}

interface PaymentValidation {
  level: "none" | "warning" | "error";
  message: string;
  allowSubmission: boolean;
  suggestions?: Array<{
    type: "expectedAmount" | "partialPayment" | "fullPayment";
    amount: number;
    label: string;
  }>;
}

function UploadPaymentProofContent() {
  const [booking, setBooking] = useState<Booking | null>(null);
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

  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // Get booking ID directly from search params (support multiple parameter names)
  const bookingId =
    searchParams.get("bookingId") ||
    searchParams.get("booking_id") ||
    searchParams.get("booking");

  // Debug logging
  console.log("🔍 URL Parameter Check:");
  console.log("  - bookingId parameter:", bookingId);
  console.log("  - searchParams object:", searchParams);
  console.log(
    "  - All search params:",
    Object.fromEntries(searchParams.entries())
  );

  // Calculate remaining balance after verified payments and pending payments
  const verifiedPaidAmount = paymentSummary.totalPaid;
  const pendingAmount = paymentSummary.pendingAmount;
  // Use payment_amount (the amount they need to pay based on payment type) instead of total_amount
  const expectedPaymentAmount =
    booking?.payment_amount || booking?.total_amount || 0;
  const remainingAmount = booking
    ? Math.max(0, expectedPaymentAmount - verifiedPaidAmount - pendingAmount)
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
          amount: /(?:you\s+paid|amount|total|sent)\s*₱?\s*([\d,]+\.?\d*)/gi,
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
      booking: Booking
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
      const pendingAmount = paymentSummary.pendingAmount;
      const actualRemaining = Math.max(
        0,
        expectedAmount - verifiedPaid - pendingAmount
      );

      const difference = Math.abs(enteredAmount - expectedAmount);
      const percentDiff =
        expectedAmount > 0 ? (difference / expectedAmount) * 100 : 0;

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
        console.log("🔍 Fetching payment history for booking:", bookingId);
        const response = await fetch(
          `/api/user/payment-history/${bookingId}?userId=${user.id}`
        );

        if (!response.ok) {
          console.warn(
            "⚠️ Payment history API returned error:",
            response.status,
            response.statusText
          );

          // If it's a 404, the API route might not exist - that's ok for basic functionality
          if (response.status === 404) {
            console.log(
              "💡 Payment history API not available - continuing without history"
            );
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
        console.log("✅ Payment history data received:", data);

        if (data.success) {
          setPaymentHistory(data.paymentHistory || []);
          setPaymentSummary(
            data.paymentSummary || {
              totalPaid: 0,
              pendingAmount: 0,
              totalSubmissions: 0,
            }
          );
          console.log("📊 Payment summary updated:", data.paymentSummary);
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
          console.log("✅ Payment history loaded successfully");
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

    if (!user) {
      router.push("/auth");
      return;
    }

    if (bookingId) {
      console.log("Booking ID found:", bookingId, "- Fetching details...");
      fetchBookingDetails();
    } else {
      console.error("No booking ID found in URL parameters");
      setError("No booking ID provided");
      setIsLoading(false);

      // Auto-redirect to bookings after 3 seconds if no booking ID
      setTimeout(() => {
        console.log("No booking ID found, redirecting to bookings...");
        router.replace("/bookings");
      }, 3000);
    }
  }, [bookingId, user, router, fetchPaymentHistory]); // Include fetchPaymentHistory dependency

  // Auto-populate amount from OCR detection when available
  // This triggers after OCR processing completes
  useEffect(() => {
    if (ocrResult?.amount && !isManualAmountSet) {
      console.log("🤖 OCR useEffect: Setting amount to", ocrResult.amount);
      setAmount(ocrResult.amount.toString());
    }
  }, [ocrResult?.amount, isManualAmountSet]); // More specific dependency

  // Validate payment amount whenever it changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0 && booking) {
      const validation = validatePaymentAmount(parseFloat(amount));
      console.log("💰 Payment Validation Result:", {
        enteredAmount: parseFloat(amount),
        expectedAmount: booking.payment_amount || booking.total_amount,
        validationLevel: validation.level,
        allowSubmission: validation.allowSubmission,
        message: validation.message,
        hasSuggestions: validation.suggestions?.length || 0,
      });
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
        setError("File size must be less than 5MB");
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
        setError("Only JPG, PNG, and GIF files are allowed");
        return;
      }

      setProofImage(file);
      setError("");

      // Reset OCR state for new image
      setOcrResult(null);
      setAmount("");
      setIsManualAmountSet(false);
      setShowOCREditor(false);

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

        console.log("🎯 Enhanced OCR Service Result:", ocrResult);
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

      console.log("✅ Enhanced OCR completed:", {
        fieldsUpdated,
        confidence: ocrResult.confidence,
        processingTime: ocrResult.processingTime,
        warnings: ocrResult.warnings?.length || 0,
      });
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
      setError("Please fill all required fields and upload an image");
      return;
    }

    // Check if reference number is required for selected payment method
    const requiresReference = ["gcash", "maya"].includes(paymentMethod);
    if (requiresReference && !referenceNumber.trim()) {
      const methodName = paymentMethod === "gcash" ? "GCash" : "Maya";
      setError(`Reference number is required for ${methodName} payments`);
      return;
    }

    if (parseFloat(amount) <= 0) {
      setError("Amount must be greater than 0");
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
      console.log("📤 Starting upload process...");

      // Import timeout utility
      const { withTimeout } = await import("../utils/apiTimeout");

      // Upload image to Supabase storage
      const fileExt = proofImage.name.split(".").pop();
      const fileName = `proof_${bookingId}_${Date.now()}.${fileExt}`;

      console.log("📁 Uploading file to storage:", fileName);

      const { error: uploadError } = await withTimeout(
        supabase.storage.from("payment-proofs").upload(fileName, proofImage),
        30000, // 30 second timeout for file uploads
        "File upload timed out"
      );

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log("✅ File uploaded to storage successfully");

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("payment-proofs").getPublicUrl(fileName);

      // Save payment proof record with validation context - Use auth.uid() which matches our database structure
      console.log("💾 Saving payment proof record...");
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      // Prepare validation context for admin review
      const submissionAmount = parseFloat(amount);
      const expectedAmount = booking.payment_amount || booking.total_amount;
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

      console.log("✅ Payment proof record saved successfully");

      // CRITICAL: Update booking to trigger real-time admin updates
      try {
        console.log(
          "🔄 Now updating booking payment status to payment_review..."
        );
        console.log("🔍 Update parameters:", {
          bookingId: parseInt(bookingId || "0"),
          userId: authUser?.id,
          updateData: {
            payment_status: "payment_review", // This indicates payment proof needs review
            updated_at: new Date().toISOString(),
          },
        });

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
          console.log(
            "✅ Booking payment status updated successfully - Admin should see real-time update now!"
          );
          console.log("📋 Updated booking data:", updateData);
        }
      } catch (updateErr) {
        console.warn(
          "⚠️ Booking payment status update failed, but payment proof upload was successful:",
          updateErr
        );
        // Continue with success flow - payment proof is the important part
      }

      // Success - Show success state briefly, then redirect
      console.log("✅ Payment proof uploaded successfully!");
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Please log in to continue</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-md text-center max-w-md border border-gray-700">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Access Error
          </h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <p className="text-gray-400 text-sm mb-6">
            Please select a booking from your bookings page to upload payment
            proof.
          </p>
          <button
            onClick={() => {
              console.log("Redirecting to bookings page...");
              // Use replace instead of push to prevent back button issues
              router.replace("/bookings");
            }}
            className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-red-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <CreditCard className="w-4 h-4" /> Go to My Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Sticky Header - Match bookings page style */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 z-10">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  console.log("🔙 Navigating back to bookings...");
                  router.replace("/bookings");
                }}
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                title="Back to Bookings"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              </button>
              <div className="text-white">
                <h1 className="text-lg sm:text-xl font-bold">
                  Upload Payment Proof
                </h1>
                <p className="text-xs sm:text-sm text-gray-400">
                  Booking #{booking?.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              <span className="hidden sm:inline text-sm text-gray-300">
                Secure Upload
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Copy Toast Notification */}
      {copyToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
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
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-red-600/30">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-xs text-red-400 font-medium hidden sm:inline">
              Pay
            </span>
          </div>

          {/* Line 1-2 */}
          <div
            className={`w-8 sm:w-16 h-1 rounded-full transition-all duration-500 ${
              proofImage ? "bg-red-500" : "bg-gray-600"
            }`}
          ></div>

          {/* Step 2: Upload */}
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                proofImage
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "bg-gray-700 text-gray-400"
              }`}
            >
              {proofImage ? <Check className="w-4 h-4" /> : "2"}
            </div>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                proofImage ? "text-red-400" : "text-gray-500"
              }`}
            >
              Upload
            </span>
          </div>

          {/* Line 2-3 */}
          <div
            className={`w-8 sm:w-16 h-1 rounded-full transition-all duration-500 ${
              uploadSuccess ? "bg-green-500" : "bg-gray-600"
            }`}
          ></div>

          {/* Step 3: Done */}
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                uploadSuccess
                  ? "bg-green-600 text-white shadow-lg shadow-green-600/30"
                  : "bg-gray-700 text-gray-400"
              }`}
            >
              {uploadSuccess ? <Check className="w-4 h-4" /> : "3"}
            </div>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                uploadSuccess ? "text-green-400" : "text-gray-500"
              }`}
            >
              Done
            </span>
          </div>
        </div>

        {/* STEP 1: Amount to Pay - Hero Section */}
        {booking && (
          <div className="bg-gradient-to-r from-red-900/40 to-orange-900/30 border border-red-500/50 rounded-xl p-4 sm:p-6">
            <div className="text-center">
              <p className="text-gray-300 text-sm mb-1">
                {paymentSummary.totalPaid > 0
                  ? "Remaining Balance"
                  : booking.payment_type === "half"
                  ? "50% Down Payment Required"
                  : "Total Amount to Pay"}
              </p>
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                ₱
                {(paymentSummary.totalPaid > 0
                  ? remainingAmount
                  : booking.payment_amount || booking.total_amount
                ).toLocaleString()}
              </div>
              {booking.payment_type === "half" &&
                paymentSummary.totalPaid === 0 && (
                  <p className="text-gray-400 text-xs">
                    Full booking: ₱{booking.total_amount.toLocaleString()}
                  </p>
                )}
              {paymentSummary.totalPaid > 0 && (
                <p className="text-green-400 text-sm flex items-center justify-center gap-1">
                  <Check className="w-4 h-4" /> ₱
                  {paymentSummary.totalPaid.toLocaleString()} already paid
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: Payment Methods - Now at Top */}
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
          <div className="bg-gray-800/70 rounded-xl p-4 sm:p-5 border border-gray-600/50">
            {/* Logos */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex items-center gap-2 bg-blue-600/20 px-3 py-1.5 rounded-full">
                <Wallet className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300 text-sm font-medium">GCash</span>
              </div>
              <span className="text-gray-500">or</span>
              <div className="flex items-center gap-2 bg-green-600/20 px-3 py-1.5 rounded-full">
                <CreditCard className="w-4 h-4 text-green-400" />
                <span className="text-green-300 text-sm font-medium">Maya</span>
              </div>
            </div>

            {/* Phone Number - Large & Centered */}
            <div className="text-center py-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-xs uppercase tracking-wider">
                  Mobile Number
                </span>
              </div>
              <p className="font-mono text-3xl sm:text-4xl font-bold text-white tracking-widest mb-3">
                0966 281 5123
              </p>
              <button
                type="button"
                onClick={() => handleCopyNumber("09662815123", "Payment")}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-lg transition-colors font-medium"
              >
                <Copy className="w-4 h-4" />
                Copy Number
              </button>
            </div>

            {/* Account Name */}
            <div className="mt-4 pt-4 border-t border-gray-600/50 text-center">
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

        {/* Payment Balance & History */}
        {(paymentSummary.totalSubmissions > 0 ||
          paymentSummary.totalPaid > 0) && (
          <div className="bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <div className="bg-blue-600/30 p-1.5 rounded-full">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                </div>
                Payment History
                {paymentSummary.totalSubmissions > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {paymentSummary.totalSubmissions} submission
                    {paymentSummary.totalSubmissions !== 1 ? "s" : ""}
                  </span>
                )}
              </h2>
              {paymentSummary.totalSubmissions > 0 && (
                <button
                  onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                >
                  {showPaymentHistory ? "Hide Details" : "Show Details"}
                </button>
              )}
            </div>

            {/* Payment Balance Summary */}
            {booking && paymentSummary.totalPaid > 0 && (
              <div className="mb-4 p-4 bg-green-900/20 border border-green-600/50 rounded-lg">
                <h3 className="text-green-300 font-semibold mb-3 flex items-center gap-2">
                  <span>💰</span> Payment Balance
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-400">Total Booking</p>
                    <p className="text-white font-semibold text-lg">
                      ₱{booking.total_amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">Verified Payments</p>
                    <p className="text-green-400 font-semibold text-lg">
                      ₱{paymentSummary.totalPaid.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">Remaining Balance</p>
                    <p className="font-semibold text-lg text-orange-400">
                      ₱{Math.max(0, remainingAmount).toLocaleString()}
                    </p>
                  </div>
                </div>

                {paymentSummary.pendingAmount > 0 && (
                  <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-600/50 rounded">
                    <p className="text-yellow-300 text-sm flex items-center gap-1">
                      <span className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin inline-block"></span>
                      <span className="font-medium">Pending Review:</span> ₱
                      {paymentSummary.pendingAmount.toLocaleString()}
                    </p>
                  </div>
                )}

                {remainingAmount <= 0 && (
                  <div className="mt-3 p-2 bg-green-900/20 border border-green-600/50 rounded">
                    <p className="text-green-300 text-sm font-medium flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Booking fully paid! No
                      additional payment required.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Payment History Details */}
            {showPaymentHistory && paymentHistory.length > 0 && (
              <div className="space-y-3">
                {paymentHistory.map((entry) => {
                  const isRejected = entry.status === "rejected";
                  const isPending = entry.status === "pending";
                  const isVerified = entry.status === "verified";

                  // Extract rejection reason from admin notes
                  let rejectionReason = null;
                  if (isRejected && entry.adminNotes) {
                    const reasonMatch = entry.adminNotes.match(
                      /REJECTION REASON: (.+?)(?:\n|$)/
                    );
                    rejectionReason = reasonMatch
                      ? reasonMatch[1]
                      : entry.adminNotes;
                  }

                  return (
                    <div
                      key={entry.id}
                      className="p-4 rounded-lg border bg-gray-900/20 border-gray-600/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">
                            Attempt #{entry.attemptNumber} •{" "}
                            {new Date(entry.uploadedAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </span>
                          {entry.isLatest && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              Latest
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                            isRejected
                              ? "bg-red-600/30 text-red-300"
                              : isPending
                              ? "bg-yellow-600/30 text-yellow-300"
                              : "bg-green-600/30 text-green-300"
                          }`}
                        >
                          {isRejected ? (
                            <>
                              <AlertCircle className="w-3 h-3" /> Rejected
                            </>
                          ) : isPending ? (
                            <>
                              <span className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin inline-block"></span>{" "}
                              Under Review
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3" /> Verified
                            </>
                          )}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">Method:</span>
                          <span className="text-white ml-1">
                            {entry.paymentMethod}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Amount:</span>
                          <span className="text-white ml-1">
                            ₱{entry.amount.toLocaleString()}
                          </span>
                        </div>
                        {entry.referenceNumber && (
                          <div>
                            <span className="text-gray-400">Ref:</span>
                            <span className="text-white ml-1">
                              {entry.referenceNumber}
                            </span>
                          </div>
                        )}
                      </div>

                      {isRejected && rejectionReason && (
                        <div className="mt-3 p-3 bg-red-800/30 border border-red-600/30 rounded">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="text-red-300 font-medium text-sm">
                                Reason for rejection:
                              </h4>
                              <p className="text-red-200 text-sm mt-1">
                                {rejectionReason}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {isPending && (
                        <div className="mt-3 p-3 bg-yellow-800/30 border border-yellow-600/30 rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-yellow-200 text-sm">
                              Currently under admin review. You will be notified
                              via email once reviewed.
                            </p>
                          </div>
                        </div>
                      )}

                      {isVerified && entry.verifiedAt && (
                        <div className="mt-3 p-2 bg-green-800/30 border border-green-600/30 rounded">
                          <p className="text-green-200 text-sm flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Verified on{" "}
                            {new Date(entry.verifiedAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Collapsible Booking Details - Compact Summary */}
        {booking && (
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowBookingDetails(!showBookingDetails)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-gray-600/30 p-1.5 rounded-full">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium text-sm">
                    Booking #{booking.id}
                  </p>
                  <p className="text-gray-400 text-xs flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(booking.check_in_date).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" }
                      )}{" "}
                      -{" "}
                      {new Date(booking.check_out_date).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" }
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {booking.number_of_guests}{" "}
                      {booking.number_of_guests === 1 ? "guest" : "guests"}
                    </span>
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  showBookingDetails ? "rotate-180" : ""
                }`}
              />
            </button>

            {showBookingDetails && (
              <div className="px-4 pb-4 border-t border-gray-700/50">
                <div className="pt-3 space-y-3">
                  {/* Guest & Stay Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 text-xs block">Guest</span>
                      <span className="text-white font-medium">
                        {booking.guest_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">
                        Duration
                      </span>
                      <span className="text-white">
                        {(() => {
                          const checkIn = new Date(booking.check_in_date);
                          const checkOut = new Date(booking.check_out_date);
                          const nights = Math.ceil(
                            (checkOut.getTime() - checkIn.getTime()) /
                              (1000 * 60 * 60 * 24)
                          );
                          return `${nights} ${
                            nights === 1 ? "night" : "nights"
                          }`;
                        })()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">
                        Status
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          booking.status === "confirmed"
                            ? "bg-green-900/30 text-green-400"
                            : booking.status === "pending"
                            ? "bg-yellow-900/30 text-yellow-400"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {booking.status
                          ? booking.status.charAt(0).toUpperCase() +
                            booking.status.slice(1)
                          : "Pending"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">
                        Total Amount
                      </span>
                      <span className="text-white font-medium">
                        ₱{booking.total_amount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Payment Status */}
                  {paymentSummary.totalPaid > 0 && (
                    <div className="flex items-center gap-4 text-sm pt-2 border-t border-gray-700/30">
                      <span className="text-green-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> ₱
                        {paymentSummary.totalPaid.toLocaleString()} paid
                      </span>
                      {paymentSummary.pendingAmount > 0 && (
                        <span className="text-yellow-400">
                          • ₱{paymentSummary.pendingAmount.toLocaleString()}{" "}
                          pending
                        </span>
                      )}
                      {remainingAmount > 0 && (
                        <span className="text-orange-400">
                          • ₱{remainingAmount.toLocaleString()} remaining
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Form - Full Width */}
        <div className="bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-green-600/30">
                <Upload className="w-4 h-4 text-green-500" />
              </div>
              {isResubmission ? "Resubmit Payment Proof" : "Upload Screenshot"}
            </h2>
            <span className="bg-red-600/30 text-red-300 text-xs px-2 py-1 rounded-full">
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Screenshot/Receipt{" "}
                  <span className="text-red-400">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-red-500 transition-colors bg-gray-700/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="proof-upload"
                    required
                  />
                  <label htmlFor="proof-upload" className="cursor-pointer">
                    {previewUrl ? (
                      <div className="space-y-2">
                        <Image
                          src={previewUrl}
                          alt="Payment proof preview"
                          width={200}
                          height={150}
                          className="mx-auto rounded-lg shadow-md max-h-40 object-contain border border-gray-600"
                        />
                        <p className="text-sm text-green-400 font-medium flex items-center justify-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Image uploaded -
                          Click to change
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FileImage className="w-12 h-12 text-gray-400 mx-auto" />
                        <div>
                          <Upload className="w-6 h-6 text-red-400 mx-auto mb-2" />
                          <p className="text-gray-300 flex items-center justify-center gap-1">
                            <Camera className="w-4 h-4" /> Click to upload
                            payment screenshot
                          </p>
                          <p className="text-xs text-gray-400">
                            JPG, PNG, GIF up to 5MB
                          </p>
                          <p className="text-xs text-blue-400 mt-1 flex items-center justify-center gap-1">
                            <Zap className="w-3 h-3" /> Smart auto-fill enabled
                          </p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
                {!previewUrl && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> Clear screenshots help AI
                    detect payment details
                  </p>
                )}
              </div>
            }
            {/* Enhanced OCR Progress and Results */}
            {ocrProgress.stage !== "idle" && proofImage && (
              <div className="mt-3 p-3 bg-gray-800/40 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-400" />
                    {ocrProgress.stage === "preprocessing"
                      ? "Enhancing image..."
                      : ocrProgress.stage === "analyzing"
                      ? "Analyzing content..."
                      : ocrProgress.stage === "extracting"
                      ? "Extracting details..."
                      : ocrProgress.stage === "validating"
                      ? "Validating data..."
                      : ocrProgress.stage === "complete"
                      ? "Analysis complete!"
                      : ocrProgress.stage === "error"
                      ? "Processing failed"
                      : "Processing..."}
                  </span>
                  {ocrProgress.progress > 0 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-900/30 text-blue-400">
                      {ocrProgress.progress}%
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {ocrProgress.progress > 0 && (
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${ocrProgress.progress}%` }}
                    />
                  </div>
                )}

                {/* Live detection feedback */}
                {Object.keys(ocrProgress.detected).length > 0 && (
                  <div className="flex gap-4 text-sm mb-2">
                    {ocrProgress.detected.amount && (
                      <span className="text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Amount: ₱{ocrProgress.detected.amount.toLocaleString()}
                      </span>
                    )}
                    {ocrProgress.detected.reference && (
                      <span className="text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Reference: {ocrProgress.detected.reference}
                      </span>
                    )}
                    {ocrProgress.detected.method && (
                      <span className="text-blue-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Method: {ocrProgress.detected.method}
                      </span>
                    )}
                  </div>
                )}

                {/* Status message */}
                {ocrProgress.message && (
                  <p className="text-xs text-gray-400">{ocrProgress.message}</p>
                )}

                {/* Final OCR Results with Confidence and Actions */}
                {ocrResult && ocrProgress.stage === "complete" && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-400" /> Final
                        Results
                        <span className="text-xs px-2 py-1 rounded-full bg-green-900/30 text-green-400">
                          {ocrResult.confidence.toFixed(0)}% confidence
                        </span>
                      </span>
                      <button
                        onClick={() => setShowOCREditor(!showOCREditor)}
                        className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded border border-blue-400/30"
                      >
                        {showOCREditor ? "Hide Editor" : "Edit Results"}
                      </button>
                    </div>

                    {showOCREditor ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={ocrResult.referenceNumber || ""}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setOcrResult((prev) =>
                              prev
                                ? { ...prev, referenceNumber: newValue }
                                : null
                            );
                            setReferenceNumber(newValue);
                          }}
                          placeholder="Reference Number"
                          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                        />
                        <input
                          type="number"
                          value={ocrResult.amount || ""}
                          onChange={(e) => {
                            const newValue = parseFloat(e.target.value) || null;
                            setOcrResult((prev) =>
                              prev ? { ...prev, amount: newValue } : null
                            );
                            setAmount(e.target.value);
                            setIsManualAmountSet(true);
                          }}
                          placeholder="Amount"
                          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                        />
                      </div>
                    ) : (
                      <div className="text-sm space-y-1">
                        {ocrResult.amount && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">Amount:</span>
                            <span className="text-white font-mono">
                              ₱{ocrResult.amount.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {ocrResult.referenceNumber && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">Reference:</span>
                            <span className="text-white font-mono">
                              {ocrResult.referenceNumber}
                            </span>
                          </div>
                        )}
                        {ocrResult.processingTime && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">
                              Processing time:
                            </span>
                            <span className="text-gray-300">
                              {(ocrResult.processingTime / 1000).toFixed(1)}s
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Validation warnings */}
                {ocrResult?.warnings && ocrResult.warnings.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {ocrResult.warnings.map((warning, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-yellow-900/20 border border-yellow-600/30 rounded text-xs text-yellow-300 flex items-start gap-2"
                      >
                        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {warning}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Payment Method <span className="text-red-400">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              >
                <option value="" className="bg-gray-700">
                  Select Payment Method
                </option>
                <option value="gcash" className="bg-gray-700">
                  GCash
                </option>
                <option value="maya" className="bg-gray-700">
                  Maya/PayMaya
                </option>
              </select>
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reference/Transaction Number
                {(paymentMethod === "gcash" || paymentMethod === "maya") && (
                  <span className="text-red-400">*</span>
                )}
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder={
                  paymentMethod === "gcash"
                    ? "Enter GCash reference number (e.g., 1234567890)"
                    : paymentMethod === "maya"
                    ? "Enter Maya reference number"
                    : "Enter transaction reference (if available)"
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required={paymentMethod === "gcash" || paymentMethod === "maya"}
              />
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount Paid <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  // Only mark as manual if user is actually typing (not auto-population)
                  if (
                    e.target.value !== (ocrResult?.amount?.toString() || "")
                  ) {
                    setIsManualAmountSet(true);
                  }
                }}
                min="0"
                step="0.01"
                placeholder="Upload receipt to auto-detect amount"
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  paymentValidation.level === "error"
                    ? "border-red-500 focus:ring-red-500"
                    : paymentValidation.level === "warning"
                    ? "border-yellow-500 focus:ring-yellow-500"
                    : "border-gray-600 focus:ring-red-500 focus:border-red-500"
                }`}
                required
              />

              {/* Payment Validation Messages */}
              {paymentValidation.level !== "none" && (
                <div
                  className={`mt-4 rounded-xl overflow-hidden ${
                    paymentValidation.level === "error"
                      ? "bg-red-950/40 border-2 border-red-500/60"
                      : "bg-gradient-to-b from-amber-950/40 to-amber-950/20 border border-amber-500/40"
                  }`}
                >
                  {/* Error State */}
                  {paymentValidation.level === "error" && (
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-red-500/20 flex-shrink-0">
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        </div>
                        <p className="text-sm text-red-200 font-medium leading-relaxed pt-1.5">
                          {paymentValidation.message}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Warning State - Amount Mismatch */}
                  {paymentValidation.level === "warning" && (
                    <div className="p-4 space-y-4">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-amber-500/20">
                          <AlertTriangle className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-amber-100">
                            Amount Mismatch
                          </h4>
                          <p className="text-xs text-amber-300/70">
                            Please verify your payment amount
                          </p>
                        </div>
                      </div>

                      {/* Amount comparison bar */}
                      <div className="relative bg-gray-800/60 rounded-lg p-1">
                        <div className="flex items-stretch">
                          <div className="flex-1 bg-gray-700/50 rounded-l-md p-3 text-center border-r border-gray-600/50">
                            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">
                              Required
                            </p>
                            <p className="text-xl font-bold text-white">
                              ₱{remainingAmount.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex-1 bg-amber-900/40 rounded-r-md p-3 text-center">
                            <p className="text-[10px] uppercase tracking-wider text-amber-400 mb-0.5">
                              Entered
                            </p>
                            <p className="text-xl font-bold text-amber-300">
                              ₱{parseFloat(amount || "0").toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {/* Difference badge */}
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-600 rounded-full text-xs font-bold text-white shadow-lg">
                          −₱
                          {(
                            remainingAmount - parseFloat(amount || "0")
                          ).toLocaleString()}
                        </div>
                      </div>

                      {/* Spacer for badge */}
                      <div className="h-1"></div>

                      {/* Quick fix button */}
                      <button
                        type="button"
                        onClick={() => {
                          setAmount(remainingAmount.toString());
                          setIsManualAmountSet(true);
                        }}
                        className="w-full py-3 px-4 bg-green-600 hover:bg-green-500 rounded-lg text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/30"
                      >
                        <Check className="w-4 h-4" />
                        Use Correct Amount: ₱{remainingAmount.toLocaleString()}
                      </button>

                      {/* Confirmation checkbox - more subtle */}
                      <div className="pt-2 border-t border-gray-700/50">
                        <label
                          htmlFor="confirm-unusual-amount"
                          className="flex items-center gap-3 cursor-pointer group py-2"
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              confirmUnusualAmount
                                ? "bg-amber-500 border-amber-500"
                                : "border-gray-500 group-hover:border-amber-400"
                            }`}
                          >
                            {confirmUnusualAmount && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <input
                            type="checkbox"
                            id="confirm-unusual-amount"
                            checked={confirmUnusualAmount}
                            onChange={(e) =>
                              setConfirmUnusualAmount(e.target.checked)
                            }
                            className="sr-only"
                          />
                          <span
                            className={`text-sm transition-colors ${
                              confirmUnusualAmount
                                ? "text-amber-200"
                                : "text-gray-400 group-hover:text-gray-300"
                            }`}
                          >
                            This amount matches my receipt exactly
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Simple Payment Notice - Only show when amount field is empty */}
              {remainingAmount > 0 &&
                paymentValidation.level === "none" &&
                !amount && (
                  <div className="mt-2 p-2 bg-blue-900/20 border border-blue-600/50 rounded">
                    <p className="text-blue-200 text-xs">
                      <strong>Required payment:</strong> ₱
                      {remainingAmount.toLocaleString()}
                      {booking?.payment_type === "half"
                        ? " (50% down payment)"
                        : " (remaining balance)"}
                    </p>
                  </div>
                )}

              {/* Payment Status - Clean single indicator */}
              {remainingAmount > 0 &&
                amount &&
                parseFloat(amount) > 0 &&
                paymentValidation.level === "none" &&
                (() => {
                  const enteredAmount = parseFloat(amount);
                  const overpayment = enteredAmount - remainingAmount;

                  if (enteredAmount === remainingAmount) {
                    // Exact match
                    return (
                      <div className="mt-3 p-2.5 rounded-lg flex items-center justify-center gap-2 bg-green-900/30 border border-green-600/40">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm font-medium">
                          Amount matches perfectly
                        </span>
                      </div>
                    );
                  } else if (enteredAmount > remainingAmount) {
                    // Overpayment
                    return (
                      <div className="mt-3 p-2.5 rounded-lg flex items-center justify-center gap-2 bg-blue-900/20 border border-blue-600/40">
                        <Info className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-300 text-sm">
                          Overpayment of{" "}
                          <span className="font-semibold text-blue-200">
                            ₱{overpayment.toLocaleString()}
                          </span>{" "}
                          — that&apos;s okay!
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
            </div>

            {/* Error Message - Dark Theme */}
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-600/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-300 text-sm">{error}</p>
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
                !paymentValidation.allowSubmission ||
                (paymentValidation.level === "warning" && !confirmUnusualAmount)
              }
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg transform ${
                !paymentValidation.allowSubmission ||
                (paymentValidation.level === "warning" && !confirmUnusualAmount)
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed scale-100"
                  : "bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 hover:scale-105 active:scale-95"
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
              <p className="text-xs text-gray-400 text-center">
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
              <p className="text-xs text-gray-400 text-center">
                Ready to submit your payment proof
              </p>
            )}
          </form>
        </div>

        {/* Compact Footer Info */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 py-2">
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            Verified within 24hrs
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <div className="text-white text-xl font-semibold">
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
