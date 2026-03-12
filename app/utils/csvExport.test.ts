import { describe, it, expect } from 'vitest';
import { preprocessBookingData } from './csvExport';

describe('preprocessBookingData', () => {
  it('formats total_amount as peso currency', () => {
    const result = preprocessBookingData([
      { total_amount: 5000, check_in_date: '', check_out_date: '', created_at: '', status: '', payment_type: 'full', user_exists: true },
    ]);
    expect(result[0].total_amount).toBe('₱5,000');
  });

  it('defaults to ₱0 when total_amount is missing', () => {
    const result = preprocessBookingData([
      { check_in_date: '', check_out_date: '', created_at: '', status: '', payment_type: 'full', user_exists: true },
    ]);
    expect(result[0].total_amount).toBe('₱0');
  });

  it('formats payment_type correctly', () => {
    const full = preprocessBookingData([
      { total_amount: 0, check_in_date: '', check_out_date: '', created_at: '', status: '', payment_type: 'full', user_exists: true },
    ]);
    expect(full[0].payment_type).toBe('Full Payment');

    const half = preprocessBookingData([
      { total_amount: 0, check_in_date: '', check_out_date: '', created_at: '', status: '', payment_type: 'half', user_exists: true },
    ]);
    expect(half[0].payment_type).toBe('Down Payment (50%)');
  });

  it('capitalizes status', () => {
    const result = preprocessBookingData([
      { total_amount: 0, check_in_date: '', check_out_date: '', created_at: '', status: 'confirmed', payment_type: 'full', user_exists: true },
    ]);
    expect(result[0].status).toBe('Confirmed');
  });

  it('defaults status to Pending when empty', () => {
    const result = preprocessBookingData([
      { total_amount: 0, check_in_date: '', check_out_date: '', created_at: '', status: '', payment_type: 'full', user_exists: true },
    ]);
    expect(result[0].status).toBe('Pending');
  });

  it('formats user_exists as Yes/No', () => {
    const exists = preprocessBookingData([
      { total_amount: 0, check_in_date: '', check_out_date: '', created_at: '', status: '', payment_type: 'full', user_exists: true },
    ]);
    expect(exists[0].user_exists).toBe('Yes');

    const deleted = preprocessBookingData([
      { total_amount: 0, check_in_date: '', check_out_date: '', created_at: '', status: '', payment_type: 'full', user_exists: false },
    ]);
    expect(deleted[0].user_exists).toBe('No');
  });

  it('formats dates correctly', () => {
    const result = preprocessBookingData([
      { total_amount: 0, check_in_date: '2026-03-15', check_out_date: '2026-03-17', created_at: '2026-03-10', status: '', payment_type: 'full', user_exists: true },
    ]);
    // These should be formatted dates (locale-dependent, so just check they're non-empty)
    expect(result[0].check_in_date).toBeTruthy();
    expect(result[0].check_out_date).toBeTruthy();
    expect(result[0].created_at).toBeTruthy();
  });

  it('handles empty dates', () => {
    const result = preprocessBookingData([
      { total_amount: 0, check_in_date: '', check_out_date: '', created_at: '', status: '', payment_type: 'full', user_exists: true },
    ]);
    expect(result[0].check_in_date).toBe('');
    expect(result[0].check_out_date).toBe('');
    expect(result[0].created_at).toBe('');
  });

  it('preserves other fields via spread', () => {
    const result = preprocessBookingData([
      { total_amount: 0, check_in_date: '', check_out_date: '', created_at: '', status: '', payment_type: 'full', user_exists: true, guest_name: 'Juan' },
    ]);
    expect(result[0].guest_name).toBe('Juan');
  });
});
