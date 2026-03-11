import { describe, it, expect } from 'vitest';
import {
  formatBookingNumber,
  parseBookingNumber,
  isValidBookingNumberFormat,
  generateBookingNumberRange,
  getNextBookingNumber,
} from './bookingNumber';

describe('formatBookingNumber', () => {
  it('zero-pads numbers 1-9999 to 4 digits', () => {
    expect(formatBookingNumber(1)).toBe('KB-0001');
    expect(formatBookingNumber(25)).toBe('KB-0025');
    expect(formatBookingNumber(999)).toBe('KB-0999');
    expect(formatBookingNumber(9999)).toBe('KB-9999');
  });

  it('uses natural length for numbers >= 10000', () => {
    expect(formatBookingNumber(10000)).toBe('KB-10000');
    expect(formatBookingNumber(25000)).toBe('KB-25000');
    expect(formatBookingNumber(100000)).toBe('KB-100000');
  });

  it('throws on invalid input (0 or negative)', () => {
    expect(() => formatBookingNumber(0)).toThrow('Booking ID must be a positive number');
    expect(() => formatBookingNumber(-1)).toThrow('Booking ID must be a positive number');
  });

  it('throws on NaN input', () => {
    expect(() => formatBookingNumber(NaN)).toThrow('Booking ID must be a positive number');
  });
});

describe('parseBookingNumber', () => {
  it('parses zero-padded booking numbers', () => {
    expect(parseBookingNumber('KB-0001')).toBe(1);
    expect(parseBookingNumber('KB-0025')).toBe(25);
    expect(parseBookingNumber('KB-9999')).toBe(9999);
  });

  it('parses large booking numbers', () => {
    expect(parseBookingNumber('KB-10000')).toBe(10000);
    expect(parseBookingNumber('KB-100000')).toBe(100000);
  });

  it('returns null for invalid formats', () => {
    expect(parseBookingNumber('')).toBe(null);
    expect(parseBookingNumber('#123')).toBe(null);
    expect(parseBookingNumber('BOOK-001')).toBe(null);
    expect(parseBookingNumber('KB-')).toBe(null);
    expect(parseBookingNumber('KB-abc')).toBe(null);
    expect(parseBookingNumber('KB-0')).toBe(null);
    expect(parseBookingNumber('KB--1')).toBe(null);
  });

  it('round-trips with formatBookingNumber', () => {
    for (const id of [1, 50, 999, 9999, 10000, 50000]) {
      expect(parseBookingNumber(formatBookingNumber(id))).toBe(id);
    }
  });
});

describe('isValidBookingNumberFormat', () => {
  it('returns true for valid formats', () => {
    expect(isValidBookingNumberFormat('KB-0001')).toBe(true);
    expect(isValidBookingNumberFormat('KB-10000')).toBe(true);
  });

  it('returns false for invalid formats', () => {
    expect(isValidBookingNumberFormat('')).toBe(false);
    expect(isValidBookingNumberFormat('invalid')).toBe(false);
    expect(isValidBookingNumberFormat('#123')).toBe(false);
  });
});

describe('generateBookingNumberRange', () => {
  it('generates a range of booking numbers', () => {
    expect(generateBookingNumberRange(1, 3)).toEqual([
      'KB-0001', 'KB-0002', 'KB-0003',
    ]);
  });

  it('handles single-element range', () => {
    expect(generateBookingNumberRange(5, 5)).toEqual(['KB-0005']);
  });

  it('returns empty array when start > end', () => {
    expect(generateBookingNumberRange(5, 3)).toEqual([]);
  });

  it('handles range crossing the 9999 boundary', () => {
    expect(generateBookingNumberRange(9998, 10001)).toEqual([
      'KB-9998', 'KB-9999', 'KB-10000', 'KB-10001',
    ]);
  });
});

describe('getNextBookingNumber', () => {
  it('returns the next booking number', () => {
    expect(getNextBookingNumber(0)).toBe('KB-0001');
    expect(getNextBookingNumber(42)).toBe('KB-0043');
    expect(getNextBookingNumber(9999)).toBe('KB-10000');
  });
});
