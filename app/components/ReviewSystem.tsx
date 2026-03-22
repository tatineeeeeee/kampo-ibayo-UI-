"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { Tables } from "../../database.types";
import {
  Star,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  Filter,
} from "lucide-react";
import Image from "next/image";

type GuestReview = Tables<"guest_reviews">;

interface ReviewPhotoSimple {
  id: string; // Supabase returns UUID strings for ids
  photo_url: string;
  caption: string | null;
  display_order: number | null;
}

interface ReviewWithPhotos extends GuestReview {
  review_photos?: ReviewPhotoSimple[];
}

interface ReviewSystemProps {
  limit?: number;
  showPagination?: boolean;
  className?: string;
}

const ReviewSystem = ({
  limit = 6,
  showPagination = true,
  className = "",
}: ReviewSystemProps) => {
  const [reviews, setReviews] = useState<ReviewWithPhotos[]>([]);
  const [allReviewsData, setAllReviewsData] = useState<ReviewWithPhotos[]>([]); // For modal
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  // Modal state
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
  const [modalFilter, setModalFilter] = useState<number | "all">("all");
  const [modalLoading, setModalLoading] = useState(false);
  const [ratingCounts, setRatingCounts] = useState<{ [key: number]: number }>({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  });

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [cardsPerView, setCardsPerView] = useState(3);
  const [selectedReview, setSelectedReview] = useState<ReviewWithPhotos | null>(null);
  const [truncatedReviews, setTruncatedReviews] = useState<Set<string>>(new Set());

  const checkTruncation = useCallback((el: HTMLParagraphElement | null, reviewId: string) => {
    if (!el) return;
    const isTruncated = el.scrollHeight > el.clientHeight;
    setTruncatedReviews(prev => {
      const has = prev.has(reviewId);
      if (isTruncated === has) return prev; // no change, skip re-render
      const next = new Set(prev);
      isTruncated ? next.add(reviewId) : next.delete(reviewId);
      return next;
    });
  }, []);

  const reviewsPerPage = limit;
  const totalPages = Math.ceil(totalReviews / reviewsPerPage);

  // Fetch reviews from database
  const fetchReviews = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);
        setError(null);


        // Calculate offset for pagination
        const offset = (page - 1) * reviewsPerPage;

        // First, let's try a simple query to test basic functionality
        const { data: testData, error: testError } = await supabase
          .from("guest_reviews")
          .select("id, guest_name, rating, review_text, approved, created_at")
          .eq("approved", true)
          .limit(3);

        if (testError) {
          console.error("❌ Basic query failed:", testError);
        } else {
        }

        // First, try to fetch reviews with photos
        let reviewsData, reviewsError, count;

        try {

          // Show ALL approved reviews, sorted by rating (highest first) for authenticity
          // This follows industry standards (Airbnb, Booking.com, Google Reviews)
          let query = supabase
            .from("guest_reviews")
            .select(
              `
            *,
            review_photos (
              id,
              photo_url,
              caption,
              display_order
            )
          `,
              { count: "exact" }
            )
            .eq("approved", true)
            .order("rating", { ascending: false }) // 5★ first, then 4★, 3★, 2★, 1★
            .order("created_at", { ascending: false }); // Then by newest

          if (!showPagination) {
            // Homepage: Show limited reviews (all ratings, best first)
            query = query.limit(limit);
          } else {
            // Other pages: Standard pagination
            query = query.range(offset, offset + reviewsPerPage - 1);
          }

          const { data, error, count: reviewCount } = await query;

          reviewsData = data;
          reviewsError = error;
          count = reviewCount;

          if (error) {
            console.error("❌ Photos query failed:", error);
          } else {

            // For homepage, prioritize reviews with photos within each rating tier
            if (!showPagination && data) {
              // Group by rating, then prioritize photos within each group
              const groupByRating = (rating: number) => {
                const withPhotos = data.filter(
                  (r) =>
                    r.rating === rating &&
                    r.review_photos &&
                    r.review_photos.length > 0
                );
                const withoutPhotos = data.filter(
                  (r) =>
                    r.rating === rating &&
                    (!r.review_photos || r.review_photos.length === 0)
                );
                return [...withPhotos, ...withoutPhotos];
              };

              // Sort: 5★ (photos first) → 4★ (photos first) → 3★ → 2★ → 1★
              const prioritized = [
                ...groupByRating(5),
                ...groupByRating(4),
                ...groupByRating(3),
                ...groupByRating(2),
                ...groupByRating(1),
              ].slice(0, limit);

              reviewsData = prioritized;
            }
          }
        } catch (photoError) {

          // Fallback to basic query without photos
          const {
            data,
            error,
            count: reviewCount,
          } = await supabase
            .from("guest_reviews")
            .select("*", { count: "exact" })
            .eq("approved", true)
            .order("created_at", { ascending: false })
            .range(offset, offset + reviewsPerPage - 1);

          reviewsData = data;
          reviewsError = error;
          count = reviewCount;

        }

        if (reviewsError) {
          console.error("Reviews fetch error details:", reviewsError);
          console.error("Error message:", reviewsError.message);
          console.error("Error code:", reviewsError.code);
          throw reviewsError;
        }

        setReviews(reviewsData || []);
        setTotalReviews(count || 0);

        // Calculate average rating and rating counts from approved reviews only
        const { data: allReviews, error: avgError } = await supabase
          .from("guest_reviews")
          .select("rating")
          .eq("approved", true);

        if (!avgError && allReviews && allReviews.length > 0) {
          const avg =
            allReviews.reduce((sum, review) => sum + review.rating, 0) /
            allReviews.length;
          setAverageRating(Math.round(avg * 10) / 10); // Round to 1 decimal place

          // Count reviews by rating
          const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          allReviews.forEach((review) => {
            if (review.rating >= 1 && review.rating <= 5) {
              counts[review.rating as keyof typeof counts]++;
            }
          });
          setRatingCounts(counts);
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError("Failed to load reviews. Please try again later.");
      } finally {
        setLoading(false);
      }
    },
    [reviewsPerPage, limit, showPagination]
  );

  // Fetch all reviews for modal
  const fetchAllReviewsForModal = useCallback(async () => {
    try {
      setModalLoading(true);

      const { data, error } = await supabase
        .from("guest_reviews")
        .select(
          `
          *,
          review_photos (
            id,
            photo_url,
            caption,
            display_order
          )
        `
        )
        .eq("approved", true)
        .order("rating", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAllReviewsData(data || []);
    } catch (err) {
      console.error("Error fetching all reviews:", err);
    } finally {
      setModalLoading(false);
    }
  }, []);

  // Open modal and fetch all reviews
  const openAllReviewsModal = () => {
    setShowAllReviewsModal(true);
    setModalFilter("all");
    if (allReviewsData.length === 0) {
      fetchAllReviewsForModal();
    }
  };

  // Get filtered reviews for modal
  const getFilteredModalReviews = () => {
    if (modalFilter === "all") return allReviewsData;
    return allReviewsData.filter((review) => review.rating === modalFilter);
  };

  useEffect(() => {
    fetchReviews(currentPage);
  }, [currentPage, fetchReviews]);

  // Responsive cards per view for carousel
  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth < 640) {
        setCardsPerView(1);
      } else if (window.innerWidth < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(3);
      }
    };
    updateCardsPerView();
    window.addEventListener("resize", updateCardsPerView);
    return () => window.removeEventListener("resize", updateCardsPerView);
  }, []);

  // Max index = last position where a full "window" of cards is visible
  const maxIndex = Math.max(0, reviews.length - cardsPerView);

  // Clamp currentSlide when cardsPerView or reviews change
  useEffect(() => {
    if (currentSlide > maxIndex) {
      setCurrentSlide(maxIndex);
    }
  }, [maxIndex, currentSlide]);

  // Auto-slide every 5 seconds, pause on hover — advances 1 card at a time
  useEffect(() => {
    if (isHovered || reviews.length <= cardsPerView) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [isHovered, maxIndex, reviews.length, cardsPerView]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  // Handle pagination
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Render star rating
  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "w-3 h-3",
      md: "w-4 h-4",
      lg: "w-5 h-5",
    };

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border/60 p-4 xs:p-5 sm:p-6 lg:p-8 rounded-xl shadow-lg animate-pulse"
            >
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="w-4 h-4 bg-muted-foreground/30 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-muted-foreground/30 rounded w-full"></div>
                <div className="h-4 bg-muted-foreground/30 rounded w-3/4"></div>
                <div className="h-4 bg-muted-foreground/30 rounded w-1/2"></div>
              </div>
              <div className="border-t border-gray-600 pt-3 sm:pt-4">
                <div className="h-4 bg-muted-foreground/30 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted-foreground/30 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${className} text-center py-8`}>
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Unable to Load Reviews
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => fetchReviews(currentPage)}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (reviews.length === 0) {
    return (
      <div className={`${className} text-center py-8`}>
        <div className="flex flex-col items-center gap-4">
          <Star className="w-12 h-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Reviews Yet
            </h3>
            <p className="text-muted-foreground">
              Be the first to share your experience at Kampo Ibayo!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Reviews Header with Stats */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="flex flex-col xs:flex-row items-center justify-center gap-1 xs:gap-2 mb-4">
          {renderStars(averageRating, "lg")}
          <div className="flex items-center gap-2">
            <span className="text-xl xs:text-2xl font-bold text-foreground">
              {averageRating}
            </span>
            <span className="text-muted-foreground text-sm xs:text-base">
              ({totalReviews} reviews)
            </span>
          </div>
        </div>
        <p className="text-muted-foreground text-sm xs:text-base sm:text-lg max-w-2xl mx-auto">
          Read authentic reviews from families and adventurers who experienced
          Kampo Ibayo
        </p>
      </div>

      {/* Reviews Carousel — Embla/shadcn-style: per-card sliding */}
      <div
        className="relative group/carousel"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Carousel viewport */}
        <div className="overflow-hidden -mx-2">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(-${currentSlide * (100 / cardsPerView)}%)`,
            }}
          >
            {reviews.map((review) => (
              <div
                key={review.id}
                className="flex-shrink-0 px-2"
                style={{ width: `${100 / cardsPerView}%` }}
              >
                <div className="group bg-card border border-border/60 hover:border-primary/40 p-4 xs:p-5 sm:p-6 lg:p-8 rounded-xl shadow-lg hover:bg-muted/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col">
                  {/* Rating and Verification */}
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    {renderStars(review.rating)}
                    <div className="flex items-center gap-2">
                      {review.approved && (
                        <div className="flex items-center gap-1 text-green-400 text-xs">
                          <CheckCircle className="w-3 h-3" />
                          <span>Approved</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review Text */}
                  <div className="mb-4 sm:mb-6">
                    <p
                      ref={(el) => checkTruncation(el, review.id)}
                      className="text-foreground/80 italic text-xs xs:text-sm sm:text-base leading-relaxed line-clamp-4"
                    >
                      &ldquo;{review.review_text}&rdquo;
                    </p>
                    {truncatedReviews.has(review.id) && (
                      <button
                        type="button"
                        onClick={() => setSelectedReview(review)}
                        className="text-primary hover:text-primary/80 text-xs mt-1.5 transition-colors"
                      >
                        See more
                      </button>
                    )}
                  </div>

                  {/* Spacer — pushes photos + guest info to bottom on short reviews */}
                  <div className="flex-1" />

                  {/* Review Photos */}
                  {review.review_photos &&
                    review.review_photos.length > 0 && (
                      <div className="mb-4 sm:mb-6">
                        <div className="grid grid-cols-3 gap-1.5 xs:gap-2 sm:gap-3">
                          {review.review_photos
                            .sort(
                              (a, b) =>
                                (a.display_order || 0) -
                                (b.display_order || 0)
                            )
                            .slice(0, 3)
                            .map((photo) => (
                              <div
                                key={photo.id}
                                className="relative aspect-square overflow-hidden rounded-lg"
                              >
                                <Image
                                  src={photo.photo_url}
                                  alt={photo.caption || "Review photo"}
                                  fill
                                  className="object-cover hover:scale-105 transition-transform duration-300"
                                  sizes="(max-width: 768px) 100px, (max-width: 1200px) 120px, 150px"
                                />
                              </div>
                            ))}
                        </div>
                        {review.review_photos.length > 3 && (
                          <p className="text-muted-foreground text-xs mt-2">
                            +{review.review_photos.length - 3} more photo
                            {review.review_photos.length - 3 > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    )}

                  {/* Guest Info */}
                  <div className="border-t border-border pt-3 sm:pt-4 mt-auto">
                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-0">
                      <div>
                        <p className="font-bold text-primary text-sm xs:text-base">
                          - {review.guest_name}
                        </p>
                        {review.guest_location && (
                          <div className="flex items-center gap-1 text-muted-foreground text-xs xs:text-sm mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{review.guest_location}</span>
                          </div>
                        )}
                      </div>
                      <div className="xs:text-right">
                        <div className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(review.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* shadcn-style navigation: arrows + progress dots */}
        {reviews.length > cardsPerView && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              type="button"
              onClick={prevSlide}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border bg-muted hover:bg-secondary hover:border-border text-foreground transition-colors"
              aria-label="Previous review"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`rounded-full transition-all duration-300 ${
                    currentSlide === index
                      ? "bg-primary w-6 h-2"
                      : "bg-muted-foreground/40 hover:bg-muted-foreground/60 w-2 h-2"
                  }`}
                  aria-label={`Go to position ${index + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={nextSlide}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border bg-muted hover:bg-secondary hover:border-border text-foreground transition-colors"
              aria-label="Next review"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* View All Reviews Button - Clean secondary style */}
      {totalReviews > 0 && (
        <div className="text-center mt-8">
          <button
            type="button"
            onClick={openAllReviewsModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-transparent border-2 border-border hover:border-primary text-muted-foreground hover:text-foreground font-medium rounded-lg transition-all duration-300"
          >
            <Eye className="w-4 h-4" />
            View All {totalReviews} {totalReviews === 1 ? "Review" : "Reviews"}
          </button>
        </div>
      )}

      {/* Review Summary */}
      <div className="text-center mt-6 text-sm text-muted-foreground">
        Showing {reviews.length} of {totalReviews} verified guest reviews
      </div>

      {/* Single Review Modal */}
      {selectedReview && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedReview(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <div className="flex items-center gap-2">
                {renderStars(selectedReview.rating)}
                {selectedReview.approved && (
                  <span className="flex items-center gap-1 text-green-400 text-xs">
                    <CheckCircle className="w-3 h-3" /> Approved
                  </span>
                )}
              </div>
              <button
                type="button"
                aria-label="Close review"
                onClick={() => setSelectedReview(null)}
                className="p-1.5 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              <p className="text-foreground/80 italic text-sm leading-relaxed">
                &ldquo;{selectedReview.review_text}&rdquo;
              </p>

              {/* Photos */}
              {selectedReview.review_photos && selectedReview.review_photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {selectedReview.review_photos.slice(0, 3).map((photo) => (
                    <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg">
                      <Image
                        src={photo.photo_url}
                        alt={photo.caption || "Review photo"}
                        fill
                        className="object-cover"
                        sizes="150px"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-700">
              <p className="font-bold text-primary text-sm">- {selectedReview.guest_name}</p>
              {selectedReview.guest_location && (
                <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{selectedReview.guest_location}</span>
                </div>
              )}
              {selectedReview.created_at && (
                <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(selectedReview.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All Reviews Modal */}
      {showAllReviewsModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAllReviewsModal(false)}
        >
          <div
            className="bg-card rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-card border-b border-border p-4 sm:p-6 z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    All Guest Reviews
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(averageRating, "sm")}
                    <span className="text-muted-foreground text-sm">
                      {averageRating} average · {totalReviews} reviews
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close reviews"
                  onClick={() => setShowAllReviewsModal(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              {/* Rating Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground text-sm mr-2">Filter:</span>
                <button
                  type="button"
                  onClick={() => setModalFilter("all")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    modalFilter === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  All ({totalReviews})
                </button>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setModalFilter(rating)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                      modalFilter === rating
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-secondary"
                    } ${ratingCounts[rating] === 0 ? "opacity-50" : ""}`}
                    disabled={ratingCounts[rating] === 0}
                  >
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {rating} ({ratingCounts[rating]})
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-4 sm:p-6">
              {modalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : getFilteredModalReviews().length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No reviews found for this rating
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredModalReviews().map((review) => (
                    <div
                      key={review.id}
                      className="bg-muted/50 p-4 sm:p-6 rounded-xl hover:bg-muted transition-colors"
                    >
                      {/* Rating and Date */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {renderStars(review.rating)}
                          <span className="text-yellow-400 font-semibold">
                            {review.rating}/5
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground text-xs sm:text-sm">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{formatDate(review.created_at)}</span>
                        </div>
                      </div>

                      {/* Review Text */}
                      <p className="text-foreground/80 text-sm sm:text-base leading-relaxed mb-4">
                        &ldquo;{review.review_text}&rdquo;
                      </p>

                      {/* Review Photos */}
                      {review.review_photos &&
                        review.review_photos.length > 0 && (
                          <div className="mb-4">
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {review.review_photos
                                .sort(
                                  (a, b) =>
                                    (a.display_order || 0) -
                                    (b.display_order || 0)
                                )
                                .map((photo) => (
                                  <div
                                    key={photo.id}
                                    className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 overflow-hidden rounded-lg"
                                  >
                                    <Image
                                      src={photo.photo_url}
                                      alt={photo.caption || "Review photo"}
                                      fill
                                      className="object-cover"
                                      sizes="96px"
                                    />
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                      {/* Guest Info */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">
                            {review.guest_name}
                          </span>
                          {review.approved && (
                            <div className="flex items-center gap-1 text-green-400 text-xs">
                              <CheckCircle className="w-3 h-3" />
                              <span>Verified</span>
                            </div>
                          )}
                        </div>
                        {review.guest_location && (
                          <div className="flex items-center gap-1 text-muted-foreground text-xs sm:text-sm">
                            <MapPin className="w-3 h-3" />
                            <span>{review.guest_location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-card border-t border-border p-4 text-center">
              <p className="text-muted-foreground text-sm">
                Showing {getFilteredModalReviews().length}{" "}
                {modalFilter === "all" ? "" : `${modalFilter}-star `}reviews
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSystem;
