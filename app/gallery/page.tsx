"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Sparkles,
  Bed,
  UtensilsCrossed,
  PartyPopper,
  Eye,
  ImageIcon,
  Star,
  Tent,
  Waves,
  PawPrint,
  Mountain,
  Loader2,
  ArrowUp,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { Tables } from "../../database.types";
import Lightbox, { LightboxImage } from "../components/Lightbox";

type GalleryImage = Tables<"gallery_images">;

const IMAGES_PER_BATCH = 12;

const categories = [
  { value: "all", label: "All Photos", icon: Camera },
  { value: "camping", label: "Camping Grounds", icon: Tent },
  { value: "rooms", label: "Family Rooms", icon: Bed },
  { value: "pool", label: "Pool Area", icon: Waves },
  { value: "pets", label: "Pet Area", icon: PawPrint },
  { value: "dining", label: "Dining & Kitchen", icon: UtensilsCrossed },
  { value: "events", label: "Events", icon: PartyPopper },
  { value: "nature", label: "Nature & Scenery", icon: Mountain },
  { value: "general", label: "General", icon: Eye },
];

const categoryLabels: Record<string, string> = {
  camping: "Camping Grounds",
  rooms: "Family Rooms",
  pool: "Pool Area",
  pets: "Pet Area",
  dining: "Dining & Kitchen",
  events: "Events & Activities",
  nature: "Nature & Scenery",
  general: "General",
};

function isWideItem(index: number): boolean {
  return index % 5 === 0;
}

function getDisplayName(image: GalleryImage): string {
  return (
    image.caption ||
    image.alt_text ||
    (image.file_name
      ? image.file_name
          .replace(/\.[^/.]+$/, "")
          .replace(/-/g, " ")
          .replace(/_/g, " ")
      : "Gallery Image")
  );
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(IMAGES_PER_BATCH);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Show scroll-to-top button after scrolling down
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!error && data) {
        setImages(data);
      }
    } catch (error) {
      console.error("Error fetching gallery images:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Refresh when user switches back to this tab (e.g., after editing in admin)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchImages();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchImages]);

  // Reset visible count when category changes
  useEffect(() => {
    setVisibleCount(IMAGES_PER_BATCH);
  }, [selectedCategory]);

  const filteredImages = useMemo(
    () =>
      selectedCategory === "all"
        ? images
        : images.filter((img) => img.category === selectedCategory),
    [images, selectedCategory]
  );

  const visibleImages = useMemo(
    () => filteredImages.slice(0, visibleCount),
    [filteredImages, visibleCount]
  );

  const hasMore = visibleCount < filteredImages.length;

  // Infinite scroll with Intersection Observer
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setLoadingMore(true);
          // Small delay for smooth feel
          setTimeout(() => {
            setVisibleCount((prev) => prev + IMAGES_PER_BATCH);
            setLoadingMore(false);
          }, 300);
        }
      },
      { rootMargin: "200px" }
    );

    const sentinel = sentinelRef.current;
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [hasMore, loading]);

  const getCategoryCount = useCallback(
    (category: string) => {
      return category === "all"
        ? images.length
        : images.filter((img) => img.category === category).length;
    },
    [images]
  );

  const lightboxImages: LightboxImage[] = useMemo(
    () =>
      filteredImages.map((img) => ({
        src: img.public_url || "",
        alt: img.alt_text || img.file_name || "Gallery Image",
        title: getDisplayName(img),
      })),
    [filteredImages]
  );

  const nextImage = useCallback(() => {
    setSelectedImage((prev) =>
      prev !== null ? (prev + 1) % filteredImages.length : 0
    );
  }, [filteredImages.length]);

  const prevImage = useCallback(() => {
    setSelectedImage((prev) =>
      prev !== null
        ? (prev - 1 + filteredImages.length) % filteredImages.length
        : 0
    );
  }, [filteredImages.length]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar — matches homepage */}
      <nav className="bg-background/90 backdrop-blur text-foreground shadow-md w-full fixed top-0 left-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-14 sm:h-16 items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 relative">
                <Image
                  src="/logo.png"
                  alt="Kampo Ibayo Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold text-primary">
                  Kampo
                </span>
                <span className="text-lg sm:text-xl font-bold text-foreground">
                  Ibayo
                </span>
              </div>
            </Link>
            <span className="text-muted-foreground text-sm hidden sm:inline">/</span>
            <span className="text-muted-foreground text-sm font-medium hidden sm:inline">
              Gallery
            </span>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Home</span>
          </Link>
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-14 sm:h-16" />

      {/* Page Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5">
            <Camera className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span>Kampo Ibayo Resort</span>
            <span className="text-border">/</span>
            <span className="text-foreground font-medium">Gallery</span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-tight">
            Photo Gallery
          </h1>

          {/* Subtitle */}
          {!loading && (
            <p className="mt-3 text-muted-foreground text-base sm:text-lg max-w-xl">
              {images.length} photos — explore the beauty of Kampo Ibayo Resort
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Category Filter Tabs */}
        <div className="mb-6 sm:mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            {categories.map((cat) => {
              const count = getCategoryCount(cat.value);
              const isActive = selectedCategory === cat.value;
              const Icon = cat.icon;
              if (count === 0 && cat.value !== "all") return null;
              return (
                <button
                  type="button"
                  key={cat.value}
                  onClick={() => {
                    setSelectedCategory(cat.value);
                    setSelectedImage(null);
                  }}
                  className={`flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{cat.label}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-[220px] sm:auto-rows-[220px] lg:auto-rows-[260px]">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className={`animate-pulse bg-card rounded-xl ${i % 5 === 0 ? "sm:col-span-2" : ""}`}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredImages.length === 0 && (
          <div className="text-center py-20 sm:py-28">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border mb-5">
              <ImageIcon className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-foreground font-semibold text-lg mb-2">
              {selectedCategory === "all"
                ? "No photos yet"
                : `No ${categories.find((c) => c.value === selectedCategory)?.label || selectedCategory} photos`}
            </p>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              {selectedCategory === "all"
                ? "Photos will appear here once uploaded."
                : "Try selecting a different category."}
            </p>
            {selectedCategory !== "all" && (
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm font-medium border border-border"
              >
                <Camera className="w-4 h-4" />
                View all photos
              </button>
            )}
          </div>
        )}

        {/* Bento Image Grid */}
        {!loading && visibleImages.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 grid-dense auto-rows-[220px] sm:auto-rows-[220px] lg:auto-rows-[260px]">
              {visibleImages.map((image, index) => {
                const wide = isWideItem(index);
                return (
                <div
                  key={image.id}
                  className={`gallery-item group relative overflow-hidden rounded-xl bg-card cursor-pointer ${wide ? "sm:col-span-2" : ""}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={image.public_url || ""}
                      alt={
                        image.alt_text || image.file_name || "Gallery image"
                      }
                      fill
                      sizes={wide ? "(max-width: 640px) 100vw, 66vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      loading={index < 6 ? "eager" : "lazy"}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWYyOTM3Ii8+PC9zdmc+"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                    {/* Category pill */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="bg-white/80 dark:bg-black/50 backdrop-blur-sm text-gray-800 dark:text-white/90 text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:py-1 rounded-md border border-black/10 dark:border-white/10">
                        {categoryLabels[image.category || "general"] ||
                          image.category}
                      </span>
                    </div>

                    {/* Homepage badge */}
                    {image.is_featured && (
                      <div className="absolute top-2.5 right-2.5">
                        <span className="inline-flex items-center gap-1 bg-primary backdrop-blur-sm text-primary-foreground text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:py-1 rounded-md border border-primary/20">
                          <Sparkles className="w-3 h-3" />
                          Homepage
                        </span>
                      </div>
                    )}

                    {/* Caption */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-medium text-sm truncate">
                        {getDisplayName(image)}
                      </p>
                    </div>

                    {/* Hover zoom icon */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Infinite scroll sentinel */}
            {hasMore && (
              <div ref={sentinelRef} className="mt-8 flex justify-center py-4">
                {loadingMore && (
                  <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading more photos...
                  </div>
                )}
              </div>
            )}

            {/* Footer count */}
            <div className="mt-6 text-center pb-8">
              <p className="text-muted-foreground text-sm">
                {hasMore
                  ? `Showing ${visibleImages.length} of ${filteredImages.length} photos — scroll for more`
                  : `All ${filteredImages.length} photos loaded`}
                {selectedCategory !== "all" && (
                  <>
                    {" "}
                    in{" "}
                    <span className="text-muted-foreground">
                      {categories.find((c) => c.value === selectedCategory)
                        ?.label}
                    </span>
                  </>
                )}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 bg-primary hover:bg-primary/90 text-foreground p-3 rounded-full shadow-lg shadow-primary/30 transition-all duration-300 min-w-[48px] min-h-[48px] flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Lightbox */}
      <Lightbox
        images={lightboxImages}
        selectedIndex={selectedImage}
        onClose={() => setSelectedImage(null)}
        onNext={nextImage}
        onPrev={prevImage}
        onSelect={setSelectedImage}
      />
    </div>
  );
}
