import { Tables } from "@/database.types";

/** Base payment proof type from Supabase (auto-generated) */
export type PaymentProofRow = Tables<"payment_proofs">;

/** Payment proof for display (matches the manual interface used across admin/bookings) */
export interface PaymentProof {
  id: number;
  booking_id: number;
  user_id: string;
  proof_image_url: string;
  reference_number: string | null;
  payment_method: string;
  amount: number;
  status: string;
  admin_notes: string | null;
  uploaded_at: string;
  verified_at: string | null;
}

/** Payment history entry (normalized shape for display) */
export interface PaymentHistoryEntry {
  id: number;
  /** Used in admin views */
  sequenceNumber?: number;
  /** Used in user-facing views */
  attemptNumber?: number;
  amount: number;
  paymentMethod: string;
  referenceNumber: string | null;
  status: string;
  uploadedAt: string;
  verifiedAt: string | null;
  adminNotes: string | null;
  proofImageUrl?: string;
  isLatest: boolean;
}

/** Payment summary for totals display */
export interface PaymentSummary {
  totalPaid: number;
  pendingAmount: number;
  totalSubmissions: number;
}

/** Payment validation result from OCR or manual check */
export interface PaymentValidation {
  level: "none" | "warning" | "error";
  message: string;
  allowSubmission: boolean;
  suggestions?: Array<{
    type: "expectedAmount" | "partialPayment" | "fullPayment";
    amount: number;
    label: string;
  }>;
}

/** Enhanced OCR result from payment proof scanning */
export interface EnhancedOCRResult {
  referenceNumber: string | null;
  amount: number | null;
  confidence: number;
  method: string;
  warnings: string[];
  suggestions: Array<{ type: string; expectedAmount?: number }>;
  processingTime?: number;
}

/** OCR processing progress state */
export interface OCRProgress {
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

/** Extracted payment data from OCR */
export interface ExtractedPaymentData {
  service: string;
  amount: number | null;
  reference: string | null;
  confidence: number;
}

/** Validation result for payment proof */
export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  suggestions: Array<{ type: string; expectedAmount?: number }>;
}
