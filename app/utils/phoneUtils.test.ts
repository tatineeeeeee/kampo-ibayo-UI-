import { describe, it, expect } from 'vitest';
import {
  formatPhoneToInternational,
  formatPhoneForDisplay,
  validatePhilippinePhone,
  cleanPhoneForDatabase,
  displayPhoneNumber,
} from './phoneUtils';

describe('formatPhoneToInternational', () => {
  it('converts 09XX format to +63', () => {
    expect(formatPhoneToInternational('09662815123')).toBe('+639662815123');
  });

  it('converts 63 prefix (without +) to +63', () => {
    expect(formatPhoneToInternational('639662815123')).toBe('+639662815123');
  });

  it('adds +63 to 10-digit number (without leading 0)', () => {
    expect(formatPhoneToInternational('9662815123')).toBe('+639662815123');
  });

  it('handles already correct +63 format', () => {
    expect(formatPhoneToInternational('+639662815123')).toBe('+639662815123');
  });

  it('strips non-digit characters', () => {
    expect(formatPhoneToInternational('0966-281-5123')).toBe('+639662815123');
    expect(formatPhoneToInternational('(0966) 281-5123')).toBe('+639662815123');
  });

  it('returns empty string for empty input', () => {
    expect(formatPhoneToInternational('')).toBe('');
  });
});

describe('formatPhoneForDisplay', () => {
  it('formats +63 number to 09XX-XXX-XXXX', () => {
    expect(formatPhoneForDisplay('+639662815123')).toBe('0966-281-5123');
  });

  it('formats 63 prefix number to display format', () => {
    expect(formatPhoneForDisplay('639662815123')).toBe('0966-281-5123');
  });

  it('formats already local number', () => {
    expect(formatPhoneForDisplay('09662815123')).toBe('0966-281-5123');
  });

  it('returns empty for empty input', () => {
    expect(formatPhoneForDisplay('')).toBe('');
  });

  it('handles short numbers gracefully', () => {
    const result = formatPhoneForDisplay('0966');
    // 4 digits hits the >= 4 branch: "0966-"
    expect(result).toBe('0966-');
  });
});

describe('validatePhilippinePhone', () => {
  it('accepts 11-digit 09XX format', () => {
    expect(validatePhilippinePhone('09662815123')).toBe(true);
  });

  it('accepts 12-digit 639 format', () => {
    expect(validatePhilippinePhone('639662815123')).toBe(true);
  });

  it('accepts +63 format', () => {
    expect(validatePhilippinePhone('+639662815123')).toBe(true);
  });

  it('rejects empty input', () => {
    expect(validatePhilippinePhone('')).toBe(false);
  });

  it('rejects too short number', () => {
    expect(validatePhilippinePhone('0966281')).toBe(false);
  });

  it('rejects non-PH prefix', () => {
    expect(validatePhilippinePhone('12345678901')).toBe(false);
  });

  it('accepts formatted phone with dashes', () => {
    // After stripping non-digits: 09662815123 (11 digits starting with 09)
    expect(validatePhilippinePhone('0966-281-5123')).toBe(true);
  });
});

describe('cleanPhoneForDatabase', () => {
  it('returns international format (delegates to formatPhoneToInternational)', () => {
    expect(cleanPhoneForDatabase('09662815123')).toBe('+639662815123');
    expect(cleanPhoneForDatabase('+639662815123')).toBe('+639662815123');
  });
});

describe('displayPhoneNumber', () => {
  it('converts +63 to display format', () => {
    expect(displayPhoneNumber('+639662815123')).toBe('0966-281-5123');
  });

  it('converts 63 prefix to display format', () => {
    expect(displayPhoneNumber('639662815123')).toBe('0966-281-5123');
  });

  it('returns empty string for null', () => {
    expect(displayPhoneNumber(null)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(displayPhoneNumber('')).toBe('');
  });

  it('returns original for non-PH format', () => {
    expect(displayPhoneNumber('+1234567890')).toBe('+1234567890');
  });
});
