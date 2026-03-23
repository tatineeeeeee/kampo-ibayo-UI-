"use client";

import Image from "next/image";
import type { PaymentProof } from "../../../lib/types";

interface PaymentProofViewerProps {
  selectedPaymentProof: PaymentProof;
  imageZoomed: boolean;
  onSetImageZoomed: (zoomed: boolean) => void;
}

export function PaymentProofViewer({
  selectedPaymentProof,
  imageZoomed,
  onSetImageZoomed,
}: PaymentProofViewerProps) {
  return (
    <>
      {/* Payment Proof Image */}
      <div className="bg-gradient-to-br from-card to-muted border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <h3 className="text-lg font-semibold text-foreground">
            Current Payment Proof
          </h3>
        </div>

        <div
          className="relative group cursor-pointer"
          onClick={() =>
            selectedPaymentProof?.proof_image_url &&
            onSetImageZoomed(true)
          }
        >
          {/* Image Container */}
          <div className="relative overflow-hidden rounded-xl bg-muted border-2 border-dashed border-border transition-all duration-300 group-hover:border-info/20 group-hover:shadow-md">
            {selectedPaymentProof?.proof_image_url ? (
              <Image
                src={selectedPaymentProof.proof_image_url}
                alt="Payment Proof"
                width={500}
                height={400}
                className="w-full h-auto max-h-80 object-contain pointer-events-none transition-all duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-80 flex items-center justify-center bg-muted">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 text-muted-foreground">
                    <svg
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No image available
                  </p>
                </div>
              </div>
            )}

            {/* Overlay with zoom hint */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
              <div className="bg-card/90 backdrop-blur-sm rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100 shadow-lg">
                <svg
                  className="w-6 h-6 text-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Action hint */}
          <p className="text-xs text-muted-foreground mt-2 text-center font-medium">
            Click to view full size
          </p>
        </div>
      </div>

      {/* Full Screen Image Modal */}
      {imageZoomed && selectedPaymentProof?.proof_image_url && (
        <div className="fixed inset-0 bg-black z-[70] flex items-center justify-center">
          {/* Backdrop - Click to close */}
          <div
            className="absolute inset-0 bg-black cursor-pointer"
            onClick={() => onSetImageZoomed(false)}
          />

          {/* Image Container */}
          <div className="relative z-10 w-full h-full flex items-center justify-center p-8">
            {selectedPaymentProof?.proof_image_url ? (
              <Image
                src={selectedPaymentProof.proof_image_url}
                alt="Payment Proof - Full View"
                width={1920}
                height={1080}
                className="max-w-full max-h-full object-contain cursor-pointer"
                onClick={() => onSetImageZoomed(false)}
                priority
              />
            ) : (
              <div className="bg-card rounded-lg p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground">
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-white text-lg">No image available</p>
                <p className="text-muted-foreground text-sm mt-2">
                  The payment proof image could not be loaded
                </p>
                <button
                  onClick={() => onSetImageZoomed(false)}
                  className="mt-4 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={() => onSetImageZoomed(false)}
            className="absolute top-4 right-4 z-20 bg-black/70 hover:bg-black/90 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold transition-colors duration-200"
            aria-label="Close"
          >
            ×
          </button>

          {/* Instructions */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-black/70 text-white text-sm px-4 py-2 rounded">
            Press ESC or click anywhere to close
          </div>
        </div>
      )}
    </>
  );
}
