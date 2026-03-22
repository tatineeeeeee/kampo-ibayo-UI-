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
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-100">
            <FolderInput className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Move {count} Image{count > 1 ? "s" : ""}
          </h3>
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white mb-4"
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
            className="flex-1 px-4 py-2 text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(category)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
}
