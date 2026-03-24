"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useToastHelpers } from "../components/Toast";
import type {
  BookingWithPayment,
  PaymentHistoryEntry,
  PaymentSummary,
  PaymentValidation,
  EnhancedOCRResult,
  OCRProgress,
  ExtractedPaymentData,
  ValidationResult,
} from "../lib/types";

export function usePaymentProofUpload() {
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

  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[]>(
    [],
  );
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    totalPaid: 0,
    pendingAmount: 0,
    totalSubmissions: 0,
  });
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [isManualAmountSet, setIsManualAmountSet] = useState(false);

  const [paymentValidation, setPaymentValidation] = useState<PaymentValidation>(
    {
      level: "none",
      message: "",
      allowSubmission: true,
    },
  );
  const [confirmUnusualAmount, setConfirmUnusualAmount] = useState(false);
  const [confirmUnrecognizedImage, setConfirmUnrecognizedImage] =
    useState(false);

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  const bookingId =
    searchParams.get("bookingId") ||
    searchParams.get("booking_id") ||
    searchParams.get("booking");

  const verifiedPaidAmount = paymentSummary.totalPaid;
  const pendingAmount = paymentSummary.pendingAmount;
  const expectedPaymentAmount =
    booking?.payment_amount || booking?.total_amount || 0;
  const remainingAmount = booking
    ? Math.max(0, expectedPaymentAmount - verifiedPaidAmount)
    : 0;

  const handleCopyNumber = (number: string, method: string) => {
    navigator.clipboard.writeText(number);
    setCopyToast(`${method} number copied!`);
    setTimeout(() => setCopyToast(null), 2000);
  };

  const goToBookings = useCallback(() => {
    router.replace("/bookings");
  }, [router]);

  const preprocessImage = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new globalThis.Image();

      img.onload = () => {
        const maxWidth = 1600;
        const scale = Math.min(maxWidth / img.width, maxWidth / img.height, 2);

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.filter = "contrast(1.3) brightness(1.1) saturate(0.7) blur(0.3px)";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(
                new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: file.lastModified,
                }),
              );
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.92,
        );
      };

      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }, []);

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
          amount:
            /(?:you\s+paid|amount|total|sent|[-–—]\s*₱|₱)\s*:?\s*₱?\s*([\d,]+\.?\d*)/gi,
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

        const amounts: number[] = [];
        while ((amountMatch = servicePatterns.amount.exec(ocrText)) !== null) {
          const amount = parseFloat(amountMatch[1].replace(/,/g, ""));
          if (amount > 0 && amount < 1000000) {
            amounts.push(amount);
            confidence += 25;
          }
        }

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
            amount: amounts.length > 0 ? amounts[0] : null,
            reference: references.length > 0 ? references[0] : null,
            confidence: Math.min(confidence, 100),
          });
        }
      }

      return results.sort((a, b) => b.confidence - a.confidence)[0] || null;
    },
    [],
  );

  const validateOCRResult = useCallback(
    (
      result: ExtractedPaymentData | null,
      bookingData: BookingWithPayment,
    ): ValidationResult => {
      const warnings: string[] = [];
      const suggestions: Array<{ type: string; expectedAmount?: number }> = [];

      if (!result || !bookingData) {
        return {
          isValid: false,
          warnings: ["Invalid data for validation"],
          suggestions: [],
        };
      }

      if (result.amount && typeof result.amount === "number") {
        const expectedAmount =
          bookingData.payment_amount || bookingData.total_amount * 0.5;
        const difference = Math.abs(result.amount - expectedAmount);
        const percentDiff = (difference / expectedAmount) * 100;

        if (percentDiff > 50) {
          warnings.push(
            `Detected amount (₱${result.amount.toLocaleString()}) differs significantly from expected (₱${expectedAmount.toLocaleString()})`,
          );
          suggestions.push({ type: "amount", expectedAmount });
        }

        if (result.amount < 100)
          warnings.push("Detected amount seems unusually low");
        if (result.amount > bookingData.total_amount * 2)
          warnings.push("Detected amount seems unusually high");
      }

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
    [],
  );

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
      const actualRemaining = Math.max(0, expectedAmount - verifiedPaid);
      const compareTarget = verifiedPaid > 0 ? actualRemaining : expectedAmount;
      const difference = Math.abs(enteredAmount - compareTarget);
      const percentDiff =
        compareTarget > 0 ? (difference / compareTarget) * 100 : 0;

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

      return {
        level: "none",
        message: "",
        allowSubmission: true,
      };
    },
    [booking, paymentSummary],
  );

  const fetchPaymentHistory = useCallback(
    async (id: string) => {
      if (!user?.id) return;

      try {
        const { getFreshSession } = await import("../utils/apiTimeout");
        const session = await getFreshSession(supabase);
        const response = await fetch(`/api/user/payment-history/${id}`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) return;
          return;
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
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
            },
          );
        }
      } catch {
        // non-critical
      }
    },
    [user?.id],
  );

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) return;

      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", parseInt(bookingId || "0"))
          .eq("user_id", user?.id || "")
          .single();

        if (error) {
          setError("Booking not found or access denied");
          return;
        }

        setBooking(data);

        const { data: proofs } = await supabase
          .from("payment_proofs")
          .select(
            "id, status, admin_notes, uploaded_at, reference_number, payment_method, amount",
          )
          .eq("booking_id", parseInt(bookingId || "0"))
          .eq("user_id", user?.id || "")
          .order("uploaded_at", { ascending: false });

        const hasRejectedProofs = proofs?.some(
          (proof) => proof.status === "rejected",
        );
        setIsResubmission(hasRejectedProofs || false);

        await fetchPaymentHistory(bookingId);
      } catch {
        setError("Failed to fetch booking details");
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
      setError("No booking ID provided");
      setIsLoading(false);
      setTimeout(() => {
        router.replace("/bookings");
      }, 3000);
    }
  }, [bookingId, user, authLoading, router, fetchPaymentHistory]);

  useEffect(() => {
    if (ocrResult?.amount && !isManualAmountSet) {
      setAmount(ocrResult.amount.toString());
    }
  }, [ocrResult?.amount, isManualAmountSet]);

  useEffect(() => {
    if (amount && parseFloat(amount) > 0 && booking) {
      const validation = validatePaymentAmount(parseFloat(amount));
      setPaymentValidation(validation);
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

  useEffect(() => {
    return () => {
      import("../utils/ocrService")
        .then(({ OCRService }) => {
          OCRService.terminateWorker().catch(console.warn);
        })
        .catch(() => {});
    };
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File Too Large", "File size must be less than 5MB.");
        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          "Invalid File Type",
          "Only JPG, PNG, and GIF files are allowed.",
        );
        return;
      }

      setProofImage(file);
      setError("");
      setOcrResult(null);
      setAmount("");
      setReferenceNumber("");
      setPaymentMethod("");
      setIsManualAmountSet(false);
      setShowOCREditor(false);
      setConfirmUnrecognizedImage(false);

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      setOcrProgress({
        stage: "preprocessing",
        progress: 10,
        detected: {},
        message: "Enhancing image quality...",
      });

      const startTime = Date.now();
      const processedImage = await preprocessImage(file);
      setOcrProgress({
        stage: "analyzing",
        progress: 30,
        detected: {},
        message: "Analyzing payment details...",
      });

      let result: EnhancedOCRResult = {
        referenceNumber: null,
        amount: null,
        confidence: 0,
        method: "unknown",
        warnings: [],
        suggestions: [],
        processingTime: 0,
      };

      try {
        const { OCRService } = await import("../utils/ocrService");
        setOcrProgress((prev) => ({
          ...prev,
          progress: 35,
          message: "Starting advanced OCR analysis...",
        }));

        const ocrServiceResult =
          await OCRService.processPaymentImage(processedImage);
        result = {
          referenceNumber: ocrServiceResult.referenceNumber,
          amount: ocrServiceResult.amount,
          confidence: ocrServiceResult.confidence,
          method: ocrServiceResult.method,
          warnings: ocrServiceResult.warnings || [],
          suggestions: ocrServiceResult.suggestions || [],
          processingTime:
            ocrServiceResult.processingTime || Date.now() - startTime,
        };
      } catch {
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

          const extracted = extractPaymentDataEnhanced(text);
          result = {
            referenceNumber: extracted?.reference || null,
            amount: extracted?.amount || null,
            confidence: extracted?.confidence || 0,
            method: extracted?.service || "unknown",
            warnings: ["Using fallback OCR processing"],
            suggestions: [],
            processingTime: Date.now() - startTime,
          };
        } catch {
          result.warnings = [
            "OCR processing failed - please enter details manually",
          ];
        }
      }

      setOcrProgress({
        stage: "validating",
        progress: 70,
        detected: {
          amount: result.amount ?? undefined,
          reference: result.referenceNumber ?? undefined,
          method: result.method !== "unknown" ? result.method : undefined,
        },
        message: "Validating detected information...",
      });

      if (booking && result) {
        const extractedData: ExtractedPaymentData = {
          service: result.method || "unknown",
          amount: result.amount,
          reference: result.referenceNumber,
          confidence: result.confidence,
        };
        const validation = validateOCRResult(extractedData, booking);
        result.warnings = [...(result.warnings || []), ...validation.warnings];
        result.suggestions = [
          ...(result.suggestions || []),
          ...validation.suggestions,
        ];
      }

      const detectedData: {
        amount?: number;
        reference?: string;
        method?: string;
      } = {};
      if (result.amount) detectedData.amount = result.amount;
      if (result.referenceNumber)
        detectedData.reference = result.referenceNumber;
      if (result.method && result.method !== "unknown")
        detectedData.method = result.method;

      setOcrProgress({
        stage: "complete",
        progress: 100,
        detected: detectedData,
        message:
          Object.keys(detectedData).length > 0
            ? `Successfully detected ${Object.keys(detectedData).length} field(s)`
            : "Analysis complete - please fill details manually",
      });

      if (
        result.referenceNumber &&
        typeof result.referenceNumber === "string"
      ) {
        setReferenceNumber(result.referenceNumber);
      }
      if (
        result.amount &&
        typeof result.amount === "number" &&
        result.amount > 0
      ) {
        setAmount(result.amount.toString());
        setIsManualAmountSet(false);
      }
      if (result.method && result.method !== "unknown") {
        const methodMap: { [key: string]: string } = {
          gcash: "gcash",
          maya: "maya",
        };
        const mappedMethod = methodMap[result.method.toLowerCase()];
        if (mappedMethod) setPaymentMethod(mappedMethod);
      }

      setOcrResult(result);
    } catch {
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
      toast.warning(
        "Missing Fields",
        "Please fill all required fields and upload an image.",
      );
      return;
    }

    const requiresReference = ["gcash", "maya"].includes(paymentMethod);
    if (requiresReference && !referenceNumber.trim()) {
      const methodName = paymentMethod === "gcash" ? "GCash" : "Maya";
      toast.warning(
        "Reference Required",
        `Reference number is required for ${methodName} payments.`,
      );
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.warning("Invalid Amount", "Amount must be greater than 0.");
      return;
    }

    setIsUploading(true);
    setError("");

    const timeoutId = setTimeout(() => {
      setIsUploading(false);
      setError("Upload timeout. Please try again.");
    }, 30000);

    try {
      const { withTimeout } = await import("../utils/apiTimeout");
      const fileExt = proofImage.name.split(".").pop();
      const fileName = `proof_${bookingId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await withTimeout(
        supabase.storage.from("payment-proofs").upload(fileName, proofImage),
        30000,
        "File upload timed out",
      );

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("payment-proofs").getPublicUrl(fileName);

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      const submissionAmount = parseFloat(amount);
      const fullExpectedAmount = booking.payment_amount || booking.total_amount;
      const expectedAmount =
        paymentSummary.totalPaid > 0
          ? Math.max(0, fullExpectedAmount - paymentSummary.totalPaid)
          : fullExpectedAmount;
      const amountDifference = Math.abs(submissionAmount - expectedAmount);
      const percentDifference =
        expectedAmount > 0 ? (amountDifference / expectedAmount) * 100 : 0;

      let adminValidationNotes = "";
      if (paymentValidation.level === "warning") {
        adminValidationNotes = `VALIDATION WARNING: ${paymentValidation.message}. User confirmed amount. `;
        adminValidationNotes += `Expected: ₱${expectedAmount.toLocaleString()}, Submitted: ₱${submissionAmount.toLocaleString()}, `;
        adminValidationNotes += `Difference: ₱${amountDifference.toLocaleString()} (${percentDifference.toFixed(
          1,
        )}%)`;
      } else if (percentDifference > 5) {
        adminValidationNotes = `Amount differs from expected by ${percentDifference.toFixed(1)}%. `;
        adminValidationNotes += `Expected: ₱${expectedAmount.toLocaleString()}, Submitted: ₱${submissionAmount.toLocaleString()}`;
      }

      if (confirmUnrecognizedImage) {
        adminValidationNotes += adminValidationNotes ? " | " : "";
        adminValidationNotes +=
          "OCR WARNING: Image not recognized as payment receipt. User confirmed manually.";
      }

      const { error: insertError } = await supabase
        .from("payment_proofs")
        .insert({
          booking_id: parseInt(bookingId || "0"),
          user_id: authUser?.id || "",
          proof_image_url: publicUrl,
          reference_number: referenceNumber || null,
          payment_method: paymentMethod,
          amount: submissionAmount,
          status: "pending",
          admin_notes: adminValidationNotes || null,
        });

      if (insertError) {
        throw new Error(`Database error: ${insertError.message}`);
      }

      try {
        await supabase
          .from("bookings")
          .update({
            payment_status: "payment_review",
            updated_at: new Date().toISOString(),
          })
          .eq("id", parseInt(bookingId || "0"))
          .eq("user_id", authUser?.id || "")
          .select();
      } catch {
        // non-critical
      }

      clearTimeout(timeoutId);
      setUploadSuccess(true);

      setTimeout(() => {
        router.push("/bookings?payment_uploaded=true");
      }, 1500);
    } catch (err) {
      clearTimeout(timeoutId);
      setError(
        err instanceof Error ? err.message : "Upload failed. Please try again.",
      );
    } finally {
      if (!uploadSuccess) {
        setIsUploading(false);
      }
    }
  };

  return {
    user,
    booking,
    bookingId,
    proofImage,
    previewUrl,
    paymentMethod,
    referenceNumber,
    amount,
    isUploading,
    uploadSuccess,
    error,
    isLoading,
    isResubmission,
    ocrResult,
    ocrProgress,
    showOCREditor,
    copyToast,
    showBookingDetails,
    paymentHistory,
    paymentSummary,
    showPaymentHistory,
    isManualAmountSet,
    paymentValidation,
    confirmUnusualAmount,
    confirmUnrecognizedImage,
    pendingAmount,
    remainingAmount,
    setPaymentMethod,
    setReferenceNumber,
    setAmount,
    setShowOCREditor,
    setOcrResult,
    setIsManualAmountSet,
    setShowBookingDetails,
    setShowPaymentHistory,
    setConfirmUnusualAmount,
    setConfirmUnrecognizedImage,
    handleCopyNumber,
    handleImageChange,
    handleSubmit,
    goToBookings,
  };
}
