'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { BuildingService } from '@/lib/admin-db';
import { validateBuildingData, validateBuildingSearchParams } from '@/lib/admin-validation';
import { parseDbError, type ErrorDetails } from '@/lib/error-handling';
import type { BuildingSearchParams } from '@/types/admin';

// Enhanced result types for better error handling
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorDetails?: ErrorDetails;
}

// Get all buildings with search and pagination
export async function getBuildings(searchParams: BuildingSearchParams = {}) {
  try {
    const validatedParams = validateBuildingSearchParams(searchParams);
    if (!validatedParams.success) {
      throw new Error('Invalid search parameters');
    }

    return await BuildingService.getAll(validatedParams.data);
  } catch (error) {
    console.error('Error fetching buildings:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch buildings');
  }
}

// Get building by ID
export async function getBuilding(id: string) {
  try {
    if (!id) {
      throw new Error('Building ID is required');
    }

    const building = await BuildingService.getById(id);
    if (!building) {
      throw new Error('Building not found');
    }

    return building;
  } catch (error) {
    console.error('Error fetching building:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch building');
  }
}

// Create new building
export async function createBuilding(formData: FormData) {
  try {
    const rawData = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      total_units: parseInt(formData.get('total_units') as string, 10),
    };

    // Validate required fields
    if (!rawData.name || typeof rawData.name !== 'string') {
      throw new Error('Building name is required');
    }
    if (!rawData.address || typeof rawData.address !== 'string') {
      throw new Error('Building address is required');
    }
    if (isNaN(rawData.total_units) || rawData.total_units < 1) {
      throw new Error('Valid total units number is required');
    }

    const cleanData = {
      name: rawData.name.trim(),
      address: rawData.address.trim(),
      total_units: rawData.total_units,
    };

    const validatedData = validateBuildingData(cleanData);
    if (!validatedData.success) {
      const errors = validatedData.error.issues.map((err: any) => err.message).join(', ');
      throw new Error(errors);
    }

    await BuildingService.create(validatedData.data);
    
    revalidatePath('/admin-hunnu/buildings');
  } catch (error) {
    console.error('Error creating building:', error);
    const errorDetails = parseDbError(error);
    throw new Error(errorDetails.message);
  }
  
  // Redirect after successful operation (outside try-catch)
  redirect('/admin-hunnu/buildings');
}

// Update existing building
export async function updateBuilding(id: string, formData: FormData) {
  try {
    if (!id) {
      throw new Error('Building ID is required');
    }

    const rawData = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      total_units: parseInt(formData.get('total_units') as string, 10),
    };

    const validatedData = validateBuildingData(rawData);
    if (!validatedData.success) {
      const errors = validatedData.error.issues.map((err: any) => err.message).join(', ');
      throw new Error(`Validation failed: ${errors}`);
    }

    await BuildingService.update(id, validatedData.data);
    
    revalidatePath('/admin-hunnu/buildings');
  } catch (error) {
    console.error('Error updating building:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update building');
  }
  
  // Redirect after successful operation (outside try-catch)
  redirect('/admin-hunnu/buildings');
}

// Delete building
export async function deleteBuilding(id: string) {
  try {
    if (!id) {
      throw new Error('Building ID is required');
    }

    await BuildingService.delete(id);
    
    revalidatePath('/admin-hunnu/buildings');
    return { success: true };
  } catch (error) {
    console.error('Error deleting building:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete building');
  }
}

// Server action for form submission with error handling
export async function submitBuildingForm(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const id = formData.get('id') as string;
    
    if (id) {
      await updateBuilding(id, formData);
    } else {
      await createBuilding(formData);
    }
    
    return { success: true };
  } catch (error: any) {
    // Check if this is a Next.js redirect (which is expected behavior)
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      // Re-throw redirect errors so Next.js can handle them properly
      throw error;
    }
    
    console.error('Building form submission error:', error);
    const errorDetails = parseDbError(error);
    return { 
      success: false, 
      error: errorDetails.message,
      errorDetails
    };
  }
}

// Server action for delete with error handling
export async function submitBuildingDelete(id: string): Promise<ActionResult> {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid building ID is required');
    }

    await deleteBuilding(id);
    return { success: true };
  } catch (error) {
    console.error('Building deletion error:', error);
    const errorDetails = parseDbError(error);
    return { 
      success: false, 
      error: errorDetails.message,
      errorDetails
    };
  }
}