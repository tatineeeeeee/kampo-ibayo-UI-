"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import {
  Check,
  Shield,
  Star,
  Users,
  Mountain,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AuthTestimonials() {
  const [authLiveRating, setAuthLiveRating] = useState<number | null>(null);
  const [authTestimonials, setAuthTestimonials] = useState<{ text: string; name: string }[]>([]);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [testimonialVisible, setTestimonialVisible] = useState(true);
  const router = useRouter();

  // Fetch live average rating and top reviews for rotating testimonials
  useEffect(() => {
    const fetchRating = async () => {
      try {
        const { data, error } = await supabase
          .from("guest_reviews")
          .select("rating, review_text, guest_name")
          .eq("approved", true);
        if (!error && data && data.length > 0) {
          const avg = data.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / data.length;
          setAuthLiveRating(Math.round(avg * 10) / 10);
          // Collect top-rated reviews for rotation
          const topReviews = data
            .filter((r) => r.rating >= 4 && r.review_text && r.guest_name)
            .map((r) => ({
              text: r.review_text!.length > 120
                ? r.review_text!.slice(0, 120).trimEnd() + "..."
                : r.review_text!,
              name: r.guest_name!,
            }));
          if (topReviews.length > 0) {
            // Shuffle so it starts differently each visit
            for (let i = topReviews.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [topReviews[i], topReviews[j]] = [topReviews[j], topReviews[i]];
            }
            setAuthTestimonials(topReviews);
          }
        }
      } catch {
        // Keep empty on error
      }
    };
    fetchRating();
  }, []);

  // Auto-rotate testimonials every 6 seconds: fade out -> swap -> fade in
  useEffect(() => {
    if (authTestimonials.length <= 1) return;
    const interval = setInterval(() => {
      setTestimonialVisible(false); // fade out
      setTimeout(() => {
        setTestimonialIndex((prev) => (prev + 1) % authTestimonials.length);
        setTestimonialVisible(true); // fade in with new content
      }, 200);
    }, 6000);
    return () => clearInterval(interval);
  }, [authTestimonials.length]);

  return (
    <div className="hidden lg:flex lg:w-1/2 bg-card text-foreground p-6 xl:p-12 flex-col justify-between">
      <div>
        {/* Brand Header with Home Button */}
        <div className="flex items-center justify-between mb-6 xl:mb-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 xl:w-16 xl:h-16 relative">
              <Image
                src="/logo.png"
                alt="Kampo Ibayo Logo"
                fill
                className="object-contain drop-shadow-lg rounded-lg"
                priority
              />
            </div>
            <h1 className="text-xl xl:text-3xl font-extrabold tracking-tight">
              <span className="text-primary">Kampo</span> Ibayo
            </h1>
          </div>

          {/* Home/Back Button - Desktop */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors p-2 xl:p-3 rounded-lg hover:bg-white/10 border border-white/20 hover:border-white/30"
            title="Back to Home"
          >
            <svg
              className="w-4 h-4 xl:w-5 xl:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-sm xl:text-base font-medium">Home</span>
          </button>
        </div>

        <p className="text-base xl:text-xl font-semibold mb-4 xl:mb-8 opacity-90">
          Where adventure meets comfort
        </p>

        <h2 className="font-bold mb-3 xl:mb-6 text-sm xl:text-lg">
          Your Wilderness Experience
        </h2>

        {/* Features List */}
        <ul className="space-y-3 xl:space-y-5 text-xs xl:text-base">
          <li className="flex items-start gap-2 xl:gap-3">
            <div className="w-6 h-6 xl:w-8 xl:h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield className="w-3 h-3 xl:w-4 xl:h-4 text-primary" />
            </div>
            <span>
              <strong>24/7 Security</strong> <br />
              Professional staff ensuring your safety
            </span>
          </li>
          <li className="flex items-start gap-2 xl:gap-3">
            <div className="w-6 h-6 xl:w-8 xl:h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Mountain className="w-3 h-3 xl:w-4 xl:h-4 text-primary" />
            </div>
            <span>
              <strong>Breathtaking Views</strong> <br />
              Unmatched natural beauty of Cavite
            </span>
          </li>
          <li className="flex items-start gap-2 xl:gap-3">
            <div className="w-6 h-6 xl:w-8 xl:h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Users className="w-3 h-3 xl:w-4 xl:h-4 text-primary" />
            </div>
            <span>
              <strong>Family-Friendly</strong> <br />
              Perfect for all ages and group sizes
            </span>
          </li>
          <li className="flex items-start gap-2 xl:gap-3">
            <div className="w-6 h-6 xl:w-8 xl:h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 xl:w-4 xl:h-4 text-primary" />
            </div>
            <span>
              <strong>Easy Booking</strong> <br />
              Reserve your spot in minutes
            </span>
          </li>
        </ul>
      </div>

      {/* Bottom testimonial -- rotating with fade */}
      <div className="mt-6 xl:mt-8">
        <div className="flex items-center gap-1 mb-2 xl:mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className="w-3 h-3 xl:w-4 xl:h-4 text-yellow-500 fill-yellow-500"
            />
          ))}
          <span className="text-muted-foreground text-xs xl:text-sm ml-2">
            {authLiveRating !== null ? `${authLiveRating}/5` : "5/5"}
          </span>
        </div>
        <p className={`text-xs xl:text-sm italic transition-opacity duration-200 ${testimonialVisible && authTestimonials.length > 0 ? "opacity-80" : authTestimonials.length === 0 ? "opacity-80" : "opacity-0"}`}>
          &quot;{authTestimonials.length > 0 ? authTestimonials[testimonialIndex].text : "Experience nature like never before"}&quot; <br />
          <span className="text-muted-foreground">{authTestimonials.length > 0 ? authTestimonials[testimonialIndex].name : "Kampo Ibayo"}</span>
        </p>
      </div>
    </div>
  );
}
