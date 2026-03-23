"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/app/supabaseClient";
import { useToastHelpers } from "@/app/components/Toast";
import { Tables } from "@/database.types";

type Review = Tables<"guest_reviews">;
type ReviewPhoto = Tables<"review_photos">;

export interface ReviewWithPhotos extends Review {
  review_photos: ReviewPhoto[];
}

export interface RejectionModalState {
  isOpen: boolean;
  reviewId: string;
  reviewTitle: string;
}

export function useReviewManagement() {
  const [reviews, setReviews] = useState<ReviewWithPhotos[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ReviewWithPhotos[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "approved" | "pending" | "flagged">("flagged");
  const [updating, setUpdating] = useState<string | null>(null);
  const toast = useToastHelpers();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [rejectionModal, setRejectionModal] = useState<RejectionModalState | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [unApprovalModal, setUnApprovalModal] = useState<RejectionModalState | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchReviews = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

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
        .order("rating", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("❌ Error fetching reviews:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Delayed fetch to not block navigation
  useEffect(() => {
    const timer = setTimeout(() => fetchReviews(), 100);
    return () => clearTimeout(timer);
  }, [fetchReviews]);

  // Filter reviews when filter or reviews change
  useEffect(() => {
    let filtered = reviews;
    if (filter === "approved") {
      filtered = reviews.filter((r) => r.approved === true);
    } else if (filter === "pending") {
      filtered = reviews.filter((r) => r.approved === null);
    } else if (filter === "flagged") {
      filtered = reviews.filter((r) => r.approved === false);
    }
    setFilteredReviews(filtered);
    setCurrentPage(1);
  }, [reviews, filter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredReviews.length);
  const paginatedReviews = filteredReviews.slice(startIndex, endIndex);

  const updateReviewStatus = async (
    reviewId: string,
    approved: boolean,
    reason?: string
  ) => {
    try {
      setUpdating(reviewId);

      const apiUrl = approved
        ? "/api/admin/approve-review"
        : "/api/admin/reject-review";

      const requestBody = approved
        ? { reviewId }
        : {
            reviewId,
            rejectionReason: reason || "Review does not meet our guidelines",
          };

      const { getFreshSession } = await import("../utils/apiTimeout");
      const session = await getFreshSession(supabase);
      if (!session?.access_token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update review status");
      }

      if (result.review) {
        setReviews(
          reviews.map((review) =>
            review.id === reviewId ? { ...review, ...result.review } : review
          )
        );
      } else {
        await fetchReviews(true);
      }

      if (approved) {
        toast.success("Review Approved", "User notified via email.");
      } else {
        toast.success("Review Rejected", "User notified via email with feedback.");
      }
    } catch (error) {
      console.error("Error updating review status:", error);
      toast.error("Failed to update review status", "Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  const filteredReviewsCount = {
    all: reviews.length,
    approved: reviews.filter((r) => r.approved === true).length,
    pending: reviews.filter((r) => r.approved === null).length,
    flagged: reviews.filter((r) => r.approved === false).length,
  };

  return {
    // Data
    filteredReviews,
    paginatedReviews,
    loading,
    refreshing,
    updating,
    filter,
    filteredReviewsCount,
    // Pagination
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    setCurrentPage,
    // Actions
    setFilter,
    fetchReviews,
    updateReviewStatus,
    // Photo modal
    selectedPhoto,
    setSelectedPhoto,
    // Rejection modal
    rejectionModal,
    setRejectionModal,
    rejectionReason,
    setRejectionReason,
    // Un-approval modal
    unApprovalModal,
    setUnApprovalModal,
    // Toast
    toast,
  };
}
