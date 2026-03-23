"use client";

import { X } from "lucide-react";
import Image from "next/image";
import type { RejectionModalState } from "@/app/hooks/useReviewManagement";

interface PhotoModalProps {
  selectedPhoto: string;
  onClose: () => void;
}

export function PhotoModal({ selectedPhoto, onClose }: PhotoModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={onClose}
    >
      <div className="relative w-full h-full max-w-7xl max-h-full flex items-center justify-center">
        <button
          onClick={onClose}
          className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 text-white hover:text-white/70 transition-colors bg-black/50 hover:bg-black/70 rounded-full p-2 sm:p-3"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <Image
          src={selectedPhoto}
          alt="Review photo - enlarged view"
          fill
          className="object-contain rounded-lg"
          sizes="100vw"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}

interface RejectionModalProps {
  modal: RejectionModalState;
  rejectionReason: string;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function RejectionModal({
  modal,
  rejectionReason,
  onReasonChange,
  onClose,
  onSubmit,
}: RejectionModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Reject Review
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-foreground mb-2">
            Rejecting:{" "}
            <span className="font-medium text-foreground">
              {modal.reviewTitle}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Please provide a reason for rejection. This will help the guest
            improve their review if they choose to resubmit.
          </p>

          <label
            htmlFor="rejectionReason"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Rejection Reason *
          </label>
          <textarea
            id="rejectionReason"
            value={rejectionReason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary text-foreground placeholder:text-muted-foreground"
            placeholder="e.g., Review contains inappropriate language, lacks specific details about the stay, or violates our review guidelines..."
            required
          />

          <div className="mt-2">
            <p className="text-xs text-muted-foreground">
              <strong>Common reasons:</strong> Inappropriate content,
              insufficient detail, spam, off-topic, violates guidelines
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted rounded-md order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!rejectionReason.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-destructive hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-md order-1 sm:order-2"
          >
            Reject Review
          </button>
        </div>
      </div>
    </div>
  );
}

interface UnApprovalModalProps {
  modal: RejectionModalState;
  rejectionReason: string;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function UnApprovalModal({
  modal,
  rejectionReason,
  onReasonChange,
  onClose,
  onSubmit,
}: UnApprovalModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Un-approve Review
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-foreground mb-2">
            Un-approving:{" "}
            <span className="font-medium text-foreground">
              {modal.reviewTitle}
            </span>
          </p>
          <p className="text-xs text-destructive bg-destructive/10 p-2 rounded mb-4">
            ⚠️ This will remove the review from public display and notify the
            guest.
          </p>

          <label
            htmlFor="unApprovalReason"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Reason for Un-approval (Optional)
          </label>
          <textarea
            id="unApprovalReason"
            value={rejectionReason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary text-foreground placeholder:text-muted-foreground"
            placeholder="e.g., Review was found to violate guidelines after publication, contains newly discovered inappropriate content..."
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted rounded-md order-2 sm:order-1 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-destructive hover:bg-destructive/90 rounded-md order-1 sm:order-2 transition-colors"
          >
            Confirm Un-approve
          </button>
        </div>
      </div>
    </div>
  );
}
