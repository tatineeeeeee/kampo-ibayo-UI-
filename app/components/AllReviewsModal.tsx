"use client";

import {
  Star,
  MapPin,
  Calendar,
  CheckCircle,
  X,
  Filter,
} from "lucide-react";
import Image from "next/image";
import { renderStars, formatDate } from "./ReviewCard";
import type { ReviewWithPhotos } from "./ReviewCard";

interface AllReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviews: ReviewWithPhotos[];
  averageRating: number;
  totalReviews: number;
  ratingCounts: { [key: number]: number };
  modalFilter: number | "all";
  onFilterChange: (filter: number | "all") => void;
  isLoading: boolean;
  onViewReview: (review: ReviewWithPhotos) => void;
}

const AllReviewsModal = ({
  isOpen,
  onClose,
  reviews,
  averageRating,
  totalReviews,
  ratingCounts,
  modalFilter,
  onFilterChange,
  isLoading,
  onViewReview,
}: AllReviewsModalProps) => {
  if (!isOpen) return null;

  const filteredReviews =
    modalFilter === "all"
      ? reviews
      : reviews.filter((review) => review.rating === modalFilter);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
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
              onClick={onClose}
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
              onClick={() => onFilterChange("all")}
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
                onClick={() => onFilterChange(rating)}
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No reviews found for this rating
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
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
                  <div className="flex items-center justify-between pt-3 border-t border-border">
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
            Showing {filteredReviews.length}{" "}
            {modalFilter === "all" ? "" : `${modalFilter}-star `}reviews
          </p>
        </div>
      </div>
    </div>
  );
};

export default AllReviewsModal;
