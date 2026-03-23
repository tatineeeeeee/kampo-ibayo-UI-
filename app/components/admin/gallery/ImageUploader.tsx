"use client";

import { useState } from "react";
import { supabase } from "../../../supabaseClient";
import { useToastHelpers } from "../../Toast";
import { Upload } from "lucide-react";
import { categoryOptions, categoryLabelMap } from "./galleryConstants";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImageUploadModal({
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
      <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Upload Images</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-muted-foreground"
          >
            <span className="sr-only">Close</span>&times;
          </button>
        </div>

        <div className="space-y-4">
          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Images
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-info/10"
            />
            {selectedFiles && selectedFiles.length > 0 && (
              <p className="text-sm text-foreground mt-1">
                {selectedFiles.length} file(s) selected
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Swimming Pool at Night"
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary text-foreground placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave blank to auto-generate from category
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary text-foreground bg-card"
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
              className="text-sm font-medium text-foreground"
            >
              Show on Homepage
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-foreground bg-muted rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={uploadImages}
            disabled={uploading || !selectedFiles}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
