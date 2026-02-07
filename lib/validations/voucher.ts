import { z } from "zod"
import { optionalImageSchema, priceSchema, dateRangeSchema, slugSchema } from "./common"

export const voucherFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be at most 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must be at most 500 characters"),
  shortDescription: z.string().max(200, "Short description must be at most 200 characters").optional(),
  price: priceSchema,
  originalPrice: priceSchema.optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  image: optionalImageSchema,
  slug: slugSchema.optional(),
  validFrom: z.date(),
  validUntil: z.date(),
  terms: z.string().min(10, "Terms must be at least 10 characters").max(1000, "Terms must be at most 1000 characters"),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
}).refine((data) => {
  return data.validUntil > data.validFrom
}, {
  message: "End date must be after start date",
  path: ["validUntil"],
}).refine((data) => {
  if (data.originalPrice && data.price) {
    return data.price <= data.originalPrice
  }
  return true
}, {
  message: "Price must be less than or equal to original price",
  path: ["price"],
})

export type VoucherFormValues = z.infer<typeof voucherFormSchema>
