/**
 * Shared constants and utilities for email templates.
 * All email templates reference these values for consistency.
 */

export const RESORT_NAME = 'Kampo Ibayo Resort';
export const RESORT_EMAIL = 'info@kampoibayo.com';
export const RESORT_PHONE = '+63 966 281 5123';
export const RESORT_SUPPORT_EMAIL = 'kampoibayo@gmail.com';
export const BUSINESS_HOURS = '8:00 AM - 8:00 PM (Philippine Time)';

export const getAdminPanelUrl = () =>
  `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/bookings`;

export const getBookingUrl = () =>
  `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/book`;

export const getAdminEmail = () =>
  (process.env.ADMIN_EMAIL || process.env.EMAIL_FROM) as string;

export const getCurrentYear = () => new Date().getFullYear();

export const getPhilippineTime = () =>
  new Date().toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

export const getCurrentDateFormatted = () =>
  new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
