"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/app/supabaseClient";
import {
  Star,
  Check,
  X,
  Eye,
  Calendar,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  ZoomIn,
} from "lucide-react";
import Image from "next/image";

import { Tables } from "@/database.types";

type Review = Tables<"guest_reviews">;
type ReviewPhoto = Tables<"review_photos">;

interface ReviewWithPhotos extends Review {
  review_photos: ReviewPhoto[];
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewWithPhotos[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ReviewWithPhotos[]>(
    []
  );
  const [loading, setLoading] = useState(false); // ✅ Start false for instant UI
  const [filter, setFilter] = useState<
    "all" | "approved" | "pending" | "flagged"
  >("flagged");
  const [updating, setUpdating] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [rejectionModal, setRejectionModal] = useState<{
    isOpen: boolean;
    reviewId: string;
    reviewTitle: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [unApprovalModal, setUnApprovalModal] = useState<{
    isOpen: boolean;
    reviewId: string;
    reviewTitle: string;
  } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchReviews = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      console.log("🔍 Fetching reviews...");

      const { data, error } = await supabase
        .from("guest_reviews")
        .select(
          `
          *,
          review_photos (
            id,
            review_id,
            photo_url,
            caption,
            display_order,
            created_at
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log("✅ Successfully fetched reviews:", data?.length || 0);
      setReviews(data || []);
    } catch (error) {
      console.error("❌ Error fetching reviews:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ✅ OPTIMIZED: Delayed fetch to not block navigation
  useEffect(() => {
    const timer = setTimeout(() => fetchReviews(), 100);
    return () => clearTimeout(timer);
  }, [fetchReviews]);

  useEffect(() => {
    let filtered = reviews;
    if (filter === "approved") {
      filtered = reviews.filter((r) => r.approved === true);
    } else if (filter === "pending") {
      filtered = reviews.filter((r) => r.approved === null);
    } else if (filter === "flagged") {
      filtered = reviews.filter((r) => r.approved === false); // Flagged for manual review
    }
    setFilteredReviews(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [reviews, filter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredReviews.length);
  const paginatedReviews = filteredReviews.slice(startIndex, endIndex);

  const updateReviewStatus = async (
    reviewId: string,
    approved: boolean,
    rejectionReason?: string
  ) => {
    try {
      setUpdating(reviewId);

      // Use the new API routes that handle both database updates and email notifications
      const apiUrl = approved
        ? "/api/admin/approve-review"
        : "/api/admin/reject-review";

      const requestBody = approved
        ? { reviewId }
        : {
            reviewId,
            rejectionReason:
              rejectionReason || "Review does not meet our guidelines",
          };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update review status");
      }

      // Update local state with the returned review data
      if (result.review) {
        setReviews(
          reviews.map((review) =>
            review.id === reviewId ? { ...review, ...result.review } : review
          )
        );
      } else {
        // Fallback: refresh the reviews list
        await fetchReviews(true);
      }

      // Show success message
      if (approved) {
        alert("Review approved and user notified via email!");
      } else {
        alert("Review rejected and user notified via email with feedback!");
      }
    } catch (error) {
      console.error("Error updating review status:", error);
      alert(
        `Failed to update review status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setUpdating(null);
    }
  };

  const renderStars = (rating: number, size = "w-4 h-4") => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const renderCategoryRatings = (review: Review) => {
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
                <div className="text-gray-600 text-xs mb-1">
                  {category.name}
                </div>
                {renderStars(category.rating, "w-3 h-3")}
                <div className="text-xs text-gray-500 mt-1">
                  {category.rating}/5
                </div>
              </div>
            )
        )}
      </div>
    );
  };

  const filteredReviewsCount = {
    all: reviews.length,
    approved: reviews.filter((r) => r.approved === true).length,
    pending: reviews.filter((r) => r.approved === null).length,
    flagged: reviews.filter((r) => r.approved === false).length,
  };

  // ✅ REMOVED BLOCKING LOADING SCREEN - UI renders instantly

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        {/* Auto-Publish System Notice */}
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-green-800">
                ✅ Auto-Publish System Active
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Reviews now publish automatically for better guest trust. Only
                problematic content (spam, profanity, personal attacks) gets
                flagged for manual review.
                <strong>
                  {" "}
                  This improves conversion rates and builds authentic
                  credibility.
                </strong>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700">
            Review Management ({loading ? "..." : filteredReviews.length})
          </h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => fetchReviews(true)}
              disabled={refreshing}
              className={`px-3 py-2 text-white rounded-md text-sm transition ${
                refreshing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {refreshing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  Refreshing...
                </span>
              ) : (
                "Refresh"
              )}
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-wrap gap-1 sm:gap-4">
              {[
                {
                  key: "flagged",
                  label: "Flagged for Review",
                  mobileLabel: "Flagged",
                  count: filteredReviewsCount.flagged,
                },
                {
                  key: "all",
                  label: "All Reviews",
                  mobileLabel: "All",
                  count: filteredReviewsCount.all,
                },
                {
                  key: "approved",
                  label: "Published",
                  mobileLabel: "Published",
                  count: filteredReviewsCount.approved,
                },
                {
                  key: "pending",
                  label: "Legacy Pending",
                  mobileLabel: "Legacy",
                  count: filteredReviewsCount.pending,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() =>
                    setFilter(tab.key as "all" | "approved" | "pending")
                  }
                  className={`${
                    filter === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } py-1.5 sm:py-2 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2`}
                >
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.mobileLabel}</span>
                  <span
                    className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                      filter === tab.key
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Pagination Info */}
        {filteredReviews.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 text-xs sm:text-sm text-gray-600 gap-1 sm:gap-0">
            <div>
              Showing {startIndex + 1} to {endIndex} of {filteredReviews.length}{" "}
              reviews
            </div>
            <div>
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <Eye className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No reviews found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === "flagged"
                ? "No reviews flagged for manual review - all reviews are auto-publishing!"
                : filter === "pending"
                ? "No legacy pending reviews"
                : "No reviews have been submitted yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-gray-50 rounded-lg border border-gray-200 p-4 sm:p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="text-base font-medium text-gray-900 flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {review.guest_name}
                            </h4>
                            {review.guest_location && (
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {review.guest_location}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <div className="flex items-center gap-2 mb-1">
                            {renderStars(review.rating)}
                            <span className="text-lg font-semibold text-gray-900">
                              {review.rating}/5
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(review.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Stay Dates */}
                      {review.stay_dates && (
                        <div className="mb-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Stay: {review.stay_dates}
                          </span>
                        </div>
                      )}

                      {/* Review Text */}
                      <div className="mb-3">
                        <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                          {review.review_text}
                        </p>

                        {/* Auto-flagged explanation */}
                        {review.approved === false &&
                          !review.rejection_reason && (
                            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <div className="flex items-start">
                                <div className="flex-shrink-0">
                                  <Eye className="h-4 w-4 text-orange-400 mt-0.5" />
                                </div>
                                <div className="ml-2">
                                  <h5 className="text-sm font-medium text-orange-800">
                                    Auto-flagged by System
                                  </h5>
                                  <p className="text-xs text-orange-700 mt-1">
                                    This review was automatically flagged for
                                    containing potentially problematic content
                                    (profanity, spam, personal attacks, etc.).
                                    You can approve it if the content is
                                    acceptable or reject it with feedback for
                                    the guest.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                        {/* Admin rejection reason */}
                        {review.approved === false &&
                          review.rejection_reason && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-start">
                                <div className="flex-shrink-0">
                                  <X className="h-4 w-4 text-red-400 mt-0.5" />
                                </div>
                                <div className="ml-2">
                                  <h5 className="text-sm font-medium text-red-800">
                                    Rejected by Admin
                                  </h5>
                                  <p className="text-xs text-red-700 mt-1">
                                    <strong>Reason:</strong>{" "}
                                    {review.rejection_reason}
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
                          <h5 className="text-sm font-medium text-gray-900 mb-2">
                            Category Ratings
                          </h5>
                          {renderCategoryRatings(review)}
                        </div>
                      )}

                      {/* Photos */}
                      {review.review_photos &&
                        review.review_photos.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                              <ImageIcon className="w-4 h-4" />
                              Photos ({review.review_photos.length})
                            </h5>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                              {review.review_photos
                                .sort(
                                  (a, b) =>
                                    (a.display_order || 0) -
                                    (b.display_order || 0)
                                )
                                .map((photo) => (
                                  <div
                                    key={photo.id}
                                    className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all group"
                                    onClick={() =>
                                      setSelectedPhoto(photo.photo_url)
                                    }
                                  >
                                    <Image
                                      src={photo.photo_url}
                                      alt={
                                        photo.caption ||
                                        `Review photo ${
                                          photo.display_order || 1
                                        }`
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
                                        <p className="truncate text-xs">
                                          {photo.caption}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                      {/* Status and Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-gray-200 gap-3">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              review.approved
                                ? "bg-green-100 text-green-800"
                                : review.approved === false
                                ? review.rejection_reason
                                  ? "bg-red-100 text-red-800"
                                  : "bg-orange-100 text-orange-800"
                                : "bg-yellow-100 text-yellow-800"
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
                                onClick={() =>
                                  updateReviewStatus(review.id, true)
                                }
                                disabled={updating === review.id}
                                className="inline-flex items-center justify-center px-3 py-2 sm:py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                {review.rejection_reason
                                  ? "Override & Approve"
                                  : "Approve & Publish"}
                              </button>
                              <button
                                onClick={() =>
                                  setRejectionModal({
                                    isOpen: true,
                                    reviewId: review.id,
                                    reviewTitle: `${review.guest_name}'s ${review.rating}-star review`,
                                  })
                                }
                                disabled={updating === review.id}
                                className="inline-flex items-center justify-center px-3 py-2 sm:py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
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
                                setUnApprovalModal({
                                  isOpen: true,
                                  reviewId: review.id,
                                  reviewTitle: `${review.guest_name}'s ${review.rating}-star review`,
                                })
                              }
                              disabled={updating === review.id}
                              className="inline-flex items-center justify-center px-3 py-2 sm:py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
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
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-b-lg gap-3 sm:gap-0">
                {/* Mobile pagination controls */}
                <div className="flex justify-between items-center sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>

                {/* Desktop pagination controls */}
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">{startIndex + 1}</span> to{" "}
                      <span className="font-medium">{endIndex}</span> of{" "}
                      <span className="font-medium">
                        {filteredReviews.length}
                      </span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              currentPage === page
                                ? "z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}

                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative w-full h-full max-w-7xl max-h-full flex items-center justify-center">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 text-white hover:text-gray-300 transition-colors bg-black/50 hover:bg-black/70 rounded-full p-2 sm:p-3"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <Image
              src={selectedPhoto}
              alt="Review photo - enlarged view"
              fill
              className="object-contain rounded-lg"
              sizes="100vw"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Reject Review
              </h3>
              <button
                onClick={() => {
                  setRejectionModal(null);
                  setRejectionReason("");
                }}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">
                Rejecting:{" "}
                <span className="font-medium text-gray-900">
                  {rejectionModal.reviewTitle}
                </span>
              </p>
              <p className="text-xs text-gray-600 mb-4">
                Please provide a reason for rejection. This will help the guest
                improve their review if they choose to resubmit.
              </p>

              <label
                htmlFor="rejectionReason"
                className="block text-sm font-medium text-gray-800 mb-2"
              >
                Rejection Reason *
              </label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 placeholder-gray-500"
                placeholder="e.g., Review contains inappropriate language, lacks specific details about the stay, or violates our review guidelines..."
                required
              />

              <div className="mt-2">
                <p className="text-xs text-gray-600">
                  <strong>Common reasons:</strong> Inappropriate content,
                  insufficient detail, spam, off-topic, violates guidelines
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => {
                  setRejectionModal(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (rejectionReason.trim()) {
                    await updateReviewStatus(
                      rejectionModal.reviewId,
                      false,
                      rejectionReason.trim()
                    );
                    setRejectionModal(null);
                    setRejectionReason("");
                  } else {
                    alert("Please provide a rejection reason");
                  }
                }}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md order-1 sm:order-2"
              >
                Reject Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Un-approval Confirmation Modal */}
      {unApprovalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Un-approve Review
              </h3>
              <button
                onClick={() => {
                  setUnApprovalModal(null);
                  setRejectionReason("");
                }}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">
                Un-approving:{" "}
                <span className="font-medium text-gray-900">
                  {unApprovalModal.reviewTitle}
                </span>
              </p>
              <p className="text-xs text-red-700 bg-red-50 p-2 rounded mb-4">
                ⚠️ This will remove the review from public display and notify
                the guest.
              </p>

              <label
                htmlFor="unApprovalReason"
                className="block text-sm font-medium text-gray-800 mb-2"
              >
                Reason for Un-approval (Optional)
              </label>
              <textarea
                id="unApprovalReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 placeholder-gray-500"
                placeholder="e.g., Review was found to violate guidelines after publication, contains newly discovered inappropriate content..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => {
                  setUnApprovalModal(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md order-2 sm:order-1 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await updateReviewStatus(
                    unApprovalModal.reviewId,
                    false,
                    rejectionReason.trim() || "Review un-approved by admin"
                  );
                  setUnApprovalModal(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md order-1 sm:order-2 transition-colors"
              >
                Confirm Un-approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
