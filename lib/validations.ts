import { z } from 'zod';

/**
 * Common validation schemas
 */

export const emailSchema = z.string().email('Invalid email address');

export const currencySchema = z.string().length(3, 'Currency must be 3 characters (ISO 4217)');

export const voucherValueSchema = z.number().int().positive('Value must be positive');

export const dateRangeSchema = z.object({
  validFrom: z.string().datetime(),
  validTo: z.string().datetime(),
}).refine(
  (data) => new Date(data.validTo) > new Date(data.validFrom),
  {
    message: 'Valid to date must be after valid from date',
    path: ['validTo'],
  }
);

export const weeklyDropSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  stock: z.number().int().positive(),
  durationMinutes: z.number().int().positive(),
});

export const voucherDesignSchema = z.object({
  headline: z.string().optional(),
  finePrint: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (hex)').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (hex)').optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (hex)').optional(),
  logo: z.string().url().nullable().optional(),
});
