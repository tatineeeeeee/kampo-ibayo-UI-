import type { CancellationEmailData, EmailTemplate } from '../emailClient';
import { escapeHtml } from '@/app/utils/escapeHtml';

// Enhanced Admin-Initiated Cancellation Email (Guest Notification)
export const createAdminCancellationGuestEmail = (cancellationData: CancellationEmailData): EmailTemplate => {
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
      <title>Booking Cancellation Notice - Kampo Ibayo Resort</title>
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
          background: linear-gradient(135deg, #2b6cb0, #1e40af);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .company-logo {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 10px;
          letter-spacing: 1px;
          color: white;
        }
        .cancellation-status {
          background: rgba(220, 38, 38, 0.2);
          color: #dc2626;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          margin: 15px 0;
          display: inline-block;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid #dc2626;
        }
        .header-title {
          color: white;
          font-size: 18px;
          font-weight: 600;
          margin: 10px 0;
        }
        .header-subtitle {
          color: #93c5fd;
          font-size: 14px;
          margin: 0;
        }
        .content-section {
          padding: 30px;
        }
        .refund-section {
          background: #f0f9ff;
          border: 1px solid #38a169;
          padding: 20px;
          margin: 20px 0;
        }
        .refund-title {
          color: #38a169;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 15px 0;
        }
        .booking-info-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }
        .booking-info-table th {
          background: #2b6cb0;
          color: white;
          padding: 12px 15px;
          text-align: left;
          font-weight: 600;
          border-bottom: 1px solid #e2e8f0;
        }
        .booking-info-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #e2e8f0;
          color: #2d3748;
        }
        .booking-info-table tr:nth-child(even) {
          background: white;
        }
        .booking-info-table tr:nth-child(odd) {
          background: #f8fafc;
        }
        .amount-highlight {
          color: #38a169;
          font-weight: 700;
          font-size: 18px;
        }
        .contact-section {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
          text-align: center;
        }
        .btn {
          display: inline-block;
          background: #3b82f6;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 8px;
        }
        .btn-green { background: #10b981; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-logo">KAMPO IBAYO RESORT</div>
          <div class="cancellation-status">BOOKING CANCELLED</div>
          <h1 class="header-title">Booking Cancellation Notice</h1>
          <p class="header-subtitle">Administrative Cancellation</p>
        </div>

        <div class="content-section">
          <p style="margin-bottom: 20px; color: #2d3748;">
            Dear ${safe.guestName},
          </p>

          <p style="color: #2d3748; margin-bottom: 20px;">
            We regret to inform you that your booking reservation has been cancelled due to operational requirements.
            We sincerely apologize for any inconvenience this cancellation may cause and appreciate your understanding.
          </p>

          ${cancellationData.cancellationReason ? `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #2d3748;"><strong>Cancellation Details:</strong> ${safe.cancellationReason}</p>
          </div>
          ` : ''}

          ${hasRefund ? `
          <div class="refund-section">
            <h3 class="refund-title">Refund Processing Information</h3>
            <table class="booking-info-table">
              <tr>
                <th colspan="2">Refund Summary</th>
              </tr>
              <tr>
                <td><strong>Down Payment Paid</strong></td>
                <td>₱${refundDetails!.downPayment.toLocaleString()}</td>
              </tr>
              <tr>
                <td><strong>Refund Amount</strong></td>
                <td class="amount-highlight">₱${refundDetails!.refundAmount.toLocaleString()}</td>
              </tr>
              <tr>
                <td><strong>Refund Percentage</strong></td>
                <td>${refundDetails!.refundPercentage}%</td>
              </tr>
              <tr>
                <td><strong>Processing Time</strong></td>
                <td>${refundDetails!.processingDays}</td>
              </tr>
              <tr>
                <td><strong>Refund Method</strong></td>
                <td>Original Payment Method</td>
              </tr>
            </table>
          </div>
          ` : ''}

          <table class="booking-info-table">
            <tr>
              <th colspan="2">Cancelled Booking Information</th>
            </tr>
            <tr>
              <td><strong>Booking Reference</strong></td>
              <td>#${safe.bookingId}</td>
            </tr>
            <tr>
              <td><strong>Guest Name</strong></td>
              <td>${safe.guestName}</td>
            </tr>
            <tr>
              <td><strong>Check-in Date</strong></td>
              <td>${safe.checkIn}</td>
            </tr>
            <tr>
              <td><strong>Check-out Date</strong></td>
              <td>${safe.checkOut}</td>
            </tr>
            <tr>
              <td><strong>Party Size</strong></td>
              <td>${cancellationData.guests} guests</td>
            </tr>
            <tr>
              <td><strong>Total Booking Value</strong></td>
              <td>₱${cancellationData.totalAmount.toLocaleString()}</td>
            </tr>
          </table>

          <div style="background: #f8fafc; padding: 20px; margin: 20px 0; border-left: 4px solid #2b6cb0;">
            <h4 style="color: #2b6cb0; margin: 0 0 15px 0;">Customer Service</h4>
            <p style="color: #2d3748; margin: 0 0 15px 0;">
              We sincerely apologize for this inconvenience and would be happy to assist you with future reservations or alternative arrangements.
            </p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; width: 120px;"><strong>Phone:</strong></td>
                <td style="padding: 5px 0;"><a href="tel:+639662815123" style="color: #2b6cb0; text-decoration: none;">+63 966 281 5123</a></td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>Email:</strong></td>
                <td style="padding: 5px 0;"><a href="mailto:kampoibayo@gmail.com" style="color: #2b6cb0; text-decoration: none;">kampoibayo@gmail.com</a></td>
              </tr>
            </table>
          </div>

          <div style="background: #2b6cb0; color: white; padding: 20px; margin-top: 30px; text-align: center;">
            <div style="font-weight: 600; margin-bottom: 5px;">Kampo Ibayo Resort</div>
            <div style="font-size: 12px; opacity: 0.9;">Professional Resort Management</div>
            <div style="font-size: 11px; margin-top: 10px; opacity: 0.8;">
              © ${new Date().getFullYear()} Kampo Ibayo Resort. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: cancellationData.email,
    subject: `Booking Cancellation Notice - Kampo Ibayo Resort (Reference #${cancellationData.bookingId})`,
    html,
  };
};
