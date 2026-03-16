"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import { useToastHelpers } from "../../components/Toast";
import { Tables } from "../../../database.types";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Edit3,
  Eye,
  Star,
  StarOff,
  Search,
  CheckSquare,
  Square,
  FolderInput,
  Calendar,
  HardDrive,
} from "lucide-react";
import Image from "next/image";
import Lightbox, { LightboxImage } from "../../components/Lightbox";

type GalleryImage = Tables<"gallery_images">;

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EditImageModalProps {
  image: GalleryImage | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: "single" | "all" | "bulk";
  imageName?: string;
  totalImages: number;
  isDeleting?: boolean;
}

const categoryOptions = [
  { value: "general", label: "General" },
  { value: "camping", label: "Camping Grounds" },
  { value: "rooms", label: "Family Rooms" },
  { value: "pool", label: "Pool Area" },
  { value: "pets", label: "Pet Area" },
  { value: "dining", label: "Dining & Kitchen" },
  { value: "events", label: "Events & Activities" },
  { value: "nature", label: "Nature & Scenery" },
];

const categoryLabelMap: Record<string, string> = Object.fromEntries(
  categoryOptions.map((c) => [c.value, c.label])
);

function cleanDisplayName(image: GalleryImage): string {
  return (
    image.caption ||
    image.alt_text ||
    (image.file_name
      ? image.file_name
          .replace(/\.[^/.]+$/, "")
          .replace(/-/g, " ")
          .replace(/_/g, " ")
      : "Gallery Image")
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Upload Modal ───────────────────────────────────────────────

function ImageUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: ImageUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [category, setCategory] = useState<string>("general");
  const [title, setTitle] = useState("");
  const [showOnHomepage, setShowOnHomepage] = useState(false);

  const { success, error: showError } = useToastHelpers();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const uploadImages = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      showError("Please select at least one image");
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("No user found");
        return;
      }

      // Get count of existing images in this category for readable naming
      const { count } = await supabase
        .from("gallery_images")
        .select("*", { count: "exact", head: true })
        .eq("category", category);

      const baseCount = count || 0;

      const uploadPromises = Array.from(selectedFiles).map(
        async (file, index) => {
          const fileExt = file.name.split(".").pop();
          const num = String(baseCount + index + 1).padStart(3, "0");
          const fileName = `${category}-${num}.${fileExt}`;
          const filePath = `${category}/${category}-${Date.now()}-${index}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("gallery-images")
            .upload(filePath, file);

          if (uploadError) {
            throw new Error(
              `Failed to upload ${file.name}: ${uploadError.message}`
            );
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("gallery-images").getPublicUrl(filePath);

          const imageTitle =
            title ||
            (selectedFiles.length === 1
              ? file.name.replace(/\.[^/.]+$/, "")
              : `${categoryLabelMap[category] || category} ${num}`);

          const { error: dbError } = await supabase
            .from("gallery_images")
            .insert({
              file_name: fileName,
              storage_path: filePath,
              public_url: publicUrl,
              category,
              caption: imageTitle,
              alt_text: imageTitle,
              is_featured: showOnHomepage,
              file_size: file.size,
              mime_type: file.type,
              uploaded_by: user.id,
              display_order: 0,
            });

          if (dbError) {
            throw new Error(
              `Failed to save image metadata: ${dbError.message}`
            );
          }

          return fileName;
        }
      );

      await Promise.all(uploadPromises);

      success(`Successfully uploaded ${selectedFiles.length} image(s)!`);
      setSelectedFiles(null);
      setTitle("");
      setCategory("general");
      setShowOnHomepage(false);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Upload error:", error);
      showError(
        error instanceof Error ? error.message : "Failed to upload images"
      );
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Upload Images</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>&times;
          </button>
        </div>

        <div className="space-y-4">
          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Select Images
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFiles && selectedFiles.length > 0 && (
              <p className="text-sm text-gray-800 mt-1">
                {selectedFiles.length} file(s) selected
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Swimming Pool at Night"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to auto-generate from category
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Show on Homepage */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="show_on_homepage_upload"
              checked={showOnHomepage}
              onChange={(e) => setShowOnHomepage(e.target.checked)}
              className="mr-2"
            />
            <label
              htmlFor="show_on_homepage_upload"
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
            onClick={uploadImages}
            disabled={uploading || !selectedFiles}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ───────────────────────────────────────

function DeleteConfirmModal({
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
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isBulkOrAll ? "bg-red-100" : "bg-orange-100"
              }`}
            >
              <Trash2
                className={`w-5 h-5 ${
                  isBulkOrAll ? "text-red-600" : "text-orange-600"
                }`}
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            &times;
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 leading-relaxed">{message}</p>
          {isBulkOrAll && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">
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
            className="flex-1 px-4 py-2 text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
              isBulkOrAll
                ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                : "bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400"
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

// ─── Edit Modal ─────────────────────────────────────────────────

function EditImageModal({ image, onClose, onSuccess }: EditImageModalProps) {
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

// ─── Bulk Move Category Modal ───────────────────────────────────

function BulkMoveCategoryModal({
  isOpen,
  onClose,
  onConfirm,
  count,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (category: string) => void;
  count: number;
}) {
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

// ─── Main Gallery Page ──────────────────────────────────────────

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: "single" | "all" | "bulk";
    image?: GalleryImage;
    isDeleting: boolean;
  }>({
    isOpen: false,
    type: "single",
    isDeleting: false,
  });

  const { success, error: showError } = useToastHelpers();

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("created_at", { ascending: false })
        .order("is_featured", { ascending: false })
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching images:", error);
      } else {
        setImages(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Filter by category + search
  const filteredImages = useMemo(() => {
    let result = images;
    if (selectedCategory !== "all") {
      result = result.filter((img) => img.category === selectedCategory);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (img) =>
          (img.caption || "").toLowerCase().includes(term) ||
          (img.alt_text || "").toLowerCase().includes(term) ||
          (img.file_name || "").toLowerCase().includes(term)
      );
    }
    return result;
  }, [images, selectedCategory, searchTerm]);

  // Lightbox images
  const lightboxImages: LightboxImage[] = useMemo(
    () =>
      filteredImages.map((img) => ({
        src: img.public_url || "",
        alt: img.alt_text || img.file_name || "Gallery Image",
        title: cleanDisplayName(img),
      })),
    [filteredImages]
  );

  // ── Selection helpers ──

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredImages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredImages.map((img) => img.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  // ── Delete helpers ──

  const openDeleteModal = (
    type: "single" | "all" | "bulk",
    image?: GalleryImage
  ) => {
    setDeleteConfirm({ isOpen: true, type, image, isDeleting: false });
  };

  const closeDeleteModal = () => {
    setDeleteConfirm({
      isOpen: false,
      type: "single",
      image: undefined,
      isDeleting: false,
    });
  };

  const handleConfirmDelete = async () => {
    setDeleteConfirm((prev) => ({ ...prev, isDeleting: true }));

    if (deleteConfirm.type === "single" && deleteConfirm.image) {
      await performSingleDelete(deleteConfirm.image);
    } else if (deleteConfirm.type === "all") {
      await performDeleteAll();
    } else if (deleteConfirm.type === "bulk") {
      await performBulkDelete();
    }

    closeDeleteModal();
  };

  const performSingleDelete = async (image: GalleryImage) => {
    try {
      const originalImages = images;
      setImages((prev) => prev.filter((img) => img.id !== image.id));

      const { error: dbError } = await supabase
        .from("gallery_images")
        .delete()
        .eq("id", image.id);

      if (dbError) {
        setImages(originalImages);
        showError("Failed to delete image");
        return;
      }

      supabase.storage.from("gallery-images").remove([image.storage_path]);
      success("Image deleted!");
      setTimeout(() => fetchImages(), 500);
    } catch {
      showError("Failed to delete image");
      fetchImages();
    }
  };

  const performDeleteAll = async () => {
    try {
      const originalImages = images;
      const storagePaths = originalImages.map((img) => img.storage_path);
      setImages([]);
      setLoading(true);

      const { error: dbError } = await supabase
        .from("gallery_images")
        .delete()
        .neq("id", 0);

      if (dbError) {
        setImages(originalImages);
        setLoading(false);
        showError("Failed to delete images");
        return;
      }

      supabase.storage.from("gallery-images").remove(storagePaths);
      success(`Deleted all ${originalImages.length} images!`);
      fetchImages();
    } catch {
      showError("Failed to delete all images");
      fetchImages();
    } finally {
      setLoading(false);
    }
  };

  const performBulkDelete = async () => {
    try {
      const ids = [...selectedIds];
      const toDelete = images.filter((img) => selectedIds.has(img.id));
      const storagePaths = toDelete.map((img) => img.storage_path);

      setImages((prev) => prev.filter((img) => !selectedIds.has(img.id)));

      const { error: dbError } = await supabase
        .from("gallery_images")
        .delete()
        .in("id", ids);

      if (dbError) {
        showError("Failed to delete selected images");
        fetchImages();
        return;
      }

      supabase.storage.from("gallery-images").remove(storagePaths);
      success(`Deleted ${ids.length} images!`);
      clearSelection();
      setTimeout(() => fetchImages(), 500);
    } catch {
      showError("Failed to delete selected images");
      fetchImages();
    }
  };

  // ── Featured toggle ──

  const toggleFeatured = async (image: GalleryImage) => {
    try {
      const { error } = await supabase
        .from("gallery_images")
        .update({ is_featured: !image.is_featured })
        .eq("id", image.id);

      if (error) throw error;

      success(
        `Image ${
          !image.is_featured ? "added to homepage" : "removed from homepage"
        }!`
      );
      fetchImages();
    } catch {
      showError("Failed to update");
    }
  };

  // ── Bulk actions ──

  const bulkToggleFeatured = async (featured: boolean) => {
    try {
      const { error } = await supabase
        .from("gallery_images")
        .update({ is_featured: featured })
        .in("id", [...selectedIds]);

      if (error) throw error;
      success(
        `${selectedIds.size} images ${
          featured ? "added to" : "removed from"
        } homepage!`
      );
      clearSelection();
      fetchImages();
    } catch {
      showError("Failed to update");
    }
  };

  const bulkMoveCategory = async (category: string) => {
    try {
      const { error } = await supabase
        .from("gallery_images")
        .update({ category })
        .in("id", [...selectedIds]);

      if (error) throw error;
      success(
        `Moved ${selectedIds.size} images to ${
          categoryLabelMap[category] || category
        }!`
      );
      clearSelection();
      setShowBulkMoveModal(false);
      fetchImages();
    } catch {
      showError("Failed to move images");
    }
  };

  // ── Lightbox nav ──

  const nextImage = useCallback(() => {
    setPreviewIndex((prev) =>
      prev !== null ? (prev + 1) % filteredImages.length : 0
    );
  }, [filteredImages.length]);

  const prevImage = useCallback(() => {
    setPreviewIndex((prev) =>
      prev !== null
        ? (prev - 1 + filteredImages.length) % filteredImages.length
        : 0
    );
  }, [filteredImages.length]);

  // ── Category tabs ──

  const filterCategories = [
    { value: "all", label: "All Images" },
    ...categoryOptions,
  ];

  const getCategoryCount = (category: string) => {
    return category === "all"
      ? images.length
      : images.filter((img) => img.category === category).length;
  };

  // ── Render ──

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Gallery Management
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              {loading
                ? "Loading gallery..."
                : `Manage resort gallery images (${images.length} total)`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex-1 sm:flex-none bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              Upload Images
            </button>
            {images.length > 0 && (
              <button
                onClick={() => openDeleteModal("all")}
                className="flex-1 sm:flex-none bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                Delete All
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search images by name or title..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 text-sm"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {filterCategories.map((category) => (
              <button
                key={category.value}
                onClick={() => {
                  setSelectedCategory(category.value);
                  clearSelection();
                }}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors ${
                  selectedCategory === category.value
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                }`}
              >
                {category.label}
                <span className="ml-1">
                  ({getCategoryCount(category.value)})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-sm font-medium text-blue-800">
              {selectedIds.size} selected
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => openDeleteModal("bulk")}
                className="px-3 py-1.5 bg-red-600 text-white text-xs sm:text-sm rounded-lg hover:bg-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
              <button
                onClick={() => setShowBulkMoveModal(true)}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
              >
                <FolderInput className="w-3.5 h-3.5" />
                Move Category
              </button>
              <button
                onClick={() => bulkToggleFeatured(true)}
                className="px-3 py-1.5 bg-yellow-500 text-white text-xs sm:text-sm rounded-lg hover:bg-yellow-600 flex items-center gap-1"
              >
                <Star className="w-3.5 h-3.5" />
                Add to Homepage
              </button>
              <button
                onClick={() => bulkToggleFeatured(false)}
                className="px-3 py-1.5 bg-gray-600 text-white text-xs sm:text-sm rounded-lg hover:bg-gray-700 flex items-center gap-1"
              >
                <StarOff className="w-3.5 h-3.5" />
                Remove from Homepage
              </button>
            </div>
            <button
              onClick={clearSelection}
              className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear
            </button>
          </div>
        )}

        {/* Select All Toggle */}
        {!loading && filteredImages.length > 0 && (
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={selectAll}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              {selectedIds.size === filteredImages.length ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedIds.size === filteredImages.length
                ? "Deselect all"
                : "Select all"}
            </button>
            {filteredImages.length !== images.length && (
              <span className="text-xs text-gray-400">
                ({filteredImages.length} shown)
              </span>
            )}
          </div>
        )}

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-800">Loading gallery...</span>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-800 font-medium mb-2 text-sm sm:text-base">
              {searchTerm
                ? `No images matching "${searchTerm}"`
                : selectedCategory === "all"
                ? "No images uploaded yet"
                : `No images in ${selectedCategory} category`}
            </p>
            <p className="text-gray-600 text-sm">
              {searchTerm
                ? "Try a different search term"
                : "Upload your first images to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredImages.map((image, index) => {
              const isSelected = selectedIds.has(image.id);
              return (
                <div
                  key={image.id}
                  className={`relative rounded-xl overflow-hidden border transition-all shadow-sm ${
                    isSelected
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-200 hover:shadow-md"
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleSelect(image.id)}
                    className={`absolute top-2 left-2 z-10 w-6 h-6 rounded flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-white/80 text-gray-400 hover:bg-white hover:text-gray-600"
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  {/* Image */}
                  <div
                    className="relative h-36 sm:h-48 w-full cursor-pointer group"
                    onClick={() => setPreviewIndex(index)}
                  >
                    <Image
                      src={image.public_url || ""}
                      alt={image.alt_text || "Gallery image"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                    {/* Hover overlay with zoom icon */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* Badges */}
                  {image.is_featured && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold z-10">
                      Homepage
                    </div>
                  )}

                  {/* Info + Actions */}
                  <div className="bg-gray-50 p-2.5 sm:p-3">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                      {cleanDisplayName(image)}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-xs text-gray-500">
                      <span className="inline-flex items-center gap-0.5 bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-medium">
                        {categoryLabelMap[image.category || "general"] ||
                          image.category}
                      </span>
                      {image.file_size && (
                        <span className="inline-flex items-center gap-0.5">
                          <HardDrive className="w-3 h-3" />
                          {formatFileSize(image.file_size)}
                        </span>
                      )}
                      {image.created_at && (
                        <span className="hidden sm:inline-flex items-center gap-0.5">
                          <Calendar className="w-3 h-3" />
                          {formatDate(image.created_at)}
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => setEditingImage(image)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleFeatured(image)}
                        className={`p-1.5 rounded transition-colors ${
                          image.is_featured
                            ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50"
                            : "text-gray-500 hover:text-yellow-500 hover:bg-yellow-50"
                        }`}
                        title={
                          image.is_featured
                            ? "Hide from Homepage"
                            : "Show on Homepage"
                        }
                      >
                        <Star className={`w-3.5 h-3.5 ${image.is_featured ? "fill-current" : ""}`} />
                      </button>
                      <button
                        onClick={() => openDeleteModal("single", image)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-auto"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <ImageUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={fetchImages}
      />

      <EditImageModal
        image={editingImage}
        onClose={() => setEditingImage(null)}
        onSuccess={fetchImages}
      />

      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        type={deleteConfirm.type}
        imageName={
          deleteConfirm.image
            ? cleanDisplayName(deleteConfirm.image)
            : undefined
        }
        totalImages={
          deleteConfirm.type === "bulk"
            ? selectedIds.size
            : deleteConfirm.type === "all"
            ? images.length
            : 1
        }
        isDeleting={deleteConfirm.isDeleting}
      />

      <BulkMoveCategoryModal
        isOpen={showBulkMoveModal}
        onClose={() => setShowBulkMoveModal(false)}
        onConfirm={bulkMoveCategory}
        count={selectedIds.size}
      />

      {/* Lightbox Preview */}
      <Lightbox
        images={lightboxImages}
        selectedIndex={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onNext={nextImage}
        onPrev={prevImage}
        onSelect={setPreviewIndex}
      />
    </div>
  );
}
