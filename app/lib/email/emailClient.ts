/**
 * =============================================================================
 * EMAIL SERVICE - SECURE COMMUNICATION
 * =============================================================================
 *
 * ENCRYPTION IMPLEMENTATION:
 *
 * 1. TLS/STARTTLS - SYMMETRIC ENCRYPTION (PHP Equivalent: PHPMailer with TLS)
 *    - Port 587 uses STARTTLS to upgrade connection to encrypted
 *    - Uses AES-256 symmetric encryption for email content
 *    - All credentials transmitted over encrypted channel
 *
 * 2. AUTHENTICATION SECURITY:
 *    - Environment variables store sensitive credentials
 *    - Never hardcode passwords in source code
 *    - PHP Equivalent: $mail->Password = getenv('SMTP_PASSWORD');
 *
 * =============================================================================
 */

import nodemailer from 'nodemailer';

// Email template interfaces
export interface EmailTemplate {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface BookingDetails {
  bookingId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  email: string;
  paymentType?: 'full' | 'half';
}

export interface RefundDetails {
  refundAmount: number;
  downPayment: number;
  refundPercentage: number;
  processingDays: string;
  refundReason: string;
}

export interface CancellationEmailData extends BookingDetails {
  cancellationReason?: string;
  cancelledBy: 'user' | 'admin';
  refundDetails?: RefundDetails;
}

/**
 * Gmail Email Transporter - SECURE CONFIGURATION
 * PHP Equivalent: PHPMailer with $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS
 */
export const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    port: 587,                    // STARTTLS port - upgrades to TLS encryption
    secure: false,                // false = STARTTLS (starts plain, upgrades to TLS)
    auth: {
      user: process.env.SMTP_USER,      // Credential from env (never hardcoded)
      pass: process.env.SMTP_PASSWORD,  // App password (transmitted over TLS)
    },
    /**
     * TLS CONFIGURATION - SYMMETRIC ENCRYPTION
     * Encrypts all email data in transit using AES-256
     */
    tls: {
      rejectUnauthorized: true,  // Validate SSL certificates
    }
  });
};

// Email sending function
export const sendEmail = async (emailData: EmailTemplate) => {
  try {
    const transporter = createEmailTransporter();

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Test email connectivity
export const testEmailConnection = async () => {
  try {
    const transporter = createEmailTransporter();
    await transporter.verify();
    return { success: true, message: 'Email server connection successful' };
  } catch (error) {
    console.error('❌ Email server connection failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
