"use client";

import { Trash2 } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: "single" | "all" | "bulk";
  imageName?: string;
  totalImages: number;
  isDeleting?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  imageName,
  totalImages,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  const isBulkOrAll = type === "all" || type === "bulk";
  const title =
    type === "all"
      ? "Delete All Images"
      : type === "bulk"
      ? `Delete ${totalImages} Selected`
      : "Delete Image";
  const message =
    type === "all"
      ? `Are you sure you want to delete all ${totalImages} images? This action cannot be undone.`
      : type === "bulk"
      ? `Are you sure you want to delete ${totalImages} selected images? This action cannot be undone.`
      : `Are you sure you want to delete "${imageName}"? This action cannot be undone.`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isBulkOrAll ? "bg-destructive/10" : "bg-warning/10"
              }`}
            >
              <Trash2
                className={`w-5 h-5 ${
                  isBulkOrAll ? "text-destructive" : "text-warning"
                }`}
              />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-muted-foreground hover:text-muted-foreground disabled:opacity-50"
          >
            &times;
          </button>
        </div>

        <div className="mb-6">
          <p className="text-foreground leading-relaxed">{message}</p>
          {isBulkOrAll && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                This action cannot be undone. Images will be permanently deleted
                from both the database and storage.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 text-foreground bg-muted rounded-lg hover:bg-muted disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
              isBulkOrAll
                ? "bg-destructive hover:bg-destructive/90 disabled:bg-destructive/60"
                : "bg-warning hover:bg-warning/90 disabled:bg-warning/60"
            }`}
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                {type === "all"
                  ? "Delete All"
                  : type === "bulk"
                  ? `Delete ${totalImages}`
                  : "Delete"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
