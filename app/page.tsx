"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isMaintenanceMode } from "./utils/maintenanceMode";
import {
  ChevronUp,
} from "lucide-react";
import { supabase } from "./supabaseClient";
import { useAuth } from "./contexts/AuthContext";
import DynamicGallery from "./components/DynamicGallery";
import Chatbot from "./components/Chatbot";
import BookingAuthModal from "./components/BookingAuthModal";
import Navbar from "./components/home/Navbar";
import HeroSection from "./components/home/HeroSection";
import AboutSection from "./components/home/AboutSection";
import AmenitiesSection from "./components/home/AmenitiesSection";
import ReviewsSection from "./components/home/ReviewsSection";
import ContactSection from "./components/home/ContactSection";
import AvailabilityModal from "./components/home/AvailabilityModal";
import { RESORT_PHONE, RESORT_PHONE_RAW, RESORT_FACEBOOK_URL } from "./lib/constants/business";
import { MAINTENANCE_CHECK_INTERVAL_MS } from "./lib/constants/timeouts";

// ----------------- Home Page -----------------
function Home() {
  const router = useRouter();
  const { user, loading: isLoadingAuth } = useAuth();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showBookingAuthModal, setShowBookingAuthModal] = useState(false);

  const [maintenanceActive, setMaintenanceActive] = useState(false);

  // Live rating from guest_reviews
  const [liveRating, setLiveRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [ratingLoading, setRatingLoading] = useState(true);

  const handleBookCTA = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!isLoadingAuth && !user) {
      setShowBookingAuthModal(true);
    } else {
      router.push('/book');
    }
  };

  // Fetch live average rating from guest_reviews
  useEffect(() => {
    const fetchLiveRating = async () => {
      try {
        const { data, error } = await supabase
          .from("guest_reviews")
          .select("rating")
          .eq("approved", true);
        if (!error && data && data.length > 0) {
          const avg = data.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / data.length;
          setLiveRating(Math.round(avg * 10) / 10);
          setRatingCount(data.length);
        }
      } catch {
        setLiveRating(null);
      } finally {
        setRatingLoading(false);
      }
    };
    fetchLiveRating();
  }, []);

  // Admin/staff users can now view the customer site via "Customer View" link
  // No automatic redirect - admins choose where to go via the navbar dropdown

  // Track scroll position for back-to-top button
  useEffect(() => {
    const handleBackToTopScroll = () => {
      setShowBackToTop(window.scrollY > 200); // Reduced threshold from 300 to 200px
    };
    window.addEventListener("scroll", handleBackToTopScroll);
    return () => window.removeEventListener("scroll", handleBackToTopScroll);
  }, []);

  // Load maintenance mode settings
  useEffect(() => {
    // Clean up old localStorage keys from testing
    if (typeof window !== "undefined") {
      localStorage.removeItem("maintenanceSettings");
      localStorage.removeItem("maintenance_settings");
    }

    let lastKnownState: boolean = false;

    const checkMaintenanceMode = async () => {
      try {
        const isActive = await isMaintenanceMode();

        // Only update if state actually changed
        if (isActive !== lastKnownState) {
          setMaintenanceActive(isActive);
          lastKnownState = isActive;
        }
      } catch (error) {
        console.error("Error checking maintenance mode:", error);
        // Keep previous state on error
      }
    };

    // Initial check
    checkMaintenanceMode();

    // Listen for settings changes from admin panel (same session only)
    const handleSettingsChange = () => {
      checkMaintenanceMode();
    };

    // Frequent polling for cross-device updates
    // Check every 3 seconds for database changes
    const interval = setInterval(checkMaintenanceMode, MAINTENANCE_CHECK_INTERVAL_MS);

    // Listen for custom events from admin settings (same session only)
    window.addEventListener("maintenanceSettingsChanged", handleSettingsChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "maintenanceSettingsChanged",
        handleSettingsChange,
      );
    };
  }, []);

  return (
    <>
      <div>
        <Navbar onBookCTA={handleBookCTA} />

        {/* Simple Maintenance Banner - Resort Style */}
        {maintenanceActive && (
          <div className="bg-orange-600 text-white py-3 px-4 shadow-lg border-b-2 border-orange-500 relative z-50">
            <div className="max-w-7xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">⚠️</span>
                <p className="font-semibold">
                  Kampo Ibayo is temporarily closed for maintenance
                </p>
              </div>
              <p className="text-sm mt-1 text-orange-100">
                For assistance, please call{" "}
                <a
                  href={`tel:${RESORT_PHONE_RAW}`}
                  className="font-bold text-white hover:underline"
                >
                  {RESORT_PHONE}
                </a>{" "}
                or message us on{" "}
                <a
                  href={RESORT_FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-white hover:underline"
                >
                  Facebook
                </a>
              </p>
            </div>
          </div>
        )}

        <HeroSection
          maintenanceActive={maintenanceActive}
          onCheckAvailability={() => setShowAvailabilityModal(true)}
          onBookCTA={handleBookCTA}
        />

        <AboutSection
          liveRating={liveRating}
          ratingCount={ratingCount}
          ratingLoading={ratingLoading}
        />

        <AmenitiesSection
          maintenanceActive={maintenanceActive}
          onBookCTA={handleBookCTA}
        />

        {/* Gallery Section */}
        <DynamicGallery />

        <ReviewsSection />

        <ContactSection user={user} isLoadingAuth={isLoadingAuth} />

        {/* Floating Action Buttons - Properly matched sizing and positioning */}
        {/* Chatbot - Independent positioning */}
        <Chatbot onOpenStateChange={setChatbotOpen} />

        {/* Back to Top Button - Hide when chatbot is open to prevent overlap */}
        {showBackToTop && !chatbotOpen && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-[5rem] right-4 sm:bottom-[6.5rem] sm:right-6 z-40 bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all duration-150 transform hover:scale-110 border border-primary/80 backdrop-blur-sm"
            aria-label="Back to top"
          >
            <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        )}

        <AvailabilityModal
          isOpen={showAvailabilityModal}
          onClose={() => setShowAvailabilityModal(false)}
        />
      </div>

      <BookingAuthModal
        isOpen={showBookingAuthModal}
        onClose={() => setShowBookingAuthModal(false)}
      />
    </>
  );
}

export default Home;
