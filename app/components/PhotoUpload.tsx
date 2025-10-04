'use client';

import { useState, useRef } from 'react';
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
      <label className="block text-white font-semibold mb-3">
        Add Photos (Optional)
        <span className="text-gray-400 font-normal text-sm ml-2">
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
                src={URL.createObjectURL(photo)}
                alt={`Preview ${index + 1}`}
                className="w-full h-20 object-cover rounded-lg border border-gray-600"
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
              ? 'border-blue-400 bg-blue-900/20'
              : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
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
            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
              <Camera className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-gray-300 font-medium">
                Drop photos here or click to upload
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {maxPhotos - photos.length} {maxPhotos - photos.length === 1 ? 'photo' : 'photos'} remaining
              </p>
            </div>
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <Upload className="w-4 h-4" />
              Choose files
            </div>
          </div>
        </div>
      )}

      {photos.length >= maxPhotos && (
        <p className="text-center text-gray-400 text-sm mt-2">
          Maximum {maxPhotos} photos reached
        </p>
      )}
    </div>
  );
};

export default PhotoUpload;