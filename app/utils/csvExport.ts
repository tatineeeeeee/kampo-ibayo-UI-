/**
 * CSV Export Utility for Admin Tables
 * Safe, reusable functions for exporting data to CSV format
 */

// Type definitions
interface CSVExportable {
  [key: string]: string | number | boolean | null | undefined | object;
}

// Type-safe CSV export function
export function exportToCSV<T extends CSVExportable>(
  data: T[],
  filename: string,
  columnMapping?: { [key: string]: string }
): void {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  try {
    // Get headers from the first row or use provided mapping
    const firstRow = data[0];
    const headers = columnMapping ? Object.keys(columnMapping) : Object.keys(firstRow);
    const headerLabels = columnMapping ? Object.values(columnMapping) : headers;

    // Create CSV content
    const csvContent = [
      // Header row
      headerLabels.map(header => `"${header}"`).join(','),
      // Data rows
      ...data.map(row => 
        headers.map(header => {
          let value = row[header];
          
          // Handle different data types safely
          if (value === null || value === undefined) {
            value = '';
          } else if (typeof value === 'object') {
            // Convert objects/arrays to JSON string
            value = JSON.stringify(value);
          } else if (typeof value === 'boolean') {
            value = value ? 'Yes' : 'No';
          } else {
            value = String(value);
          }
          
          // Escape quotes and wrap in quotes for CSV safety
          return `"${value.toString().replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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

// Pre-configured export functions for each admin page
export const exportBookingsCSV = (bookings: CSVExportable[]) => {
  const columnMapping = {
    id: 'Booking ID',
    guest_name: 'Guest Name',
    guest_email: 'Guest Email',
    guest_phone: 'Guest Phone',
    check_in_date: 'Check-in Date',
    check_out_date: 'Check-out Date',
    number_of_guests: 'Number of Guests',
    total_amount: 'Total Amount (PHP)',
    payment_type: 'Payment Type',
    status: 'Booking Status',
    payment_status: 'Payment Status',
    special_requests: 'Special Requests',
    created_at: 'Booking Date',
    user_exists: 'User Account Active'
  };
  
  exportToCSV(bookings, 'kampo_ibayo_bookings', columnMapping);
};

export const exportUsersCSV = (users: CSVExportable[]) => {
  const columnMapping = {
    id: 'User ID',
    name: 'Full Name',
    email: 'Email Address',
    phone: 'Phone Number',
    created_at: 'Registration Date',
    updated_at: 'Last Updated',
    auth_id: 'Auth ID'
  };
  
  exportToCSV(users, 'kampo_ibayo_users', columnMapping);
};

export const exportPaymentsCSV = (payments: CSVExportable[]) => {
  const columnMapping = {
    id: 'Payment ID',
    user: 'Guest Name',
    email: 'Guest Email', 
    amount: 'Amount (PHP)',
    date: 'Payment Date',
    status: 'Payment Status',
    payment_intent_id: 'PayMongo Intent ID',
    booking_status: 'Booking Status',
    payment_status: 'Processing Status'
  };
  
  exportToCSV(payments, 'kampo_ibayo_payments', columnMapping);
};

// Enhanced export with filtering options
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
  
  const columnMapping = {
    id: 'Booking ID',
    guest_name: 'Guest Name',
    guest_email: 'Guest Email',
    guest_phone: 'Guest Phone',
    check_in_date: 'Check-in Date',
    check_out_date: 'Check-out Date',
    number_of_guests: 'Number of Guests',
    total_amount: 'Total Amount (PHP)',
    payment_type: 'Payment Type',
    status: 'Booking Status',
    payment_status: 'Payment Status',
    special_requests: 'Special Requests',
    created_at: 'Booking Date',
    user_exists: 'User Account Active'
  };
  
  exportToCSV(filteredBookings, filename, columnMapping);
};

// Utility to format data before export (optional preprocessing)
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