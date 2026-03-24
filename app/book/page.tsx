"use client";

import { FaCalendarAlt, FaExclamationTriangle } from "react-icons/fa";
import { useBookingForm } from "../hooks/useBookingForm";
import BookingFormFields from "../components/booking/BookingFormFields";
import BookingCalendar from "../components/booking/BookingCalendar";
import PriceBreakdown from "../components/booking/PriceBreakdown";
import PaymentTypeSelector from "../components/booking/PaymentTypeSelector";
import BookingTopBar from "../components/booking/BookingTopBar";
import BookingSubmitSection from "../components/booking/BookingSubmitSection";

function BookingPage() {
  const {
    user,
    loading,
    formData,
    setFormData,
    minDate,
    maxBookingDate,
    existingBookings,
    canCreateBooking,
    limitMessage,
    estimatedPrice,
    isSubmitting,
    isPageLoading,
    paymentType,
    setPaymentType,
    pricingBreakdown,
    handleChange,
    handleSubmit,
  } = useBookingForm();

  if (loading || isPageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg text-muted-foreground">
            {loading ? "Loading..." : "Preparing booking form..."}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <BookingTopBar loading={loading} isSignedIn={Boolean(user)} />

      <main className="min-h-screen bg-background">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="mb-4">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Book Your Escape
            </h1>
            <p className="text-muted-foreground mt-1">
              Experience luxury and comfort at Kampo Ibayo Resort
            </p>
          </div>

          {!canCreateBooking && (
            <div className="mb-5 p-4 bg-destructive/10 border border-destructive/40 rounded-xl">
              <div className="flex items-center gap-2">
                <FaExclamationTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-destructive text-sm font-medium">
                  {limitMessage}
                </p>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start"
          >
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border p-4 sm:p-5">
                <BookingFormFields
                  formData={formData}
                  setFormData={setFormData}
                  handleChange={handleChange}
                />
              </div>
              <div className="bg-card rounded-2xl border border-border p-4 sm:p-5">
                <PaymentTypeSelector
                  paymentType={paymentType}
                  setPaymentType={setPaymentType}
                  estimatedPrice={estimatedPrice}
                />
              </div>
            </div>

            <div className="space-y-3 md:sticky md:top-20">
              <div className="bg-card rounded-2xl border border-border p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FaCalendarAlt className="w-4 h-4 text-primary flex-shrink-0" />
                  <h2 className="text-lg font-bold text-foreground">
                    Select Your Dates
                  </h2>
                </div>
                <BookingCalendar
                  formData={formData}
                  setFormData={setFormData}
                  minDate={minDate}
                  maxBookingDate={maxBookingDate}
                  existingBookings={existingBookings}
                  pricingBreakdown={pricingBreakdown}
                />
              </div>

              <PriceBreakdown
                formData={formData}
                estimatedPrice={estimatedPrice}
                pricingBreakdown={pricingBreakdown}
                paymentType={paymentType}
              />

              <BookingSubmitSection
                canCreateBooking={canCreateBooking}
                isSubmitting={isSubmitting}
                estimatedPrice={estimatedPrice}
                paymentType={paymentType}
              />
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

export default BookingPage;
