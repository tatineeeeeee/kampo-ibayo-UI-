/**
 * Phone number utility functions for consistent formatting
 */

/**
 * Convert Philippine phone number to international format (+63)
 * @param phone - Phone number in various formats
 * @returns Formatted phone number with +63 prefix
 */
export const formatPhoneToInternational = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Convert to +63 format
  if (cleaned.startsWith('0')) {
    // 09123456789 -> +639123456789
    cleaned = cleaned.replace(/^0/, '+63');
  } else if (cleaned.startsWith('63') && !cleaned.startsWith('+63')) {
    // 639123456789 -> +639123456789
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+63') && cleaned.length === 10) {
    // 9123456789 -> +639123456789
    cleaned = '+63' + cleaned;
  } else if (!cleaned.startsWith('+63')) {
    // Assume it needs +63 prefix
    cleaned = '+63' + cleaned;
  }
  
  return cleaned;
};

/**
 * Format phone number for display (09XX-XXX-XXXX)
 * @param phone - Phone number in any format
 * @returns Formatted phone number for display
 */
export const formatPhoneForDisplay = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Convert from +63 format to local format if needed
  if (cleaned.startsWith('63') && cleaned.length === 12) {
    cleaned = '0' + cleaned.substring(2);
  }
  
  // Limit to 11 digits
  cleaned = cleaned.slice(0, 11);
  
  // Format as 09XX-XXX-XXXX
  if (cleaned.length >= 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length >= 4) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  
  return cleaned;
};

/**
 * Validate Philippine phone number
 * @param phone - Phone number to validate
 * @returns True if valid Philippine mobile number
 */
export const validatePhilippinePhone = (phone: string): boolean => {
  if (!phone) return false;
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's 11 digits starting with 09
  // or 12 digits starting with 63
  // or 13 characters starting with +63
  if (cleaned.length === 11 && cleaned.startsWith('09')) {
    return true;
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('639')) {
    return true;
  }
  
  if (phone.startsWith('+63') && cleaned.length === 12) {
    return true;
  }
  
  return false;
};

/**
 * Extract clean phone number for database storage
 * Always returns international format (+63XXXXXXXXXX)
 */
export const cleanPhoneForDatabase = (phone: string): string => {
  return formatPhoneToInternational(phone);
};

/**
 * Format phone number for user-friendly display
 * Converts +639123456789 back to 0912-345-6789 for better readability
 * @param phone - Phone number (usually from database in +63 format)
 * @returns User-friendly formatted phone number
 */
export const displayPhoneNumber = (phone: string | null): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Convert from international format to local display format
  if (cleaned.startsWith('63') && cleaned.length === 12) {
    cleaned = '0' + cleaned.substring(2);
  }
  
  // Format as 0912-345-6789 for display
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // Return as-is if format doesn't match expected patterns
  return phone;
};