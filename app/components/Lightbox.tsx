"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface LightboxImage {
  src: string;
  alt: string;
  title?: string;
}

interface LightboxProps {
  images: LightboxImage[];
  selectedIndex: number | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelect: (index: number) => void;
}

const Lightbox = ({
  images,
  selectedIndex,
  onClose,
  onNext,
  onPrev,
  onSelect,
}: LightboxProps) => {
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const closingRef = useRef(false);

  // Animate in on open
  useEffect(() => {
    if (selectedIndex !== null) {
      closingRef.current = false;
      // Trigger animation on next frame
      requestAnimationFrame(() => setIsVisible(true));
    }
  }, [selectedIndex]);

  // Instant close
  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setIsVisible(false);
    onClose();
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          onPrev();
          break;
        case "ArrowRight":
          onNext();
          break;
        case "Escape":
          handleClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedIndex, onNext, onPrev, handleClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "0px";
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [selectedIndex]);

  const handleImageLoad = useCallback(() => {
    setIsImageLoading(false);
  }, []);

  // Reset loading state when image changes
  useEffect(() => {
    if (selectedIndex !== null) {
      setIsImageLoading(true);
    }
  }, [selectedIndex]);

  // Touch swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 75) {
      onNext();
    } else if (distance < -75) {
      onPrev();
    }
    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, onNext, onPrev]);

  if (selectedIndex === null || images.length === 0) return null;

  const currentImage = images[selectedIndex];
  if (!currentImage) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${
        isVisible
          ? "bg-black/90 backdrop-blur-sm"
          : "bg-black/0 backdrop-blur-none"
      }`}
      onClick={handleClose}
      style={{ touchAction: "none" }}
    >
      <div
        className={`relative w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-6 transition-all duration-300 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Loading spinner */}
        {isImageLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}

        {/* Main image container */}
        <div
          className="relative flex items-center justify-center w-full h-full max-w-6xl max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={currentImage.src}
            alt={currentImage.alt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
            className="object-contain rounded-lg shadow-2xl"
            onLoad={handleImageLoad}
            onError={() => setIsImageLoading(false)}
          />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 sm:p-3 transition-all duration-300 shadow-lg backdrop-blur-sm border border-white/30 z-50"
          aria-label="Close lightbox"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 backdrop-blur-sm text-white rounded-full p-2 sm:p-3 md:p-4 transition-all duration-300 shadow-lg border border-white/30 z-50"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 backdrop-blur-sm text-white rounded-full p-2 sm:p-3 md:p-4 transition-all duration-300 shadow-lg border border-white/30 z-50"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </button>
          </>
        )}

        {/* Image Information Panel */}
        <div className="absolute bottom-4 sm:bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-xl md:rounded-2xl shadow-xl border border-white/30 max-w-[85vw] sm:max-w-md z-40">
          <div className="text-center">
            <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-1 truncate">
              {currentImage.title || currentImage.alt || "Gallery Image"}
            </h3>
            <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-white/80">
              <span>
                {selectedIndex + 1} of {images.length}
              </span>
              <span className="hidden sm:inline">&bull;</span>
              <span className="hidden sm:flex items-center gap-1">
                Use
                <kbd className="bg-white/20 px-1 sm:px-2 py-0.5 rounded text-xs font-mono">
                  &larr;
                </kbd>
                <kbd className="bg-white/20 px-1 sm:px-2 py-0.5 rounded text-xs font-mono">
                  &rarr;
                </kbd>
                to navigate
              </span>
            </div>
          </div>
        </div>

        {/* Mobile swipe hint + dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-20 xs:bottom-24 sm:hidden left-1/2 transform -translate-x-1/2 flex gap-1.5 z-30">
            {images.length <= 12 &&
              images.map((_, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(index);
                  }}
                  className={`w-2.5 h-2.5 xs:w-3 xs:h-3 rounded-full transition-all duration-200 touch-manipulation ${
                    index === selectedIndex
                      ? "bg-white shadow-lg scale-110"
                      : "bg-white/40 hover:bg-white/60"
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Lightbox;
