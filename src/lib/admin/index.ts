// Admin Dashboard utilities - centralized exports

// Database services
export {
  WorkerService,
  BuildingService,
  ApartmentService,
  FloorService,
} from '../admin-db';

// Types
export type {
  Worker,
  Building,
  Apartment,
  FloorGroup,
  WorkerFormData,
  BuildingFormData,
  ApartmentFormData,
  ApiResponse,
  PaginatedResponse,
  SearchParams,
  WorkerSearchParams,
  BuildingSearchParams,
  ApartmentSearchParams,
} from '../../types/admin';

// Validation schemas and functions
export {
  workerSchema,
  buildingSchema,
  apartmentSchema,
  searchParamsSchema,
  workerSearchParamsSchema,
  buildingSearchParamsSchema,
  apartmentSearchParamsSchema,
  validateWorkerData,
  validateBuildingData,
  validateApartmentData,
  validateSearchParams,
  validateWorkerSearchParams,
  validateBuildingSearchParams,
  validateApartmentSearchParams,
} from '../admin-validation';

// Constants and utilities
export {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  ADMIN_ROUTES,
  ENTITY_TYPES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  FIELD_LIMITS,
  SEARCH_DEBOUNCE_MS,
  formatDate,
  formatFloorNumber,
  generateUnitNumber,
  parseFloorFromUnitNumber,
  validateUnitNumber,
  debounce,
} from '../admin-constants';