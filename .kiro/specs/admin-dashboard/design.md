# Admin Dashboard Design Document

## Overview

The Admin Dashboard is a comprehensive CRUD interface accessible via the `/admin-hunnu` route, built using Next.js 14 with TypeScript, Supabase for data persistence, and Radix UI components styled with Tailwind CSS. The dashboard provides a unified interface for managing Workers, Buildings, Floors, and Apartments without authentication requirements.

## Architecture

### Technology Stack

- **Frontend Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **State Management**: React hooks and Server Components
- **Forms**: React Hook Form
- **Icons**: Lucide React

### Route Structure

```
/admin-hunnu
├── /workers          # Worker CRUD operations
├── /buildings        # Building CRUD operations
├── /floors           # Floor CRUD operations
└── /apartments       # Apartment CRUD operations
```

### Page Architecture

- **Layout**: Shared admin layout with navigation sidebar
- **Server Components**: For data fetching and initial rendering
- **Client Components**: For interactive forms and real-time updates
- **API Routes**: Server actions for CRUD operations

## Components and Interfaces

### Core Components

#### 1. AdminLayout Component

```typescript
interface AdminLayoutProps {
  children: React.ReactNode;
}
```

- Provides consistent navigation sidebar
- Responsive design for mobile/desktop
- Active route highlighting

#### 2. EntityTable Component

```typescript
interface EntityTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}
```

- Reusable table component for all entities
- Built-in pagination, search, and filtering
- Action buttons for edit/delete operations

#### 3. EntityForm Component

```typescript
interface EntityFormProps<T> {
  entity?: T;
  onSubmit: (data: T) => Promise<void>;
  onCancel: () => void;
  schema: ZodSchema<T>;
}
```

- Generic form component for create/edit operations
- Form validation using Zod schemas
- Loading states and error handling

#### 4. ConfirmDialog Component

```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}
```

- Confirmation dialogs for delete operations
- Prevents accidental data loss

### Navigation Component

```typescript
interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  count?: number;
}
```

## Data Models

### Database Schema

#### Workers Table (Existing)

```sql
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Buildings Table (Existing)

```sql
CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  total_units INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Apartments Table (Existing)

```sql
CREATE TABLE apartments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  floor INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(building_id, unit_number)
);
```

**Note**: There is no separate floors table. Floor information is stored as an integer column in the apartments table and is auto-calculated from the unit_number via a database trigger.

### TypeScript Interfaces

```typescript
interface Worker {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface Building {
  id: string;
  name: string;
  address: string;
  total_units: number;
  created_at: string;
  updated_at: string;
  apartments?: Apartment[];
}

interface Apartment {
  id: string;
  building_id: string;
  unit_number: string;
  floor: number;
  created_at: string;
  updated_at: string;
  building?: Building;
}

// Virtual interface for floor grouping (not a database table)
interface FloorGroup {
  floor_number: number;
  building_id: string;
  apartments: Apartment[];
  building?: Building;
}
```

## Error Handling

### Client-Side Error Handling

- Form validation errors displayed inline
- Network error toast notifications
- Loading states during async operations
- Optimistic updates with rollback on failure

### Server-Side Error Handling

- Database constraint violations
- Foreign key relationship validation
- Graceful error responses with user-friendly messages
- Logging for debugging purposes

### Referential Integrity

- Prevent deletion of buildings with existing floors
- Prevent deletion of floors with existing apartments
- Cascade deletes where appropriate
- Clear error messages for constraint violations

## Testing Strategy

### Unit Tests

- Component rendering and props handling
- Form validation logic
- Utility functions and helpers
- Database query functions

### Integration Tests

- CRUD operations end-to-end
- Form submission workflows
- Navigation between sections
- Error handling scenarios

### Manual Testing

- Cross-browser compatibility
- Responsive design validation
- Accessibility compliance
- Performance with large datasets

## User Interface Design

### Layout Structure

```
┌─────────────────────────────────────────┐
│ Header: Admin Dashboard                 │
├─────────────┬───────────────────────────┤
│ Sidebar     │ Main Content Area         │
│ - Workers   │                           │
│ - Buildings │ [Entity List/Form]        │
│ - Floors    │                           │
│ - Apartments│                           │
└─────────────┴───────────────────────────┘
```

### Design Principles

- **Consistency**: Uniform styling across all sections
- **Accessibility**: WCAG 2.1 AA compliance
- **Responsiveness**: Mobile-first design approach
- **Performance**: Optimized loading and rendering
- **Usability**: Intuitive navigation and clear actions

### Color Scheme & Styling

- Primary: Tailwind blue palette
- Success: Green for confirmations
- Danger: Red for deletions and errors
- Warning: Yellow for validation messages
- Neutral: Gray scale for backgrounds and text

### Interactive Elements

- Hover states for all clickable elements
- Loading spinners for async operations
- Smooth transitions and animations
- Clear visual feedback for user actions
