import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the supabase client before importing bookingUtils
vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  },
}));

import { getDaysPending, shouldShowExpirationWarning, getExpirationWarningMessage } from './bookingUtils';

describe('getDaysPending', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Fix "now" to a known date: 2026-03-11T00:00:00Z
    vi.setSystemTime(new Date('2026-03-11T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 0 for null input', () => {
    expect(getDaysPending(null)).toBe(0);
  });

  it('returns 0 for a booking created today', () => {
    expect(getDaysPending('2026-03-11T00:00:00Z')).toBe(0);
  });

  it('returns correct days for a booking created 3 days ago', () => {
    expect(getDaysPending('2026-03-08T00:00:00Z')).toBe(3);
  });

  it('returns correct days for a booking created 7 days ago', () => {
    expect(getDaysPending('2026-03-04T00:00:00Z')).toBe(7);
  });

  it('floors partial days', () => {
    // Created 2.5 days ago
    expect(getDaysPending('2026-03-08T12:00:00Z')).toBe(2);
  });
});

describe('shouldShowExpirationWarning', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-11T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false for non-pending status', () => {
    expect(shouldShowExpirationWarning('2026-03-01T00:00:00Z', 'confirmed')).toBe(false);
    expect(shouldShowExpirationWarning('2026-03-01T00:00:00Z', 'cancelled')).toBe(false);
    expect(shouldShowExpirationWarning('2026-03-01T00:00:00Z', 'completed')).toBe(false);
  });

  it('returns false for null createdAt', () => {
    expect(shouldShowExpirationWarning(null, 'pending')).toBe(false);
  });

  it('returns false for pending booking under 5 days', () => {
    // Created 4 days ago
    expect(shouldShowExpirationWarning('2026-03-07T00:00:00Z', 'pending')).toBe(false);
  });

  it('returns true for pending booking at exactly 5 days', () => {
    // Created 5 days ago
    expect(shouldShowExpirationWarning('2026-03-06T00:00:00Z', 'pending')).toBe(true);
  });

  it('returns true for pending booking at 6+ days', () => {
    expect(shouldShowExpirationWarning('2026-03-05T00:00:00Z', 'pending')).toBe(true);
    expect(shouldShowExpirationWarning('2026-03-04T00:00:00Z', 'pending')).toBe(true);
  });
});

describe('getExpirationWarningMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-11T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty string for null input', () => {
    expect(getExpirationWarningMessage(null)).toBe('');
  });

  it('returns "expire today" when 7+ days pending', () => {
    expect(getExpirationWarningMessage('2026-03-04T00:00:00Z')).toBe('⚠️ This booking will expire today');
  });

  it('returns "expire tomorrow" when 6 days pending', () => {
    expect(getExpirationWarningMessage('2026-03-05T00:00:00Z')).toBe('⚠️ This booking will expire tomorrow');
  });

  it('returns days remaining when under 7 days', () => {
    // 5 days pending → 2 days left
    expect(getExpirationWarningMessage('2026-03-06T00:00:00Z')).toBe('⚠️ This booking will expire in 2 day(s)');
  });

  it('returns 0 days left capped message for very old bookings', () => {
    // 10 days pending → max(0, 7-10) = 0
    expect(getExpirationWarningMessage('2026-03-01T00:00:00Z')).toBe('⚠️ This booking will expire today');
  });
});
