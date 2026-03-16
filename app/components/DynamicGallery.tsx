"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { supabase } from "../supabaseClient";
import { Tables } from "../../database.types";
import GalleryCarousel from "./GalleryCarousel";
import Lightbox from "./Lightbox";

type GalleryImage = Tables<"gallery_images">;

interface GalleryImageWithCategory extends Omit<GalleryImage, "id"> {
  id: string | number;
  categoryLabel?: string | null;
  displayName?: string;
}

// Loading Skeleton Component
export const LoadingSkeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-600 rounded ${className}`}></div>
);

// Dynamic Gallery Component that loads from Supabase
const DynamicGallery = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [images, setImages] = useState<GalleryImageWithCategory[]>([]);

  // Static fallback images (always available)
  const staticGalleryImages = useMemo(
    () => [
      {
        src: "/gallery1.jpg",
        alt: "Crystal clear swimming pool with mountain views",
      },
      {
        src: "/gallery2.jpg",
        alt: "Spacious camping grounds under starlit skies",
      },
      {
        src: "/gallery3.jpg",
        alt: "Cozy bonfire area perfect for evening gatherings",
      },
      {
        src: "/gallery4.jpg",
        alt: "Private river access for swimming and relaxation",
      },
      {
        src: "/gallery5.jpg",
        alt: "Fully equipped outdoor kitchen for group cooking",
      },
      { src: "/gallery6.jpg", alt: "Scenic picnic areas surrounded by nature" },
      {
        src: "/pool.jpg",
        alt: "Resort overview showcasing all premium amenities",
      },
      { src: "/pooll.jpg", alt: "Pool facilities with crystal-clear waters" },
    ],
    []
  );

  // Category labels for display
  const categoryLabels = useMemo(
    () => ({
      camping: "Camping Grounds",
      rooms: "Family Rooms",
      pool: "Pool Area",
      pets: "Pet Area",
      dining: "Dining & Kitchen",
      events: "Events & Activities",
      nature: "Nature & Scenery",
      general: "General",
    }),
    []
  );

  // Display images: use DB images if available, static fallback ONLY when DB is empty
  const displayImages = useMemo(() => {
    const maxImages = 8;

    const dynamicImages = images.map((img) => ({
      ...img,
      id: img.id.toString(),
      displayName:
        img.caption ||
        img.alt_text ||
        (img.file_name
          ? img.file_name
              .replace(/\.[^/.]+$/, "")
              .replace(/-/g, " ")
              .replace(/_/g, " ")
          : "Gallery Image"),
      categoryLabel:
        categoryLabels[img.category as keyof typeof categoryLabels] ||
        img.category,
    }));

    // If we have any DB images, use those exclusively
    if (dynamicImages.length > 0) {
      return dynamicImages.slice(0, maxImages);
    }

    // No DB images at all — use static fallback
    return staticGalleryImages.map((img, index) => ({
      id: `static-${index}`,
      file_name: img.alt,
      alt_text: img.alt,
      caption: img.alt,
      category: "general" as const,
      is_featured: false,
      display_order: index + 1000,
      storage_path: img.src,
      public_url: img.src,
      file_size: null,
      mime_type: "image/jpeg",
      uploaded_by: "system",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      categoryLabel: "General Views",
      displayName: img.alt,
    }));
  }, [images, staticGalleryImages, categoryLabels]);

  // Map to carousel and lightbox formats
  const carouselImages = useMemo(
    () =>
      displayImages.map((img) => ({
        id: img.id,
        src: img.public_url || img.storage_path || "",
        alt: img.alt_text || img.displayName || "Gallery Image",
        caption: img.displayName || img.alt_text || undefined,
        categoryLabel: img.categoryLabel || undefined,
      })),
    [displayImages]
  );

  const lightboxImages = useMemo(
    () =>
      displayImages.map((img) => ({
        src: img.public_url || img.storage_path || "",
        alt: img.alt_text || img.displayName || "Gallery Image",
        title: img.displayName || img.alt_text || undefined,
      })),
    [displayImages]
  );

  // Fetch images — only featured (curated by admin). Fallback to recent if none featured.
  const fetchImages = useCallback(async () => {
    try {
      // Get featured images (admin-curated for homepage)
      const { data: featuredData, error: featuredError } = await supabase
        .from("gallery_images")
        .select("*")
        .eq("is_featured", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (featuredError) {
        console.error("Error fetching gallery images:", featuredError);
        return;
      }

      if (featuredData && featuredData.length > 0) {
        const mappedImages = featuredData.map((img) => ({
          ...img,
          categoryLabel:
            categoryLabels[img.category as keyof typeof categoryLabels] ||
            img.category,
        }));
        setImages(mappedImages);
        return;
      }

      // Fallback: no featured images yet, show recent uploads
      const { data: recentData, error: recentError } = await supabase
        .from("gallery_images")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);

      if (recentError) {
        console.error("Error fetching recent images:", recentError);
        return;
      }

      if (recentData && recentData.length > 0) {
        const mappedImages = recentData.map((img) => ({
          ...img,
          categoryLabel:
            categoryLabels[img.category as keyof typeof categoryLabels] ||
            img.category,
        }));
        setImages(mappedImages);
      } else {
        setImages([]);
      }
    } catch (error) {
      console.error("Error in fetchImages:", error);
    }
  }, [categoryLabels]);

  // Load images on mount with refresh interval
  useEffect(() => {
    let mounted = true;

    const loadImages = async () => {
      if (mounted) {
        await fetchImages();
      }
    };

    loadImages();

    const refreshInterval = setInterval(() => {
      if (mounted) {
        fetchImages();
      }
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(refreshInterval);
    };
  }, [fetchImages]);

  // Refresh when user comes back to the tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchImages();
      }
    };

    const handleFocus = () => {
      fetchImages();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchImages]);

  // Lightbox navigation
  const nextImage = useCallback(() => {
    setSelectedImage((prev) =>
      prev !== null ? (prev + 1) % displayImages.length : 0
    );
  }, [displayImages.length]);

  const prevImage = useCallback(() => {
    setSelectedImage((prev) =>
      prev !== null
        ? (prev - 1 + displayImages.length) % displayImages.length
        : 0
    );
  }, [displayImages.length]);

  return (
    <>
      <section
        id="gallery"
        className="bg-gray-800 text-white py-6 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-8"
      >
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-8 sm:mb-10 lg:mb-12">
          Photo Gallery
        </h2>

        <div className="max-w-7xl mx-auto mb-8">
          <GalleryCarousel
            images={carouselImages}
            onImageClick={(index) => setSelectedImage(index)}
          />
        </div>

        {/* View Full Gallery Button */}
        <div className="max-w-7xl mx-auto text-center">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full px-6 py-3 transition-all duration-300 group touch-manipulation min-h-[48px]"
          >
            <span className="text-white/80 text-sm group-hover:text-white">
              View Full Gallery
            </span>
            <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
          </Link>
        </div>
      </section>

      <Lightbox
        images={lightboxImages}
        selectedIndex={selectedImage}
        onClose={() => setSelectedImage(null)}
        onNext={nextImage}
        onPrev={prevImage}
        onSelect={setSelectedImage}
      />
    </>
  );
};

export default DynamicGallery;
