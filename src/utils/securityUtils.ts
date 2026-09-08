/**
 * Security & Authentication Utilities for Bakery Management POS
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  score: number; // 0 to 5
}

/**
 * Validates password against strict policy:
 * - Minimum 8 characters
 * - Uppercase letter (A-Z)
 * - Lowercase letter (a-z)
 * - Number (0-9)
 * - Special symbol (!@#$%^&*...)
 */
export function validatePassword(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password);

  const errors: string[] = [];
  if (!hasMinLength) errors.push('8 خانات على الأقل');
  if (!hasUppercase) errors.push('حرف كبير إنجليزي واحد على الأقل (A-Z)');
  if (!hasLowercase) errors.push('حرف صغير إنجليزي واحد على الأقل (a-z)');
  if (!hasNumber) errors.push('رقم واحد على الأقل (0-9)');
  if (!hasSpecialChar) errors.push('رمز خاص واحد على الأقل (@, #, $, %, !...)');

  let score = 0;
  if (hasMinLength) score++;
  if (hasUppercase) score++;
  if (hasLowercase) score++;
  if (hasNumber) score++;
  if (hasSpecialChar) score++;

  return {
    isValid: errors.length === 0,
    errors,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    score,
  };
}

/**
 * Checks if password has expired (> 30 days)
 */
export function isPasswordExpired(updatedAt?: string, expiryDays: number = 30): boolean {
  if (!updatedAt) return false;
  const updatedTime = new Date(updatedAt).getTime();
  if (isNaN(updatedTime)) return false;
  const ageMs = Date.now() - updatedTime;
  const maxAgeMs = expiryDays * 24 * 60 * 60 * 1000;
  return ageMs > maxAgeMs;
}

/**
 * Calculate remaining days before password expiry
 */
export function getPasswordRemainingDays(updatedAt?: string, expiryDays: number = 30): number {
  if (!updatedAt) return expiryDays;
  const updatedTime = new Date(updatedAt).getTime();
  if (isNaN(updatedTime)) return expiryDays;
  const elapsedDays = (Date.now() - updatedTime) / (24 * 60 * 60 * 1000);
  return Math.max(0, Math.ceil(expiryDays - elapsedDays));
}

/**
 * Human-readable device and browser detection
 */
export function getDeviceInfo(): string {
  if (typeof window === 'undefined' || !navigator) return 'جهاز غير معروف';
  const ua = navigator.userAgent || '';
  
  let browser = 'متصفح ويب';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome') && !ua.includes('Edg/')) browser = 'Google Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Apple Safari';
  else if (ua.includes('OPR') || ua.includes('Opera')) browser = 'Opera';

  let os = 'نظام تشغيل';
  if (ua.includes('Windows')) os = 'Windows PC';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android Mobile';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS (iPhone/iPad)';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${browser} على ${os}`;
}

/**
 * Generate 6-digit random verification code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generates unique active session token
 */
export function generateSessionToken(userId: string): string {
  const rand = Math.random().toString(36).substring(2, 10);
  return `sess_${userId}_${Date.now()}_${rand}`;
}
