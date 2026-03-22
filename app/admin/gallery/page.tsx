"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import { useToastHelpers } from "../../components/Toast";
import Lightbox, { LightboxImage } from "../../components/Lightbox";
import GalleryToolbar from "../../components/admin/gallery/GalleryToolbar";
import GalleryGrid from "../../components/admin/gallery/GalleryGrid";
import ImageUploadModal from "../../components/admin/gallery/ImageUploader";
import EditImageModal from "../../components/admin/gallery/EditImageModal";
import DeleteConfirmModal from "../../components/admin/gallery/DeleteConfirmModal";
import BulkMoveCategoryModal from "../../components/admin/gallery/BulkMoveCategoryModal";
import {
  GalleryImage,
  categoryLabelMap,
  cleanDisplayName,
} from "../../components/admin/gallery/galleryConstants";

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

  // ── Render ──

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <GalleryToolbar
          images={images}
          filteredImages={filteredImages}
          loading={loading}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          selectedIds={selectedIds}
          onSearchChange={setSearchTerm}
          onCategoryChange={setSelectedCategory}
          onUploadClick={() => setShowUploadModal(true)}
          onDeleteAllClick={() => openDeleteModal("all")}
          onBulkDeleteClick={() => openDeleteModal("bulk")}
          onBulkMoveClick={() => setShowBulkMoveModal(true)}
          onBulkFeature={bulkToggleFeatured}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
        />

        <GalleryGrid
          filteredImages={filteredImages}
          loading={loading}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onPreview={setPreviewIndex}
          onEdit={setEditingImage}
          onToggleFeatured={toggleFeatured}
          onDeleteSingle={(image) => openDeleteModal("single", image)}
        />
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
