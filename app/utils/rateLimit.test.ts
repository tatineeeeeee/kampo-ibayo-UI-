import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, getClientIp } from './rateLimit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    // Reset time mocking between tests
    vi.useRealTimers();
  });

  it('allows requests within the limit', () => {
    const key = 'test-allow-' + Date.now();
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);  // 1st
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);  // 2nd
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);  // 3rd
  });

  it('blocks requests exceeding the limit', () => {
    const key = 'test-block-' + Date.now();
    checkRateLimit(key, 2, 60_000); // 1st
    checkRateLimit(key, 2, 60_000); // 2nd
    expect(checkRateLimit(key, 2, 60_000)).toBe(false); // 3rd — blocked
  });

  it('resets after the time window expires', () => {
    vi.useFakeTimers();
    const key = 'test-reset';

    checkRateLimit(key, 1, 1000); // 1st — allowed
    expect(checkRateLimit(key, 1, 1000)).toBe(false); // 2nd — blocked

    vi.advanceTimersByTime(1001); // Advance past the window

    expect(checkRateLimit(key, 1, 1000)).toBe(true); // Reset — allowed again
  });

  it('tracks different keys independently', () => {
    const keyA = 'test-keyA-' + Date.now();
    const keyB = 'test-keyB-' + Date.now();

    checkRateLimit(keyA, 1, 60_000);
    expect(checkRateLimit(keyA, 1, 60_000)).toBe(false); // A exhausted

    expect(checkRateLimit(keyB, 1, 60_000)).toBe(true);  // B still available
  });

  it('handles maxRequests of 1 correctly', () => {
    const key = 'test-single-' + Date.now();
    expect(checkRateLimit(key, 1, 60_000)).toBe(true);
    expect(checkRateLimit(key, 1, 60_000)).toBe(false);
  });
});

describe('getClientIp', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientIp(request)).toBe('1.2.3.4');
  });

  it('extracts single IP from x-forwarded-for', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '10.0.0.1' },
    });
    expect(getClientIp(request)).toBe('10.0.0.1');
  });

  it('falls back to x-real-ip', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-real-ip': '192.168.1.1' },
    });
    expect(getClientIp(request)).toBe('192.168.1.1');
  });

  it('returns unknown when no IP headers present', () => {
    const request = new Request('http://localhost');
    expect(getClientIp(request)).toBe('unknown');
  });
});
