import type { BookingDetails, EmailTemplate } from '../emailClient';
import { escapeHtml } from '@/app/utils/escapeHtml';

// Professional Admin Notification for User-Initiated Cancellation
export const createUserCancellationAdminNotification = (
  bookingDetails: BookingDetails,
  cancellationReason?: string
): EmailTemplate => {
  const safe = {
    guestName: escapeHtml(String(bookingDetails.guestName)),
    bookingId: escapeHtml(String(bookingDetails.bookingId)),
    checkIn: escapeHtml(String(bookingDetails.checkIn)),
    checkOut: escapeHtml(String(bookingDetails.checkOut)),
    email: escapeHtml(String(bookingDetails.email)),
    cancellationReason: cancellationReason ? escapeHtml(String(cancellationReason)) : '',
  };
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Guest Cancellation Alert - Kampo Ibayo Resort</title>
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
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 10px;
          letter-spacing: 1px;
        }
        .alert-status {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          margin: 15px 0;
          display: inline-block;
          text-transform: uppercase;
          letter-spacing: 0.5px;
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
        .priority-notice {
          background: #fef2f2;
          border-left: 4px solid #dc2626;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .priority-notice-title {
          color: #dc2626;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 10px 0;
        }
        .priority-notice-text {
          color: #991b1b;
          margin: 0;
        }
        .cancellation-reason {
          background: #fefefe;
          border: 1px solid #e2e8f0;
          padding: 20px;
          margin: 20px 0;
        }
        .reason-header {
          color: #2d3748;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 12px 0;
        }
        .reason-text {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 15px;
          color: #2d3748;
          line-height: 1.6;
          margin: 0;
          font-style: normal;
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
        .status-tag {
          background: #dc2626;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .amount-highlight {
          color: #dc2626;
          font-weight: 700;
        }
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .detail-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .detail-value {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
        .revenue-impact {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
          text-align: center;
        }
        .revenue-title {
          color: #92400e;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 12px 0;
        }
        .revenue-amount {
          font-size: 32px;
          font-weight: 800;
          color: #dc2626;
          margin: 8px 0;
        }
        .revenue-subtitle {
          color: #92400e;
          font-size: 14px;
          margin: 0;
        }
        .contact-section {
          background: #eff6ff;
          border: 2px solid #3b82f6;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        .contact-title {
          color: #1e40af;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .contact-email {
          background: white;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 12px 16px;
          margin: 8px 0;
          font-weight: 600;
          color: #1e40af;
        }
        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin: 32px 0;
          flex-wrap: wrap;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }
        .btn-primary {
          background: #3b82f6;
          color: white;
        }
        .btn-primary:hover {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        .btn-success {
          background: #10b981;
          color: white;
        }
        .btn-success:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
        .recommendations {
          background: #f3f4f6;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        .recommendations-title {
          color: #374151;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .recommendations-list {
          margin: 0;
          padding-left: 0;
          list-style: none;
        }
        .recommendations-list li {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 12px 16px;
          margin: 8px 0;
          color: #4b5563;
          position: relative;
          padding-left: 48px;
        }
        .recommendations-list li::before {
          content: "•";
          color: #3b82f6;
          font-weight: bold;
          position: absolute;
          left: 20px;
          font-size: 18px;
        }
        .footer {
          text-align: center;
          margin-top: 32px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-logo">KAMPO IBAYO RESORT</div>
          <div class="alert-status">GUEST CANCELLATION ALERT</div>
          <h1 class="header-title">Booking Cancellation Notice</h1>
          <p class="header-subtitle">Administrative Action Required</p>
        </div>

        <div class="content-section">
          <div class="priority-notice">
            <h3 class="priority-notice-title">Priority Administrative Notice</h3>
            <p class="priority-notice-text">A guest has initiated a booking cancellation requiring immediate attention for refund processing and administrative follow-up.</p>
          </div>

          ${cancellationReason ? `
          <div class="cancellation-reason">
            <h4 class="reason-header">Cancellation Details</h4>
            <p class="reason-text">"${safe.cancellationReason}"</p>
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
              <td>${bookingDetails.guests} guests</td>
            </tr>
            <tr>
              <td><strong>Status</strong></td>
              <td><span class="status-tag">CANCELLED</span></td>
            </tr>
            <tr>
              <td><strong>Cancellation Time</strong></td>
              <td>${new Date().toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })}</td>
            </tr>
          </table>

          <div class="financial-section">
            <h3 class="financial-title">Financial Impact Summary</h3>
            <div class="financial-grid">
              <div class="financial-item">
                <div class="financial-label">Total Booking Value</div>
                <div class="financial-value amount-highlight">₱${bookingDetails.totalAmount.toLocaleString()}</div>
              </div>
              <div class="financial-item">
                <div class="financial-label">Revenue Status</div>
                <div class="financial-value">Cancelled</div>
              </div>
            </div>
          </div>

          <table class="booking-info-table">
            <tr>
              <th colspan="2">Guest Contact Information</th>
            </tr>
            <tr>
              <td><strong>Email Address</strong></td>
              <td>${safe.email}</td>
            </tr>
            <tr>
              <td><strong>Recommended Action</strong></td>
              <td>Review cancellation and process refund if applicable</td>
            </tr>
          </table>

          <table class="booking-info-table">
            <tr>
              <th colspan="2">Administrative Actions Required</th>
            </tr>
            <tr>
              <td><strong>Priority Level</strong></td>
              <td><span class="status-tag">HIGH</span></td>
            </tr>
            <tr>
              <td><strong>Admin Panel</strong></td>
              <td><a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/bookings" style="color: #2b6cb0; text-decoration: none;">View Booking Details</a></td>
            </tr>
            <tr>
              <td><strong>Guest Contact</strong></td>
              <td><a href="mailto:${safe.email}" style="color: #2b6cb0; text-decoration: none;">Send Email</a></td>
            </tr>
          </table>

          <div style="background: #f8fafc; padding: 20px; margin: 20px 0; border-left: 4px solid #2b6cb0;">
            <h4 style="color: #2b6cb0; margin: 0 0 15px 0;">Administrative Checklist</h4>
            <ul style="margin: 0; padding-left: 20px; color: #2d3748;">
              <li>Review and process any applicable refunds</li>
              <li>Update property availability calendar</li>
              <li>Document cancellation reason for future reference</li>
              <li>Consider follow-up communication with guest</li>
              <li>Update revenue reports and forecasting</li>
            </ul>
          </div>

          <div style="background: #2b6cb0; color: white; padding: 20px; margin-top: 30px; text-align: center;">
            <div style="font-weight: 600; margin-bottom: 5px;">Kampo Ibayo Resort</div>
            <div style="font-size: 12px; opacity: 0.9;">Administrative Management System</div>
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
    to: (process.env.ADMIN_EMAIL || process.env.EMAIL_FROM) as string,
    subject: `Guest Cancellation Alert: Booking ${bookingDetails.bookingId} - ${bookingDetails.guestName}`,
    html,
  };
};
