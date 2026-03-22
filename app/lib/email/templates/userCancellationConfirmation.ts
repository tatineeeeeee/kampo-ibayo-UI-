import type { CancellationEmailData, EmailTemplate } from '../emailClient';
import { escapeHtml } from '@/app/utils/escapeHtml';

// Professional User Cancellation Confirmation Email
export const createUserCancellationConfirmationEmail = (cancellationData: CancellationEmailData): EmailTemplate => {
  const { refundDetails } = cancellationData;
  const safe = {
    guestName: escapeHtml(String(cancellationData.guestName)),
    bookingId: escapeHtml(String(cancellationData.bookingId)),
    checkIn: escapeHtml(String(cancellationData.checkIn)),
    checkOut: escapeHtml(String(cancellationData.checkOut)),
    cancellationReason: cancellationData.cancellationReason ? escapeHtml(String(cancellationData.cancellationReason)) : '',
  };
  const hasRefund = refundDetails && refundDetails.refundAmount > 0;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cancellation Confirmation - Kampo Ibayo Resort</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #2d3748;
          max-width: 600px;
          margin: 0 auto;
          padding: 0;
          background: #f7fafc;
        }
        .container {
          background: white;
          margin: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }
        .header {
          background: linear-gradient(135deg, #2563eb, #1e3a8a);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .company-logo {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 10px;
          letter-spacing: 1px;
        }
        .cancellation-status {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          margin: 16px 0;
          display: inline-block;
        }
        .refund-section {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 24px;
          border-radius: 12px;
          margin: 24px 0;
          text-align: center;
        }
        .refund-amount {
          font-size: 36px;
          font-weight: 800;
          margin: 8px 0;
        }
        .payment-breakdown {
          background: #f0f9ff;
          border: 2px solid #3b82f6;
          border-radius: 12px;
          padding: 20px;
          margin: 16px 0;
        }
        .breakdown-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          padding: 8px 0;
        }
        .breakdown-total {
          border-top: 2px solid #3b82f6;
          font-weight: 700;
          font-size: 18px;
        }
        .booking-details {
          background: #f8fafc;
          padding: 24px;
          border-radius: 12px;
          margin: 24px 0;
          border: 1px solid #e2e8f0;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 16px 0;
        }
        .detail-card {
          background: white;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
        }
        .detail-label {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .detail-value {
          color: #1f2937;
          font-weight: 600;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-logo">KAMPO IBAYO RESORT</div>
          <div class="cancellation-status">RESERVATION CANCELLED</div>
          <h1 style="margin: 10px 0; font-size: 20px;">Cancellation Confirmation</h1>
          <p style="margin: 0; color: #93c5fd; font-size: 14px;">Reference Number: ${safe.bookingId}</p>
        </div>

        <div class="content-section">
          <p>Dear ${safe.guestName},</p>

          <p>This email confirms that your reservation has been successfully cancelled as requested. We have processed your cancellation in accordance with our cancellation policy.</p>

          ${cancellationData.cancellationReason ? `
          <div style="background: #edf2f7; border: 1px solid #cbd5e0; padding: 15px; margin: 20px 0;">
            <strong>Cancellation Reason:</strong><br>
            ${safe.cancellationReason}
          </div>
          ` : ''}


          <div class="cancellation-summary">
            <h3 class="section-title">Cancelled Reservation Details</h3>

            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">Confirmation Number</div>
                <div class="detail-value">${safe.bookingId}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Guest Name</div>
                <div class="detail-value">${safe.guestName}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Original Check-in</div>
                <div class="detail-value">${safe.checkIn}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Original Check-out</div>
                <div class="detail-value">${safe.checkOut}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Number of Guests</div>
                <div class="detail-value">${cancellationData.guests} Guest(s)</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Cancellation Date</div>
                <div class="detail-value">${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}</div>
              </div>
            </div>
          </div>

          ${hasRefund ? `
          <div class="refund-section">
            <h3 class="section-title">Refund Information</h3>

            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
              <tr style="background: #f7fafc;">
                <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Original Booking Amount:</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">₱${cancellationData.totalAmount.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Down Payment (Paid):</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">₱${refundDetails!.downPayment.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Balance (Pay on Arrival):</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">₱${(cancellationData.totalAmount - refundDetails!.downPayment).toLocaleString()}</td>
              </tr>
              <tr style="background: #f0fff4;">
                <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #2f855a;">Refund Amount (${refundDetails!.refundPercentage}%):</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #2f855a;">₱${refundDetails!.refundAmount.toLocaleString()}</td>
              </tr>
            </table>

            <p style="margin: 15px 0; color: #2f855a; font-weight: 600;">
              <strong>Processing Time:</strong> Your refund will be processed within ${refundDetails!.processingDays} to your original payment method.
            </p>
          </div>
          ` : `
          <div class="no-refund-section">
            <h3 class="section-title">Payment Information</h3>
            <p style="color: #c53030; font-weight: 600; margin: 0;">
              Based on our cancellation policy and the timing of your cancellation, no refund is applicable for this reservation.
            </p>
          </div>
          `}

        <div class="booking-details">
          <h3 style="color: #1f2937; margin: 0 0 16px 0;">📋 Cancelled Booking Details</h3>
          <div class="detail-grid">
            <div class="detail-card">
              <div class="detail-label">Booking ID</div>
              <div class="detail-value">#${safe.bookingId}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Guest Name</div>
              <div class="detail-value">${safe.guestName}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Check-in Date</div>
              <div class="detail-value">${safe.checkIn}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Check-out Date</div>
              <div class="detail-value">${safe.checkOut}</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Number of Guests</div>
              <div class="detail-value">${cancellationData.guests} guests</div>
            </div>
            <div class="detail-card">
              <div class="detail-label">Cancellation Date</div>
              <div class="detail-value">${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}</div>
            </div>
          </div>
        </div>

        <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <h4 style="color: #166534; margin: 0 0 12px 0;">🌟 We Hope to See You Again!</h4>
          <p style="color: #166534; margin: 0 0 16px 0;">
            While we're sorry to see this booking cancelled, we'd love to welcome you to Kampo Ibayo in the future.
          </p>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/book"
             style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 8px;">
            🏖️ Book Again
          </a>
        </div>

        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; margin: 0;"><strong>Kampo Ibayo Resort</strong></p>
          <p style="color: #9ca3af; font-size: 14px; margin: 4px 0 0 0;">Thank you for your understanding.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: cancellationData.email,
    subject: `Cancellation Confirmed - Kampo Ibayo Resort (Booking #${cancellationData.bookingId})`,
    html,
  };
};
