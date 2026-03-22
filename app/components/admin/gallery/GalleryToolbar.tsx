"use client";

import {
  Upload,
  Trash2,
  Search,
  CheckSquare,
  Square,
  FolderInput,
  Star,
  StarOff,
} from "lucide-react";
import { GalleryImage, categoryOptions } from "./galleryConstants";

interface GalleryToolbarProps {
  images: GalleryImage[];
  filteredImages: GalleryImage[];
  loading: boolean;
  searchTerm: string;
  selectedCategory: string;
  selectedIds: Set<number>;
  onSearchChange: (term: string) => void;
  onCategoryChange: (category: string) => void;
  onUploadClick: () => void;
  onDeleteAllClick: () => void;
  onBulkDeleteClick: () => void;
  onBulkMoveClick: () => void;
  onBulkFeature: (featured: boolean) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export default function GalleryToolbar({
  images,
  filteredImages,
  loading,
  searchTerm,
  selectedCategory,
  selectedIds,
  onSearchChange,
  onCategoryChange,
  onUploadClick,
  onDeleteAllClick,
  onBulkDeleteClick,
  onBulkMoveClick,
  onBulkFeature,
  onSelectAll,
  onClearSelection,
}: GalleryToolbarProps) {
  const filterCategories = [
    { value: "all", label: "All Images" },
    ...categoryOptions,
  ];

  const getCategoryCount = (category: string) => {
    return category === "all"
      ? images.length
      : images.filter((img) => img.category === category).length;
  };

  return (
    <>
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
            onClick={onUploadClick}
            className="flex-1 sm:flex-none bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            Upload Images
          </button>
          {images.length > 0 && (
            <button
              onClick={onDeleteAllClick}
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
            onChange={(e) => onSearchChange(e.target.value)}
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
                onCategoryChange(category.value);
                onClearSelection();
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
              onClick={onBulkDeleteClick}
              className="px-3 py-1.5 bg-red-600 text-white text-xs sm:text-sm rounded-lg hover:bg-red-700 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
            <button
              onClick={onBulkMoveClick}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
            >
              <FolderInput className="w-3.5 h-3.5" />
              Move Category
            </button>
            <button
              onClick={() => onBulkFeature(true)}
              className="px-3 py-1.5 bg-yellow-500 text-white text-xs sm:text-sm rounded-lg hover:bg-yellow-600 flex items-center gap-1"
            >
              <Star className="w-3.5 h-3.5" />
              Add to Homepage
            </button>
            <button
              onClick={() => onBulkFeature(false)}
              className="px-3 py-1.5 bg-gray-600 text-white text-xs sm:text-sm rounded-lg hover:bg-gray-700 flex items-center gap-1"
            >
              <StarOff className="w-3.5 h-3.5" />
              Remove from Homepage
            </button>
          </div>
          <button
            onClick={onClearSelection}
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
            onClick={onSelectAll}
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
    </>
  );
}
