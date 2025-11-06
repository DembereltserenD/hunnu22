# Smoke Detector Tracking

## Overview

The system now tracks smoke detector cleaning activities by parsing codes like `224-1002-3SD 99354845` and displaying statistics on both building and apartment pages.

## Code Format

The system parses codes in the format: `BuildingNumber-UnitNumber-QuantitySD PhoneNumber`

### Examples:

- `224-1002-3SD 99354845` = Building 224, Unit 1002, 3 Smoke Detectors, Phone 99354845
- `222-1006-1SD 99123456` = Building 222, Unit 1006, 1 Smoke Detector, Phone 99123456
- `225-1205-5SD 99876543` = Building 225, Unit 1205, 5 Smoke Detectors, Phone 99876543

## Where to See SD Statistics

### Building Page (`/building/[id]`)

- **Building Statistics Card**: Shows total smoke detectors cleaned across all units
- **Smoke Detector Summary Card**: Displays building-wide SD statistics including:
  - Total cleaned
  - Recently cleaned (last 30 days)
  - Last cleaned date
  - Pending issues
- **Individual Apartment Cards**: Each apartment shows its SD count in the details

### Apartment Page (`/apartment/[id]`)

- **Current Status Card**: Shows SD cleaned count for the apartment
- **Smoke Detector History Card**: Detailed SD statistics including:
  - Total cleaned
  - Recently cleaned (last 30 days)
  - Pending issues
  - Last cleaned date

## Data Flow

1. **Input**: Codes are entered via the bulk import form (`/admin-hunnu/phone-issues/bulk`)
2. **Parsing**: The `parseSmokeDetectorCode()` function extracts building, unit, quantity, and phone data
3. **Storage**: Each SD cleaning is stored as a resolved phone issue with type `smoke_detector`
4. **Display**: Statistics are calculated and displayed using `calculateSmokeDetectorStats()`

## Key Functions

### `parseSmokeDetectorCode(code: string)`

Parses SD codes and returns structured data or null if invalid.

### `calculateSmokeDetectorStats(phoneIssues, apartmentId?, buildingApartmentIds?)`

Calculates SD statistics for an apartment or building:

- `totalCleaned`: Total resolved SD issues
- `recentlyCleaned`: Resolved in last 30 days
- `pendingIssues`: Open/in-progress SD issues
- `lastCleanedDate`: Date of most recent cleaning

## Visual Indicators

- 🔥 **Flame icon**: Represents smoke detectors
- **Green badges/cards**: Indicate completed/resolved SD work
- **Red badges**: Show pending SD issues
- **Statistics cards**: Provide quick overview of SD status

## Admin Features

Administrators can:

- Bulk import SD cleaning data using the standard format
- View building-wide and apartment-specific SD statistics
- Track SD cleaning progress over time
- Identify apartments with pending SD issues
