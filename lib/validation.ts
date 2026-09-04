/**
 * Validation utilities for common form fields
 * Password strength, email validation, field patterns
 */

export interface PasswordStrength {
  score: number; // 0-4 (very weak to very strong)
  strength: 'very-weak' | 'weak' | 'moderate' | 'strong' | 'very-strong';
  feedback: string;
  requirements: {
    hasMinLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
  };
}

/**
 * Evaluate password strength with detailed feedback
 * Checks: length, uppercase, lowercase, numbers, special chars
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    hasMinLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const metRequirements = Object.values(requirements).filter(Boolean).length;

  let score: number;
  let strength: PasswordStrength['strength'];
  let feedback: string;

  if (password.length === 0) {
    score = 0;
    strength = 'very-weak';
    feedback = 'Password is required';
  } else if (metRequirements <= 1) {
    score = 0;
    strength = 'very-weak';
    feedback = 'Too weak. Add uppercase, numbers, and special characters';
  } else if (metRequirements === 2) {
    score = 1;
    strength = 'weak';
    feedback = 'Weak. Add more character types';
  } else if (metRequirements === 3) {
    score = 2;
    strength = 'moderate';
    feedback = 'Moderate. Consider adding more character variety';
  } else if (metRequirements === 4) {
    score = 3;
    strength = 'strong';
    feedback = 'Strong password';
  } else {
    score = 4;
    strength = 'very-strong';
    feedback = 'Very strong password';
  }

  return {
    score,
    strength,
    feedback,
    requirements,
  };
}

/**
 * Validate email format with RFC 5322 basic check
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get email validation feedback
 */
export function getEmailFeedback(email: string): {
  isValid: boolean;
  message: string;
} {
  if (!email) {
    return { isValid: false, message: 'Email is required' };
  }

  if (email.length > 254) {
    return { isValid: false, message: 'Email is too long' };
  }

  if (!email.includes('@')) {
    return { isValid: false, message: 'Email must contain @' };
  }

  const [localPart, domain] = email.split('@');

  if (!localPart || localPart.length > 64) {
    return { isValid: false, message: 'Email local part is invalid' };
  }

  if (!domain || !domain.includes('.')) {
    return { isValid: false, message: 'Email domain is invalid' };
  }

  if (!isValidEmail(email)) {
    return { isValid: false, message: 'Email format is invalid' };
  }

  return { isValid: true, message: 'Email looks good' };
}

/**
 * Validate phone number (basic international format)
 */
export function isValidPhone(phone: string): boolean {
  // Remove common separators
  const cleaned = phone.replace(/[\s\-()]/g, '');
  // Check if it's 10-15 digits, optionally starting with +
  return /^\+?\d{10,15}$/.test(cleaned);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate required field
 */
export function isRequired(value: string | undefined | null): boolean {
  return Boolean(value && value.trim().length > 0);
}

/**
 * Validate minimum length
 */
export function hasMinLength(value: string, min: number): boolean {
  return value.length >= min;
}

/**
 * Validate maximum length
 */
export function hasMaxLength(value: string, max: number): boolean {
  return value.length <= max;
}

/**
 * Match two fields (e.g., password confirmation)
 */
export function fieldsMatch(value1: string, value2: string): boolean {
  return value1 === value2;
}
