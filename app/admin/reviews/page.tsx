"use client";

import { Check, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useReviewManagement } from "@/app/hooks/useReviewManagement";
import ReviewCard from "@/app/components/admin/reviews/ReviewCard";
import {
  PhotoModal,
  RejectionModal,
  UnApprovalModal,
} from "@/app/components/admin/reviews/ReviewModals";

export default function AdminReviewsPage() {
  const {
    filteredReviews,
    paginatedReviews,
    loading,
    refreshing,
    updating,
    filter,
    filteredReviewsCount,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    setCurrentPage,
    setFilter,
    fetchReviews,
    updateReviewStatus,
    selectedPhoto,
    setSelectedPhoto,
    rejectionModal,
    setRejectionModal,
    rejectionReason,
    setRejectionReason,
    unApprovalModal,
    setUnApprovalModal,
    toast,
  } = useReviewManagement();

  return (
    <div>
      <div className="bg-card rounded-xl shadow-md p-4 sm:p-6">
        {/* Auto-Publish System Notice */}
        <div className="bg-success/10 border-l-4 border-success p-4 mb-6 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-success" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-success">
                ✅ Auto-Publish System Active
              </h4>
              <p className="text-sm text-success mt-1">
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

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">
            Review Management ({loading ? "..." : filteredReviews.length})
          </h3>
          <button
            onClick={() => fetchReviews(true)}
            disabled={refreshing}
            className={`px-3 py-2 text-white rounded-md text-sm transition ${
              refreshing
                ? "bg-muted-foreground cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
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

        {/* Filter Tabs */}
        <div className="mb-4">
          <div className="border-b border-border">
            <nav className="-mb-px flex flex-wrap gap-1 sm:gap-4">
              {[
                { key: "flagged", label: "Flagged for Review", mobileLabel: "Flagged", count: filteredReviewsCount.flagged },
                { key: "all", label: "All Reviews", mobileLabel: "All", count: filteredReviewsCount.all },
                { key: "approved", label: "Published", mobileLabel: "Published", count: filteredReviewsCount.approved },
                { key: "pending", label: "Legacy Pending", mobileLabel: "Legacy", count: filteredReviewsCount.pending },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as "all" | "approved" | "pending" | "flagged")}
                  className={`${
                    filter === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  } py-1.5 sm:py-2 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2`}
                >
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.mobileLabel}</span>
                  <span
                    className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                      filter === tab.key
                        ? "bg-info/10 text-primary"
                        : "bg-muted text-foreground"
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 text-xs sm:text-sm text-muted-foreground gap-1 sm:gap-0">
            <div>
              Showing {startIndex + 1} to {endIndex} of {filteredReviews.length} reviews
            </div>
            <div>
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <Eye className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">
              No reviews found
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
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
                <ReviewCard
                  key={review.id}
                  review={review}
                  updating={updating}
                  onApprove={(id) => updateReviewStatus(id, true)}
                  onReject={setRejectionModal}
                  onUnApprove={setUnApprovalModal}
                  onPhotoClick={setSelectedPhoto}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-border bg-card px-4 py-3 sm:px-6 mt-4 rounded-b-lg gap-3 sm:gap-0">
                <div className="flex justify-between items-center sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  <span className="text-sm text-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>

                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <p className="text-sm text-foreground">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                    <span className="font-medium">{endIndex}</span> of{" "}
                    <span className="font-medium">{filteredReviews.length}</span> results
                  </p>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-muted-foreground ring-1 ring-inset ring-border hover:bg-muted focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          currentPage === page
                            ? "z-10 bg-primary text-primary-foreground"
                            : "text-foreground ring-1 ring-inset ring-border hover:bg-muted"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-muted-foreground ring-1 ring-inset ring-border hover:bg-muted focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {selectedPhoto && (
        <PhotoModal
          selectedPhoto={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

      {rejectionModal && (
        <RejectionModal
          modal={rejectionModal}
          rejectionReason={rejectionReason}
          onReasonChange={setRejectionReason}
          onClose={() => {
            setRejectionModal(null);
            setRejectionReason("");
          }}
          onSubmit={async () => {
            if (rejectionReason.trim()) {
              await updateReviewStatus(rejectionModal.reviewId, false, rejectionReason.trim());
              setRejectionModal(null);
              setRejectionReason("");
            } else {
              toast.warning("Rejection Reason Required", "Please provide a reason for rejection.");
            }
          }}
        />
      )}

      {unApprovalModal && (
        <UnApprovalModal
          modal={unApprovalModal}
          rejectionReason={rejectionReason}
          onReasonChange={setRejectionReason}
          onClose={() => {
            setUnApprovalModal(null);
            setRejectionReason("");
          }}
          onSubmit={async () => {
            await updateReviewStatus(
              unApprovalModal.reviewId,
              false,
              rejectionReason.trim() || "Review un-approved by admin"
            );
            setUnApprovalModal(null);
            setRejectionReason("");
          }}
        />
      )}
    </div>
  );
}
