"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { useToastHelpers } from "../../Toast";
import Image from "next/image";
import { GalleryImage, categoryOptions } from "./galleryConstants";

interface EditImageModalProps {
  image: GalleryImage | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditImageModal({
  image,
  onClose,
  onSuccess,
}: EditImageModalProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    caption: "",
    category: "general",
    alt_text: "",
    is_featured: false,
  });

  const { success, error: showError } = useToastHelpers();

  useEffect(() => {
    if (image) {
      setFormData({
        caption: image.caption || "",
        category: image.category || "general",
        alt_text: image.alt_text || "",
        is_featured: image.is_featured || false,
      });
    }
  }, [image]);

  const saveChanges = async () => {
    if (!image) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("gallery_images")
        .update({
          caption: formData.caption || null,
          category: formData.category,
          alt_text: formData.alt_text || formData.caption || null,
          is_featured: formData.is_featured,
        })
        .eq("id", image.id);

      if (error) throw error;

      success("Image updated successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Save error:", error);
      showError("Failed to update image");
    } finally {
      setSaving(false);
    }
  };

  if (!image) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Edit Image</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
        </div>

        {/* Image Preview */}
        <div className="mb-4 relative h-40 w-full">
          <Image
            src={image.public_url || ""}
            alt={image.alt_text || "Gallery image"}
            fill
            className="object-cover rounded-lg"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>

        <div className="space-y-4">
          {/* Title / Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.caption}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, caption: e.target.value }))
              }
              placeholder="Image title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, category: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Alt Text */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Alt Text
            </label>
            <input
              type="text"
              value={formData.alt_text}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, alt_text: e.target.value }))
              }
              placeholder="Describe the image..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Show on Homepage */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_featured"
              checked={formData.is_featured}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  is_featured: e.target.checked,
                }))
              }
              className="mr-2"
            />
            <label
              htmlFor="is_featured"
              className="text-sm font-medium text-gray-900"
            >
              Show on Homepage
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveChanges}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
