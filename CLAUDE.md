# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Run tests with UI
```

Run a single test file:
```bash
npx vitest run src/components/admin/__tests__/entity-form.test.tsx
```

## Architecture Overview

This is a Next.js 14 building/apartment management application with Supabase backend. The UI is in Mongolian.

### Directory Structure

- `src/app/` - Next.js App Router pages
  - `(auth)/` - Auth pages (sign-in, sign-up, forgot-password) grouped without URL prefix
  - `admin-hunnu/` - Admin dashboard for managing workers, buildings, apartments, phone issues
  - `dashboard/` - Main user dashboard
  - `worker-dashboard/` - Worker-specific interface
- `src/components/ui/` - Reusable UI components (shadcn/ui-based)
- `src/components/admin/` - Admin-specific components (forms, tables, dialogs)
- `src/lib/admin/` - Database service classes (WorkerService, BuildingService, ApartmentService)
- `src/lib/` - Utilities (validation schemas, IndexedDB, helpers)
- `src/hooks/` - Custom React hooks (useEntityFilters, useDebounce, useLoadingStates)
- `src/contexts/` - React contexts (RealtimeContext for data sync)
- `src/types/` - TypeScript interfaces
- `supabase/` - Supabase client setup and migrations

### Key Patterns

**Path Alias**: Use `@/*` to import from `src/*`

**Database Services**: Static methods for CRUD operations
```typescript
import { WorkerService } from '@/lib/admin/admin-db'
await WorkerService.getAll({ limit: 10, page: 1, search: 'query' })
await WorkerService.create(data)
await WorkerService.update(id, data)
await WorkerService.delete(id)
```

**Validation**: Zod schemas in `src/lib/admin-validation.ts` for form validation

**Supabase Clients**:
- `supabase/client.ts` - Browser client
- `supabase/server.ts` - Server-side client with cookies

**Auth Middleware**: `supabase/middleware.ts` handles session refresh and route protection

**Offline Support**: IndexedDB (`src/lib/indexedDB.ts`) + RealtimeContext for sync

### Database Tables

Core tables: `workers`, `buildings`, `apartments`, `visits`, `active_sessions`, `phone_issues`, `users`, `worker_requests`

- Apartments auto-calculate floor from unit_number via database trigger
- Unique constraint on (building_id, unit_number) for apartments

### Testing

Tests use Vitest with happy-dom. Test files are in `__tests__` directories adjacent to the code they test. Setup file at `src/test/setup.ts`.
