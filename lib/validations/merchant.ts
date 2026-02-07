import { z } from "zod"
import { emailSchema, phoneSchema, urlSchema, slugSchema, optionalImageSchema } from "./common"

export const merchantProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be at most 100 characters"),
  slug: slugSchema,
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must be at most 1000 characters"),
  logo: optionalImageSchema,
  coverImage: optionalImageSchema,
  email: emailSchema,
  phone: phoneSchema,
  website: urlSchema,
  address: z.string().min(5, "Address must be at least 5 characters").max(200, "Address must be at most 200 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  category: z.string().min(1, "Category is required"),
  socialMedia: z.object({
    facebook: urlSchema,
    instagram: urlSchema,
    twitter: urlSchema,
    linkedin: urlSchema,
  }).optional(),
})

export type MerchantProfileFormValues = z.infer<typeof merchantProfileSchema>

export const merchantBrandSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  font: z.string().min(1, "Font is required"),
  logoPosition: z.enum(["left", "center", "right"]).optional(),
  customCss: z.string().max(5000, "Custom CSS must be at most 5000 characters").optional(),
})

export type MerchantBrandFormValues = z.infer<typeof merchantBrandSchema>

export const campaignFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be at most 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must be at most 1000 characters"),
  image: optionalImageSchema,
  startDate: z.date(),
  endDate: z.date(),
  budget: z.number().min(0, "Budget must be positive").optional(),
  targetAudience: z.string().max(500, "Target audience must be at most 500 characters").optional(),
  goals: z.string().max(500, "Goals must be at most 500 characters").optional(),
  status: z.enum(["draft", "active", "paused", "ended"]).optional(),
}).refine((data) => {
  return data.endDate > data.startDate
}, {
  message: "End date must be after start date",
  path: ["endDate"],
})

export type CampaignFormValues = z.infer<typeof campaignFormSchema>
