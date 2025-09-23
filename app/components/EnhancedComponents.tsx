"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { 
  Users, 
  Award, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Wifi,
  Car,
  Star
} from "lucide-react";

// Loading Skeleton Component
export const LoadingSkeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-300 rounded ${className}`}></div>
);

// Enhanced Gallery with Lightbox
export const EnhancedGallery = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const galleryImages = [
    { src: "/gallery1.jpg", alt: "Crystal clear swimming pool with mountain views" },
    { src: "/gallery2.jpg", alt: "Spacious camping grounds under starlit skies" },
    { src: "/gallery3.jpg", alt: "Cozy bonfire area perfect for evening gatherings" },
    { src: "/gallery4.jpg", alt: "Private river access for swimming and relaxation" },
    { src: "/gallery5.jpg", alt: "Fully equipped outdoor kitchen for group cooking" },
    { src: "/gallery6.jpg", alt: "Scenic picnic areas surrounded by nature" },
    { src: "/pool.jpg", alt: "Resort overview showcasing all premium amenities" },
    { src: "/pooll.jpg", alt: "Pool facilities with crystal-clear waters" },
  ];

  const nextImage = useCallback(() => {
    setSelectedImage((prev) => prev !== null ? (prev + 1) % galleryImages.length : 0);
  }, [galleryImages.length]);

  const prevImage = useCallback(() => {
    setSelectedImage((prev) => prev !== null ? (prev - 1 + galleryImages.length) % galleryImages.length : 0);
  }, [galleryImages.length]);

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
                src={galleryImages[0].src}
                alt={galleryImages[0].alt}
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
                    {galleryImages[0].alt}
                  </h3>
                  <div className="flex items-center gap-4 text-sm sm:text-base text-white/90">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View full size
                    </span>
                    <span>•</span>
                    <span>Tap to explore</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Production-Ready Thumbnail Gallery */}
          <div className="relative">
            {/* Universal responsive grid - works everywhere */}
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
              {galleryImages.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 hover:scale-105"
                  onClick={() => setSelectedImage(index)}
                  aria-label={`View photo ${index + 1}: ${image.alt}`}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
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
              {galleryImages.length} Photos
            </span>
          </button>
        </div>
      </section>

      {/* Enhanced Lightbox Modal */}
      {selectedImage !== null && (
        <div className="fixed inset-0 bg-black/96 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Main Image Container */}
            <div className="relative max-w-6xl max-h-[90vh]">
              <Image
                src={galleryImages[selectedImage].src}
                alt={galleryImages[selectedImage].alt}
                width={0}
                height={0}
                sizes="100vw"
                className="rounded-2xl max-w-[95vw] max-h-[90vh] w-auto h-auto object-contain shadow-2xl"
                style={{ width: 'auto', height: 'auto' }}
              />
              
              {/* Elegant Controls */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-4 -right-4 bg-white text-gray-900 hover:bg-gray-100 rounded-full p-3 transition-all duration-300 shadow-lg hover:shadow-xl group"
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
            </div>
            
            {/* Image Information Panel */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-xl border border-white/20">
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-1">{galleryImages[selectedImage].alt}</h3>
                <div className="flex items-center justify-center gap-4 text-sm text-white/80">
                  <span>{selectedImage + 1} of {galleryImages.length}</span>
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

// Enhanced Contact Form
export const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    checkIn: "",
    guests: "2"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert("Thank you for your inquiry! We'll get back to you soon.");
    setFormData({ name: "", email: "", phone: "", message: "", checkIn: "", guests: "2" });
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">Quick Inquiry</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Your Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
          />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <input
            type="tel"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <input
            type="date"
            value={formData.checkIn}
            onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <select
            value={formData.guests}
            onChange={(e) => setFormData({...formData, guests: e.target.value})}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            {[1,2,3,4,5,6,7,8].map(num => (
              <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
        <textarea
          placeholder="Your Message"
          value={formData.message}
          onChange={(e) => setFormData({...formData, message: e.target.value})}
          rows={4}
          className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          Send Inquiry
        </button>
      </form>
    </div>
  );
};


// Trust Badges Section
export const TrustBadges = () => {
  const badges = [
    { icon: <Award className="w-6 h-6 sm:w-8 sm:h-8" />, title: "Certified Safe", desc: "DOT Certified" },
    { icon: <Users className="w-6 h-6 sm:w-8 sm:h-8" />, title: "Family Friendly", desc: "Kid Safe Environment" },
    { icon: <Wifi className="w-6 h-6 sm:w-8 sm:h-8" />, title: "Free WiFi", desc: "High Speed Internet" },
    { icon: <Car className="w-6 h-6 sm:w-8 sm:h-8" />, title: "Free Parking", desc: "Secure Vehicle Area" },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Mobile: Stack vertically */}
      <div className="block sm:hidden space-y-4">
        {badges.map((badge, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded-lg flex items-center gap-4 text-white">
            <div className="bg-red-600 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
              {badge.icon}
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-sm">{badge.title}</h3>
              <p className="text-gray-400 text-xs">{badge.desc}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Desktop: Grid layout */}
      <div className="hidden sm:grid gap-6 grid-cols-2 md:grid-cols-4">
        {badges.map((badge, index) => (
          <div key={index} className="text-center text-white group hover:scale-105 transition-transform duration-300">
            <div className="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-red-500 transition-colors">
              {badge.icon}
            </div>
            <h3 className="font-semibold mb-1 text-base">{badge.title}</h3>
            <p className="text-gray-400 text-sm">{badge.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};