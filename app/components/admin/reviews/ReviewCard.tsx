"use client";

import {
  Star,
  Check,
  X,
  Eye,
  Calendar,
  User,
  MapPin,
  ImageIcon,
  ZoomIn,
} from "lucide-react";
import Image from "next/image";
import type { ReviewWithPhotos, RejectionModalState } from "@/app/hooks/useReviewManagement";
import { Tables } from "@/database.types";

type Review = Tables<"guest_reviews">;

interface ReviewCardProps {
  review: ReviewWithPhotos;
  updating: string | null;
  onApprove: (reviewId: string) => void;
  onReject: (modal: RejectionModalState) => void;
  onUnApprove: (modal: RejectionModalState) => void;
  onPhotoClick: (url: string) => void;
}

function renderStars(rating: number, size = "w-4 h-4") {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-border"
          }`}
        />
      ))}
    </div>
  );
}

function renderCategoryRatings(review: Review) {
  const categories = [
    { name: "Cleanliness", rating: review.cleanliness_rating },
    { name: "Service", rating: review.service_rating },
    { name: "Location", rating: review.location_rating },
    { name: "Value", rating: review.value_rating },
    { name: "Amenities", rating: review.amenities_rating },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-3">
      {categories.map(
        (category) =>
          category.rating && (
            <div key={category.name} className="text-sm">
              <div className="text-muted-foreground text-xs mb-1">
                {category.name}
              </div>
              {renderStars(category.rating, "w-3 h-3")}
              <div className="text-xs text-muted-foreground mt-1">
                {category.rating}/5
              </div>
            </div>
          )
      )}
    </div>
  );
}

export default function ReviewCard({
  review,
  updating,
  onApprove,
  onReject,
  onUnApprove,
  onPhotoClick,
}: ReviewCardProps) {
  return (
    <div className="bg-muted rounded-lg border border-border p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3">
            <div className="flex items-center space-x-3">
              <div>
                <h4 className="text-base font-medium text-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {review.guest_name}
                </h4>
                {review.guest_location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {review.guest_location}
                  </p>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="flex items-center gap-2 mb-1">
                {renderStars(review.rating)}
                <span className="text-lg font-semibold text-foreground">
                  {review.rating}/5
                </span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(review.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Stay Dates */}
          {review.stay_dates && (
            <div className="mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info/10 text-info">
                Stay: {review.stay_dates}
              </span>
            </div>
          )}

          {/* Review Text */}
          <div className="mb-3">
            <p className="text-foreground leading-relaxed text-sm sm:text-base">
              {review.review_text}
            </p>

            {/* Auto-flagged explanation */}
            {review.approved === false && !review.rejection_reason && (
              <div className="mt-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Eye className="h-4 w-4 text-warning mt-0.5" />
                  </div>
                  <div className="ml-2">
                    <h5 className="text-sm font-medium text-warning">
                      Auto-flagged by System
                    </h5>
                    <p className="text-xs text-warning mt-1">
                      This review was automatically flagged for containing
                      potentially problematic content (profanity, spam, personal
                      attacks, etc.). You can approve it if the content is
                      acceptable or reject it with feedback for the guest.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Admin rejection reason */}
            {review.approved === false && review.rejection_reason && (
              <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <X className="h-4 w-4 text-destructive mt-0.5" />
                  </div>
                  <div className="ml-2">
                    <h5 className="text-sm font-medium text-destructive">
                      Rejected by Admin
                    </h5>
                    <p className="text-xs text-destructive mt-1">
                      <strong>Reason:</strong> {review.rejection_reason}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Category Ratings */}
          {(review.cleanliness_rating ||
            review.service_rating ||
            review.location_rating ||
            review.value_rating ||
            review.amenities_rating) && (
            <div className="mb-3">
              <h5 className="text-sm font-medium text-foreground mb-2">
                Category Ratings
              </h5>
              {renderCategoryRatings(review)}
            </div>
          )}

          {/* Photos */}
          {review.review_photos && review.review_photos.length > 0 && (
            <div className="mb-3">
              <h5 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Photos ({review.review_photos.length})
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {review.review_photos
                  .sort(
                    (a, b) =>
                      (a.display_order || 0) - (b.display_order || 0)
                  )
                  .map((photo) => (
                    <div
                      key={photo.id}
                      className="relative aspect-square overflow-hidden rounded-lg border border-border cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
                      onClick={() => onPhotoClick(photo.photo_url)}
                    >
                      <Image
                        src={photo.photo_url}
                        alt={
                          photo.caption ||
                          `Review photo ${photo.display_order || 1}`
                        }
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                        <ZoomIn className="w-4 h-4 sm:w-6 sm:h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-1 sm:p-2">
                          <p className="truncate text-xs">{photo.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Status and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-border gap-3">
            <div className="flex items-center space-x-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  review.approved
                    ? "bg-success/10 text-success"
                    : review.approved === false
                    ? review.rejection_reason
                      ? "bg-destructive/10 text-destructive"
                      : "bg-warning/10 text-warning"
                    : "bg-warning/10 text-warning"
                }`}
              >
                {review.approved ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Published & Live
                  </>
                ) : review.approved === false ? (
                  review.rejection_reason ? (
                    <>
                      <X className="w-3 h-3 mr-1" />
                      Rejected by Admin
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 mr-1" />
                      Flagged for Review
                    </>
                  )
                ) : (
                  <>
                    <Eye className="w-3 h-3 mr-1" />
                    Awaiting Review (Legacy)
                  </>
                )}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              {!review.approved && (
                <>
                  <button
                    onClick={() => onApprove(review.id)}
                    disabled={updating === review.id}
                    className="inline-flex items-center justify-center px-3 py-2 sm:py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-success hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success disabled:opacity-50"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    {review.rejection_reason
                      ? "Override & Approve"
                      : "Approve & Publish"}
                  </button>
                  <button
                    onClick={() =>
                      onReject({
                        isOpen: true,
                        reviewId: review.id,
                        reviewTitle: `${review.guest_name}'s ${review.rating}-star review`,
                      })
                    }
                    disabled={updating === review.id}
                    className="inline-flex items-center justify-center px-3 py-2 sm:py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-destructive hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive disabled:opacity-50"
                  >
                    <X className="w-3 h-3 mr-1" />
                    {review.rejection_reason
                      ? "Update Rejection"
                      : "Reject with Feedback"}
                  </button>
                </>
              )}

              {review.approved && (
                <button
                  onClick={() =>
                    onUnApprove({
                      isOpen: true,
                      reviewId: review.id,
                      reviewTitle: `${review.guest_name}'s ${review.rating}-star review`,
                    })
                  }
                  disabled={updating === review.id}
                  className="inline-flex items-center justify-center px-3 py-2 sm:py-1.5 border border-destructive/20 text-xs font-medium rounded-md text-destructive bg-destructive/10 hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive disabled:opacity-50"
                  title="This will remove the review from public display"
                >
                  <X className="w-3 h-3 mr-1" />
                  Un-approve
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
