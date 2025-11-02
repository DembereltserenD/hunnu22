// Database utility functions for Admin Dashboard CRUD operations

import { createClient } from '../../supabase/server';
import type { 
  Worker, 
  Building, 
  Apartment, 
  FloorGroup,
  WorkerFormData, 
  BuildingFormData, 
  ApartmentFormData,
  PaginatedResponse,
  WorkerSearchParams,
  BuildingSearchParams,
  ApartmentSearchParams
} from '../types/admin';

// Worker CRUD Operations
export class WorkerService {
  static async getAll(params: WorkerSearchParams = {}): Promise<PaginatedResponse<Worker>> {
    const supabase = await createClient();
    const { query = '', page = 1, limit = 10, has_email, has_phone } = params;
    const offset = (page - 1) * limit;

    let queryBuilder = supabase
      .from('workers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (query && query.trim()) {
      // Enhanced search: search in name, email, and phone fields
      const searchTerm = query.trim();
      queryBuilder = queryBuilder.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
    }

    // Filter by email presence
    if (has_email === 'true') {
      queryBuilder = queryBuilder.not('email', 'is', null).neq('email', '');
    } else if (has_email === 'false') {
      queryBuilder = queryBuilder.or('email.is.null,email.eq.');
    }

    // Filter by phone presence
    if (has_phone === 'true') {
      queryBuilder = queryBuilder.not('phone', 'is', null).neq('phone', '');
    } else if (has_phone === 'false') {
      queryBuilder = queryBuilder.or('phone.is.null,phone.eq.');
    }

    const { data, error, count } = await queryBuilder
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch workers: ${error.message}`);
    }

    return {
      data: data || [],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  }

  static async getById(id: string): Promise<Worker | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch worker: ${error.message}`);
    }

    return data;
  }

  static async create(workerData: WorkerFormData): Promise<Worker> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('workers')
      .insert([workerData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create worker: ${error.message}`);
    }

    return data;
  }

  static async update(id: string, workerData: Partial<WorkerFormData>): Promise<Worker> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('workers')
      .update({ ...workerData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update worker: ${error.message}`);
    }

    return data;
  }

  static async delete(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('workers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete worker: ${error.message}`);
    }
  }
}

// Building CRUD Operations
export class BuildingService {
  static async getAll(params: BuildingSearchParams = {}): Promise<PaginatedResponse<Building>> {
    const supabase = await createClient();
    const { query = '', page = 1, limit = 10, completion_status, min_units, max_units } = params;
    const offset = (page - 1) * limit;

    let queryBuilder = supabase
      .from('buildings')
      .select('*, apartments(*)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (query && query.trim()) {
      // Enhanced search: search in name and address fields
      const searchTerm = query.trim();
      queryBuilder = queryBuilder.or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`);
    }

    // Filter by unit count range
    if (min_units !== undefined) {
      queryBuilder = queryBuilder.gte('total_units', min_units);
    }
    if (max_units !== undefined) {
      queryBuilder = queryBuilder.lte('total_units', max_units);
    }

    const { data, error, count } = await queryBuilder
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch buildings: ${error.message}`);
    }

    let filteredData = data || [];

    // Filter by completion status (client-side since it requires apartment count comparison)
    if (completion_status) {
      filteredData = filteredData.filter(building => {
        const apartmentCount = building.apartments?.length || 0;
        const isComplete = apartmentCount === building.total_units;
        
        if (completion_status === 'complete') {
          return isComplete;
        } else if (completion_status === 'incomplete') {
          return !isComplete;
        }
        return true;
      });
    }

    return {
      data: filteredData,
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  }

  static async getById(id: string): Promise<Building | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('buildings')
      .select('*, apartments(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch building: ${error.message}`);
    }

    return data;
  }

  static async create(buildingData: BuildingFormData): Promise<Building> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('buildings')
      .insert([buildingData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create building: ${error.message}`);
    }

    return data;
  }

  static async update(id: string, buildingData: Partial<BuildingFormData>): Promise<Building> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('buildings')
      .update({ ...buildingData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update building: ${error.message}`);
    }

    return data;
  }

  static async delete(id: string): Promise<void> {
    const supabase = await createClient();
    
    // Check if building has apartments before deletion
    const { data: apartments } = await supabase
      .from('apartments')
      .select('id')
      .eq('building_id', id)
      .limit(1);

    if (apartments && apartments.length > 0) {
      throw new Error('Cannot delete building with existing apartments. Please remove all apartments first.');
    }

    const { error } = await supabase
      .from('buildings')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete building: ${error.message}`);
    }
  }
}

// Apartment CRUD Operations
export class ApartmentService {
  static async getAll(params: ApartmentSearchParams = {}): Promise<PaginatedResponse<Apartment>> {
    const supabase = await createClient();
    const { query = '', page = 1, limit = 10, building_id, floor } = params;
    const offset = (page - 1) * limit;

    let queryBuilder = supabase
      .from('apartments')
      .select('*, building:buildings(*)', { count: 'exact' })
      .order('building_id')
      .order('floor')
      .order('unit_number');

    if (query && query.trim()) {
      // Enhanced search: search in unit_number and building name/address
      const searchTerm = query.trim();
      queryBuilder = queryBuilder.or(`unit_number.ilike.%${searchTerm}%,building.name.ilike.%${searchTerm}%,building.address.ilike.%${searchTerm}%`);
    }

    if (building_id) {
      queryBuilder = queryBuilder.eq('building_id', building_id);
    }

    if (floor !== undefined) {
      queryBuilder = queryBuilder.eq('floor', floor);
    }

    const { data, error, count } = await queryBuilder
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch apartments: ${error.message}`);
    }

    return {
      data: data || [],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  }

  static async getById(id: string): Promise<Apartment | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('apartments')
      .select('*, building:buildings(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch apartment: ${error.message}`);
    }

    return data;
  }

  static async getByBuildingGroupedByFloor(buildingId: string): Promise<FloorGroup[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('apartments')
      .select('*, building:buildings(*)')
      .eq('building_id', buildingId)
      .order('floor')
      .order('unit_number');

    if (error) {
      throw new Error(`Failed to fetch apartments by building: ${error.message}`);
    }

    // Group apartments by floor
    const floorGroups: { [key: number]: FloorGroup } = {};
    
    data?.forEach((apartment: any) => {
      const floorNumber = apartment.floor;
      if (!floorGroups[floorNumber]) {
        floorGroups[floorNumber] = {
          floor_number: floorNumber,
          building_id: buildingId,
          apartments: [],
          building: apartment.building
        };
      }
      floorGroups[floorNumber].apartments.push(apartment);
    });

    return Object.values(floorGroups).sort((a, b) => a.floor_number - b.floor_number);
  }

  static async create(apartmentData: ApartmentFormData): Promise<Apartment> {
    const supabase = await createClient();
    
    // Check if unit_number is unique within the building
    const { data: existing } = await supabase
      .from('apartments')
      .select('id')
      .eq('building_id', apartmentData.building_id)
      .eq('unit_number', apartmentData.unit_number)
      .single();

    if (existing) {
      throw new Error('Unit number already exists in this building');
    }

    const { data, error } = await supabase
      .from('apartments')
      .insert([apartmentData])
      .select('*, building:buildings(*)')
      .single();

    if (error) {
      throw new Error(`Failed to create apartment: ${error.message}`);
    }

    return data;
  }

  static async update(id: string, apartmentData: Partial<ApartmentFormData>): Promise<Apartment> {
    const supabase = await createClient();
    
    // If updating unit_number, check uniqueness within building
    if (apartmentData.unit_number) {
      const currentApartment = await this.getById(id);
      if (!currentApartment) {
        throw new Error('Apartment not found');
      }

      const { data: existing } = await supabase
        .from('apartments')
        .select('id')
        .eq('building_id', apartmentData.building_id || currentApartment.building_id)
        .eq('unit_number', apartmentData.unit_number)
        .neq('id', id)
        .single();

      if (existing) {
        throw new Error('Unit number already exists in this building');
      }
    }

    const { data, error } = await supabase
      .from('apartments')
      .update({ ...apartmentData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, building:buildings(*)')
      .single();

    if (error) {
      throw new Error(`Failed to update apartment: ${error.message}`);
    }

    return data;
  }

  static async delete(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('apartments')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete apartment: ${error.message}`);
    }
  }
}

// Floor utility functions (virtual entity)
export class FloorService {
  static async getFloorsByBuilding(buildingId: string): Promise<FloorGroup[]> {
    return ApartmentService.getByBuildingGroupedByFloor(buildingId);
  }

  static async getFloorsWithCounts(): Promise<{ building_id: string; floor_number: number; apartment_count: number; building?: Building }[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('apartments')
      .select('building_id, floor, building:buildings(*)')
      .order('building_id')
      .order('floor');

    if (error) {
      throw new Error(`Failed to fetch floor data: ${error.message}`);
    }

    // Group by building and floor, count apartments
    const floorCounts: { [key: string]: { building_id: string; floor_number: number; apartment_count: number; building?: Building } } = {};
    
    data?.forEach((apartment: any) => {
      const key = `${apartment.building_id}-${apartment.floor}`;
      if (!floorCounts[key]) {
        floorCounts[key] = {
          building_id: apartment.building_id,
          floor_number: apartment.floor,
          apartment_count: 0,
          building: apartment.building
        };
      }
      floorCounts[key].apartment_count++;
    });

    return Object.values(floorCounts).sort((a, b) => {
      if (a.building_id === b.building_id) {
        return a.floor_number - b.floor_number;
      }
      return a.building_id.localeCompare(b.building_id);
    });
  }
}