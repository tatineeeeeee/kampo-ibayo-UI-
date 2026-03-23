"use client";

import {
  Image as ImageIcon,
  Trash2,
  Edit3,
  Eye,
  Star,
  CheckSquare,
  Square,
  HardDrive,
  Calendar,
} from "lucide-react";
import Image from "next/image";
import {
  GalleryImage,
  categoryLabelMap,
  cleanDisplayName,
  formatDate,
  formatFileSize,
} from "./galleryConstants";

interface GalleryGridProps {
  filteredImages: GalleryImage[];
  loading: boolean;
  searchTerm: string;
  selectedCategory: string;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onPreview: (index: number) => void;
  onEdit: (image: GalleryImage) => void;
  onToggleFeatured: (image: GalleryImage) => void;
  onDeleteSingle: (image: GalleryImage) => void;
}

export default function GalleryGrid({
  filteredImages,
  loading,
  searchTerm,
  selectedCategory,
  selectedIds,
  onToggleSelect,
  onPreview,
  onEdit,
  onToggleFeatured,
  onDeleteSingle,
}: GalleryGridProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-foreground">Loading gallery...</span>
      </div>
    );
  }

  if (filteredImages.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
        <p className="text-foreground font-medium mb-2 text-sm sm:text-base">
          {searchTerm
            ? `No images matching "${searchTerm}"`
            : selectedCategory === "all"
            ? "No images uploaded yet"
            : `No images in ${selectedCategory} category`}
        </p>
        <p className="text-muted-foreground text-sm">
          {searchTerm
            ? "Try a different search term"
            : "Upload your first images to get started"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {filteredImages.map((image, index) => {
        const isSelected = selectedIds.has(image.id);
        return (
          <div
            key={image.id}
            className={`relative rounded-xl overflow-hidden border transition-all shadow-sm ${
              isSelected
                ? "border-primary ring-2 ring-primary/30"
                : "border-border hover:shadow-md"
            }`}
          >
            {/* Checkbox */}
            <button
              onClick={() => onToggleSelect(image.id)}
              className={`absolute top-2 left-2 z-10 w-6 h-6 rounded flex items-center justify-center transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-card/80 text-muted-foreground hover:bg-card hover:text-muted-foreground"
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
              onClick={() => onPreview(index)}
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
              <div className="absolute top-2 right-2 bg-warning text-white px-1.5 py-0.5 rounded text-[10px] font-semibold z-10">
                Homepage
              </div>
            )}

            {/* Info + Actions */}
            <div className="bg-muted p-2.5 sm:p-3">
              <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                {cleanDisplayName(image)}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-0.5 bg-muted text-foreground px-1.5 py-0.5 rounded font-medium">
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
              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
                <button
                  onClick={() => onEdit(image)}
                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onToggleFeatured(image)}
                  className={`p-1.5 rounded transition-colors ${
                    image.is_featured
                      ? "text-warning hover:text-warning hover:bg-warning/10"
                      : "text-muted-foreground hover:text-warning hover:bg-warning/10"
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
                  onClick={() => onDeleteSingle(image)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors ml-auto"
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
  );
}
