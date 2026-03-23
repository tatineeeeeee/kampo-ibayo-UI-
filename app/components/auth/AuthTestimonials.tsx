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
    <div className="hidden lg:flex lg:w-1/2 bg-card text-foreground p-8 xl:p-12 flex-col justify-between relative overflow-hidden">
      {/* Layered ambient glow — teal (top) fading into blue (bottom) for ocean depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-info/8 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-info/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Brand Header with Home Button */}
        <div className="flex items-center justify-between mb-8 xl:mb-12">
          <div className="flex items-center gap-3 xl:gap-4">
            <div className="w-12 h-12 xl:w-16 xl:h-16 relative">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-lg" />
              <Image
                src="/logo.png"
                alt="Kampo Ibayo Logo"
                fill
                className="object-contain drop-shadow-lg rounded-xl relative z-10"
                priority
              />
            </div>
            <h1 className="text-2xl xl:text-3xl font-display font-extrabold tracking-tight">
              <span className="text-primary">Kampo</span>{" "}
              <span className="text-foreground">Ibayo</span>
            </h1>
          </div>

          {/* Home/Back Button - Desktop */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 p-2.5 xl:p-3 rounded-xl bg-primary/5 hover:bg-primary/15 border border-primary/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/15"
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

        {/* Hero tagline */}
        <div className="mb-8 xl:mb-12">
          <p className="text-2xl xl:text-3xl font-display font-bold mb-3 xl:mb-4 leading-tight">
            Where adventure<br />
            <span className="text-primary">meets comfort</span>
          </p>
          <p className="text-sm xl:text-base text-muted-foreground leading-relaxed">
            Your premier tropical escape in General Trias, Cavite
          </p>
        </div>

        {/* Features List */}
        <div className="space-y-3 xl:space-y-4">
          <h2 className="text-xs xl:text-sm font-semibold text-primary uppercase tracking-widest mb-1">
            Why choose us
          </h2>
          <ul className="space-y-3 xl:space-y-4 text-xs xl:text-sm">
            <li className="flex items-center gap-3 xl:gap-4 p-2.5 xl:p-3 rounded-xl bg-primary/5 border border-primary/10 transition-all duration-200 hover:bg-primary/10 hover:border-primary/20">
              <div className="w-8 h-8 xl:w-10 xl:h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/15">
                <Shield className="w-4 h-4 xl:w-5 xl:h-5 text-primary" />
              </div>
              <div>
                <span className="font-semibold text-foreground">24/7 Security</span>
                <p className="text-muted-foreground text-xs mt-0.5">Professional staff ensuring your safety</p>
              </div>
            </li>
            <li className="flex items-center gap-3 xl:gap-4 p-2.5 xl:p-3 rounded-xl bg-primary/5 border border-primary/10 transition-all duration-200 hover:bg-primary/10 hover:border-primary/20">
              <div className="w-8 h-8 xl:w-10 xl:h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/15">
                <Mountain className="w-4 h-4 xl:w-5 xl:h-5 text-primary" />
              </div>
              <div>
                <span className="font-semibold text-foreground">Breathtaking Views</span>
                <p className="text-muted-foreground text-xs mt-0.5">Unmatched natural beauty of Cavite</p>
              </div>
            </li>
            <li className="flex items-center gap-3 xl:gap-4 p-2.5 xl:p-3 rounded-xl bg-primary/5 border border-primary/10 transition-all duration-200 hover:bg-primary/10 hover:border-primary/20">
              <div className="w-8 h-8 xl:w-10 xl:h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/15">
                <Users className="w-4 h-4 xl:w-5 xl:h-5 text-primary" />
              </div>
              <div>
                <span className="font-semibold text-foreground">Family-Friendly</span>
                <p className="text-muted-foreground text-xs mt-0.5">Perfect for all ages and group sizes</p>
              </div>
            </li>
            <li className="flex items-center gap-3 xl:gap-4 p-2.5 xl:p-3 rounded-xl bg-primary/5 border border-primary/10 transition-all duration-200 hover:bg-primary/10 hover:border-primary/20">
              <div className="w-8 h-8 xl:w-10 xl:h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/15">
                <Check className="w-4 h-4 xl:w-5 xl:h-5 text-primary" />
              </div>
              <div>
                <span className="font-semibold text-foreground">Easy Booking</span>
                <p className="text-muted-foreground text-xs mt-0.5">Reserve your spot in minutes</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom testimonial -- rotating with fade */}
      <div className="mt-8 xl:mt-10 relative z-10">
        {/* Glassmorphic testimonial card — fixed height so long reviews don't resize */}
        <div className="bg-background/30 backdrop-blur-xl rounded-2xl p-4 xl:p-5 border border-primary/15 shadow-lg shadow-primary/10 h-[120px] xl:h-[130px] flex flex-col justify-between overflow-hidden">
          <div className="flex items-center gap-1.5 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-accent fill-accent"
              />
            ))}
            <span className="text-muted-foreground text-xs xl:text-sm ml-2 font-medium">
              {authLiveRating !== null ? `${authLiveRating}/5 rating` : "5/5 rating"}
            </span>
          </div>
          <p className={`text-xs xl:text-sm italic leading-snug line-clamp-2 transition-opacity duration-200 ${testimonialVisible && authTestimonials.length > 0 ? "opacity-80" : authTestimonials.length === 0 ? "opacity-80" : "opacity-0"}`}>
            &quot;{authTestimonials.length > 0 ? authTestimonials[testimonialIndex].text : "Experience nature like never before"}&quot;
          </p>
          <p className={`text-xs text-muted-foreground font-medium transition-opacity duration-200 ${testimonialVisible && authTestimonials.length > 0 ? "opacity-70" : authTestimonials.length === 0 ? "opacity-70" : "opacity-0"}`}>
            — {authTestimonials.length > 0 ? authTestimonials[testimonialIndex].name : "Kampo Ibayo"}
          </p>
        </div>
      </div>
    </div>
  );
}
