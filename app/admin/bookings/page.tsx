"use client";

import { Footprints } from "lucide-react";
import { useToastHelpers } from "../../components/Toast";
import { formatBookingNumber } from "../../utils/bookingNumber";
import { displayPhoneNumber } from "../../utils/phoneUtils";
import { supabase } from "../../supabaseClient";
import { SmartWorkflowStatusCell } from "../../components/admin/bookings/WorkflowStatus";
import { PaymentStatusCell } from "../../components/admin/bookings/PaymentStatusCell";
import { AdminPaymentBreakdown } from "../../components/admin/bookings/AdminPaymentBreakdown";
import { SmartConfirmButton } from "../../components/admin/bookings/SmartConfirmButton";
import { PaymentProofButton } from "../../components/admin/bookings/PaymentProofButton";
import { AdminDashboardSummary } from "../../components/admin/bookings/AdminDashboardSummary";
import { BookingDetailModal } from "../../components/admin/bookings/BookingDetailModal";
import { PaymentProofModal } from "../../components/admin/bookings/PaymentProofModal";
import { BookingFilters } from "../../components/admin/bookings/BookingFilters";
import { BookingPagination } from "../../components/admin/bookings/BookingPagination";
import { useBookingManagement } from "../../hooks/useBookingManagement";
import { useBookingModals } from "../../hooks/useBookingModals";
import { useBookingActions } from "../../hooks/useBookingActions";

export default function BookingsPage() {
  const { success, error: showError } = useToastHelpers();

  const management = useBookingManagement();
  const modals = useBookingModals();
  const actions = useBookingActions(management, modals);

  const {
    bookings,
    filteredBookings,
    paginatedBookings,
    loading,
    refreshing,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    showDeletedUsers,
    setShowDeletedUsers,
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToPreviousPage,
    goToNextPage,
    newBookingAlert,
    refreshTrigger,
    setRefreshTrigger,
    lastRealTimeEvent,
    realTimeStatus,
    isManualRefreshing,
    handleManualRefresh,
    fetchBookings,
    fetchPaymentHistory,
    paymentHistory,
    paymentHistoryLoading,
    showPaymentHistory,
    setShowPaymentHistory,
    paymentSummary,
    setPaymentSummary,
    setPaymentHistory,
  } = management;

  const {
    selectedBooking,
    setSelectedBooking,
    showModal,
    setShowModal,
    showCancelModal,
    setShowCancelModal,
    adminCancellationReason,
    setAdminCancellationReason,
    showConfirmCancel,
    setShowConfirmCancel,
    shouldRefund,
    setShouldRefund,
    isProcessing,
    showRescheduleModal,
    setShowRescheduleModal,
    rescheduleCheckIn,
    setRescheduleCheckIn,
    rescheduleCheckOut,
    setRescheduleCheckOut,
    rescheduleReason,
    setRescheduleReason,
    rescheduleLoading,
    showPaymentProofModal,
    setShowPaymentProofModal,
    selectedPaymentProof,
    setSelectedPaymentProof,
    paymentProofLoading,
    imageZoomed,
    setImageZoomed,
    verificationNotes,
    setVerificationNotes,
    rejectionReason,
    setRejectionReason,
    customRejectionReason,
    setCustomRejectionReason,
    rejectionReasons,
    openModal: openModalFn,
    closeModal: closeModalFn,
    closePaymentProofModal: closePaymentProofModalFn,
    handleViewPaymentProof,
  } = modals;

  const {
    updateBookingStatus,
    handleAdminCancelBooking,
    handleAdminReschedule,
    handlePaymentProofAction,
    formatDate,
    getStatusColor,
  } = actions;

  // Wrappers that wire the hooks together
  const openModal = (booking: typeof selectedBooking & {}) =>
    openModalFn(booking, fetchPaymentHistory);

  const closeModal = () =>
    closeModalFn(setPaymentSummary, setPaymentHistory);

  const closePaymentProofModal = () =>
    closePaymentProofModalFn(setPaymentHistory, setPaymentSummary, setShowPaymentHistory);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-muted-foreground">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Real-time Booking Alerts */}
      {newBookingAlert && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-pulse text-white ${
            newBookingAlert.includes("cancelled")
              ? "bg-destructive/100"
              : "bg-success"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {newBookingAlert.includes("cancelled") ? "\u{1F494}" : "\u{1F389}"}
            </span>
            <span className="font-semibold">{newBookingAlert}</span>
          </div>
        </div>
      )}

      <AdminDashboardSummary />

      {/* Real-time Status Bar */}
      <div className="bg-card rounded-xl shadow-md mb-4 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Real-time Connection Status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  realTimeStatus === "active"
                    ? "bg-success"
                    : realTimeStatus === "degraded"
                      ? "bg-warning"
                      : "bg-destructive/100"
                } ${realTimeStatus === "active" ? "animate-pulse" : ""}`}
              ></div>
              <span className="text-sm font-medium text-foreground">
                {realTimeStatus === "active"
                  ? "Real-time Active"
                  : realTimeStatus === "degraded"
                    ? "Sync Mode"
                    : realTimeStatus === "connecting"
                      ? "Connecting..."
                      : "Offline Mode"}
              </span>
            </div>

            {/* Last Update Indicator */}
            <div className="text-xs text-muted-foreground">
              {lastRealTimeEvent ? (
                <>
                  Last update:{" "}
                  {new Date(lastRealTimeEvent).toLocaleTimeString()}
                </>
              ) : (
                <>Awaiting updates...</>
              )}
            </div>

            {/* Smart Polling Indicator */}
            {realTimeStatus === "degraded" && (
              <div className="flex items-center gap-1 text-xs text-warning">
                <svg
                  className="w-3 h-3 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Auto-sync active</span>
              </div>
            )}
          </div>

          {/* Manual Refresh Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={isManualRefreshing}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-primary/10 text-primary border border-info/20 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                className={`w-4 h-4 ${
                  isManualRefreshing ? "animate-spin" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {isManualRefreshing ? "Refreshing..." : "Refresh"}
            </button>

            {/* System Status Info */}
            <div className="text-xs text-muted-foreground">
              {filteredBookings.length} booking
              {filteredBookings.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Performance Metrics and Real-time Activity Log */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-2 pt-2 border-t border-border">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                Subscriptions:{" "}
                {realTimeStatus === "active" ? "\u2705 Active" : "\u274C Inactive"}
              </span>
              <span>
                Polling:{" "}
                {realTimeStatus === "degraded" ? "\u26A0\uFE0F Enabled" : "\u23F8\uFE0F Standby"}
              </span>
              <span>
                Events:{" "}
                {lastRealTimeEvent
                  ? `\uD83D\uDFE2 ${new Date(lastRealTimeEvent).toLocaleTimeString()}`
                  : "\uD83D\uDD34 None"}
              </span>
              <span>Refresh Trigger: #{refreshTrigger}</span>
              <button
                onClick={() => {
                  setRefreshTrigger((prev) => prev + 1);
                }}
                className="text-primary hover:text-primary underline"
              >
                Force Refresh
              </button>
            </div>
          </div>
        )}

        {/* Real-time Activity Indicator */}
        {refreshTrigger > 0 && (
          <div className="mt-2 pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-success">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span>
                Real-time update #{refreshTrigger} - Payment proof components
                refreshed at {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl shadow-md p-3 sm:p-4">
        <BookingFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          showDeletedUsers={showDeletedUsers}
          bookings={bookings}
          filteredBookings={filteredBookings}
          refreshing={refreshing}
          onSearchTermChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
          onShowDeletedUsersChange={setShowDeletedUsers}
          onRefresh={() => fetchBookings(true)}
          onSuccess={success}
          onError={showError}
        />

        {/* Pagination Info */}
        {filteredBookings.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mb-3 sm:mb-4 text-xs sm:text-sm text-foreground font-medium">
            <div>
              Showing {startIndex + 1} to {endIndex} of{" "}
              {filteredBookings.length} bookings
            </div>
            <div>
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}

        {filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No bookings found</p>
            {!showDeletedUsers && bookings.length > 0 && (
              <p className="text-sm mt-2">
                All bookings are from deleted users. Check &quot;Show deleted
                user bookings&quot; to see them.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-3">
              {paginatedBookings.map((booking) => (
                <div
                  key={`mobile-${booking.id}`}
                  className={`bg-card border rounded-lg p-4 shadow-sm ${
                    !booking.user_exists
                      ? "border-destructive/20 bg-destructive/10"
                      : "border-border"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-primary text-xs">
                          {formatBookingNumber(booking.id)}
                        </span>
                        {booking.special_requests?.startsWith("[WALK-IN]") && (
                          <span className="px-1.5 py-0.5 bg-info/10 text-info text-[9px] font-bold rounded-full inline-flex items-center gap-0.5">
                            <Footprints className="w-2.5 h-2.5" /> Walk-in
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-foreground mt-1">
                        {booking.guest_name}
                      </h4>
                      {!booking.user_exists && (
                        <span className="px-2 py-0.5 bg-destructive/100 text-white text-[10px] rounded">
                          User Deleted
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <SmartWorkflowStatusCell
                        booking={booking}
                        refreshKey={refreshTrigger}
                      />
                      <PaymentStatusCell
                        booking={booking}
                        refreshKey={refreshTrigger}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground text-xs">Check-in</p>
                      <p className="text-foreground">
                        {formatDate(booking.check_in_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Check-out</p>
                      <p className="text-foreground">
                        {formatDate(booking.check_out_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Guests</p>
                      <p className="text-foreground">
                        {booking.number_of_guests}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Amount</p>
                      <p className="text-success font-semibold">
                        &#8369;{booking.total_amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {booking.payment_status === "paid" || booking.payment_status === "verified"
                          ? "Paid"
                          : booking.payment_status === "payment_review"
                            ? "Under Review"
                            : booking.payment_type === "half"
                              ? "50% Down"
                              : "Pending"}
                      </p>
                    </div>
                  </div>

                  {booking.guest_email && (
                    <p className="text-xs text-muted-foreground mb-2 truncate">
                      {"\u{1F4E7}"}{" "}
                      <a
                        href={`mailto:${booking.guest_email}`}
                        className="text-primary"
                      >
                        {booking.guest_email}
                      </a>
                    </p>
                  )}
                  {booking.guest_phone && (
                    <p className="text-xs text-muted-foreground mb-3">
                      {"\u{1F4F1}"}{" "}
                      <a
                        href={`tel:${booking.guest_phone}`}
                        className="text-primary"
                      >
                        {displayPhoneNumber(booking.guest_phone)}
                      </a>
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openModal(booking)}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-xs hover:bg-primary/90 text-center"
                    >
                      View Details
                    </button>
                    <PaymentProofButton
                      bookingId={booking.id}
                      booking={booking}
                      variant="modal"
                      onViewProof={async (proof) => {
                        setSelectedPaymentProof(proof);
                        setShowPaymentProofModal(true);
                        if (proof.id > 0) {
                          await fetchPaymentHistory(booking.id);
                        }
                      }}
                      refreshKey={refreshTrigger}
                    />
                    {(booking.status || "pending") === "pending" && (
                      <>
                        <SmartConfirmButton
                          booking={booking}
                          onConfirm={(bookingId) =>
                            updateBookingStatus(bookingId, "confirmed")
                          }
                          variant="modal"
                          refreshKey={refreshTrigger}
                        />
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowModal(true);
                            setShowCancelModal(true);
                          }}
                          className="px-3 py-2 bg-destructive text-white rounded-md text-xs hover:bg-destructive/90 text-center"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-muted text-left text-muted-foreground text-sm">
                    <th className="p-2 w-20 text-center">#</th>
                    <th className="p-3 min-w-[160px]">Guest</th>
                    <th className="p-3 min-w-[180px]">Email</th>
                    <th className="p-3 min-w-[120px]">Contact</th>
                    <th className="p-3 min-w-[90px]">Check-in</th>
                    <th className="p-3 min-w-[90px]">Check-out</th>
                    <th className="p-3 w-16 text-center">Guests</th>
                    <th className="p-3 min-w-[100px]">Amount</th>
                    <th className="p-3 min-w-[120px]">Status</th>
                    <th className="p-3 min-w-[110px]">Payment</th>
                    <th className="p-3 min-w-[140px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className={`border-t hover:bg-muted ${
                        !booking.user_exists ? "bg-destructive/10" : ""
                      }`}
                    >
                      <td className="p-2 text-center">
                        <div className="font-mono font-bold text-primary text-xs whitespace-nowrap">
                          {formatBookingNumber(booking.id)}
                          {booking.special_requests?.startsWith(
                            "[WALK-IN]",
                          ) && (
                            <span className="ml-1 px-1.5 py-0.5 bg-info/10 text-info text-[9px] font-bold rounded-full inline-flex items-center gap-0.5">
                              <Footprints className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-foreground">
                        <div className="font-medium">
                          {booking.guest_name}
                          {!booking.user_exists && (
                            <span className="ml-2 px-2 py-1 bg-destructive/100 text-white text-xs rounded">
                              User Deleted
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-foreground text-sm">
                        {booking.guest_email ? (
                          <a
                            href={`mailto:${booking.guest_email}`}
                            className="text-primary hover:text-primary hover:underline"
                          >
                            {booking.guest_email}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">No email</span>
                        )}
                      </td>
                      <td className="p-3 text-foreground text-sm">
                        {booking.guest_phone ? (
                          <a
                            href={`tel:${booking.guest_phone}`}
                            className="text-primary hover:text-primary hover:underline"
                          >
                            {displayPhoneNumber(booking.guest_phone)}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">No phone</span>
                        )}
                      </td>
                      <td className="p-3 text-foreground text-sm">
                        {formatDate(booking.check_in_date)}
                      </td>
                      <td className="p-3 text-foreground text-sm">
                        {formatDate(booking.check_out_date)}
                      </td>
                      <td className="p-3 text-foreground text-center">
                        {booking.number_of_guests}
                      </td>
                      <td className="p-3 text-foreground">
                        <div className="font-medium text-sm">
                          &#8369;{booking.total_amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {booking.payment_status === "paid" || booking.payment_status === "verified"
                            ? booking.payment_type === "half" ? "50% Down" : "Paid"
                            : booking.payment_status === "payment_review"
                              ? "Under Review"
                              : booking.payment_type === "half"
                                ? "50% Down"
                                : "Pending"}
                        </div>
                        <AdminPaymentBreakdown bookingId={booking.id} totalAmount={booking.total_amount} paymentStatus={booking.payment_status || ""} paymentType={booking.payment_type ?? undefined} />
                      </td>
                      <td className="p-3">
                        <SmartWorkflowStatusCell
                          booking={booking}
                          refreshKey={refreshTrigger}
                        />
                      </td>
                      <td className="p-3">
                        <PaymentStatusCell
                          key={`payment-status-${
                            booking.id
                          }-${refreshTrigger}-${
                            booking.payment_status || "none"
                          }-${booking.status || "pending"}-${
                            booking.updated_at || "none"
                          }`}
                          booking={booking}
                          refreshKey={refreshTrigger}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          {/* Primary Actions Row */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => openModal(booking)}
                              className="h-6 px-2 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 flex items-center justify-center"
                              title="View booking details"
                            >
                              View
                            </button>

                            <PaymentProofButton
                              key={`proof-${booking.id}-${refreshTrigger}-${
                                booking.payment_status || "none"
                              }`}
                              bookingId={booking.id}
                              booking={booking}
                              onViewProof={async (proof) => {
                                setSelectedPaymentProof(proof);
                                setShowPaymentProofModal(true);
                                if (proof.id > 0) {
                                  // Only fetch history for real proofs, not dummy ones
                                  await fetchPaymentHistory(booking.id);

                                  // Fetch the correct payment proof using priority logic
                                  try {
                                    const { data: allProofs } = await supabase
                                      .from("payment_proofs")
                                      .select("*")
                                      .eq("booking_id", booking.id)
                                      .order("uploaded_at", {
                                        ascending: false,
                                      });

                                    if (allProofs && allProofs.length > 0) {
                                      // Priority: pending > verified > rejected > cancelled
                                      const pendingProof = allProofs.find(
                                        (p) => p.status === "pending",
                                      );
                                      const verifiedProof = allProofs.find(
                                        (p) => p.status === "verified",
                                      );
                                      const rejectedProof = allProofs.find(
                                        (p) => p.status === "rejected",
                                      );
                                      const cancelledProof = allProofs.find(
                                        (p) => p.status === "cancelled",
                                      );

                                      const prioritizedProof =
                                        pendingProof ||
                                        verifiedProof ||
                                        rejectedProof ||
                                        cancelledProof ||
                                        allProofs[0];
                                      setSelectedPaymentProof(prioritizedProof);
                                    }
                                  } catch (error) {
                                    // Silent fail
                                  }
                                }
                              }}
                              refreshKey={refreshTrigger}
                            />
                          </div>

                          {/* Secondary Actions Row - Only for pending bookings */}
                          {(booking.status || "pending") === "pending" && (
                            <div className="flex gap-1">
                              <SmartConfirmButton
                                booking={booking}
                                onConfirm={(bookingId) =>
                                  updateBookingStatus(bookingId, "confirmed")
                                }
                                refreshKey={refreshTrigger}
                              />
                              <button
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setShowModal(true);
                                  setShowCancelModal(true);
                                }}
                                className="h-6 px-2 py-1 bg-destructive text-white rounded text-xs hover:bg-destructive/90 flex items-center justify-center"
                                title="Cancel booking"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination Controls */}
        <BookingPagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredBookings.length}
          onGoToPage={goToPage}
          onGoToFirstPage={goToFirstPage}
          onGoToLastPage={goToLastPage}
          onGoToPreviousPage={goToPreviousPage}
          onGoToNextPage={goToNextPage}
        />
      </div>

      {/* Booking Detail Modal */}
      {showModal && selectedBooking && (
        <BookingDetailModal
          selectedBooking={selectedBooking}
          showCancelModal={showCancelModal}
          showRescheduleModal={showRescheduleModal}
          showConfirmCancel={showConfirmCancel}
          shouldRefund={shouldRefund}
          isProcessing={isProcessing}
          adminCancellationReason={adminCancellationReason}
          rescheduleCheckIn={rescheduleCheckIn}
          rescheduleCheckOut={rescheduleCheckOut}
          rescheduleReason={rescheduleReason}
          rescheduleLoading={rescheduleLoading}
          refreshTrigger={refreshTrigger}
          paymentSummary={paymentSummary}
          onClose={closeModal}
          onSetShowCancelModal={setShowCancelModal}
          onSetShowRescheduleModal={setShowRescheduleModal}
          onSetShowConfirmCancel={setShowConfirmCancel}
          onSetShouldRefund={setShouldRefund}
          onSetAdminCancellationReason={setAdminCancellationReason}
          onSetRescheduleCheckIn={setRescheduleCheckIn}
          onSetRescheduleCheckOut={setRescheduleCheckOut}
          onSetRescheduleReason={setRescheduleReason}
          onUpdateBookingStatus={updateBookingStatus}
          onAdminCancelBooking={handleAdminCancelBooking}
          onAdminReschedule={handleAdminReschedule}
          onViewPaymentProof={handleViewPaymentProof}
          fetchPaymentHistory={fetchPaymentHistory}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
        />
      )}

      {/* Payment Proof Modal */}
      {showPaymentProofModal && selectedPaymentProof && (
        <PaymentProofModal
          selectedPaymentProof={selectedPaymentProof}
          selectedBooking={selectedBooking}
          paymentHistory={paymentHistory}
          paymentHistoryLoading={paymentHistoryLoading}
          showPaymentHistory={showPaymentHistory}
          paymentSummary={paymentSummary}
          paymentProofLoading={paymentProofLoading}
          imageZoomed={imageZoomed}
          verificationNotes={verificationNotes}
          rejectionReason={rejectionReason}
          customRejectionReason={customRejectionReason}
          rejectionReasons={rejectionReasons}
          onClose={closePaymentProofModal}
          onSetShowPaymentHistory={setShowPaymentHistory}
          onSetImageZoomed={setImageZoomed}
          onSetVerificationNotes={setVerificationNotes}
          onSetRejectionReason={setRejectionReason}
          onSetCustomRejectionReason={setCustomRejectionReason}
          onPaymentProofAction={handlePaymentProofAction}
          onShowError={showError}
        />
      )}
    </div>
  );
}
