"use client";

import { Suspense } from "react";
import { useMyBookings } from "../hooks/useMyBookings";
import { SearchParamsHandler } from "../components/bookings/SearchParamsHandler";
import { BookingsHeader } from "../components/bookings/BookingsHeader";
import { BookingStatsPanel } from "../components/bookings/BookingStatsPanel";
import { EmptyBookingsState } from "../components/bookings/EmptyBookingsState";
import { PaymentProcessInfo } from "../components/bookings/PaymentProcessInfo";
import { BookingCard } from "../components/bookings/BookingCard";
import { BookingsPagination } from "../components/bookings/BookingsPagination";
import { CancelBookingModal } from "../components/bookings/CancelBookingModal";
import { RescheduleBookingModal } from "../components/bookings/RescheduleBookingModal";
import { BookingDetailModal } from "../components/bookings/BookingDetailModal";

function BookingsPageContent() {
  const {
    bookings,
    user,
    authLoading,
    loading,
    selectedBooking,
    setSelectedBooking,
    showModal,
    showCancelModal,
    cancellationReason,
    bookingStats,
    maintenanceActive,
    bookingsWithPendingProofs,
    showRescheduleModal,
    newCheckInDate,
    newCheckOutDate,
    rescheduleLoading,
    showCalendar,
    currentPage,
    paginatedBookings,
    refreshTrigger,
    setRefreshTrigger,
    isRefreshing,
    handlePaymentUploaded,
    openModal,
    closeModal,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    goToPreviousPage,
    goToNextPage,
    canCancelBooking,
    canRescheduleBooking,
    getCancellationMessage,
    setShowCancelModal,
    setCancellationReason,
    handleCancelBooking,
    handleOpenReschedule,
    setShowCalendar,
    setNewCheckInDate,
    setNewCheckOutDate,
    handleCalendarDateSelect,
    handleRescheduleBooking,
    getStatusIcon,
    getStatusColor,
    getStatusDisplayName,
  } = useMyBookings();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-foreground text-xl font-semibold mb-2">
            Loading your bookings...
          </div>
          <div className="text-muted-foreground text-sm">
            {authLoading ? "Authenticating..." : "Fetching booking data..."}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <SearchParamsHandler onPaymentUploaded={handlePaymentUploaded} />
      </Suspense>

      <BookingsHeader
        maintenanceActive={maintenanceActive}
        isRefreshing={isRefreshing}
        onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
      />

      <div className="px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
        {bookingStats && <BookingStatsPanel bookingStats={bookingStats} />}

        {bookings.length === 0 ? (
          <EmptyBookingsState maintenanceActive={maintenanceActive} />
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {bookings.some((b) => b.status === "pending") && <PaymentProcessInfo />}

            <div className="bg-card rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 lg:mb-6 gap-2">
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-foreground">
                  Your Reservations ({bookings.length})
                </h2>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {bookings.length > 6 ? (
                    <>
                      Showing {startIndex + 1} to {endIndex} of {bookings.length}
                    </>
                  ) : (
                    <>Showing all bookings</>
                  )}
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {paginatedBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    user={user}
                    refreshTrigger={refreshTrigger}
                    bookingsWithPendingProofs={bookingsWithPendingProofs}
                    onViewDetails={openModal}
                    onCancel={(b) => {
                      setSelectedBooking(b);
                      setShowCancelModal(true);
                    }}
                    onReschedule={handleOpenReschedule}
                    canCancelBooking={canCancelBooking}
                    canRescheduleBooking={canRescheduleBooking}
                    getCancellationMessage={getCancellationMessage}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                    getStatusDisplayName={getStatusDisplayName}
                  />
                ))}
              </div>

              {bookings.length > 6 && (
                <BookingsPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onGoToPage={goToPage}
                  onPreviousPage={goToPreviousPage}
                  onNextPage={goToNextPage}
                />
              )}
            </div>
          </div>
        )}

        {/* Modals */}
        {showCancelModal && selectedBooking && (
          <CancelBookingModal
            booking={selectedBooking}
            cancellationReason={cancellationReason}
            onReasonChange={setCancellationReason}
            onClose={() => {
              setShowCancelModal(false);
              setCancellationReason("");
            }}
            onConfirm={handleCancelBooking}
          />
        )}

        {showRescheduleModal && selectedBooking && (
          <RescheduleBookingModal
            booking={selectedBooking}
            newCheckInDate={newCheckInDate}
            newCheckOutDate={newCheckOutDate}
            rescheduleLoading={rescheduleLoading}
            showCalendar={showCalendar}
            onCheckInChange={setNewCheckInDate}
            onCheckOutChange={setNewCheckOutDate}
            onCalendarToggle={setShowCalendar}
            onCalendarDateSelect={handleCalendarDateSelect}
            onConfirm={handleRescheduleBooking}
            onClose={closeModal}
          />
        )}

        {showModal && selectedBooking && !showCancelModal && (
          <BookingDetailModal
            booking={selectedBooking}
            showCancelSection={showCancelModal}
            canCancelBooking={canCancelBooking}
            getCancellationMessage={getCancellationMessage}
            cancellationReason={cancellationReason}
            onCancellationReasonChange={setCancellationReason}
            onCancelBooking={handleCancelBooking}
            onShowCancelSection={setShowCancelModal}
            onClose={closeModal}
            getStatusIcon={getStatusIcon}
            getStatusColor={getStatusColor}
            getStatusDisplayName={getStatusDisplayName}
          />
        )}
      </div>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-foreground text-xl font-semibold">Loading...</div>
          </div>
        </div>
      }
    >
      <BookingsPageContent />
    </Suspense>
  );
}
