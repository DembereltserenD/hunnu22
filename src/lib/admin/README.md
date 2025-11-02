# Admin Dashboard Database Utilities

This directory contains all the database utilities, types, and validation schemas for the Admin Dashboard feature.

## Files Overview

### Core Database Services

- **`admin-db.ts`** - CRUD operations for Workers, Buildings, Apartments, and Floors
- **`admin-validation.ts`** - Zod validation schemas for form data
- **`admin-constants.ts`** - Constants, error messages, and utility functions

### Types

- **`../types/admin.ts`** - TypeScript interfaces for all entities

### Exports

- **`index.ts`** - Centralized exports for easy importing

## Database Schema

The admin dashboard works with the existing Supabase tables:

### Workers Table

- `id` (UUID, Primary Key)
- `name` (TEXT, Required)
- `email` (TEXT, Optional, Unique)
- `phone` (TEXT, Optional)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### Buildings Table

- `id` (UUID, Primary Key)
- `name` (TEXT, Required)
- `address` (TEXT, Required)
- `total_units` (INTEGER, Required)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### Apartments Table

- `id` (UUID, Primary Key)
- `building_id` (UUID, Foreign Key to Buildings)
- `unit_number` (TEXT, Required)
- `floor` (INTEGER, Auto-calculated from unit_number)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- Unique constraint: `(building_id, unit_number)`

**Note**: Floors are NOT a separate table. Floor information is stored as an integer column in the apartments table and is auto-calculated from the unit_number via a database trigger.

## Usage Examples

```typescript
import {
  WorkerService,
  BuildingService,
  ApartmentService,
  validateWorkerData,
  SUCCESS_MESSAGES,
} from "@/lib/admin";

// Get all workers with pagination
const workers = await WorkerService.getAll({ page: 1, limit: 10 });

// Create a new worker
const newWorker = await WorkerService.create({
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
});

// Validate form data
const validation = validateWorkerData(formData);
if (!validation.success) {
  console.error(validation.error.issues);
}

// Get apartments grouped by floor
const floorGroups =
  await ApartmentService.getByBuildingGroupedByFloor(buildingId);
```

## Error Handling

All database services throw descriptive errors that can be caught and displayed to users:

```typescript
try {
  await BuildingService.delete(buildingId);
} catch (error) {
  if (error.message.includes("existing apartments")) {
    // Handle constraint violation
  }
}
```

## Validation

Form validation is handled using Zod schemas. All schemas include:

- Required field validation
- Length limits
- Format validation (email, phone, etc.)
- Custom business rules

## Constants

Common constants are defined in `admin-constants.ts`:

- Route paths
- Success/error messages
- Field limits
- Utility functions for formatting dates, floor numbers, etc.
