"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CarouselImage {
  id: string | number;
  src: string;
  alt: string;
  caption?: string;
  categoryLabel?: string;
}

interface GalleryCarouselProps {
  images: CarouselImage[];
  onImageClick: (index: number) => void;
  autoSlideInterval?: number;
}

const GalleryCarousel = ({
  images,
  onImageClick,
  autoSlideInterval = 4500,
}: GalleryCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [itemsPerView, setItemsPerView] = useState(3);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Responsive items per view
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  // Always use the responsive itemsPerView for card sizing — keeps cards consistent size
  const effectiveItemsPerView = itemsPerView;

  const maxIndex = Math.max(0, images.length - effectiveItemsPerView);

  // Clamp currentSlide when itemsPerView or images change
  useEffect(() => {
    if (currentSlide > maxIndex) {
      setCurrentSlide(maxIndex);
    }
  }, [currentSlide, maxIndex]);

  // Auto-slide
  useEffect(() => {
    if (isHovered || images.length <= effectiveItemsPerView) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, autoSlideInterval);

    return () => clearInterval(interval);
  }, [isHovered, maxIndex, autoSlideInterval, images.length, itemsPerView]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, maxIndex));
  }, [maxIndex]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  // Touch handlers
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
      nextSlide();
    } else if (distance < -75) {
      prevSlide();
    }
    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, nextSlide, prevSlide]);

  if (images.length === 0) return null;

  const totalDots = maxIndex + 1;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Carousel viewport */}
      <div
        className="overflow-hidden rounded-xl"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={trackRef}
          className={`flex transition-transform duration-500 ease-out ${images.length < effectiveItemsPerView ? "justify-center" : ""}`}
          style={{
            transform: `translateX(-${currentSlide * (100 / effectiveItemsPerView)}%)`,
          }}
        >
          {images.map((image, index) => (
            <div
              key={image.id}
              className="flex-shrink-0 px-1.5 sm:px-2"
              style={{ width: `${100 / effectiveItemsPerView}%` }}
            >
              <div
                className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group bg-muted"
                onClick={() => onImageClick(index)}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes={`(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw`}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                {/* Caption */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <p className="text-foreground font-semibold text-sm sm:text-base truncate">
                    {image.caption || image.alt}
                  </p>
                  {image.categoryLabel && (
                    <span className="text-foreground/70 text-xs sm:text-sm">
                      {image.categoryLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {images.length > effectiveItemsPerView && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="absolute left-0 sm:-left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed text-foreground rounded-full p-2 sm:p-2.5 lg:p-3 transition-all duration-300 shadow-lg backdrop-blur-sm border border-white/20 z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            disabled={currentSlide >= maxIndex}
            className="absolute right-0 sm:-right-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed text-foreground rounded-full p-2 sm:p-2.5 lg:p-3 transition-all duration-300 shadow-lg backdrop-blur-sm border border-white/20 z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {totalDots > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-6">
          {Array.from({ length: totalDots }).map((_, index) => (
            <button
              type="button"
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`rounded-full transition-all duration-300 ${
                currentSlide === index
                  ? "bg-primary w-6 h-2"
                  : "bg-muted-foreground/40 hover:bg-muted-foreground/70 w-2 h-2"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryCarousel;
