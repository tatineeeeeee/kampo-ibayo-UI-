"use client";

import { useState } from "react";
import { FolderInput } from "lucide-react";
import { categoryOptions } from "./galleryConstants";

interface BulkMoveCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (category: string) => void;
  count: number;
}

export default function BulkMoveCategoryModal({
  isOpen,
  onClose,
  onConfirm,
  count,
}: BulkMoveCategoryModalProps) {
  const [category, setCategory] = useState("general");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-info/10">
            <FolderInput className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Move {count} Image{count > 1 ? "s" : ""}
          </h3>
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-card mb-4"
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-foreground bg-muted rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(category)}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
}
