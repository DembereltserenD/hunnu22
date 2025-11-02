'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { WorkerService } from '@/lib/admin-db';
import { validateWorkerData, validateWorkerSearchParams } from '@/lib/admin-validation';
import { parseDbError, type ErrorDetails } from '@/lib/error-handling';
import type { WorkerFormData, WorkerSearchParams } from '@/types/admin';

// Enhanced result types for better error handling
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorDetails?: ErrorDetails;
}

// Get all workers with search and pagination
export async function getWorkers(searchParams: WorkerSearchParams = {}) {
  try {
    const validatedParams = validateWorkerSearchParams(searchParams);
    if (!validatedParams.success) {
      const errorMessage = validatedParams.error.issues
        .map(issue => issue.message)
        .join(', ');
      throw new Error(`Invalid search parameters: ${errorMessage}`);
    }

    return await WorkerService.getAll(validatedParams.data);
  } catch (error) {
    console.error('Error fetching workers:', error);
    const errorDetails = parseDbError(error);
    throw new Error(errorDetails.message);
  }
}

// Get worker by ID
export async function getWorker(id: string) {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid worker ID is required');
    }

    const worker = await WorkerService.getById(id);
    if (!worker) {
      throw new Error('Worker not found');
    }

    return worker;
  } catch (error) {
    console.error('Error fetching worker:', error);
    const errorDetails = parseDbError(error);
    throw new Error(errorDetails.message);
  }
}

// Create new worker
export async function createWorker(formData: FormData) {
  try {
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
    };

    // Validate required fields
    if (!rawData.name || typeof rawData.name !== 'string') {
      throw new Error('Worker name is required');
    }

    // Clean up empty strings to undefined for optional fields
    const cleanData = {
      name: rawData.name.trim(),
      email: rawData.email?.trim() || undefined,
      phone: rawData.phone?.trim() || undefined,
    };

    const validatedData = validateWorkerData(cleanData);
    if (!validatedData.success) {
      const errors = validatedData.error.issues.map((err: any) => err.message).join(', ');
      throw new Error(errors);
    }

    await WorkerService.create(validatedData.data);
    
    revalidatePath('/admin-hunnu/workers');
  } catch (error) {
    console.error('Error creating worker:', error);
    const errorDetails = parseDbError(error);
    throw new Error(errorDetails.message);
  }
  
  // Redirect after successful operation (outside try-catch)
  redirect('/admin-hunnu/workers');
}

// Update existing worker
export async function updateWorker(id: string, formData: FormData) {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid worker ID is required');
    }

    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
    };

    // Validate required fields
    if (!rawData.name || typeof rawData.name !== 'string') {
      throw new Error('Worker name is required');
    }

    // Clean up empty strings to undefined for optional fields
    const cleanData = {
      name: rawData.name.trim(),
      email: rawData.email?.trim() || undefined,
      phone: rawData.phone?.trim() || undefined,
    };

    const validatedData = validateWorkerData(cleanData);
    if (!validatedData.success) {
      const errors = validatedData.error.issues.map((err: any) => err.message).join(', ');
      throw new Error(errors);
    }

    await WorkerService.update(id, validatedData.data);
    
    revalidatePath('/admin-hunnu/workers');
  } catch (error) {
    console.error('Error updating worker:', error);
    const errorDetails = parseDbError(error);
    throw new Error(errorDetails.message);
  }
  
  // Redirect after successful operation (outside try-catch)
  redirect('/admin-hunnu/workers');
}

// Delete worker
export async function deleteWorker(id: string) {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid worker ID is required');
    }

    await WorkerService.delete(id);
    
    revalidatePath('/admin-hunnu/workers');
    return { success: true };
  } catch (error) {
    console.error('Error deleting worker:', error);
    const errorDetails = parseDbError(error);
    throw new Error(errorDetails.message);
  }
}

// Server action for form submission with error handling
export async function submitWorkerForm(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const id = formData.get('id') as string;
    
    if (id) {
      await updateWorker(id, formData);
    } else {
      await createWorker(formData);
    }
    
    return { success: true };
  } catch (error: any) {
    // Check if this is a Next.js redirect (which is expected behavior)
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      // Re-throw redirect errors so Next.js can handle them properly
      throw error;
    }
    
    console.error('Worker form submission error:', error);
    const errorDetails = parseDbError(error);
    return { 
      success: false, 
      error: errorDetails.message,
      errorDetails
    };
  }
}

// Server action for delete with error handling
export async function submitWorkerDelete(id: string): Promise<ActionResult> {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid worker ID is required');
    }

    await deleteWorker(id);
    return { success: true };
  } catch (error) {
    console.error('Worker deletion error:', error);
    const errorDetails = parseDbError(error);
    return { 
      success: false, 
      error: errorDetails.message,
      errorDetails
    };
  }
}