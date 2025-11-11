"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { 
  ChevronLeft, 
  ChevronRight, 
  X,
  Star,
  Users,
  Award
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { Tables } from "../../database.types";

type GalleryImage = Tables<'gallery_images'>;

interface GalleryImageWithCategory extends Omit<GalleryImage, 'id'> {
  id: string | number; // Allow both string and number IDs
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
  const [images, setImages] = useState<GalleryImageWithCategory[]>([]);  // Static fallback images (always available) - these show first, then get replaced by admin uploads
  const staticGalleryImages = useMemo(() => [
    { src: "/gallery1.jpg", alt: "Crystal clear swimming pool with mountain views" },
    { src: "/gallery2.jpg", alt: "Spacious camping grounds under starlit skies" },
    { src: "/gallery3.jpg", alt: "Cozy bonfire area perfect for evening gatherings" },
    { src: "/gallery4.jpg", alt: "Private river access for swimming and relaxation" },
    { src: "/gallery5.jpg", alt: "Fully equipped outdoor kitchen for group cooking" },
    { src: "/gallery6.jpg", alt: "Scenic picnic areas surrounded by nature" },
    { src: "/pool.jpg", alt: "Resort overview showcasing all premium amenities" },
    { src: "/pooll.jpg", alt: "Pool facilities with crystal-clear waters" },
  ], []);

  // Category labels for display - memoized to prevent re-renders
  const categoryLabels = useMemo(() => ({
    'featured': 'Featured',
    'rooms': 'Rooms & Accommodations',
    'dining': 'Dining & Kitchen',
    'amenities': 'Amenities & Facilities',
    'exterior': 'Exterior & Grounds',
    'events': 'Events & Activities',
    'general': 'General Views'
  }), []);

  // Display images: Mix dynamic + static to always show 8 images
  const displayImages = useMemo(() => {
    const maxImages = 8;
    
    // Process dynamic images with clean names (remove file extensions)
    const dynamicImages = images.map(img => ({
      ...img,
      id: img.id.toString(), // Convert to string for consistency
      // Clean display name: remove file extension and make it readable
      displayName: img.caption || 
                   img.alt_text || 
                   (img.file_name ? img.file_name.replace(/\.[^/.]+$/, '').replace(/-/g, ' ').replace(/_/g, ' ') : 'Gallery Image'),
      categoryLabel: categoryLabels[img.category as keyof typeof categoryLabels] || img.category
    }));

    // Create static images with proper structure
    const staticImages = staticGalleryImages.map((img, index) => ({
      id: `static-${index}`,
      file_name: img.alt,
      alt_text: img.alt,
      caption: img.alt,
      category: 'general' as const,
      is_featured: false,
      display_order: index + 1000, // High number to appear after dynamic images
      storage_path: img.src,
      public_url: img.src,
      file_size: null,
      mime_type: 'image/jpeg',
      uploaded_by: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      categoryLabel: 'General Views',
      displayName: img.alt
    }));

    // Combine: Dynamic images first (most recent first), then fill with static
    const combined = [...dynamicImages];
    
    // Add static images to fill up to 8 total
    if (combined.length < maxImages) {
      const needMore = maxImages - combined.length;
      combined.push(...staticImages.slice(0, needMore));
    }

    // Make sure first image (index 0) is marked as featured for the hero section
    if (combined.length > 0 && !combined[0].is_featured) {
      combined[0] = { ...combined[0], is_featured: true };
    }

    return combined.slice(0, maxImages); // Ensure exactly 8 images max
  }, [images, staticGalleryImages, categoryLabels]);

  // Fetch images from Supabase with error handling - SAFE VERSION
  const fetchImages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .order('created_at', { ascending: false }) // Most recent first
        .order('is_featured', { ascending: false })
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching gallery images:', error);
        return; // Silently fail, will use static images
      }

      if (data && data.length > 0) {
        // Map images with category labels
        const mappedImages = data.map(img => ({
          ...img,
          categoryLabel: categoryLabels[img.category as keyof typeof categoryLabels] || img.category
        }));
        setImages(mappedImages);
      } else {
        // No images found, clear the state
        setImages([]);
      }
      
    } catch (error) {
      console.error('Error in fetchImages:', error);
      // Silent failure - will use static images
    }
  }, [categoryLabels]);

  // Load images on mount with safe refresh intervals
  useEffect(() => {
    let mounted = true;
    
    const loadImages = async () => {
      if (mounted) {
        await fetchImages();
      }
    };

    // Initial load
    loadImages();
    
    // Set up a SINGLE interval that refreshes every 10 seconds
    // This is frequent enough to catch delete operations quickly
    const refreshInterval = setInterval(() => {
      if (mounted) {
        fetchImages();
      }
    }, 10000); // Refresh every 10 seconds - safe but responsive
    
    return () => {
      mounted = false;
      clearInterval(refreshInterval);
    };
  }, [fetchImages]);

  // Refresh when user comes back to the tab - SAFE VERSION
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible, refresh once immediately
        fetchImages();
      }
    };

    const handleFocus = () => {
      // Window gained focus, refresh once immediately
      fetchImages();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchImages]);

  // Navigation functions
  const nextImage = useCallback(() => {
    setSelectedImage((prev) => prev !== null ? (prev + 1) % displayImages.length : 0);
  }, [displayImages.length]);

  const prevImage = useCallback(() => {
    setSelectedImage((prev) => prev !== null ? (prev - 1 + displayImages.length) % displayImages.length : 0);
  }, [displayImages.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (selectedImage !== null) {
        switch (e.key) {
          case 'ArrowLeft':
            prevImage();
            break;
          case 'ArrowRight':
            nextImage();
            break;
          case 'Escape':
            setSelectedImage(null);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedImage, nextImage, prevImage]);

  return (
    <>
      <section id="gallery" className="bg-gray-800 text-white py-6 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-8 sm:mb-10 lg:mb-12">
          Photo Gallery
        </h2>
        
        {/* Modern Featured Gallery */}
        <div className="max-w-7xl mx-auto mb-12">
          {/* Hero Image - Real-World Best Practice */}
          <div className="relative mb-8">
            {/* Main hero container */}
            <div 
              className="relative h-[60vh] sm:h-[70vh] lg:h-[80vh] max-h-[600px] rounded-xl overflow-hidden cursor-pointer group bg-gray-700"
              onClick={() => setSelectedImage(0)}
            >
              <Image
                src={displayImages[0]?.public_url || displayImages[0]?.storage_path || ''}
                alt={displayImages[0]?.alt_text || displayImages[0]?.file_name || ''}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Progressive overlay - not too dark */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              
              {/* Subtle hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
              
              {/* Content overlay */}
              <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
                {/* Top section - Featured badge */}
                <div className="flex justify-start">
                  <div className="bg-gradient-to-r from-red-900/80 to-red-800/80 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm border border-red-700/50 flex items-center gap-2">
                    <Star className="w-4 h-4 fill-current" />
                    Featured
                  </div>
                </div>
                
                {/* Bottom section - main content */}
                <div className="text-white">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 leading-tight">
                    {displayImages[0]?.displayName || displayImages[0]?.alt_text || 'Gallery Image'}
                  </h3>
                  <div className="flex items-center gap-4 text-sm sm:text-base text-white/90">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Resort Life
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      Premium Experience
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Production-Ready Thumbnail Gallery */}
          <div className="relative">
            {/* Universal responsive grid - works everywhere */}
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
              {displayImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 hover:scale-105"
                  onClick={() => setSelectedImage(index)}
                  aria-label={`View photo ${index + 1}: ${image.displayName || image.alt_text}`}
                >
                  <Image
                    src={image.public_url || image.storage_path || ''}
                    alt={image.displayName || image.alt_text || `Gallery image ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 25vw, (max-width: 1024px) 16vw, 12vw"
                    className="object-cover transition-transform duration-200 group-hover:scale-110"
                  />
                  
                  {/* Simple, reliable hover effect */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200"></div>
                  
                  {/* Image number - always visible for clarity */}
                  <div className="absolute bottom-1 right-1">
                    <span className="bg-gradient-to-r from-red-900/80 to-red-800/80 text-white text-xs px-2 py-1 rounded-md font-semibold shadow-lg border border-red-700/50">
                      {index + 1}
                    </span>
                  </div>
                  
                  {/* Active state indicator */}
                  {selectedImage === index && (
                    <div className="absolute inset-0 ring-2 ring-red-500 ring-inset rounded-lg"></div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Mobile scroll hint */}
            <div className="block sm:hidden mt-3 text-center">
              <p className="text-gray-400 text-xs">Tap any photo to view full size</p>
            </div>
          </div>
        </div>

        {/* View All Photos Button */}
        <div className="max-w-7xl mx-auto text-center">
          <button 
            onClick={() => setSelectedImage(0)}
            className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full px-6 py-3 transition-all duration-300 group"
          >
            <span className="text-white/80 text-sm group-hover:text-white">View all</span>
            <span className="bg-gradient-to-r from-red-900/80 to-red-800/80 group-hover:from-red-800/90 group-hover:to-red-700/90 text-white text-sm font-semibold px-3 py-1 rounded-full transition-all duration-300 shadow-lg border border-red-700/50">
              {displayImages.length} Photos
            </span>
          </button>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage !== null && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-7xl mx-auto">
            <Image
              src={displayImages[selectedImage]?.public_url || displayImages[selectedImage]?.storage_path || ''}
              alt={displayImages[selectedImage]?.displayName || displayImages[selectedImage]?.alt_text || ''}
              width={0}
              height={0}
              sizes="100vw"
              className="rounded-2xl max-w-[95vw] max-h-[90vh] w-auto h-auto object-contain shadow-2xl"
              style={{ width: 'auto', height: 'auto' }}
            />
            
            {/* Controls */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-4 -right-4 bg-white text-gray-900 hover:bg-gray-100 rounded-full p-3 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Navigation */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full p-4 transition-all duration-300 shadow-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full p-4 transition-all duration-300 shadow-lg"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            
            {/* Image Information Panel */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-xl border border-white/20">
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-1">{displayImages[selectedImage].displayName || displayImages[selectedImage].alt_text}</h3>
                <div className="flex items-center justify-center gap-4 text-sm text-white/80">
                  <span>{selectedImage + 1} of {displayImages.length}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    Use 
                    <kbd className="bg-white/20 px-2 py-0.5 rounded text-xs font-mono">←</kbd>
                    <kbd className="bg-white/20 px-2 py-0.5 rounded text-xs font-mono">→</kbd>
                    to navigate
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DynamicGallery;