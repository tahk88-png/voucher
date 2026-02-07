import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency amount (minor units to major units).
 * Defaults to EUR for Figma surfaces.
 */
export function formatCurrency(amount: number, currency: string = "EUR") {
  const major = amount / 100
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(major)
}

/**
 * Format percentage from basis points.
 */
export function formatPercentage(basisPoints: number) {
  return `${(basisPoints / 100).toFixed(0)}%`
}

/**
 * Safely parse JSON that may arrive as string or object.
 */
export function safeParseJson<T = unknown>(value: unknown): T | null {
  if (value === null || value === undefined) return null
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }
  return value as T
}

/**
 * Lightweight helper to hash an identifier; uses Web Crypto if available.
 */
export async function hashFriendIdentifier(identifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(identifier.toLowerCase().trim())
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode("voucher-default-secret"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign("HMAC", key, data)
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}
