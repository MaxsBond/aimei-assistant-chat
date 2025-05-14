/**
 * Validation utility functions
 */

/**
 * Validates a phone number format
 * Supports various formats including:
 * - US: (123) 456-7890, 123-456-7890, 123.456.7890
 * - International: +1 123-456-7890, +44 1234 567890
 * 
 * @param phoneNumber - The phone number to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validatePhoneNumber(phoneNumber: string): { 
  isValid: boolean; 
  error?: string;
} {
  // Remove all non-numeric characters except + for country code
  const cleaned = phoneNumber.replace(/\s+/g, '');
  
  // Very basic check - must be at least 7 digits (local number minimum)
  if (cleaned.length < 7) {
    return {
      isValid: false,
      error: 'Phone number is too short'
    };
  }
  
  // Check for international format with + prefix
  if (cleaned.startsWith('+')) {
    // International number validation
    // Most international numbers are 7-15 digits plus country code
    const digitCount = cleaned.replace(/\D/g, '').length;
    
    if (digitCount < 7 || digitCount > 15) {
      return {
        isValid: false,
        error: 'International number should have 7-15 digits plus country code'
      };
    }
  } else {
    // US/North American validation
    // Must be 10 digits for standard US number
    const digitCount = cleaned.replace(/\D/g, '').length;
    
    if (digitCount !== 10) {
      return {
        isValid: false,
        error: 'U.S. number should have exactly 10 digits'
      };
    }
  }
  
  // Additional pattern matching for common formats
  const commonPatterns = [
    /^\+?[1-9]\d{1,14}$/, // E.164 format
    /^\+?[1-9]\d{1,3}[-.\s]?\d{1,14}$/, // International with optional separator
    /^(\+?[1-9]\d{1,3})?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/, // North American pattern
  ];
  
  const matchesAnyPattern = commonPatterns.some(pattern => pattern.test(cleaned));
  
  if (!matchesAnyPattern) {
    return {
      isValid: false,
      error: 'Invalid phone number format'
    };
  }
  
  return { isValid: true };
}

/**
 * Format a phone number for display
 * 
 * @param phoneNumber - The raw phone number
 * @returns Formatted phone number string
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a US number (10 digits)
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  }
  
  // For international numbers that start with +
  if (phoneNumber.startsWith('+')) {
    // Try to format with country code
    const countryCode = phoneNumber.match(/^\+(\d+)/)?.[1];
    
    if (countryCode) {
      const nationalNumber = digitsOnly.slice(countryCode.length);
      // Simple international format with space after country code
      return `+${countryCode} ${nationalNumber}`;
    }
  }
  
  // If we can't determine the format, return original with spaces between groups
  return phoneNumber;
} 