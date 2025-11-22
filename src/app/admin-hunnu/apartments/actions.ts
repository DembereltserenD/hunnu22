'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApartmentService, BuildingService } from '@/lib/admin-db';
import { validateApartmentData, validateApartmentSearchParams } from '@/lib/admin-validation';
import { parseDbError, type ErrorDetails } from '@/lib/error-handling';
import type { ApartmentSearchParams } from '@/types/admin';

// Enhanced result types for better error handling
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorDetails?: ErrorDetails;
}

// Get all apartments with search and pagination
export async function getApartments(searchParams: ApartmentSearchParams = {}) {
  try {
    const validatedParams = validateApartmentSearchParams(searchParams);
    if (!validatedParams.success) {
      console.error('Apartment search params validation failed:', validatedParams.error.issues);
      const errorMessage = validatedParams.error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      throw new Error(`Invalid search parameters: ${errorMessage}`);
    }

    return await ApartmentService.getAll(validatedParams.data);
  } catch (error) {
    console.error('Error fetching apartments:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch apartments');
  }
}

// Get apartment by ID
export async function getApartment(id: string) {
  try {
    if (!id) {
      throw new Error('Apartment ID is required');
    }

    const apartment = await ApartmentService.getById(id);
    if (!apartment) {
      throw new Error('Apartment not found');
    }

    return apartment;
  } catch (error) {
    console.error('Error fetching apartment:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch apartment');
  }
}

// Get apartments grouped by floor for a building
export async function getApartmentsByBuildingGroupedByFloor(buildingId: string) {
  try {
    if (!buildingId) {
      throw new Error('Building ID is required');
    }

    return await ApartmentService.getByBuildingGroupedByFloor(buildingId);
  } catch (error) {
    console.error('Error fetching apartments by building:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch apartments by building');
  }
}

// Get all buildings for apartment form dropdown
export async function getBuildingsForSelect() {
  try {
    const result = await BuildingService.getAll({ limit: 1000 }); // Get all buildings
    return result.data.map(building => ({
      id: building.id,
      name: building.name,
      address: building.address
    }));
  } catch (error) {
    console.error('Error fetching buildings for select:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch buildings');
  }
}

// Create new apartment
export async function createApartment(formData: FormData) {
  try {
    console.log('Creating apartment with form data:', Object.fromEntries(formData.entries()));
    
    const rawData = {
      building_id: formData.get('building_id') as string,
      unit_number: formData.get('unit_number') as string,
    };

    console.log('Raw apartment data:', rawData);

    // Validate required fields
    if (!rawData.building_id || typeof rawData.building_id !== 'string') {
      throw new Error('Building selection is required');
    }
    if (!rawData.unit_number || typeof rawData.unit_number !== 'string') {
      throw new Error('Unit number is required');
    }

    const cleanData = {
      building_id: rawData.building_id.trim(),
      unit_number: rawData.unit_number.trim(),
    };

    console.log('Clean apartment data:', cleanData);

    const validatedData = validateApartmentData(cleanData);
    if (!validatedData.success) {
      console.error('Apartment validation failed:', validatedData.error.issues);
      const errors = validatedData.error.issues.map((err: any) => err.message).join(', ');
      throw new Error(errors);
    }

    console.log('Validated apartment data:', validatedData.data);

    const result = await ApartmentService.create(validatedData.data);
    console.log('Apartment created successfully:', result);
    
    revalidatePath('/admin-hunnu/apartments');
  } catch (error) {
    console.error('Error creating apartment:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    // Re-throw the original error for now to get more details
    throw error;
  }
  
  // Redirect after successful operation (outside try-catch)
  redirect('/admin-hunnu/apartments');
}

// Create apartment without redirect (for bulk operations)
export async function createApartmentWithoutRedirect(apartmentData: { building_id: string; unit_number: string; floor?: number }) {
  try {
    const validatedData = validateApartmentData(apartmentData);
    if (!validatedData.success) {
      const errors = validatedData.error.issues.map((err: any) => err.message).join(', ');
      throw new Error(errors);
    }

    const result = await ApartmentService.create(validatedData.data);
    
    // Revalidate paths to ensure data is fresh across the app
    revalidatePath('/admin-hunnu/apartments');
    revalidatePath('/admin-hunnu/buildings');
    
    return result;
  } catch (error) {
    console.error('Error creating apartment:', error);
    throw error;
  }
}



// Update existing apartment
export async function updateApartment(id: string, formData: FormData) {
  try {
    if (!id) {
      throw new Error('Apartment ID is required');
    }

    const rawData: any = {
      building_id: formData.get('building_id') as string,
      unit_number: formData.get('unit_number') as string,
    };

    // Handle smoke detector fields
    const smokeDetectorCount = formData.get('smoke_detector_count');
    if (smokeDetectorCount !== null && smokeDetectorCount !== '') {
      rawData.smoke_detector_count = parseInt(smokeDetectorCount as string);
    }

    const smokeDetectorLoops = formData.get('smoke_detector_loops') as string;
    if (smokeDetectorLoops) {
      rawData.smoke_detector_loops = smokeDetectorLoops.split(',').map(s => s.trim()).filter(s => s);
    }

    const smokeDetectorAddresses = formData.get('smoke_detector_addresses') as string;
    if (smokeDetectorAddresses) {
      rawData.smoke_detector_addresses = smokeDetectorAddresses.split(',').map(s => s.trim()).filter(s => s);
    }

    const validatedData = validateApartmentData(rawData);
    if (!validatedData.success) {
      const errors = validatedData.error.issues.map((err: any) => err.message).join(', ');
      throw new Error(`Validation failed: ${errors}`);
    }

    await ApartmentService.update(id, validatedData.data);
    
    revalidatePath('/admin-hunnu/apartments');
  } catch (error) {
    console.error('Error updating apartment:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update apartment');
  }
  
  // Redirect after successful operation (outside try-catch)
  redirect('/admin-hunnu/apartments');
}

// Delete apartment
export async function deleteApartment(id: string) {
  try {
    if (!id) {
      throw new Error('Apartment ID is required');
    }

    await ApartmentService.delete(id);
    
    revalidatePath('/admin-hunnu/apartments');
    return { success: true };
  } catch (error) {
    console.error('Error deleting apartment:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete apartment');
  }
}

// Server action for form submission with error handling
export async function submitApartmentForm(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const id = formData.get('id') as string;
    
    if (id) {
      await updateApartment(id, formData);
    } else {
      await createApartment(formData);
    }
    
    return { success: true };
  } catch (error: any) {
    // Check if this is a Next.js redirect (which is expected behavior)
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      // Re-throw redirect errors so Next.js can handle them properly
      throw error;
    }
    
    console.error('Apartment form submission error:', error);
    const errorDetails = parseDbError(error);
    return { 
      success: false, 
      error: errorDetails.message,
      errorDetails
    };
  }
}

// Server action for delete with error handling
export async function submitApartmentDelete(id: string): Promise<ActionResult> {
  try {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid apartment ID is required');
    }

    await deleteApartment(id);
    return { success: true };
  } catch (error) {
    console.error('Apartment deletion error:', error);
    const errorDetails = parseDbError(error);
    return { 
      success: false, 
      error: errorDetails.message,
      errorDetails
    };
  }
}