# Implementation Plan

- [x] 1. Review existing database schema and create TypeScript types

  - Review existing Supabase tables: workers, buildings, apartments
  - Define TypeScript interfaces matching existing schema
  - Create database utility functions for CRUD operations
  - Note: Floors are managed as apartment.floor column, not separate table
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 2. Create core admin layout and routing

  - [x] 2.1 Implement admin layout component with navigation sidebar

    - Create AdminLayout component with responsive sidebar navigation
    - Add navigation items for Workers, Buildings, and Apartments
    - Implement active route highlighting
    - _Requirements: 6.1, 6.2_

  - [x] 2.2 Set up admin route structure

    - Create `/admin-hunnu` page route without authentication
    - Set up nested routes for Workers, Buildings, and Apartments
    - Implement route-based navigation
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 3. Build reusable UI components

  - [x] 3.1 Create EntityTable component

    - Build generic table component with pagination and search
    - Add edit and delete action buttons
    - Implement responsive table design
    - _Requirements: 6.4, 6.5_

  - [x] 3.2 Create EntityForm component

    - Build generic form component for create/edit operations
    - Implement form validation using React Hook Form
    - Add loading states and error handling
    - _Requirements: 1.2, 2.2, 3.2, 4.2_

  - [x] 3.3 Create ConfirmDialog component

    - Build confirmation dialog for delete operations
    - Implement proper accessibility features
    - Add customizable title and description
    - _Requirements: 1.5, 2.5, 3.5_

- [x] 4. Implement Worker management functionality

  - [x] 4.1 Create Worker CRUD operations

    - Implement server actions for Worker create, read, update, delete
    - Add form validation for Worker data
    - Handle database constraints and errors
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 4.2 Build Worker management pages

    - Create Worker list page with table display
    - Implement Worker create/edit forms
    - Add Worker delete confirmation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [-] 5. Implement Building management functionality

  - [x] 5.1 Create Building CRUD operations

    - Implement server actions for Building operations
    - Add validation for Building data and relationships
    - Handle cascade delete prevention for Buildings with Apartments
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 5.2 Build Building management pages

    - Create Building list page with associated Apartments display grouped by floor
    - Implement Building create/edit forms
    - Add Building delete with relationship validation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 6. Implement Apartment management functionality

  - [x] 6.1 Create Apartment CRUD operations

    - Implement server actions for Apartment operations
    - Add Building association validation
    - Handle unit_number uniqueness within buildings
    - Implement referential integrity maintenance
    - Note: Floor is auto-calculated from unit_number via database trigger
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 6.2 Build Apartment management pages

    - Create Apartment list page organized by Building and Floor
    - Implement Apartment create/edit forms with Building selection
    - Add Apartment delete functionality
    - Display apartments grouped by floor number for better organization
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7. Add search and filtering capabilities

  - [x] 7.1 Implement search functionality

    - Add search input components to all entity tables
    - Implement server-side search for better performance
    - Add debounced search to prevent excessive API calls
    - _Requirements: 6.4_

  - [x] 7.2 Add filtering and pagination

    - Implement filtering options for each entity type
    - Add pagination controls for large datasets
    - Maintain filter state across navigation
    - _Requirements: 6.5_

- [x] 8. Enhance user experience and error handling

  - [x] 8.1 Add loading states and optimistic updates

    - Implement loading spinners for all async operations
    - Add optimistic updates for better perceived performance
    - Handle rollback scenarios for failed operations
    - _Requirements: 6.2, 6.3_

  - [x] 8.2 Implement comprehensive error handling

    - Add toast notifications for success/error messages
    - Handle database constraint violations gracefully
    - Provide clear error messages for validation failures
    - _Requirements: 2.5, 3.5_

- [x] 9. Testing and validation

  - [x] 9.1 Write unit tests for components

    - Create tests for EntityTable, EntityForm, and ConfirmDialog components
    - Test form validation logic and error handling
    - Verify component props and rendering behavior
    - _Requirements: All requirements_

  - [x] 9.2 Write integration tests for CRUD operations

    - Test complete workflows for each entity type
    - Verify referential integrity constraints
    - Test error scenarios and edge cases
    - _Requirements: All requirements_

- [x] 10. **NEW** Phone Issues Management System

  - [x] 10.1 Create phone issues database schema

    - Create phone_issues table with proper relationships to apartments and workers
    - Add issue type classification (smoke_detector, domophone, light_bulb)
    - Implement status tracking (open, in_progress, resolved)
    - Add automatic timestamp tracking for creation and resolution
    - Include sample data for testing
    - _Requirements: New feature for maintenance issue tracking_

  - [x] 10.2 Build phone issues CRUD operations

    - Implement server actions for phone issue management
    - Create helper functions for apartment and worker selection
    - Add comprehensive phone issue summary aggregation
    - Handle automatic resolution timestamp setting
    - _Requirements: New feature for maintenance issue tracking_

  - [x] 10.3 Create phone issues dashboard view

    - Build comprehensive summary view showing phone numbers with issue statistics
    - Display total issues, status breakdown, and issue type distribution
    - Show smoke detector resolution tracking with worker attribution
    - Add visual status indicators and icons for different issue types
    - Include latest issue information with apartment and building details
    - _Requirements: New feature for maintenance issue tracking_

  - [x] 10.4 Implement phone issue form components

    - Create PhoneIssueForm component with apartment and worker selection
    - Add issue type and status selection with proper validation
    - Handle building data properly from Supabase queries
    - Implement create and edit functionality
    - _Requirements: New feature for maintenance issue tracking_

  - [x] 10.5 Add phone issues to admin navigation

    - Update AdminLayout to include Phone Issues navigation
    - Add Phone Issues card to main admin dashboard
    - Create proper routing for phone issues management
    - _Requirements: New feature for maintenance issue tracking_

## Phone Issues Feature Summary

The phone issues management system provides exactly what was requested:

### Key Features Implemented:

- **Phone Number Tracking**: View all phone numbers and their associated issues
- **Issue Status Monitoring**: Track open, in-progress, and resolved issues
- **Issue Type Classification**: Support for smoke detector, domophone, and light bulb issues
- **Worker Assignment**: Assign and track which workers resolve issues
- **Smoke Detector Focus**: Special tracking for smoke detector issues and their resolution
- **Comprehensive Dashboard**: Visual summary showing:
  - Phone numbers with total issue counts
  - Status breakdown with visual indicators
  - Issue type distribution with icons
  - Worker resolution statistics
  - Latest issue details

### Dashboard View Features:

- Each phone number displayed as a card
- Total issue count and status badges
- Issue type breakdown with visual icons (🔥 smoke detector, 📞 domophone, 💡 light bulb)
- Smoke detector resolution tracking showing how many were cleared
- Worker resolution statistics showing which workers resolved issues
- Latest issue information with apartment and building context

### Technical Implementation:

- Full CRUD operations for phone issues
- Proper database relationships with apartments and workers
- Automatic timestamp tracking for issue creation and resolution
- Type-safe TypeScript interfaces
- Responsive UI with consistent design
- Form validation and error handling
