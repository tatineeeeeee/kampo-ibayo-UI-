import { describe, it, expect } from 'vitest';
import { timingSafeEqual } from 'crypto';

// Test the safeCompare logic directly (same algorithm as in serverAuth.ts)
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

describe('safeCompare (timing-safe secret comparison)', () => {
  it('returns true for matching strings', () => {
    expect(safeCompare('my-secret-123', 'my-secret-123')).toBe(true);
  });

  it('returns false for different strings of same length', () => {
    expect(safeCompare('secret-aaa', 'secret-bbb')).toBe(false);
  });

  it('returns false for different lengths', () => {
    expect(safeCompare('short', 'much-longer-string')).toBe(false);
  });

  it('returns false for empty vs non-empty', () => {
    expect(safeCompare('', 'something')).toBe(false);
  });

  it('returns true for two empty strings', () => {
    expect(safeCompare('', '')).toBe(true);
  });

  it('handles special characters', () => {
    expect(safeCompare('p@$$w0rd!#%', 'p@$$w0rd!#%')).toBe(true);
    expect(safeCompare('p@$$w0rd!#%', 'p@$$w0rd!#&')).toBe(false);
  });
});
