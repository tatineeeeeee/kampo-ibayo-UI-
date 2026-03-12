import { describe, it, expect } from 'vitest';
import {
  createBookingConfirmationSMS,
  createBookingApprovalSMS,
  createPaymentApprovedSMS,
  createBookingReminderSMS,
  createBookingCancellationSMS,
  createBookingRescheduleSMS,
  createPaymentReviewSMS,
  createCheckInDaySMS,
  createReminder12HourSMS,
  createReminder3HourSMS,
} from './smsService';

describe('SMS message templates', () => {
  // All SMS messages should be exactly 160 characters (padded or truncated)
  const MAX_SMS_LENGTH = 160;

  describe('createBookingConfirmationSMS', () => {
    it('returns exactly 160 characters', () => {
      const msg = createBookingConfirmationSMS('1', 'Juan', '2026-03-15');
      expect(msg.length).toBe(MAX_SMS_LENGTH);
    });

    it('contains booking number in KB- format', () => {
      const msg = createBookingConfirmationSMS('42', 'Maria', '2026-04-01');
      expect(msg).toContain('KB-0042');
    });

    it('contains the guest name', () => {
      const msg = createBookingConfirmationSMS('1', 'Pedro', '2026-03-15');
      expect(msg).toContain('Pedro');
    });

    it('contains the check-in date', () => {
      const msg = createBookingConfirmationSMS('1', 'Ana', '2026-05-20');
      expect(msg).toContain('2026-05-20');
    });

    it('starts with KAMPO IBAYO prefix', () => {
      const msg = createBookingConfirmationSMS('1', 'Test', '2026-01-01');
      expect(msg).toMatch(/^KAMPO IBAYO/);
    });
  });

  describe('createBookingApprovalSMS', () => {
    it('returns exactly 160 characters', () => {
      const msg = createBookingApprovalSMS('10', 'Juan', '2026-03-15');
      expect(msg.length).toBe(MAX_SMS_LENGTH);
    });

    it('contains CONFIRMED keyword', () => {
      const msg = createBookingApprovalSMS('10', 'Juan', '2026-03-15');
      expect(msg).toContain('CONFIRMED');
    });

    it('contains formatted booking number', () => {
      const msg = createBookingApprovalSMS('5', 'Juan', '2026-03-15');
      expect(msg).toContain('KB-0005');
    });
  });

  describe('createPaymentApprovedSMS', () => {
    it('returns exactly 160 characters', () => {
      const msg = createPaymentApprovedSMS('1', 'Guest', '2026-06-01');
      expect(msg.length).toBe(MAX_SMS_LENGTH);
    });

    it('contains payment approved context', () => {
      const msg = createPaymentApprovedSMS('1', 'Guest', '2026-06-01');
      expect(msg).toContain('Payment approved');
    });
  });

  describe('createBookingReminderSMS', () => {
    it('returns exactly 160 characters', () => {
      const msg = createBookingReminderSMS('Ana', '2026-04-10');
      expect(msg.length).toBe(MAX_SMS_LENGTH);
    });

    it('contains tomorrow context', () => {
      const msg = createBookingReminderSMS('Ana', '2026-04-10');
      expect(msg).toContain('tomorrow');
    });
  });

  describe('createBookingCancellationSMS', () => {
    it('returns exactly 160 characters', () => {
      const msg = createBookingCancellationSMS('100', 'Mark');
      expect(msg.length).toBe(MAX_SMS_LENGTH);
    });

    it('contains cancelled keyword', () => {
      const msg = createBookingCancellationSMS('100', 'Mark');
      expect(msg).toContain('cancelled');
    });

    it('contains contact number', () => {
      const msg = createBookingCancellationSMS('100', 'Mark');
      expect(msg).toContain('09662815123');
    });
  });

  describe('createBookingRescheduleSMS', () => {
    it('returns exactly 160 characters', () => {
      const msg = createBookingRescheduleSMS('7', 'Luis', '2026-07-01');
      expect(msg.length).toBe(MAX_SMS_LENGTH);
    });

    it('contains rescheduled keyword', () => {
      const msg = createBookingRescheduleSMS('7', 'Luis', '2026-07-01');
      expect(msg).toContain('rescheduled');
    });

    it('contains new check-in date', () => {
      const msg = createBookingRescheduleSMS('7', 'Luis', '2026-07-01');
      expect(msg).toContain('2026-07-01');
    });
  });

  describe('createPaymentReviewSMS', () => {
    it('returns exactly 160 characters', () => {
      const msg = createPaymentReviewSMS('20', 'Rosa');
      expect(msg.length).toBe(MAX_SMS_LENGTH);
    });

    it('contains review context', () => {
      const msg = createPaymentReviewSMS('20', 'Rosa');
      expect(msg).toContain('review');
    });
  });

  describe('createCheckInDaySMS', () => {
    it('returns exactly 160 characters', () => {
      const msg = createCheckInDaySMS('Juan');
      expect(msg.length).toBe(MAX_SMS_LENGTH);
    });

    it('uses default 3PM check-in time', () => {
      const msg = createCheckInDaySMS('Juan');
      expect(msg).toContain('3PM');
    });

    it('accepts custom check-in time', () => {
      const msg = createCheckInDaySMS('Juan', '2PM');
      expect(msg).toContain('2PM');
    });
  });

  describe('createReminder12HourSMS', () => {
    it('returns exactly 160 characters', () => {
      const msg = createReminder12HourSMS('Guest');
      expect(msg.length).toBe(MAX_SMS_LENGTH);
    });

    it('contains 12 hours context', () => {
      const msg = createReminder12HourSMS('Guest');
      expect(msg).toContain('12 hours');
    });
  });

  describe('createReminder3HourSMS', () => {
    it('returns exactly 160 characters', () => {
      const msg = createReminder3HourSMS('Guest');
      expect(msg.length).toBe(MAX_SMS_LENGTH);
    });

    it('contains 3 hours context', () => {
      const msg = createReminder3HourSMS('Guest');
      expect(msg).toContain('3 hours');
    });
  });
});
