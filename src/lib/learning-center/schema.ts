import { z } from "zod"

export const MentorFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").or(z.literal("")).nullable(),
  status: z.enum(["Being Reviewed", "Waitlisted", "Onboarded", "Active", "Inactive"]).default("Active"),
  expertise: z.array(z.string()).default([]),
  contact_number: z.string().or(z.literal("")).nullable(),
  linkedin_url: z.string().url("Invalid URL").or(z.literal("")).nullable(),
  city: z.string().or(z.literal("")).nullable(),
})

export type MentorFormValues = z.infer<typeof MentorFormSchema>

export const CategoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").or(z.literal("")).nullable().optional(),
})

export type CategoryFormValues = z.infer<typeof CategoryFormSchema>

export const SubcategoryFormSchema = z.object({
  category_id: z.string().min(1, "Parent category is required"),
  name: z.string().min(1, "Subcategory name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").or(z.literal("")).nullable().optional(),
})

export type SubcategoryFormValues = z.infer<typeof SubcategoryFormSchema>

// Set to true in the future when category and subcategory become mandatory
const IS_CATEGORY_REQUIRED = false

export const SessionFormSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  mentor_id: z.string().or(z.literal("")).nullable().optional(),
  date: z.string().min(1, "Date is required"),
  start_time: z.string().or(z.literal("")).nullable().optional(),
  duration_minutes: z.number().min(1, "Duration must be at least 1 minute"),
  mode: z.string().default("Online"),
  platform: z.string().or(z.literal("")).nullable().optional(),
  meeting_link: z.string().or(z.literal("")).nullable().optional(),
  audience_id: z.string().or(z.literal("")).nullable().optional(),
  category_id: IS_CATEGORY_REQUIRED
    ? z.string().min(1, "Category is required")
    : z.string().or(z.literal("")).nullable().optional(),
  subcategory_id: IS_CATEGORY_REQUIRED
    ? z.string().min(1, "Subcategory is required")
    : z.string().or(z.literal("")).nullable().optional(),
  description: z.string().or(z.literal("")).nullable().optional(),
})

export type SessionFormValues = z.infer<typeof SessionFormSchema>
