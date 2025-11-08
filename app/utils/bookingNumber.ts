/**
 * Booking Number Utility
 * Handles scalable booking number formatting for Kampo Ibayo Resort
 * 
 * Format Logic:
 * - 1-9999: KB-0001, KB-0002, ..., KB-9999 (zero-padded to 4 digits)
 * - 10000+: KB-10000, KB-10001, KB-25000, etc. (natural length)
 * 
 * This ensures:
 * ✅ Professional appearance for small numbers (KB-0001)
 * ✅ Scalable for high volumes (KB-10000, KB-50000)
 * ✅ Consistent branding (KB prefix)
 * ✅ Easy sorting and recognition
 */

export const formatBookingNumber = (bookingId: number): string => {
  // Validate input
  if (!bookingId || bookingId < 1) {
    throw new Error('Booking ID must be a positive number');
  }

  const KB_PREFIX = 'KB-';
  
  // For bookings 1-9999: use zero-padded 4-digit format (KB-0001)
  if (bookingId <= 9999) {
    return `${KB_PREFIX}${bookingId.toString().padStart(4, '0')}`;
  }
  
  // For bookings 10000+: use natural length (KB-10000, KB-25000)
  return `${KB_PREFIX}${bookingId}`;
};

/**
 * Parse booking number back to ID
 * Examples:
 * - "KB-0001" → 1
 * - "KB-10000" → 10000
 * - "#123" → null (invalid format)
 */
export const parseBookingNumber = (bookingNumber: string): number | null => {
  if (!bookingNumber) return null;
  
  const KB_PREFIX = 'KB-';
  
  // Check if it starts with our prefix
  if (!bookingNumber.startsWith(KB_PREFIX)) {
    return null;
  }
  
  // Extract the number part
  const numberPart = bookingNumber.substring(KB_PREFIX.length);
  const parsed = parseInt(numberPart, 10);
  
  // Validate it's a positive integer
  if (isNaN(parsed) || parsed < 1) {
    return null;
  }
  
  return parsed;
};

/**
 * Check if a string matches our booking number format
 * Used for search validation and filtering
 */
export const isValidBookingNumberFormat = (input: string): boolean => {
  return parseBookingNumber(input) !== null;
};

/**
 * Generate a range of booking numbers for testing/display
 * Useful for admin demos or bulk operations
 */
export const generateBookingNumberRange = (startId: number, endId: number): string[] => {
  const range: string[] = [];
  
  for (let id = startId; id <= endId; id++) {
    range.push(formatBookingNumber(id));
  }
  
  return range;
};

/**
 * Get next expected booking number for display
 * Useful for showing "Next booking will be: KB-0123"
 */
export const getNextBookingNumber = (currentHighestId: number): string => {
  return formatBookingNumber(currentHighestId + 1);
};

// Example usage and test cases:
/*
Examples of output:
formatBookingNumber(1)      → "KB-0001"
formatBookingNumber(25)     → "KB-0025"  
formatBookingNumber(999)    → "KB-0999"
formatBookingNumber(9999)   → "KB-9999"
formatBookingNumber(10000)  → "KB-10000"
formatBookingNumber(25000)  → "KB-25000"
formatBookingNumber(100000) → "KB-100000"

parseBookingNumber("KB-0001")  → 1
parseBookingNumber("KB-10000") → 10000
parseBookingNumber("invalid")  → null

This approach scales naturally:
- Your first 9,999 bookings look professional: KB-0001 to KB-9999
- Beyond that, it grows naturally: KB-10000, KB-50000, KB-999999
- No arbitrary limits or formatting breaks
- Always maintains the KB- branding
- Easy to search, sort, and reference
*/