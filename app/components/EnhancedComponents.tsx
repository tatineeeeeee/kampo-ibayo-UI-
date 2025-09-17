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
  Car
} from "lucide-react";

// Loading Skeleton Component
export const LoadingSkeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-300 rounded ${className}`}></div>
);

// Enhanced Gallery with Lightbox
export const EnhancedGallery = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const galleryImages = [
    { src: "/gallery1.jpg", alt: "Swimming Pool Area" },
    { src: "/gallery2.jpg", alt: "Camping Grounds" },
    { src: "/gallery3.jpg", alt: "Bonfire Area" },
    { src: "/gallery4.jpg", alt: "River Access" },
    { src: "/gallery5.jpg", alt: "Outdoor Kitchen" },
    { src: "/gallery6.jpg", alt: "Picnic Areas" },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % galleryImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

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
      <section id="gallery" className="bg-gray-800 text-white py-16 px-6">
        <h2 className="text-3xl font-bold text-center mb-10">
          Photo Gallery
        </h2>
        
        {/* Featured Carousel */}
        <div className="max-w-5xl mx-auto mb-10">
          <div className="relative h-[500px] rounded-xl overflow-hidden group bg-gradient-to-br from-gray-800 to-gray-900">
            <Image
              src={galleryImages[currentSlide].src}
              alt={galleryImages[currentSlide].alt}
              fill
              className="object-cover object-center transition-transform duration-500"
              style={{ filter: 'brightness(0.9)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20"></div>
            
            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full p-3 transition-all duration-300 hover:scale-110 shadow-lg"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full p-3 transition-all duration-300 hover:scale-110 shadow-lg"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
              {galleryImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 ${
                    index === currentSlide ? "bg-white shadow-lg" : "bg-white/60 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Thumbnail Grid */}
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className="relative h-36 md:h-40 lg:h-44 rounded-lg overflow-hidden cursor-pointer group shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => setSelectedImage(index)}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
              
              {/* Image label overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white font-semibold text-sm">{image.alt}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage !== null && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative">
              <Image
                src={galleryImages[selectedImage].src}
                alt={galleryImages[selectedImage].alt}
                width={0}
                height={0}
                sizes="100vw"
                className="rounded-lg max-w-[95vw] max-h-[95vh] w-auto h-auto object-contain"
                style={{ width: 'auto', height: 'auto' }}
              />
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-black/70 hover:bg-black/90 backdrop-blur-sm rounded-full p-3 transition-all duration-300 z-10"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              
              {/* Previous Button */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 backdrop-blur-sm rounded-full p-3 transition-all duration-300 z-10"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              
              {/* Next Button */}
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 backdrop-blur-sm rounded-full p-3 transition-all duration-300 z-10"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
              
              {/* Image info */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
                <span className="font-medium">{galleryImages[selectedImage].alt}</span>
                <span className="mx-2">•</span>
                <span>{selectedImage + 1} / {galleryImages.length}</span>
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
    { icon: <Award className="w-8 h-8" />, title: "Certified Safe", desc: "DOT Certified" },
    { icon: <Users className="w-8 h-8" />, title: "Family Friendly", desc: "Kid Safe Environment" },
    { icon: <Wifi className="w-8 h-8" />, title: "Free WiFi", desc: "High Speed Internet" },
    { icon: <Car className="w-8 h-8" />, title: "Free Parking", desc: "Secure Vehicle Area" },
  ];

  return (
    <section className="bg-gray-900 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-6">
          {badges.map((badge, index) => (
            <div key={index} className="text-center text-white group hover:scale-105 transition-transform duration-300">
              <div className="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-red-500 transition-colors">
                {badge.icon}
              </div>
              <h3 className="font-semibold mb-1">{badge.title}</h3>
              <p className="text-gray-400 text-sm">{badge.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};