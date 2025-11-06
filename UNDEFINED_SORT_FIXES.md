# Undefined Sort Error Fixes

## Problem Solved

Fixed `TypeError: Cannot read properties of undefined (reading 'sort')` error in admin pages that occurred when trying to sort undefined arrays or access undefined object properties.

## Root Cause

The error occurred in the apartments page (and potentially buildings page) when:

1. `group.floors[floor]` was undefined but the code tried to call `.sort()` on it
2. Missing null/undefined checks for data properties before calling methods
3. Race conditions or data inconsistencies causing expected arrays to be undefined

## Fixes Applied

### 1. Apartments Page (`src/app/admin-hunnu/apartments/page.tsx`)

#### Before (Problematic Code):

```typescript
apartments: group.floors[floor].sort((a, b) =>
  a.unit_number.localeCompare(b.unit_number)
);
```

#### After (Fixed Code):

```typescript
apartments: (group.floors[floor] || []).sort((a, b) =>
  (a.unit_number || "").localeCompare(b.unit_number || "")
);
```

#### Additional Safety Checks Added:

- **Array validation**: Check if `apartments` exists and is an array
- **Apartment validation**: Check if individual apartment objects exist
- **Building validation**: Check if building exists and has an ID
- **Floor validation**: Check if floor is a valid number
- **String comparison safety**: Use fallback empty strings for `localeCompare`

```typescript
const groupApartmentsByBuilding = (): BuildingGroup[] => {
  // Add safety check for apartments array
  if (!apartments || !Array.isArray(apartments)) {
    return [];
  }

  const grouped = apartments.reduce(
    (acc, apartment) => {
      // Add safety checks for apartment data
      if (!apartment) return acc;

      const building = (apartment as GroupedApartment).building;
      if (!building || !building.id) return acc;

      const buildingId = building.id;
      if (!acc[buildingId]) {
        acc[buildingId] = {
          building,
          floors: {},
          totalApartments: 0,
        };
      }

      const floor = apartment.floor;
      // Add safety check for floor number
      if (typeof floor !== "number" || isNaN(floor)) return acc;

      if (!acc[buildingId].floors[floor]) {
        acc[buildingId].floors[floor] = [];
      }

      acc[buildingId].floors[floor].push(apartment as GroupedApartment);
      acc[buildingId].totalApartments++;

      return acc;
    },
    {} as Record<
      string,
      {
        building: any;
        floors: Record<number, GroupedApartment[]>;
        totalApartments: number;
      }
    >
  );

  return Object.values(grouped)
    .map((group) => ({
      building: group.building,
      totalApartments: group.totalApartments,
      floors: Object.keys(group.floors)
        .map(Number)
        .sort((a, b) => a - b)
        .map((floor) => ({
          floor,
          apartments: (group.floors[floor] || []).sort((a, b) =>
            (a.unit_number || "").localeCompare(b.unit_number || "")
          ),
        })),
    }))
    .sort((a, b) =>
      (a.building?.name || "").localeCompare(b.building?.name || "")
    );
};
```

### 2. Buildings Page (`src/app/admin-hunnu/buildings/page.tsx`)

#### Before (Potentially Problematic):

```typescript
apartments: grouped[floor].sort((a: any, b: any) =>
  a.unit_number.localeCompare(b.unit_number)
);
```

#### After (Fixed):

```typescript
apartments: (grouped[floor] || []).sort((a: any, b: any) =>
  (a.unit_number || "").localeCompare(b.unit_number || "")
);
```

#### Additional Safety Checks Added:

```typescript
const groupApartmentsByFloor = (apartments: any[] = []) => {
  const grouped = apartments.reduce(
    (acc, apartment) => {
      if (!apartment) return acc;

      const floor = apartment.floor;
      // Add safety check for floor number
      if (typeof floor !== "number" || isNaN(floor)) return acc;

      if (!acc[floor]) {
        acc[floor] = [];
      }
      acc[floor].push(apartment);
      return acc;
    },
    {} as Record<number, any[]>
  );

  return Object.keys(grouped)
    .map(Number)
    .sort((a: number, b: number) => a - b)
    .map((floor) => ({
      floor,
      apartments: (grouped[floor] || []).sort((a: any, b: any) =>
        (a.unit_number || "").localeCompare(b.unit_number || "")
      ),
    }));
};
```

## Safety Patterns Implemented

### 1. Null Coalescing for Arrays

```typescript
(array || []).sort(...)  // Ensures we always have an array to sort
```

### 2. Safe String Comparison

```typescript
(a.property || "").localeCompare(b.property || ""); // Prevents undefined string comparison
```

### 3. Type and Existence Validation

```typescript
if (!data || !Array.isArray(data)) return [];
if (!item) return acc;
if (typeof value !== "number" || isNaN(value)) return acc;
```

### 4. Optional Chaining for Object Properties

```typescript
a.building?.name || ""; // Safe access to nested properties
```

## Benefits

- ✅ **Prevents Runtime Errors**: No more "Cannot read properties of undefined" errors
- ✅ **Graceful Degradation**: App continues to work even with incomplete data
- ✅ **Better User Experience**: No crashes, just empty states when data is missing
- ✅ **Robust Data Handling**: Handles edge cases and data inconsistencies
- ✅ **Type Safety**: Added proper type checks for critical operations

## Testing

- ✅ TypeScript compilation: No errors
- ✅ Runtime safety: Handles undefined/null data gracefully
- ✅ Edge cases: Works with empty arrays, missing properties, invalid data types

The admin pages are now much more robust and will handle data inconsistencies without crashing.
