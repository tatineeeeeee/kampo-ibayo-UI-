// Email client, types, and utilities
export {
  createEmailTransporter,
  sendEmail,
  testEmailConnection,
} from './emailClient';

export type {
  EmailTemplate,
  BookingDetails,
  RefundDetails,
  CancellationEmailData,
} from './emailClient';

// Shared constants
export {
  RESORT_NAME,
  RESORT_EMAIL,
  RESORT_PHONE,
  RESORT_SUPPORT_EMAIL,
  BUSINESS_HOURS,
  getAdminPanelUrl,
  getBookingUrl,
  getAdminEmail,
  getCurrentYear,
  getPhilippineTime,
  getCurrentDateFormatted,
} from './templates/shared';

// Email templates
export { createBookingConfirmationEmail } from './templates/bookingConfirmation';
export { createAdminNotificationEmail } from './templates/adminNotification';
export { createBookingConfirmedEmail } from './templates/bookingConfirmed';
export { createBookingCancelledEmail } from './templates/bookingCancelled';
export { createUserCancellationEmail } from './templates/userCancellation';
export { createUserCancellationAdminNotification } from './templates/userCancellationAdmin';
export { createAdminCancellationGuestEmail } from './templates/adminCancellationGuest';
export { createUserCancellationConfirmationEmail } from './templates/userCancellationConfirmation';
