import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency amount (minor units to major units)
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const major = amount / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(major);
}

/**
 * Format percentage (basis points to percentage)
 */
export function formatPercentage(basisPoints: number): string {
  return `${(basisPoints / 100).toFixed(0)}%`;
}

/**
 * Hash friend identifier (phone/email) for privacy using HMAC-SHA256
 * Uses proper HMAC instead of simple concatenation to prevent rainbow table attacks
 */
export async function hashFriendIdentifier(identifier: string): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be at least 32 characters for secure hashing');
  }

  const encoder = new TextEncoder();

  // Import secret as CryptoKey for HMAC
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Generate HMAC signature
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(identifier.toLowerCase().trim())
  );

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Safely parse JSON from Prisma Json fields
 * Prisma Json fields can be objects (already parsed) or strings (need parsing)
 */
export function safeParseJson<T = unknown>(value: unknown): T | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  // Already an object (Prisma deserialized it)
  return value as T;
}
