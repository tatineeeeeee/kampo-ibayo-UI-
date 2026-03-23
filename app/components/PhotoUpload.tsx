'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { Camera, X, Upload } from 'lucide-react';

interface PhotoUploadProps {
  onPhotosChange: (photos: File[]) => void;
  maxPhotos?: number;
  className?: string;
}

const PhotoUpload = ({ onPhotosChange, maxPhotos = 3, className = "" }: PhotoUploadProps) => {
  const [photos, setPhotos] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create blob URLs with proper cleanup to prevent memory leaks
  const blobUrls = useMemo(() => photos.map(photo => URL.createObjectURL(photo)), [photos]);
  useEffect(() => {
    return () => {
      blobUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [blobUrls]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    const newPhotos = Array.from(files).filter(file => {
      // Only allow image files
      return file.type.startsWith('image/');
    }).slice(0, maxPhotos - photos.length);

    const updatedPhotos = [...photos, ...newPhotos].slice(0, maxPhotos);
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <label className="block text-foreground font-semibold mb-3">
        Add Photos (Optional)
        <span className="text-muted-foreground font-normal text-sm ml-2">
          Up to {maxPhotos} photos
        </span>
      </label>

      {/* Photo Preview */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={blobUrls[index]}
                alt={`Preview ${index + 1}`}
                className="w-full h-20 object-cover rounded-lg border border-border"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {photos.length < maxPhotos && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            dragActive
              ? 'border-primary/70 bg-primary/10'
              : 'border-border hover:border-border hover:bg-muted/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
              <Camera className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-muted-foreground font-medium">
                Drop photos here or click to upload
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {maxPhotos - photos.length} {maxPhotos - photos.length === 1 ? 'photo' : 'photos'} remaining
              </p>
            </div>
            <div className="flex items-center gap-2 text-primary text-sm">
              <Upload className="w-4 h-4" />
              Choose files
            </div>
          </div>
        </div>
      )}

      {photos.length >= maxPhotos && (
        <p className="text-center text-muted-foreground text-sm mt-2">
          Maximum {maxPhotos} photos reached
        </p>
      )}
    </div>
  );
};

export default PhotoUpload;