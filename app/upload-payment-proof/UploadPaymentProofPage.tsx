"use client";

import React, { Suspense } from "react";
import Image from "next/image";
import {
  Upload,
  FileImage,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Check,
  Camera,
  Zap,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import { usePaymentProofUpload } from "../hooks/usePaymentProofUpload";
import OCRResultDisplay from "../components/payment/OCRResultDisplay";
import PaymentHistoryList from "../components/payment/PaymentHistoryList";
import PaymentMethodSelector from "../components/payment/PaymentMethodSelector";
import UploadInstructions from "../components/payment/UploadInstructions";
import BookingDetailsSummary from "../components/payment/BookingDetailsSummary";
import UploadPaymentHeader from "../components/payment/UploadPaymentHeader";
import PaymentProgressStepper from "../components/payment/PaymentProgressStepper";
import PaymentUploadFooterInfo from "../components/payment/PaymentUploadFooterInfo";

function UploadPaymentProofContent() {
  const {
    user,
    booking,
    proofImage,
    previewUrl,
    paymentMethod,
    referenceNumber,
    amount,
    isUploading,
    uploadSuccess,
    error,
    isLoading,
    isResubmission,
    ocrResult,
    ocrProgress,
    showOCREditor,
    copyToast,
    showBookingDetails,
    paymentHistory,
    paymentSummary,
    showPaymentHistory,
    isManualAmountSet,
    paymentValidation,
    confirmUnusualAmount,
    confirmUnrecognizedImage,
    pendingAmount,
    remainingAmount,
    setPaymentMethod,
    setReferenceNumber,
    setAmount,
    setShowOCREditor,
    setOcrResult,
    setIsManualAmountSet,
    setShowBookingDetails,
    setShowPaymentHistory,
    setConfirmUnusualAmount,
    setConfirmUnrecognizedImage,
    handleCopyNumber,
    handleImageChange,
    handleSubmit,
    goToBookings,
  } = usePaymentProofUpload();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Please log in to continue</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card p-8 rounded-lg shadow-md text-center max-w-md border border-border">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Access Error
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-muted-foreground text-sm mb-6">
            Please select a booking from your bookings page to upload payment
            proof.
          </p>
          <button
            onClick={goToBookings}
            className="bg-gradient-to-r from-primary to-blue-500 text-foreground px-6 py-2 rounded-lg hover:from-primary/90 hover:to-primary transition-colors flex items-center gap-2 mx-auto"
          >
            <CreditCard className="w-4 h-4" /> Go to My Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <UploadPaymentHeader bookingId={booking?.id} onBack={goToBookings} />

      {copyToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-green-600 text-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">{copyToast}</span>
          </div>
        </div>
      )}

      <div className="px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6 max-w-6xl mx-auto">
        <PaymentProgressStepper
          hasProofImage={Boolean(proofImage)}
          uploadSuccess={uploadSuccess}
        />

        {booking && (
          <div className="bg-primary/8 border border-primary/30 rounded-xl p-4 sm:p-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-1">
                {remainingAmount <= 0
                  ? "Fully Paid"
                  : paymentSummary.totalPaid > 0
                    ? "Remaining Balance"
                    : booking.payment_type === "half"
                      ? "50% Down Payment Required"
                      : "Total Amount to Pay"}
              </p>
              <div className="text-4xl sm:text-5xl font-bold text-foreground mb-2">
                ₱{remainingAmount.toLocaleString()}
              </div>
              {paymentSummary.totalPaid > 0 && (
                <p className="text-green-400 text-sm flex items-center justify-center gap-1">
                  <Check className="w-4 h-4" /> ₱
                  {paymentSummary.totalPaid.toLocaleString()} already paid
                </p>
              )}
              {paymentSummary.totalPaid > 0 && remainingAmount > 0 && (
                <p className="text-muted-foreground text-xs">
                  Total booking: ₱
                  {(
                    booking.payment_amount || booking.total_amount
                  ).toLocaleString()}
                </p>
              )}
              {pendingAmount > 0 && remainingAmount > 0 && (
                <p className="text-amber-400 text-xs mt-1">
                  ₱{pendingAmount.toLocaleString()} under review — you can still
                  submit a new proof
                </p>
              )}
            </div>
          </div>
        )}

        <UploadInstructions handleCopyNumber={handleCopyNumber} />

        <PaymentHistoryList
          booking={booking}
          paymentHistory={paymentHistory}
          paymentSummary={paymentSummary}
          showPaymentHistory={showPaymentHistory}
          setShowPaymentHistory={setShowPaymentHistory}
          remainingAmount={remainingAmount}
        />

        {booking && (
          <BookingDetailsSummary
            booking={booking}
            showBookingDetails={showBookingDetails}
            setShowBookingDetails={setShowBookingDetails}
            paymentSummary={paymentSummary}
            remainingAmount={remainingAmount}
          />
        )}

        <div className="bg-card rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-green-600/30">
                <Upload className="w-4 h-4 text-green-500" />
              </div>
              {isResubmission ? "Resubmit Payment Proof" : "Upload Screenshot"}
            </h2>
            <span className="bg-primary/30 text-primary/80 text-xs px-2 py-1 rounded-full">
              Step 2
            </span>
          </div>

          {isResubmission && (
            <div className="mb-4 p-3 bg-orange-900/30 border border-orange-600/50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <p className="text-orange-200 text-sm">
                  <strong>Resubmission:</strong> Please address the rejection
                  reason above when uploading your new payment proof.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Payment Screenshot/Receipt{" "}
                <span className="text-red-400">*</span>
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors bg-muted/50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="proof-upload"
                />
                <label htmlFor="proof-upload" className="cursor-pointer">
                  {previewUrl ? (
                    <div className="space-y-2">
                      <Image
                        src={previewUrl}
                        alt="Payment proof preview"
                        width={200}
                        height={150}
                        className="mx-auto rounded-lg shadow-md max-h-40 object-contain border border-border"
                      />
                      <p className="text-sm text-green-400 font-medium flex items-center justify-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Image uploaded -
                        Click to change
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FileImage className="w-12 h-12 text-muted-foreground mx-auto" />
                      <div>
                        <Upload className="w-6 h-6 text-primary mx-auto mb-2" />
                        <p className="text-muted-foreground flex items-center justify-center gap-1">
                          <Camera className="w-4 h-4" /> Click to upload payment
                          screenshot
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG, GIF up to 5MB
                        </p>
                        <p className="text-xs text-primary mt-1 flex items-center justify-center gap-1">
                          <Zap className="w-3 h-3" /> Smart auto-fill enabled
                        </p>
                      </div>
                    </div>
                  )}
                </label>
              </div>
              {!previewUrl && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" /> Clear screenshots help AI
                  detect payment details
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-600/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            )}

            <OCRResultDisplay
              ocrProgress={ocrProgress}
              ocrResult={ocrResult}
              proofImage={proofImage}
              showOCREditor={showOCREditor}
              setShowOCREditor={setShowOCREditor}
              setOcrResult={setOcrResult}
              setReferenceNumber={setReferenceNumber}
              setAmount={setAmount}
              setIsManualAmountSet={setIsManualAmountSet}
            />

            <PaymentMethodSelector
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              referenceNumber={referenceNumber}
              setReferenceNumber={setReferenceNumber}
              amount={amount}
              setAmount={setAmount}
              ocrResult={ocrResult}
              setIsManualAmountSet={setIsManualAmountSet}
              paymentValidation={paymentValidation}
              remainingAmount={remainingAmount}
              confirmUnusualAmount={confirmUnusualAmount}
              setConfirmUnusualAmount={setConfirmUnusualAmount}
              paymentSummary={paymentSummary}
              booking={booking}
            />

            {ocrResult &&
              ocrProgress.stage === "complete" &&
              !ocrResult.amount &&
              !ocrResult.referenceNumber &&
              ocrResult.method === "unknown" && (
                <div className="p-3 bg-amber-900/30 border border-amber-600/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-amber-200 text-sm font-medium">
                        No payment details detected
                      </p>
                      <p className="text-amber-300/80 text-xs mt-1">
                        The uploaded image doesn&apos;t appear to be a payment
                        receipt. Please upload a clear screenshot of your GCash
                        or Maya confirmation.
                      </p>
                      <div className="pt-2 mt-2 border-t border-amber-700/50">
                        <label
                          htmlFor="confirm-unrecognized-image"
                          className="flex items-center gap-3 cursor-pointer group py-1"
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              confirmUnrecognizedImage
                                ? "bg-amber-500 border-amber-500"
                                : "border-border group-hover:border-amber-400"
                            }`}
                          >
                            {confirmUnrecognizedImage && (
                              <Check className="w-3 h-3 text-foreground" />
                            )}
                          </div>
                          <input
                            type="checkbox"
                            id="confirm-unrecognized-image"
                            checked={confirmUnrecognizedImage}
                            onChange={(e) =>
                              setConfirmUnrecognizedImage(e.target.checked)
                            }
                            className="sr-only"
                          />
                          <span
                            className={`text-sm transition-colors ${
                              confirmUnrecognizedImage
                                ? "text-amber-200"
                                : "text-muted-foreground group-hover:text-muted-foreground"
                            }`}
                          >
                            I confirm this is a valid payment receipt
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            <button
              type="submit"
              disabled={
                isUploading ||
                !proofImage ||
                uploadSuccess ||
                remainingAmount <= 0 ||
                !paymentValidation.allowSubmission ||
                (paymentValidation.level === "warning" &&
                  !confirmUnusualAmount) ||
                !!(
                  ocrResult &&
                  ocrProgress.stage === "complete" &&
                  !ocrResult.amount &&
                  !ocrResult.referenceNumber &&
                  ocrResult.method === "unknown" &&
                  !confirmUnrecognizedImage
                )
              }
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg transform ${
                !paymentValidation.allowSubmission ||
                (paymentValidation.level === "warning" &&
                  !confirmUnusualAmount) ||
                !!(
                  ocrResult &&
                  ocrProgress.stage === "complete" &&
                  !ocrResult.amount &&
                  !ocrResult.referenceNumber &&
                  ocrResult.method === "unknown" &&
                  !confirmUnrecognizedImage
                )
                  ? "bg-muted text-muted-foreground cursor-not-allowed scale-100"
                  : "bg-gradient-to-r from-primary to-blue-500 text-foreground hover:from-primary/90 hover:to-primary hover:scale-105 active:scale-95"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : uploadSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Uploaded Successfully!
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Submit Payment Proof
                </>
              )}
            </button>

            {!proofImage ? (
              <p className="text-xs text-muted-foreground text-center">
                Please upload an image before submitting
              </p>
            ) : !paymentValidation.allowSubmission ? (
              <p className="text-xs text-red-400 text-center">
                Please correct the amount before submitting
              </p>
            ) : paymentValidation.level === "warning" &&
              !confirmUnusualAmount ? (
              <p className="text-xs text-yellow-400 text-center">
                Please confirm the amount is correct before submitting
              </p>
            ) : (
              <p className="text-xs text-muted-foreground text-center">
                Ready to submit your payment proof
              </p>
            )}
          </form>
        </div>

        <PaymentUploadFooterInfo />
      </div>
    </div>
  );
}

export default function UploadPaymentProof() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-foreground text-xl font-semibold">
              Loading payment page...
            </div>
          </div>
        </div>
      }
    >
      <UploadPaymentProofContent />
    </Suspense>
  );
}
