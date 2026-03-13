import { z } from "zod";

export const completeProfileSchema = z.object({
  nim: z
    .string()
    .trim()
    .min(1, "Student ID is required")
    .max(8, "Student ID must be at most 8 characters")
    .regex(/^[a-zA-Z0-9]+$/, "Student ID must be alphanumeric"),
  yearOfEntry: z
    .number({ required_error: "Year of entry is required" })
    .int()
    .min(1950, "Invalid year of entry")
    .max(new Date().getFullYear(), "Invalid year of entry"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .max(13, "Phone number must be at most 13 characters")
    .regex(/^(\+62|0)\d+$/, "Phone number must start with +62 or 0 and contain only digits"),
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
