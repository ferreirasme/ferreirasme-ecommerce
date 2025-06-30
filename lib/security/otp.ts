import crypto from 'crypto';

// Generate secure alphanumeric OTP
export function generateSecureOTP(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(length);
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += chars[bytes[i] % chars.length];
  }
  
  return otp;
}

// OTP configuration
export const OTP_CONFIG = {
  length: 8,
  expirationMinutes: 5,
  maxAttempts: 3,
  blockDurationMinutes: 30,
} as const;

// Generate OTP expiration timestamp
export function getOTPExpiration(): Date {
  const expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + OTP_CONFIG.expirationMinutes);
  return expiration;
}

// Check if OTP is expired
export function isOTPExpired(expiresAt: Date | string): boolean {
  const expiration = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return new Date() > expiration;
}

// Hash OTP for storage (optional extra security)
export async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}