import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Next.js functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock the database services
vi.mock('@/lib/admin-db', () => ({
  WorkerService: {
    create: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  BuildingService: {
    create: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  ApartmentService: {
    create: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getByBuildingGroupedByFloor: vi.fn(),
  },
}));

// Mock validation functions
vi.mock('@/lib/admin-validation', () => ({
  validateWorkerData: vi.fn((data) => ({ success: true, data })),
  validateWorkerSearchParams: vi.fn((params) => ({ success: true, data: params })),
  validateBuildingData: vi.fn((data) => ({ success: true, data })),
  validateBuildingSearchParams: vi.fn((params) => ({ success: true, data: params })),
  validateApartmentData: vi.fn((data) => ({ success: true, data })),
  validateApartmentSearchParams: vi.fn((params) => ({ success: true, data: params })),
}));

// Mock error handling
vi.mock('@/lib/error-handling', () => ({
  parseDbError: vi.fn((error) => ({ 
    message: error instanceof Error ? error.message : 'Unknown error',
    type: 'database_error'
  })),
}));

describe('Worker CRUD Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Worker', () => {
    it('should create a worker successfully', async () => {
      const { WorkerService } = await import('@/lib/admin-db');
      const { createWorker } = await import('../workers/actions');
      
      const formData = new FormData();
      formData.append('name', 'John Doe');
      formData.append('email', 'john@example.com');
      formData.append('phone', '123-456-7890');

      vi.mocked(WorkerService.create).mockResolvedValue({ 
        id: '1', 
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      await expect(createWorker(formData)).resolves.not.toThrow();
      expect(WorkerService.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
      });
    });

    it('should handle validation errors', async () => {
      const { createWorker } = await import('../workers/actions');
      
      const formData = new FormData();
      formData.append('name', ''); // Invalid empty name

      await expect(createWorker(formData)).rejects.toThrow('Worker name is required');
    });

    it('should handle database errors', async () => {
      const { WorkerService } = await import('@/lib/admin-db');
      const { createWorker } = await import('../workers/actions');
      
      const formData = new FormData();
      formData.append('name', 'John Doe');

      vi.mocked(WorkerService.create).mockRejectedValue(new Error('Database connection failed'));

      await expect(createWorker(formData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('Update Worker', () => {
    it('should update a worker successfully', async () => {
      const { WorkerService } = await import('@/lib/admin-db');
      const { updateWorker } = await import('../workers/actions');
      
      const formData = new FormData();
      formData.append('name', 'Jane Doe');
      formData.append('email', 'jane@example.com');

      vi.mocked(WorkerService.update).mockResolvedValue({ 
        id: '1', 
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      await expect(updateWorker('1', formData)).resolves.not.toThrow();
      expect(WorkerService.update).toHaveBeenCalledWith('1', {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: undefined,
      });
    });

    it('should require valid worker ID', async () => {
      const { updateWorker } = await import('../workers/actions');
      
      const formData = new FormData();
      formData.append('name', 'Jane Doe');

      await expect(updateWorker('', formData)).rejects.toThrow('Valid worker ID is required');
    });
  });

  describe('Delete Worker', () => {
    it('should delete a worker successfully', async () => {
      const { WorkerService } = await import('@/lib/admin-db');
      const { deleteWorker } = await import('../workers/actions');
      
      vi.mocked(WorkerService.delete).mockResolvedValue(undefined);

      const result = await deleteWorker('1');
      expect(result).toEqual({ success: true });
      expect(WorkerService.delete).toHaveBeenCalledWith('1');
    });

    it('should require valid worker ID', async () => {
      const { deleteWorker } = await import('../workers/actions');
      
      await expect(deleteWorker('')).rejects.toThrow('Valid worker ID is required');
    });
  });

  describe('Get Workers', () => {
    it('should fetch workers with search parameters', async () => {
      const { WorkerService } = await import('@/lib/admin-db');
      const { getWorkers } = await import('../workers/actions');
      
      const mockWorkers = {
        data: [{ 
          id: '1', 
          name: 'John Doe',
          email: 'john@example.com',
          phone: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }],
        count: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };
      vi.mocked(WorkerService.getAll).mockResolvedValue(mockWorkers);

      const result = await getWorkers({ query: 'John' });
      expect(result).toEqual(mockWorkers);
      expect(WorkerService.getAll).toHaveBeenCalledWith({ query: 'John' });
    });
  });

  describe('Form Submission Actions', () => {
    it('should handle successful form submission', async () => {
      const { WorkerService } = await import('@/lib/admin-db');
      const { submitWorkerForm } = await import('../workers/actions');
      
      const formData = new FormData();
      formData.append('name', 'John Doe');
      
      vi.mocked(WorkerService.create).mockResolvedValue({ 
        id: '1',
        name: 'John Doe',
        email: null,
        phone: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const result = await submitWorkerForm(null, formData);
      expect(result).toEqual({ success: true });
    });

    it('should handle form submission errors', async () => {
      const { submitWorkerForm } = await import('../workers/actions');
      
      const formData = new FormData();
      formData.append('name', ''); // Invalid

      const result = await submitWorkerForm(null, formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Worker name is required');
    });

    it('should handle successful deletion', async () => {
      const { WorkerService } = await import('@/lib/admin-db');
      const { submitWorkerDelete } = await import('../workers/actions');
      
      vi.mocked(WorkerService.delete).mockResolvedValue(undefined);

      const result = await submitWorkerDelete('1');
      expect(result).toEqual({ success: true });
    });

    it('should handle deletion errors', async () => {
      const { submitWorkerDelete } = await import('../workers/actions');
      
      const result = await submitWorkerDelete('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Valid worker ID is required');
    });
  });
});

describe('Building CRUD Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Building', () => {
    it('should create a building successfully', async () => {
      const { BuildingService } = await import('@/lib/admin-db');
      const { createBuilding } = await import('../buildings/actions');
      
      const formData = new FormData();
      formData.append('name', 'Building A');
      formData.append('address', '123 Main St');
      formData.append('total_units', '50');

      vi.mocked(BuildingService.create).mockResolvedValue({ 
        id: '1', 
        name: 'Building A',
        address: '123 Main St',
        total_units: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      await expect(createBuilding(formData)).resolves.not.toThrow();
      expect(BuildingService.create).toHaveBeenCalledWith({
        name: 'Building A',
        address: '123 Main St',
        total_units: 50,
      });
    });

    it('should validate required fields', async () => {
      const { createBuilding } = await import('../buildings/actions');
      
      const formData = new FormData();
      formData.append('name', '');
      formData.append('address', '123 Main St');
      formData.append('total_units', '50');

      await expect(createBuilding(formData)).rejects.toThrow('Building name is required');
    });

    it('should validate total units as number', async () => {
      const { createBuilding } = await import('../buildings/actions');
      
      const formData = new FormData();
      formData.append('name', 'Building A');
      formData.append('address', '123 Main St');
      formData.append('total_units', 'invalid');

      await expect(createBuilding(formData)).rejects.toThrow('Valid total units number is required');
    });
  });

  describe('Referential Integrity', () => {
    it('should prevent deletion of building with apartments', async () => {
      const { BuildingService } = await import('@/lib/admin-db');
      const { deleteBuilding } = await import('../buildings/actions');
      
      vi.mocked(BuildingService.delete).mockRejectedValue(
        new Error('Cannot delete building with existing apartments')
      );

      await expect(deleteBuilding('1')).rejects.toThrow(
        'Cannot delete building with existing apartments'
      );
    });
  });
});

describe('Apartment CRUD Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Apartment', () => {
    it('should create an apartment successfully', async () => {
      const { ApartmentService } = await import('@/lib/admin-db');
      const { createApartment } = await import('../apartments/actions');
      
      const formData = new FormData();
      formData.append('building_id', 'building-1');
      formData.append('unit_number', '101');

      vi.mocked(ApartmentService.create).mockResolvedValue({ 
        id: '1', 
        building_id: 'building-1',
        unit_number: '101',
        floor: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      await expect(createApartment(formData)).resolves.not.toThrow();
      expect(ApartmentService.create).toHaveBeenCalledWith({
        building_id: 'building-1',
        unit_number: '101',
      });
    });

    it('should validate building selection', async () => {
      const { createApartment } = await import('../apartments/actions');
      
      const formData = new FormData();
      formData.append('building_id', '');
      formData.append('unit_number', '101');

      await expect(createApartment(formData)).rejects.toThrow('Building selection is required');
    });

    it('should validate unit number uniqueness within building', async () => {
      const { ApartmentService } = await import('@/lib/admin-db');
      const { createApartment } = await import('../apartments/actions');
      
      const formData = new FormData();
      formData.append('building_id', 'building-1');
      formData.append('unit_number', '101');

      vi.mocked(ApartmentService.create).mockRejectedValue(
        new Error('Unit number already exists in this building')
      );

      await expect(createApartment(formData)).rejects.toThrow(
        'Unit number already exists in this building'
      );
    });
  });

  describe('Floor Grouping', () => {
    it('should group apartments by floor correctly', async () => {
      const { ApartmentService } = await import('@/lib/admin-db');
      const { getApartmentsByBuildingGroupedByFloor } = await import('../apartments/actions');
      
      const mockGroupedApartments = [
        {
          floor_number: 1,
          building_id: 'building-1',
          apartments: [
            { id: '1', unit_number: '101', floor: 1, building_id: 'building-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: '2', unit_number: '102', floor: 1, building_id: 'building-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
          ]
        },
        {
          floor_number: 2,
          building_id: 'building-1',
          apartments: [
            { id: '3', unit_number: '201', floor: 2, building_id: 'building-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
          ]
        }
      ];

      vi.mocked(ApartmentService.getByBuildingGroupedByFloor).mockResolvedValue(mockGroupedApartments);

      const result = await getApartmentsByBuildingGroupedByFloor('building-1');
      
      expect(result).toEqual(mockGroupedApartments);
      expect(ApartmentService.getByBuildingGroupedByFloor).toHaveBeenCalledWith('building-1');
    });
  });
});

describe('Error Handling Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle database connection errors consistently', async () => {
    const { WorkerService } = await import('@/lib/admin-db');
    const { getWorkers } = await import('../workers/actions');
    
    const dbError = new Error('Connection timeout');
    vi.mocked(WorkerService.getAll).mockRejectedValue(dbError);

    await expect(getWorkers()).rejects.toThrow('Connection timeout');
  });

  it('should handle validation errors with detailed messages', async () => {
    const { validateWorkerData } = await import('@/lib/admin-validation');
    const { createWorker } = await import('../workers/actions');
    
    const mockZodError = new Error('Validation failed') as any;
    mockZodError.issues = [
      { code: 'custom', path: ['name'], message: 'Name is required' },
      { code: 'custom', path: ['email'], message: 'Email format is invalid' }
    ];
    
    vi.mocked(validateWorkerData).mockReturnValue({
      success: false,
      error: mockZodError
    });

    const formData = new FormData();
    formData.append('name', '');
    formData.append('email', 'invalid-email');

    await expect(createWorker(formData)).rejects.toThrow('Name is required, Email format is invalid');
  });

  it('should handle constraint violations gracefully', async () => {
    const { WorkerService } = await import('@/lib/admin-db');
    const { createWorker } = await import('../workers/actions');
    
    const formData = new FormData();
    formData.append('name', 'John Doe');
    formData.append('email', 'existing@example.com');

    vi.mocked(WorkerService.create).mockRejectedValue(
      new Error('Email already exists')
    );

    await expect(createWorker(formData)).rejects.toThrow('Email already exists');
  });
});