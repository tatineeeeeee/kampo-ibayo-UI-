import { describe, it, expect } from 'vitest';
import { ReceiptService } from './receiptService';

describe('ReceiptService.generateReceiptNumber', () => {
  it('generates receipt number with KIR prefix', () => {
    const receipt = ReceiptService.generateReceiptNumber(1);
    expect(receipt).toMatch(/^KIR-0001-\d{6}$/);
  });

  it('zero-pads booking ID to 4 digits', () => {
    const receipt = ReceiptService.generateReceiptNumber(42);
    expect(receipt).toMatch(/^KIR-0042-\d{6}$/);
  });

  it('handles large booking IDs', () => {
    const receipt = ReceiptService.generateReceiptNumber(12345);
    expect(receipt).toMatch(/^KIR-12345-\d{6}$/);
  });

  it('uses KIR-R prefix for rescheduled bookings', () => {
    const receipt = ReceiptService.generateReceiptNumber(1, true);
    expect(receipt).toMatch(/^KIR-R-0001-\d{6}$/);
  });

  it('uses KIR prefix when not rescheduled (default)', () => {
    const receipt = ReceiptService.generateReceiptNumber(1, false);
    expect(receipt).toMatch(/^KIR-0001-\d{6}$/);
  });

  it('appends 6-digit timestamp suffix', () => {
    const receipt = ReceiptService.generateReceiptNumber(1);
    const parts = receipt.split('-');
    const timestamp = parts[parts.length - 1];
    expect(timestamp).toMatch(/^\d{6}$/);
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
