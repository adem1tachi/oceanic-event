/**
 * Algerian Mobile Phone Normalization & Validation Utilities
 * 
 * Rules:
 * - Algerian mobile operators use prefixes 05 (Ooredoo), 06 (Mobilis), and 07 (Djezzy).
 * - Total national length is 10 digits (e.g., 05XX XX XX XX).
 * - Accepted inputs:
 *   - Local format: 05XXXXXXXX, 06XXXXXXXX, 07XXXXXXXX
 *   - International: +2135XXXXXXXX, +2136XXXXXXXX, +2137XXXXXXXX
 *   - Double-zero international: 002135XXXXXXXX, etc.
 *   - Plain country code: 2135XXXXXXXX
 *   - Formatted: spaces, hyphens, periods, or parentheses like +213 (0) 550 12 34 56
 * 
 * Canonical storage format:
 *   E.164: +213XXXXXXXXX (where XXXXXXXXX starts with 5, 6, or 7 followed by 8 digits)
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized?: string;
  error?: string;
}

/**
 * Normalizes and validates an Algerian mobile phone number.
 * 
 * @param input Raw phone input string from form
 * @returns PhoneValidationResult with normalized E.164 string if valid
 */
export function normalizeAlgerianPhone(input: string): PhoneValidationResult {
  if (!input || typeof input !== "string") {
    return { isValid: false, error: "phone_required" };
  }

  // Remove whitespace, hyphens, dots, parentheses
  let cleaned = input.trim().replace(/[\s\-\.\(\)]/g, "");

  // Remove leading '+' or '00' international prefix if present
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1);
  } else if (cleaned.startsWith("00")) {
    cleaned = cleaned.slice(2);
  }

  // Handle '213' country prefix
  if (cleaned.startsWith("213")) {
    cleaned = cleaned.slice(3);
    // If user wrote +213 05... or +213 (0) 5... strip the redundant leading 0
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.slice(1);
    }
  } else if (cleaned.startsWith("0")) {
    // Local national format: 05..., 06..., 07...
    cleaned = cleaned.slice(1);
  }

  // At this stage, cleaned must be exactly 9 digits and start with 5, 6, or 7
  const algerianMobileRegex = /^[567]\d{8}$/;

  if (!algerianMobileRegex.test(cleaned)) {
    return {
      isValid: false,
      error: "invalid_algerian_phone",
    };
  }

  return {
    isValid: true,
    normalized: `+213${cleaned}`,
  };
}

/**
 * Formats a normalized or raw phone number into standard national display format (0X XX XX XX XX)
 * 
 * @param phone E.164 or national phone string
 * @returns Formatted phone string or original if invalid
 */
export function formatAlgerianPhoneDisplay(phone: string): string {
  const result = normalizeAlgerianPhone(phone);
  if (!result.isValid || !result.normalized) {
    return phone;
  }

  // E.164 format is +213XXXXXXXXX
  const nationalDigits = "0" + result.normalized.slice(4); // 05XXXXXXXX
  // Format as 0550 12 34 56
  return `${nationalDigits.slice(0, 4)} ${nationalDigits.slice(4, 6)} ${nationalDigits.slice(6, 8)} ${nationalDigits.slice(8, 10)}`;
}

/**
 * Quick boolean checker for Algerian mobile numbers
 */
export function isValidAlgerianPhone(input: string): boolean {
  return normalizeAlgerianPhone(input).isValid;
}
