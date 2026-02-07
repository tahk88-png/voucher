import { z } from "zod"

// Common validation schemas that can be reused across the app

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address")

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")

export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid phone number")

export const urlSchema = z
  .string()
  .url("Invalid URL")
  .or(z.literal(""))

export const slugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(50, "Slug must be at most 50 characters")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens only")

export const dateRangeSchema = z.object({
  from: z.date(),
  to: z.date().optional(),
}).refine((data) => {
  if (data.to) {
    return data.to >= data.from
  }
  return true
}, {
  message: "End date must be after start date",
  path: ["to"],
})

export const imageSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 5 * 1024 * 1024, "Image must be less than 5MB")
  .refine(
    (file) => ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type),
    "Only JPEG, PNG, and WebP images are allowed"
  )

export const optionalImageSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 5 * 1024 * 1024, "Image must be less than 5MB")
  .refine(
    (file) => ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type),
    "Only JPEG, PNG, and WebP images are allowed"
  )
  .optional()
  .or(z.string().url().optional())

export const priceSchema = z
  .number()
  .min(0, "Price must be positive")
  .max(1000000, "Price must be less than 1,000,000")

export const discountSchema = z
  .number()
  .min(0, "Discount must be at least 0%")
  .max(100, "Discount cannot exceed 100%")

export const quantitySchema = z
  .number()
  .int("Quantity must be a whole number")
  .min(1, "Quantity must be at least 1")
  .max(10000, "Quantity cannot exceed 10,000")
