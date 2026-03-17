import { describe, it, expect } from 'vitest';
import { ReceiptService } from './receiptService';

describe('ReceiptService.generateReceiptNumber', () => {
  it('generates receipt number from check-in date + booking ID', () => {
    const receipt = ReceiptService.generateReceiptNumber(79, false, '2026-04-13');
    expect(receipt).toBe('20260413-079');
  });

  it('uses REF- prefix for rescheduled bookings', () => {
    const receipt = ReceiptService.generateReceiptNumber(60, true, '2026-03-17');
    expect(receipt).toBe('REF-20260317-060');
  });

  it('falls back to current date when no check-in date provided', () => {
    const receipt = ReceiptService.generateReceiptNumber(42);
    expect(receipt).toMatch(/^\d{8}-042$/);
  });

  it('generates consistent number for same booking', () => {
    const receipt1 = ReceiptService.generateReceiptNumber(60, false, '2026-03-17');
    const receipt2 = ReceiptService.generateReceiptNumber(60, false, '2026-03-17');
    expect(receipt1).toBe(receipt2);
    expect(receipt1).toBe('20260317-060');
  });
});

describe('ReceiptService.validateReceiptData', () => {
  it('returns true when all required fields present', () => {
    expect(ReceiptService.validateReceiptData({
      booking: {} as never,
      paymentProof: {} as never,
      userEmail: 'test@example.com',
    })).toBe(true);
  });

  it('returns false when booking is missing', () => {
    expect(ReceiptService.validateReceiptData({
      paymentProof: {} as never,
      userEmail: 'test@example.com',
    })).toBe(false);
  });

  it('returns false when paymentProof is missing', () => {
    expect(ReceiptService.validateReceiptData({
      booking: {} as never,
      userEmail: 'test@example.com',
    })).toBe(false);
  });

  it('returns false when userEmail is missing', () => {
    expect(ReceiptService.validateReceiptData({
      booking: {} as never,
      paymentProof: {} as never,
    })).toBe(false);
  });

  it('returns false for empty object', () => {
    expect(ReceiptService.validateReceiptData({})).toBe(false);
  });

  it('returns false when userEmail is empty string', () => {
    expect(ReceiptService.validateReceiptData({
      booking: {} as never,
      paymentProof: {} as never,
      userEmail: '',
    })).toBe(false);
  });
});
