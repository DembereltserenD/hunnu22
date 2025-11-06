// Admin Dashboard TypeScript interfaces based on existing database schema

export interface Worker {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  total_units: number;
  created_at: string;
  updated_at: string;
  apartments?: Apartment[];
}

export interface Apartment {
  id: string;
  building_id: string;
  unit_number: string;
  floor: number;
  created_at: string;
  updated_at: string;
  building?: Building;
}

// Virtual interface for floor grouping (not a database table)
// Floors are managed as apartment.floor column, not separate table
export interface FloorGroup {
  floor_number: number;
  building_id: string;
  apartments: Apartment[];
  building?: Building;
}

// Form data interfaces for create/update operations
export interface WorkerFormData {
  name: string;
  email?: string;
  phone?: string;
}

export interface BuildingFormData {
  name: string;
  address: string;
  total_units: number;
}

export interface ApartmentFormData {
  building_id: string;
  unit_number: string;
  // Note: floor is auto-calculated from unit_number via database trigger
}

// API response interfaces
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Phone Issues interface
export interface PhoneIssue {
  id: string;
  apartment_id: string;
  phone_number: string;
  issue_type: 'domophone' | 'light_bulb';
  status: 'open' | 'хүлээж авсан' | 'болсон' | 'тусламж хэрэгтэй';
  worker_id?: string | null;
  description?: string | null;
  worker_notes?: string | null; // For additional details when status is "тусламж хэрэгтэй"
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
  apartment?: Apartment;
  worker?: Worker;
}

export interface PhoneIssueFormData {
  apartment_id: string;
  phone_number: string;
  issue_type: 'domophone' | 'light_bulb';
  status: 'open' | 'хүлээж авсан' | 'болсон' | 'тусламж хэрэгтэй' | 'цэвэрлэх хэрэгтэй';
  worker_id?: string;
  description?: string;
  worker_notes?: string;
}

// Phone Issues Summary interface for dashboard view
export interface PhoneIssueSummary {
  phone_number: string;
  total_issues: number;
  open_issues: number;
  received_issues: number;
  completed_issues: number;
  needs_help_issues: number;
  smoke_detector_issues: number;
  domophone_issues: number;
  light_bulb_issues: number;
  smoke_detector_resolved: number;
  resolved_by_workers: { worker_name: string; count: number }[];
  latest_issue?: PhoneIssue;
}

// Search and filter interfaces
export interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
}

export interface WorkerSearchParams extends SearchParams {
  has_email?: string;
  has_phone?: string;
}

export interface BuildingSearchParams extends SearchParams {
  completion_status?: string;
  min_units?: number;
  max_units?: number;
}

export interface ApartmentSearchParams extends SearchParams {
  building_id?: string;
  floor?: number;
}

export interface PhoneIssueSearchParams extends SearchParams {
  phone_number?: string;
  issue_type?: string;
  status?: string;
  worker_id?: string;
}