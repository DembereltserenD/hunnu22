// Constants and utility functions for Admin Dashboard

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// Route paths
export const ADMIN_ROUTES = {
  DASHBOARD: '/admin-hunnu',
  WORKERS: '/admin-hunnu/workers',
  BUILDINGS: '/admin-hunnu/buildings',
  APARTMENTS: '/admin-hunnu/apartments',
} as const;

// Entity types
export const ENTITY_TYPES = {
  WORKER: 'worker',
  BUILDING: 'building',
  APARTMENT: 'apartment',
} as const;

// Status messages
export const SUCCESS_MESSAGES = {
  WORKER_CREATED: 'Worker created successfully',
  WORKER_UPDATED: 'Worker updated successfully',
  WORKER_DELETED: 'Worker deleted successfully',
  BUILDING_CREATED: 'Building created successfully',
  BUILDING_UPDATED: 'Building updated successfully',
  BUILDING_DELETED: 'Building deleted successfully',
  APARTMENT_CREATED: 'Apartment created successfully',
  APARTMENT_UPDATED: 'Apartment updated successfully',
  APARTMENT_DELETED: 'Apartment deleted successfully',
} as const;

export const ERROR_MESSAGES = {
  GENERIC_ERROR: 'An unexpected error occurred',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  VALIDATION_ERROR: 'Please check the form for errors',
  NOT_FOUND: 'Item not found',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  BUILDING_HAS_APARTMENTS: 'Cannot delete building with existing apartments',
  DUPLICATE_UNIT_NUMBER: 'Unit number already exists in this building',
} as const;

// Form field limits
export const FIELD_LIMITS = {
  WORKER_NAME_MAX: 100,
  WORKER_EMAIL_MAX: 255,
  WORKER_PHONE_MAX: 20,
  BUILDING_NAME_MAX: 100,
  BUILDING_ADDRESS_MAX: 200,
  BUILDING_TOTAL_UNITS_MAX: 1000,
  APARTMENT_UNIT_NUMBER_MAX: 20,
} as const;

// Utility functions
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatFloorNumber = (floor: number): string => {
  if (floor === 1) return '1st Floor';
  if (floor === 2) return '2nd Floor';
  if (floor === 3) return '3rd Floor';
  return `${floor}th Floor`;
};

export const generateUnitNumber = (floor: number, unitOnFloor: number): string => {
  // Generate unit number in format: floor + unit (e.g., 101, 102, 201, 202)
  return `${floor}${unitOnFloor.toString().padStart(2, '0')}`;
};

export const parseFloorFromUnitNumber = (unitNumber: string): number => {
  // Extract floor number from unit number
  // For 3+ digit numbers, first digits are floor
  // For 1-2 digit numbers, default to floor 1
  if (unitNumber.length >= 3) {
    const floorStr = unitNumber.substring(0, unitNumber.length - 2);
    const floor = parseInt(floorStr, 10);
    return isNaN(floor) ? 1 : floor;
  }
  return 1;
};

export const validateUnitNumber = (unitNumber: string): boolean => {
  // Unit number should contain at least one digit and be reasonable length
  return /\d/.test(unitNumber) && unitNumber.length <= FIELD_LIMITS.APARTMENT_UNIT_NUMBER_MAX;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Search debounce delay
export const SEARCH_DEBOUNCE_MS = 300;