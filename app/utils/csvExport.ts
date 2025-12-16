/**
 * CSV Export Utility for Admin Tables
 * Safe, reusable functions for exporting data to CSV format
 */

// Type definitions
interface CSVExportable {
  [key: string]: string | number | boolean | null | undefined | object;
}

// Helper to format date
const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return String(dateStr);
  }
};

// Helper to format currency
const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '₱0';
  return `₱${amount.toLocaleString()}`;
};

// Helper to format Philippine phone number for display
// Converts +639662815123 or 639662815123 to 0966-281-5123
const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '';

  // Remove all non-digit characters
  let cleaned = String(phone).replace(/\D/g, '');

  // Convert from international format (+63) to local format (09XX)
  if (cleaned.startsWith('63') && cleaned.length === 12) {
    cleaned = '0' + cleaned.substring(2);
  }

  // Format as 0966-281-5123
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // If it's 10 digits without leading 0, add it
  if (cleaned.length === 10 && cleaned.startsWith('9')) {
    cleaned = '0' + cleaned;
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // Return original if format doesn't match
  return String(phone);
};

// Helper to format booking ID
const formatBookingId = (id: number | string | null | undefined): string => {
  if (!id) return '';
  return `KB-${String(id).padStart(4, '0')}`;
};

// Type-safe CSV export function
export function exportToCSV<T extends CSVExportable>(
  data: T[],
  filename: string,
  columns: { key: string; header: string; format?: (value: unknown, row: T) => string }[]
): void {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  try {
    // Create CSV content
    const csvContent = [
      // Header row
      columns.map(col => `"${col.header}"`).join(','),
      // Data rows
      ...data.map(row =>
        columns.map(col => {
          let value: string;

          if (col.format) {
            value = col.format(row[col.key], row);
          } else {
            const rawValue = row[col.key];
            if (rawValue === null || rawValue === undefined) {
              value = '';
            } else if (typeof rawValue === 'object') {
              value = JSON.stringify(rawValue);
            } else if (typeof rawValue === 'boolean') {
              value = rawValue ? 'Yes' : 'No';
            } else {
              value = String(rawValue);
            }
          }

          // Escape quotes and wrap in quotes for CSV safety
          return `"${value.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    // Add BOM for Excel UTF-8 compatibility
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error exporting CSV:', error);
    alert('Failed to export CSV. Please try again.');
  }
}

// =====================
// BOOKINGS CSV EXPORT
// =====================
export const exportBookingsCSV = (bookings: CSVExportable[]) => {
  const columns = [
    { key: 'id', header: 'Booking ID', format: (v: unknown) => formatBookingId(v as number) },
    { key: 'guest_name', header: 'Guest Name', format: (v: unknown) => String(v || '') },
    { key: 'guest_email', header: 'Email', format: (v: unknown) => String(v || '') },
    { key: 'guest_phone', header: 'Phone', format: (v: unknown) => formatPhoneNumber(v as string) },
    { key: 'check_in_date', header: 'Check-in', format: (v: unknown) => formatDate(v as string) },
    { key: 'check_out_date', header: 'Check-out', format: (v: unknown) => formatDate(v as string) },
    {
      key: 'nights', header: 'Nights', format: (v: unknown, row: CSVExportable) => {
        const checkIn = row.check_in_date as string;
        const checkOut = row.check_out_date as string;
        if (!checkIn || !checkOut) return '';
        const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
        return String(nights);
      }
    },
    { key: 'number_of_guests', header: 'Guests', format: (v: unknown) => String(v || 0) },
    { key: 'total_amount', header: 'Total Amount', format: (v: unknown) => formatCurrency(v as number) },
    {
      key: 'payment_type', header: 'Payment Type', format: (v: unknown) => {
        const type = v as string;
        return type === 'full' ? 'Full Payment' : '50% Downpayment';
      }
    },
    {
      key: 'status', header: 'Booking Status', format: (v: unknown) => {
        const status = (v as string || 'pending').toLowerCase();
        return status.charAt(0).toUpperCase() + status.slice(1);
      }
    },
    {
      key: 'payment_status', header: 'Payment Status', format: (v: unknown) => {
        const status = (v as string || 'pending').toLowerCase();
        return status.charAt(0).toUpperCase() + status.slice(1);
      }
    },
    { key: 'special_requests', header: 'Special Requests', format: (v: unknown) => String(v || 'None') },
    { key: 'created_at', header: 'Booked On', format: (v: unknown) => formatDate(v as string) },
  ];

  exportToCSV(bookings, 'kampo_ibayo_bookings', columns);
};

// =====================
// USERS CSV EXPORT
// =====================
export const exportUsersCSV = (users: CSVExportable[]) => {
  const columns = [
    { key: 'name', header: 'Full Name', format: (v: unknown) => String(v || '') },
    { key: 'email', header: 'Email Address', format: (v: unknown) => String(v || '') },
    { key: 'phone', header: 'Phone Number', format: (v: unknown) => formatPhoneNumber(v as string) },
    { key: 'created_at', header: 'Registered On', format: (v: unknown) => formatDate(v as string) },
  ];

  exportToCSV(users, 'kampo_ibayo_users', columns);
};

// =====================
// PAYMENTS CSV EXPORT
// =====================
export const exportPaymentsCSV = (payments: CSVExportable[]) => {
  const columns = [
    { key: 'booking_id', header: 'Booking ID', format: (v: unknown) => formatBookingId(v as number) },
    { key: 'user', header: 'Guest Name', format: (v: unknown, row: CSVExportable) => String(row.guest_name || row.user || '') },
    { key: 'email', header: 'Email', format: (v: unknown) => String(v || '') },
    { key: 'total_amount', header: 'Total Booking', format: (v: unknown) => formatCurrency(v as number) },
    { key: 'amount', header: 'Amount Paid', format: (v: unknown) => formatCurrency(v as number) },
    {
      key: 'balance', header: 'Balance Remaining', format: (v: unknown, row: CSVExportable) => {
        const total = (row.total_amount as number) || 0;
        const paid = (row.amount as number) || 0;
        return formatCurrency(Math.max(0, total - paid));
      }
    },
    {
      key: 'payment_type', header: 'Payment Type', format: (v: unknown) => {
        const type = v as string;
        return type === 'full' ? 'Full Payment' : type === 'half' ? '50% Downpayment' : String(type || '');
      }
    },
    {
      key: 'original_method', header: 'Payment Method', format: (v: unknown, row: CSVExportable) => {
        const method = String(row.original_method || row.payment_method || '');
        return method ? method.toUpperCase() : '';
      }
    },
    {
      key: 'original_reference', header: 'Reference Number', format: (v: unknown, row: CSVExportable) => {
        return String(row.original_reference || row.reference_number || '');
      }
    },
    {
      key: 'status', header: 'Payment Status', format: (v: unknown) => {
        const status = (v as string || '').toLowerCase();
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
      }
    },
    {
      key: 'booking_status', header: 'Booking Status', format: (v: unknown) => {
        const status = (v as string || '').toLowerCase();
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
      }
    },
    {
      key: 'check_in_date', header: 'Check-in Date', format: (v: unknown, row: CSVExportable) => {
        return formatDate((row.check_in_date || row.date) as string);
      }
    },
    { key: 'verified_at', header: 'Verified On', format: (v: unknown) => formatDate(v as string) },
  ];

  exportToCSV(payments, 'kampo_ibayo_payments', columns);
};

// =====================
// FILTERED BOOKINGS EXPORT (with options)
// =====================
export const exportFilteredBookingsCSV = (
  bookings: CSVExportable[],
  options: {
    includeDeletedUsers?: boolean;
    dateRange?: { start: string; end: string };
    status?: string;
  } = {}
) => {
  let filteredBookings = [...bookings];

  // Apply filters
  if (!options.includeDeletedUsers) {
    filteredBookings = filteredBookings.filter(booking => booking.user_exists !== false);
  }

  if (options.status) {
    filteredBookings = filteredBookings.filter(booking => booking.status === options.status);
  }

  if (options.dateRange) {
    filteredBookings = filteredBookings.filter(booking => {
      const createdAt = booking.created_at as string;
      if (!createdAt) return false;
      const bookingDate = new Date(createdAt);
      const startDate = new Date(options.dateRange!.start);
      const endDate = new Date(options.dateRange!.end);
      return bookingDate >= startDate && bookingDate <= endDate;
    });
  }

  // Generate filename with filters
  let filename = 'kampo_ibayo_bookings';
  if (options.status) {
    filename += `_${options.status}`;
  }
  if (options.dateRange) {
    filename += `_${options.dateRange.start}_to_${options.dateRange.end}`;
  }

  const columns = [
    { key: 'id', header: 'Booking ID', format: (v: unknown) => formatBookingId(v as number) },
    { key: 'guest_name', header: 'Guest Name', format: (v: unknown) => String(v || '') },
    { key: 'guest_email', header: 'Email', format: (v: unknown) => String(v || '') },
    { key: 'guest_phone', header: 'Phone', format: (v: unknown) => formatPhoneNumber(v as string) },
    { key: 'check_in_date', header: 'Check-in', format: (v: unknown) => formatDate(v as string) },
    { key: 'check_out_date', header: 'Check-out', format: (v: unknown) => formatDate(v as string) },
    {
      key: 'nights', header: 'Nights', format: (v: unknown, row: CSVExportable) => {
        const checkIn = row.check_in_date as string;
        const checkOut = row.check_out_date as string;
        if (!checkIn || !checkOut) return '';
        const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
        return String(nights);
      }
    },
    { key: 'number_of_guests', header: 'Guests', format: (v: unknown) => String(v || 0) },
    { key: 'total_amount', header: 'Total Amount', format: (v: unknown) => formatCurrency(v as number) },
    {
      key: 'payment_type', header: 'Payment Type', format: (v: unknown) => {
        const type = v as string;
        return type === 'full' ? 'Full Payment' : '50% Downpayment';
      }
    },
    {
      key: 'status', header: 'Booking Status', format: (v: unknown) => {
        const status = (v as string || 'pending').toLowerCase();
        return status.charAt(0).toUpperCase() + status.slice(1);
      }
    },
    {
      key: 'payment_status', header: 'Payment Status', format: (v: unknown) => {
        const status = (v as string || 'pending').toLowerCase();
        return status.charAt(0).toUpperCase() + status.slice(1);
      }
    },
    { key: 'special_requests', header: 'Special Requests', format: (v: unknown) => String(v || 'None') },
    { key: 'created_at', header: 'Booked On', format: (v: unknown) => formatDate(v as string) },
  ];

  exportToCSV(filteredBookings, filename, columns);
};

// Legacy: Keep for backwards compatibility
export const preprocessBookingData = (bookings: CSVExportable[]) => {
  return bookings.map(booking => {
    const totalAmount = typeof booking.total_amount === 'number' ? booking.total_amount : 0;
    const checkInDate = typeof booking.check_in_date === 'string' ? booking.check_in_date : '';
    const checkOutDate = typeof booking.check_out_date === 'string' ? booking.check_out_date : '';
    const createdAt = typeof booking.created_at === 'string' ? booking.created_at : '';
    const status = typeof booking.status === 'string' ? booking.status : '';

    return {
      ...booking,
      total_amount: totalAmount ? `₱${totalAmount.toLocaleString()}` : '₱0',
      check_in_date: checkInDate ? new Date(checkInDate).toLocaleDateString() : '',
      check_out_date: checkOutDate ? new Date(checkOutDate).toLocaleDateString() : '',
      created_at: createdAt ? new Date(createdAt).toLocaleDateString() : '',
      user_exists: booking.user_exists === false ? 'No' : 'Yes',
      payment_type: booking.payment_type === 'full' ? 'Full Payment' : 'Down Payment (50%)',
      status: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending'
    };
  });
};