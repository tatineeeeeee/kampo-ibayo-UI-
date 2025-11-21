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

      // Minor warnings (informational)
      if (percentDiff > 25) {
        return {
          level: "warning",
          message: `Amount differs from expected ₱${expectedAmount.toLocaleString()}. Please verify this is correct.`,
          allowSubmission: true,
        };
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
          <h2 className="text-xl font-bold text-white mb-2">⚠️ Access Error</h2>
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
            className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-red-600 transition-colors"
          >
            📋 Go to My Bookings
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

      {/* Main Content */}
      <div className="px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6 max-w-6xl mx-auto">
        {/* Payment Instructions - Streamlined */}
        <div className="bg-blue-800/50 border border-blue-600/50 rounded-lg sm:rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-600/30 p-2 rounded-full">
              <CreditCard className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              How It Works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="bg-blue-600/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-300 font-bold">1</span>
              </div>
              <h3 className="font-semibold text-blue-200 mb-1">Pay Online</h3>
              <p className="text-blue-100 text-xs">GCash, Maya</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-300 font-bold">2</span>
              </div>
              <h3 className="font-semibold text-blue-200 mb-1">
                Upload Screenshot
              </h3>
              <p className="text-blue-100 text-xs">
                Clear payment confirmation
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-600/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-green-300 font-bold">3</span>
              </div>
              <h3 className="font-semibold text-green-200 mb-1">Auto-Fill</h3>
              <p className="text-green-100 text-xs">
                AI extracts payment details
              </p>
            </div>
          </div>
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
                    <p className="text-yellow-300 text-sm">
                      <span className="font-medium">⏳ Pending Review:</span> ₱
                      {paymentSummary.pendingAmount.toLocaleString()}
                    </p>
                  </div>
                )}

                {remainingAmount <= 0 && (
                  <div className="mt-3 p-2 bg-green-900/20 border border-green-600/50 rounded">
                    <p className="text-green-300 text-sm font-medium">
                      ✅ Booking fully paid! No additional payment required.
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
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-600/30 text-green-300">
                          {isRejected
                            ? "❌ Rejected"
                            : isPending
                            ? "⏳ Under Review"
                            : "✅ Verified"}
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
                          <p className="text-green-200 text-sm">
                            ✅ Verified on{" "}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Booking Details - Dark Theme */}
          <div className="bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="bg-red-600/30 p-1.5 rounded-full">
                <CreditCard className="w-4 h-4 text-red-500" />
              </div>
              Booking Summary
            </h2>

            {/* OCR Disclaimer */}
            <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="bg-yellow-600/30 p-1 rounded-full mt-0.5">
                  <svg
                    className="w-3 h-3 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="text-xs text-yellow-200">
                  <p className="font-medium mb-1">⚠️ OCR Detection Notice</p>
                  <p className="leading-relaxed">
                    The system tries to automatically read payment details from
                    your screenshot, but
                    <span className="font-medium text-yellow-100">
                      {" "}
                      OCR is not perfect
                    </span>
                    . Please double-check and correct any detected amounts,
                    references, or payment methods before submitting.
                  </p>
                </div>
              </div>
            </div>
            {booking && (
              <div className="space-y-3">
                {/* Guest Information */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs block">
                      Primary Guest
                    </span>
                    <span className="text-white font-medium">
                      {booking.guest_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">
                      Total Guests
                    </span>
                    <span className="text-white">
                      {booking.number_of_guests}{" "}
                      {booking.number_of_guests === 1 ? "person" : "people"}
                    </span>
                  </div>
                </div>

                {/* Stay Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs block">
                      Check-in
                    </span>
                    <span className="text-white">
                      {new Date(booking.check_in_date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">
                      Check-out
                    </span>
                    <span className="text-white">
                      {new Date(booking.check_out_date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </div>
                </div>

                {/* Additional Booking Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
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
                        return `${nights} ${nights === 1 ? "night" : "nights"}`;
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">
                      Booking Status
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
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
                </div>

                {/* Payment Summary - Simplified */}
                <div className="border-t border-gray-700 pt-3 mt-3">
                  <div className="text-center p-4 rounded-lg bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-600/30">
                    {paymentSummary.totalPaid > 0 ? (
                      // Show detailed breakdown when there are payments
                      <>
                        <div className="text-gray-400 text-sm mb-1">
                          Total Booking Amount
                        </div>
                        <div className="text-white font-bold text-2xl">
                          ₱{booking.total_amount.toLocaleString()}
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="text-green-400">
                            ₱{paymentSummary.totalPaid.toLocaleString()} paid
                          </span>
                          {paymentSummary.pendingAmount > 0 && (
                            <span className="text-yellow-400 ml-2">
                              • ₱{paymentSummary.pendingAmount.toLocaleString()}{" "}
                              pending
                            </span>
                          )}
                        </div>
                        {remainingAmount > 0 && (
                          <div className="mt-2 px-3 py-1 bg-orange-600/20 border border-orange-500/30 rounded-full inline-block">
                            <span className="text-orange-300 font-semibold text-sm">
                              ₱{remainingAmount.toLocaleString()} remaining
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      // Show payment amount based on payment type when no payments made
                      <>
                        <div className="text-gray-400 text-sm mb-1">
                          {booking.payment_type === "half"
                            ? "50% Down Payment"
                            : "Amount to Pay"}
                        </div>
                        <div className="text-white font-bold text-2xl">
                          ₱
                          {(
                            booking.payment_amount || booking.total_amount
                          ).toLocaleString()}
                        </div>
                        <div className="text-gray-400 text-xs mt-1">
                          {booking.payment_type === "half"
                            ? `Half payment • Full amount: ₱${booking.total_amount.toLocaleString()}`
                            : "Full booking amount"}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Methods */}
            <div className="mt-6 p-4 bg-green-800/20 border border-green-600/30 rounded-lg">
              <h3 className="font-semibold text-green-300 mb-3 flex items-center gap-2">
                <span>📳</span> Payment Methods
              </h3>
              <div className="text-sm text-green-200 space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">GCash:</span>
                    <span className="bg-gray-700 px-2 py-1 rounded text-green-400 font-mono text-xs">
                      09876543210
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Maya:</span>
                    <span className="bg-gray-700 px-2 py-1 rounded text-green-400 font-mono text-xs">
                      09876543210
                    </span>
                  </div>
                </div>
                <div className="text-xs text-green-300 mt-3 p-2 bg-green-900/20 rounded">
                  💡 <strong>Account Name:</strong> Kampo Ibayo
                </div>
              </div>
            </div>
          </div>

          {/* Upload Form - Dark Theme */}
          <div className="bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-green-600/30">
                <Upload className="w-4 h-4 text-green-500" />
              </div>
              {isResubmission
                ? "Resubmit Payment Proof"
                : "Upload Payment Proof"}
            </h2>

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
                          <p className="text-sm text-green-400 font-medium">
                            ✅ Image uploaded - Click to change
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <FileImage className="w-12 h-12 text-gray-400 mx-auto" />
                          <div>
                            <Upload className="w-6 h-6 text-red-400 mx-auto mb-2" />
                            <p className="text-gray-300">
                              📸 Click to upload payment screenshot
                            </p>
                            <p className="text-xs text-gray-400">
                              JPG, PNG, GIF up to 5MB
                            </p>
                            <p className="text-xs text-blue-400 mt-1">
                              🚀 Smart auto-fill enabled
                            </p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                  {!previewUrl && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <span>💡</span> Clear screenshots help AI detect payment
                      details
                    </p>
                  )}
                </div>
              }
              {/* Enhanced OCR Progress and Results */}
              {ocrProgress.stage !== "idle" && proofImage && (
                <div className="mt-3 p-3 bg-gray-800/40 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400 flex items-center gap-2">
                      🤖{" "}
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
                          Amount: ₱
                          {ocrProgress.detected.amount.toLocaleString()}
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
                    <p className="text-xs text-gray-400">
                      {ocrProgress.message}
                    </p>
                  )}

                  {/* Final OCR Results with Confidence and Actions */}
                  {ocrResult && ocrProgress.stage === "complete" && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                          ✨ Final Results
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
                              const newValue =
                                parseFloat(e.target.value) || null;
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
                  required={
                    paymentMethod === "gcash" || paymentMethod === "maya"
                  }
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
                    className={`mt-3 p-4 rounded-lg border ${
                      paymentValidation.level === "error"
                        ? "bg-red-900/20 border-red-500/50"
                        : "bg-yellow-900/20 border-yellow-500/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-1.5 rounded-full mt-0.5 flex-shrink-0 ${
                          paymentValidation.level === "error"
                            ? "bg-red-600/30"
                            : "bg-yellow-600/30"
                        }`}
                      >
                        <AlertCircle
                          className={`w-4 h-4 ${
                            paymentValidation.level === "error"
                              ? "text-red-400"
                              : "text-yellow-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium mb-3 ${
                            paymentValidation.level === "error"
                              ? "text-red-200"
                              : "text-yellow-200"
                          }`}
                        >
                          {paymentValidation.message}
                        </p>

                        {/* Amount Suggestions */}
                        {paymentValidation.suggestions &&
                          paymentValidation.suggestions.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs text-gray-400 mb-2">
                                💡 Quick suggestions:
                              </p>
                              <div className="flex gap-2 flex-wrap">
                                {paymentValidation.suggestions.map(
                                  (suggestion, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setAmount(suggestion.amount.toString());
                                        setIsManualAmountSet(true);
                                        setConfirmUnusualAmount(false);
                                      }}
                                      className={`px-3 py-2 border rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 ${
                                        suggestion.type === "expectedAmount"
                                          ? "bg-green-600/20 text-green-300 border-green-600/30 hover:bg-green-600/30"
                                          : suggestion.type === "partialPayment"
                                          ? "bg-blue-600/20 text-blue-300 border-blue-600/30 hover:bg-blue-600/30"
                                          : "bg-purple-600/20 text-purple-300 border-purple-600/30 hover:bg-purple-600/30"
                                      }`}
                                    >
                                      {suggestion.label}
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {/* Improved confirmation checkbox for warnings */}
                        {paymentValidation.level === "warning" && (
                          <div className="bg-yellow-800/20 border border-yellow-600/30 rounded-lg p-3">
                            <label
                              htmlFor="confirm-unusual-amount"
                              className="flex items-start gap-3 cursor-pointer group"
                            >
                              <input
                                type="checkbox"
                                id="confirm-unusual-amount"
                                checked={confirmUnusualAmount}
                                onChange={(e) =>
                                  setConfirmUnusualAmount(e.target.checked)
                                }
                                className="mt-0.5 w-4 h-4 rounded border-2 border-yellow-500 text-yellow-600 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-0 bg-gray-700 transition-all duration-200"
                              />
                              <span className="text-sm text-yellow-100 group-hover:text-white transition-colors leading-relaxed">
                                I confirm this amount is correct and matches my
                                payment proof
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Simple Payment Notice - Only show when no validation warning to avoid redundancy */}
                {remainingAmount > 0 && paymentValidation.level === "none" && (
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

                {/* Quick action buttons */}
                {(ocrResult?.amount || remainingAmount > 0) && (
                  <div className="mt-2 flex gap-2">
                    {ocrResult?.amount && (
                      <button
                        type="button"
                        onClick={() => {
                          setAmount(ocrResult.amount!.toString());
                          setIsManualAmountSet(true);
                        }}
                        className="px-2 py-1 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-600/30 rounded text-xs transition-all"
                        title="Use the amount detected from your uploaded receipt"
                      >
                        Use AI: ₱{ocrResult.amount.toLocaleString()}
                      </button>
                    )}
                    {remainingAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setAmount(remainingAmount.toString());
                          setIsManualAmountSet(true);
                        }}
                        className="px-2 py-1 bg-green-600/20 text-green-300 hover:bg-green-600/30 border border-green-600/30 rounded text-xs transition-all"
                        title="Pay the full remaining balance to complete your booking"
                      >
                        Pay Remaining: ₱{remainingAmount.toLocaleString()}
                      </button>
                    )}
                  </div>
                )}

                {/* Payment Summary - moved below Amount Paid */}
                <div className="mt-4">
                  <div className="p-3 bg-gray-800/50 border border-gray-600/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-300">
                        Payment Summary
                      </h3>
                      {remainingAmount > 0 && (
                        <div className="text-xs text-blue-300 bg-blue-900/20 px-2 py-1 rounded border border-blue-600/30">
                          💡 Partial payments allowed
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        Total Booking Amount:
                      </span>
                      <span className="text-white font-medium">
                        ₱{booking?.total_amount.toLocaleString() || "0"}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        {booking?.payment_type === "half"
                          ? "Required Down Payment (50%):"
                          : "Required Payment (100%):"}
                      </span>
                      <span className="text-blue-400 font-medium">
                        ₱{expectedPaymentAmount.toLocaleString()}
                      </span>
                    </div>

                    {paymentSummary.totalPaid > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Already Verified:</span>
                        <span className="text-green-400 font-medium">
                          ₱{paymentSummary.totalPaid.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {paymentSummary.pendingAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">
                          Pending Verification:
                        </span>
                        <span className="text-yellow-400 font-medium">
                          ₱{paymentSummary.pendingAmount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="border-t border-gray-600 pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300 font-medium">
                          {remainingAmount > 0
                            ? "Still Need to Pay (minimum):"
                            : "Payment Status:"}
                        </span>
                        <span
                          className={`font-bold ${
                            remainingAmount <= 0
                              ? "text-green-400"
                              : "text-orange-400"
                          }`}
                        >
                          {remainingAmount > 0
                            ? `₱${remainingAmount.toLocaleString()}`
                            : "✓ Complete"}
                        </span>
                      </div>
                      {remainingAmount > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          Admin will verify that your payment proof matches the
                          amount entered
                        </div>
                      )}
                    </div>

                    {/* Clear payment expectation message */}
                    {remainingAmount > 0 && (
                      <div className="mt-2 p-2 bg-blue-900/20 border border-blue-600/30 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <div className="text-blue-200 text-xs">
                            {booking?.payment_type === "half" ? (
                              <p>
                                <strong>50% Down Payment:</strong> Pay ₱
                                {remainingAmount.toLocaleString()} now.
                                Remaining ₱
                                {(
                                  (booking?.total_amount || 0) -
                                  expectedPaymentAmount
                                ).toLocaleString()}{" "}
                                due on arrival.
                              </p>
                            ) : (
                              <p>
                                <strong>Full Payment:</strong> Pay ₱
                                {remainingAmount.toLocaleString()} to complete
                                your booking.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show success message when fully paid */}
                    {remainingAmount <= 0 && (
                      <div className="mt-2 p-2 bg-green-900/20 border border-green-600/30 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <div className="text-green-200 text-xs">
                            <p>
                              <strong>Payment Complete!</strong>{" "}
                              {booking?.payment_type === "half"
                                ? "Down payment verified. Balance due on arrival."
                                : "Booking fully paid!"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment preview - shows what will happen after this payment */}
                    {amount &&
                      parseFloat(amount) > 0 &&
                      remainingAmount > 0 && (
                        <div className="mt-2 space-y-2">
                          {/* Current payment preview */}
                          <div className="p-2 bg-blue-900/20 border border-blue-600/30 rounded">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <div className="text-blue-200 text-xs">
                                <p>
                                  <strong>This Payment:</strong> ₱
                                  {parseFloat(amount).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* After payment preview */}
                          <div className="p-2 bg-gray-800/30 border border-gray-600/30 rounded">
                            <div className="text-gray-300 text-xs">
                              <div className="flex justify-between items-center">
                                <span>After this payment:</span>
                                <span className="font-medium">
                                  {Math.max(
                                    0,
                                    remainingAmount - parseFloat(amount)
                                  ) > 0 ? (
                                    <span className="text-yellow-400">
                                      ₱
                                      {Math.max(
                                        0,
                                        remainingAmount - parseFloat(amount)
                                      ).toLocaleString()}{" "}
                                      still needed
                                    </span>
                                  ) : (
                                    <span className="text-green-400">
                                      ✓ Payment requirement met
                                    </span>
                                  )}
                                </span>
                              </div>

                              {/* Show overpayment warning if applicable */}
                              {parseFloat(amount) > remainingAmount && (
                                <div className="mt-1 text-orange-300">
                                  <strong>Note:</strong> You&apos;re paying ₱
                                  {(
                                    parseFloat(amount) - remainingAmount
                                  ).toLocaleString()}{" "}
                                  more than required.
                                </div>
                              )}

                              {/* Show partial payment note */}
                              {parseFloat(amount) < remainingAmount &&
                                parseFloat(amount) > 0 && (
                                  <div className="mt-1 text-blue-300">
                                    <strong>Partial Payment:</strong> Admin will
                                    verify this amount matches your proof.
                                    Submit additional payments later if needed.
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
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
                  (paymentValidation.level === "warning" &&
                    !confirmUnusualAmount)
                }
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg transform ${
                  !paymentValidation.allowSubmission ||
                  (paymentValidation.level === "warning" &&
                    !confirmUnusualAmount)
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
        </div>

        {/* Important Note - Full Width */}
        <div className="bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
          <h4 className="font-semibold text-yellow-300 mb-4">
            Verification Process
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-yellow-200">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-400 rounded-full flex-shrink-0"></div>
              <span>
                Verified within <strong>24 hours</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-400 rounded-full flex-shrink-0"></div>
              <span>Email confirmation sent</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-400 rounded-full flex-shrink-0"></div>
              <span>Secure & confidential</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full flex-shrink-0"></div>
              <span>AI-powered auto-fill</span>
            </div>
          </div>

          {/* Helpful Tip */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600/50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 bg-blue-400 rounded-full flex-shrink-0 mt-1.5"></div>
              <div>
                <h5 className="text-blue-200 font-semibold text-sm mb-1">
                  Smart Auto-Detection
                </h5>
                <p className="text-blue-200 text-sm">
                  Our AI automatically detects payment amounts from screenshots
                  - just upload and let it fill the details for you!
                </p>
              </div>
            </div>
          </div>
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
