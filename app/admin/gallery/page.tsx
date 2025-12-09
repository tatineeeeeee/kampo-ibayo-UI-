"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import Image from "next/image";

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
  type: "single" | "all";
  imageName?: string;
  totalImages: number;
  isDeleting?: boolean;
}

function ImageUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: ImageUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [category, setCategory] = useState<string>("general");
  const [caption, setCaption] = useState("");

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
      // Temporarily bypass user check for debugging
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("No user found");
        return;
      }
      console.log("Current user:", user); // Debug log

      const uploadPromises = Array.from(selectedFiles).map(
        async (file, index) => {
          // Create unique filename
          const fileExt = file.name.split(".").pop();
          const fileName = `${category}-${Date.now()}-${index}.${fileExt}`;
          const filePath = `${category}/${fileName}`;

          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from("gallery-images")
            .upload(filePath, file);

          if (uploadError) {
            throw new Error(
              `Failed to upload ${file.name}: ${uploadError.message}`
            );
          }

          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("gallery-images").getPublicUrl(filePath);

          // Save metadata to database
          console.log("Attempting to insert:", {
            file_name: fileName,
            storage_path: filePath,
            public_url: publicUrl,
            category,
            caption: caption || null,
            alt_text: caption || file.name,
            file_size: file.size,
            mime_type: file.type,
            uploaded_by: user.id,
            display_order: 0,
          });

          const { error: dbError } = await supabase
            .from("gallery_images")
            .insert({
              file_name: fileName,
              storage_path: filePath,
              public_url: publicUrl,
              category,
              caption: caption || null,
              alt_text: caption || file.name,
              file_size: file.size,
              mime_type: file.type,
              uploaded_by: user.id,
              display_order: 0,
            });

          if (dbError) {
            console.error("Database insert error:", dbError);
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
      setCaption("");
      setCategory("general");
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
            <span className="sr-only">Close</span>×
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
              <option value="general">General</option>
              <option value="featured">Featured</option>
              <option value="rooms">Rooms</option>
              <option value="dining">Dining</option>
              <option value="amenities">Amenities</option>
              <option value="exterior">Exterior</option>
              <option value="events">Events</option>
            </select>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Caption (Optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption for all images..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-500"
            />
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

  const title = type === "all" ? "Delete All Images" : "Delete Image";
  const message =
    type === "all"
      ? `Are you sure you want to delete all ${totalImages} images? This action cannot be undone.`
      : `Are you sure you want to delete "${imageName}"? This action cannot be undone.`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                type === "all" ? "bg-red-100" : "bg-orange-100"
              }`}
            >
              <Trash2
                className={`w-5 h-5 ${
                  type === "all" ? "text-red-600" : "text-orange-600"
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
            ×
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 leading-relaxed">{message}</p>
          {type === "all" && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">
                ⚠️ This action cannot be undone. All images will be permanently
                deleted from both the database and storage.
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
              type === "all"
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
                {type === "all" ? "Delete All" : "Delete"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

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
          alt_text: formData.alt_text || null,
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
            ×
          </button>
        </div>

        {/* Image Preview */}
        <div className="mb-4 relative h-32 w-full">
          <Image
            src={image.public_url || ""}
            alt={image.alt_text || "Gallery image"}
            fill
            className="object-cover rounded-lg"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>

        <div className="space-y-4">
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
              <option value="general">General</option>
              <option value="featured">Featured</option>
              <option value="rooms">Rooms</option>
              <option value="dining">Dining</option>
              <option value="amenities">Amenities</option>
              <option value="exterior">Exterior</option>
              <option value="events">Events</option>
            </select>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Caption
            </label>
            <input
              type="text"
              value={formData.caption}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, caption: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-500"
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-500"
            />
          </div>

          {/* Featured */}
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
              Featured Image
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

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: "single" | "all";
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
        .order("created_at", { ascending: false }) // Most recent first
        .order("is_featured", { ascending: false })
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching images:", error);
        // Use console.error instead of showError to prevent dependency loop
        console.error("Failed to load gallery images");
      } else {
        setImages(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
      console.error("An error occurred while loading images");
    } finally {
      setLoading(false);
    }
  }, []); // Remove showError dependency to prevent infinite loop

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const filteredImages =
    selectedCategory === "all"
      ? images
      : images.filter((img) => img.category === selectedCategory);

  const openDeleteModal = (type: "single" | "all", image?: GalleryImage) => {
    setDeleteConfirm({
      isOpen: true,
      type: type,
      image: image,
      isDeleting: false,
    });
  };

  const openDeleteAllModal = () => {
    openDeleteModal("all");
  };

  const closeDeleteModal = () => {
    setDeleteConfirm({
      isOpen: false,
      type: "single",
      image: undefined,
      isDeleting: false,
    });
  };

  const deleteImage = (image: GalleryImage) => {
    openDeleteModal("single", image);
  };

  const performSingleDelete = async (image: GalleryImage) => {
    try {
      // Show immediate feedback
      const originalImages = images;
      setImages((prev) => prev.filter((img) => img.id !== image.id));

      // Delete from database first (faster)
      const { error: dbError } = await supabase
        .from("gallery_images")
        .delete()
        .eq("id", image.id);

      if (dbError) {
        console.error("Failed to delete image from database:", dbError);
        // Restore images on error
        setImages(originalImages);
        showError("Failed to delete image from database");
        return;
      }

      // Delete from storage (slower, but don't block UI)
      const { error: storageError } = await supabase.storage
        .from("gallery-images")
        .remove([image.storage_path]);

      if (storageError) {
        console.error("Storage deletion error:", storageError);
        console.warn("Image removed from database but storage cleanup failed");
      }

      success("Image deleted successfully!");

      // Refresh to ensure consistency
      setTimeout(() => {
        fetchImages();
      }, 500);
    } catch (error) {
      console.error("Delete error:", error);
      // Restore images on error
      setImages(images);
      showError("Failed to delete image");
    }
  };

  const handleConfirmDelete = async () => {
    // For single delete, we need an image. For delete all, we don't.
    if (deleteConfirm.type === "single" && !deleteConfirm.image) return;

    setDeleteConfirm((prev) => ({ ...prev, isDeleting: true }));

    if (deleteConfirm.type === "single" && deleteConfirm.image) {
      await performSingleDelete(deleteConfirm.image);
    } else if (deleteConfirm.type === "all") {
      await performDeleteAll();
    }

    closeDeleteModal();
  };

  const deleteAllImages = () => {
    openDeleteAllModal();
  };

  const performDeleteAll = async () => {
    try {
      // Show immediate feedback
      const originalImages = images;

      // Get all storage paths for bulk deletion BEFORE clearing the UI
      const storagePaths = originalImages.map((img) => img.storage_path);

      setImages([]);
      setLoading(true);

      // Delete all from database first (faster)
      const { error: dbError } = await supabase
        .from("gallery_images")
        .delete()
        .neq("id", 0); // Delete all records

      if (dbError) {
        console.error("Failed to delete images from database:", dbError);
        setImages(originalImages);
        setLoading(false);
        showError("Failed to delete images from database");
        return;
      }

      // Delete all from storage (slower, but don't block UI too much)
      const { error: storageError } = await supabase.storage
        .from("gallery-images")
        .remove(storagePaths);

      if (storageError) {
        console.error("Storage bulk deletion error:", storageError);
        console.warn(
          "Images removed from database but some storage cleanup failed"
        );
      }

      success(`Successfully deleted all ${originalImages.length} images!`);

      // Refresh to ensure consistency
      fetchImages();
    } catch (error) {
      console.error("Bulk delete error:", error);
      showError("Failed to delete all images");
      fetchImages(); // Refresh to show current state
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = async (image: GalleryImage) => {
    try {
      const { error } = await supabase
        .from("gallery_images")
        .update({ is_featured: !image.is_featured })
        .eq("id", image.id);

      if (error) throw error;

      success(
        `Image ${
          !image.is_featured ? "marked as featured" : "removed from featured"
        }!`
      );
      fetchImages();
    } catch (error) {
      console.error("Toggle featured error:", error);
      console.error("Failed to update featured status");
    }
  };

  const categories = [
    { value: "all", label: "All Images" },
    { value: "featured", label: "Featured" },
    { value: "rooms", label: "Rooms" },
    { value: "dining", label: "Dining" },
    { value: "amenities", label: "Amenities" },
    { value: "exterior", label: "Exterior" },
    { value: "events", label: "Events" },
    { value: "general", label: "General" },
  ];

  const getCategoryCount = (category: string) => {
    return category === "all"
      ? images.length
      : images.filter((img) => img.category === category).length;
  };

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
                onClick={() => deleteAllImages()}
                className="flex-1 sm:flex-none bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                Delete All
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-4 sm:mb-6">
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors ${
                  selectedCategory === category.value
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                }`}
              >
                <span className="sm:hidden">
                  {category.value === "all"
                    ? "All"
                    : category.value === "rooms"
                    ? "Room"
                    : category.value === "amenities"
                    ? "Amen"
                    : category.value === "surroundings"
                    ? "Area"
                    : category.value === "activities"
                    ? "Act"
                    : category.value === "general"
                    ? "Gen"
                    : category.label}
                </span>
                <span className="hidden sm:inline">{category.label}</span>
                <span className="ml-1">
                  ({getCategoryCount(category.value)})
                </span>
              </button>
            ))}
          </div>
        </div>

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
              {selectedCategory === "all"
                ? "No images uploaded yet"
                : `No images in ${selectedCategory} category`}
            </p>
            <p className="text-gray-600 text-sm">
              Start building your resort gallery by uploading your first images
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="relative group bg-gray-100 rounded-lg overflow-hidden"
              >
                {/* Image */}
                <div className="relative h-32 sm:h-48 w-full">
                  <Image
                    src={image.public_url || ""}
                    alt={image.alt_text || "Gallery image"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                </div>

                {/* Featured Badge */}
                {image.is_featured && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                    Featured
                  </div>
                )}

                {/* Category Badge */}
                <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  {image.category}
                </div>

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() =>
                      window.open(image.public_url || "", "_blank")
                    }
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                    title="View Full Size"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingImage(image)}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                    title="Edit Image"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleFeatured(image)}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                    title={
                      image.is_featured
                        ? "Remove from Featured"
                        : "Mark as Featured"
                    }
                  >
                    {image.is_featured ? (
                      <StarOff className="w-4 h-4" />
                    ) : (
                      <Star className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteImage(image)}
                    className="p-2 bg-red-500/80 backdrop-blur-sm rounded-lg text-white hover:bg-red-600/80 transition-colors"
                    title="Delete Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Image Info */}
                <div className="p-2 sm:p-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                    {image.caption ||
                      (image.file_name
                        ? image.file_name
                            .replace(/\.[^/.]+$/, "")
                            .replace(/-/g, " ")
                            .replace(/_/g, " ")
                        : "Gallery Image")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {image.file_size
                      ? `${(image.file_size / 1024 / 1024).toFixed(2)} MB`
                      : "Unknown size"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <ImageUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={fetchImages}
      />

      {/* Edit Modal */}
      <EditImageModal
        image={editingImage}
        onClose={() => setEditingImage(null)}
        onSuccess={fetchImages}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        type={deleteConfirm.type}
        imageName={deleteConfirm.image?.file_name}
        totalImages={images.length}
        isDeleting={deleteConfirm.isDeleting}
      />
    </div>
  );
}
