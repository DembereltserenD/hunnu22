// Validation schemas for Admin Dashboard forms using Zod

import { z } from 'zod';

// Worker validation schema
export const workerSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  email: z.string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val || val === '') return true;
      // Basic phone validation - allows various formats
      return /^[\+]?[1-9][\d]{0,15}$/.test(val.replace(/[\s\-\(\)]/g, ''));
    }, 'Invalid phone number format')
});

// Building validation schema
export const buildingSchema = z.object({
  name: z.string()
    .min(1, 'Building name is required')
    .max(100, 'Building name must be less than 100 characters')
    .trim(),
  address: z.string()
    .min(1, 'Address is required')
    .max(200, 'Address must be less than 200 characters')
    .trim(),
  total_units: z.number()
    .int('Total units must be a whole number')
    .min(1, 'Building must have at least 1 unit')
    .max(1000, 'Total units cannot exceed 1000')
});

// Apartment validation schema
export const apartmentSchema = z.object({
  building_id: z.string()
    .uuid('Invalid building selection')
    .min(1, 'Building selection is required'),
  unit_number: z.string()
    .min(1, 'Unit number is required')
    .max(20, 'Unit number must be less than 20 characters')
    .trim()
    .refine((val) => {
      // Unit number should contain at least one digit
      return /\d/.test(val);
    }, 'Unit number must contain at least one digit')
});

// Search parameters validation
export const searchParamsSchema = z.object({
  query: z.string().optional(),
  page: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return isNaN(num) ? 1 : Math.max(1, num);
  }).optional().default(1),
  limit: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return isNaN(num) ? 10 : Math.min(100, Math.max(1, num));
  }).optional().default(10)
});

export const workerSearchParamsSchema = searchParamsSchema.extend({
  has_email: z.string().optional(),
  has_phone: z.string().optional()
});

export const buildingSearchParamsSchema = searchParamsSchema.extend({
  completion_status: z.string().optional(),
  min_units: z.union([z.number(), z.string()]).transform(val => {
    if (!val) return undefined;
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return isNaN(num) ? undefined : Math.max(1, num);
  }).optional(),
  max_units: z.union([z.number(), z.string()]).transform(val => {
    if (!val) return undefined;
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return isNaN(num) ? undefined : Math.max(1, num);
  }).optional()
});

export const apartmentSearchParamsSchema = searchParamsSchema.extend({
  building_id: z.string().uuid().optional(),
  floor: z.union([z.number(), z.string()]).transform(val => {
    if (!val) return undefined;
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return isNaN(num) ? undefined : Math.max(1, num);
  }).optional()
});

// Type exports for use in components
export type WorkerFormData = z.infer<typeof workerSchema>;
export type BuildingFormData = z.infer<typeof buildingSchema>;
export type ApartmentFormData = z.infer<typeof apartmentSchema>;
export type SearchParams = z.infer<typeof searchParamsSchema>;
export type WorkerSearchParams = z.infer<typeof workerSearchParamsSchema>;
export type BuildingSearchParams = z.infer<typeof buildingSearchParamsSchema>;
export type ApartmentSearchParams = z.infer<typeof apartmentSearchParamsSchema>;

// Validation helper functions
export const validateWorkerData = (data: unknown) => {
  return workerSchema.safeParse(data);
};

export const validateBuildingData = (data: unknown) => {
  return buildingSchema.safeParse(data);
};

export const validateApartmentData = (data: unknown) => {
  return apartmentSchema.safeParse(data);
};

export const validateSearchParams = (data: unknown) => {
  return searchParamsSchema.safeParse(data);
};

export const validateWorkerSearchParams = (data: unknown) => {
  return workerSearchParamsSchema.safeParse(data);
};

export const validateBuildingSearchParams = (data: unknown) => {
  return buildingSearchParamsSchema.safeParse(data);
};

export const validateApartmentSearchParams = (data: unknown) => {
  return apartmentSearchParamsSchema.safeParse(data);
};