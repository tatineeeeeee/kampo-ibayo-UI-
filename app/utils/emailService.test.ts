import { describe, it, expect } from 'vitest';
import {
  createBookingConfirmationEmail,
  createBookingConfirmedEmail,
  createAdminNotificationEmail,
  createBookingCancelledEmail,
  createAdminCancellationGuestEmail,
  type BookingDetails,
  type CancellationEmailData,
} from './emailService';

const mockBooking: BookingDetails = {
  bookingId: '42',
  guestName: 'Juan Dela Cruz',
  checkIn: '2026-04-01',
  checkOut: '2026-04-03',
  guests: 4,
  totalAmount: 5000,
  email: 'juan@example.com',
};

describe('createBookingConfirmationEmail', () => {
  it('returns correct email structure', () => {
    const email = createBookingConfirmationEmail(mockBooking);
    expect(email).toHaveProperty('to');
    expect(email).toHaveProperty('subject');
    expect(email).toHaveProperty('html');
  });

  it('sets correct recipient', () => {
    const email = createBookingConfirmationEmail(mockBooking);
    expect(email.to).toBe('juan@example.com');
  });

  it('includes guest name in HTML body', () => {
    const email = createBookingConfirmationEmail(mockBooking);
    expect(email.html).toContain('Juan Dela Cruz');
  });

  it('includes booking details in HTML body', () => {
    const email = createBookingConfirmationEmail(mockBooking);
    expect(email.html).toContain('2026-04-01');
    expect(email.html).toContain('2026-04-03');
  });

  it('includes subject line', () => {
    const email = createBookingConfirmationEmail(mockBooking);
    expect(email.subject).toBeTruthy();
    expect(email.subject.length).toBeGreaterThan(0);
  });
});

describe('createBookingConfirmedEmail', () => {
  it('returns correct email structure', () => {
    const email = createBookingConfirmedEmail(mockBooking);
    expect(email).toHaveProperty('to');
    expect(email).toHaveProperty('subject');
    expect(email).toHaveProperty('html');
  });

  it('sets correct recipient', () => {
    const email = createBookingConfirmedEmail(mockBooking);
    expect(email.to).toBe('juan@example.com');
  });

  it('includes guest name', () => {
    const email = createBookingConfirmedEmail(mockBooking);
    expect(email.html).toContain('Juan Dela Cruz');
  });
});

describe('createAdminNotificationEmail', () => {
  it('returns correct email structure', () => {
    const email = createAdminNotificationEmail(mockBooking);
    expect(email).toHaveProperty('to');
    expect(email).toHaveProperty('subject');
    expect(email).toHaveProperty('html');
  });

  it('includes booking details', () => {
    const email = createAdminNotificationEmail(mockBooking);
    expect(email.html).toContain('Juan Dela Cruz');
    expect(email.html).toContain('2026-04-01');
  });
});

describe('createBookingCancelledEmail', () => {
  it('returns correct email structure', () => {
    const email = createBookingCancelledEmail(mockBooking);
    expect(email).toHaveProperty('to');
    expect(email).toHaveProperty('subject');
    expect(email).toHaveProperty('html');
  });

  it('sets correct recipient', () => {
    const email = createBookingCancelledEmail(mockBooking);
    expect(email.to).toBe('juan@example.com');
  });

  it('includes guest name', () => {
    const email = createBookingCancelledEmail(mockBooking);
    expect(email.html).toContain('Juan Dela Cruz');
  });
});

describe('createAdminCancellationGuestEmail', () => {
  const mockCancellation: CancellationEmailData = {
    ...mockBooking,
    cancellationReason: 'Maintenance required',
    cancelledBy: 'admin',
  };

  it('returns correct email structure', () => {
    const email = createAdminCancellationGuestEmail(mockCancellation);
    expect(email).toHaveProperty('to');
    expect(email).toHaveProperty('subject');
    expect(email).toHaveProperty('html');
  });

  it('sets correct recipient', () => {
    const email = createAdminCancellationGuestEmail(mockCancellation);
    expect(email.to).toBe('juan@example.com');
  });

  it('includes cancellation reason', () => {
    const email = createAdminCancellationGuestEmail(mockCancellation);
    expect(email.html).toContain('Maintenance required');
  });

  it('includes guest name', () => {
    const email = createAdminCancellationGuestEmail(mockCancellation);
    expect(email.html).toContain('Juan Dela Cruz');
  });
});
