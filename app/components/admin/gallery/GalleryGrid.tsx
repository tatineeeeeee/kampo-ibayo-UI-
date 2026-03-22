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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-800">Loading gallery...</span>
      </div>
    );
  }

  if (filteredImages.length === 0) {
    return (
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
                ? "border-blue-500 ring-2 ring-blue-200"
                : "border-gray-200 hover:shadow-md"
            }`}
          >
            {/* Checkbox */}
            <button
              onClick={() => onToggleSelect(image.id)}
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
                  onClick={() => onEdit(image)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onToggleFeatured(image)}
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
                  onClick={() => onDeleteSingle(image)}
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
  );
}
