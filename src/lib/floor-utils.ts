/**
 * Clean unit number by removing extra text like "SD", "1SD", etc.
 * Examples:
 * - "101-1 SD" -> "101"
 * - "205-2SD" -> "205"
 * - "1005" -> "1005"
 */
export function cleanUnitNumber(unitNumber: string): string {
  // Remove common suffixes and extra text
  return unitNumber
    .replace(/[-\s]*\d*\s*SD.*$/i, '') // Remove "-1 SD", "1SD", etc.
    .replace(/[-\s]*\d*\s*smoke.*$/i, '') // Remove smoke detector references
    .replace(/[-\s]*\d*\s*detector.*$/i, '') // Remove detector references
    .trim();
}

/**
 * Calculate floor number from unit number
 * Examples:
 * - 101 -> Floor 1
 * - 205 -> Floor 2  
 * - 1005 -> Floor 10
 * - 1501 -> Floor 15
 */
export function calculateFloor(unitNumber: string): number {
  // Clean the unit number first
  const cleanUnit = cleanUnitNumber(unitNumber);
  
  // Extract only the numeric part
  const numericUnit = parseInt(cleanUnit.replace(/\D/g, ''), 10);
  
  if (isNaN(numericUnit)) {
    return 1; // Default to floor 1 if parsing fails
  }
  
  // For 3-digit numbers (101-999), floor is first digit
  if (numericUnit >= 100 && numericUnit <= 999) {
    return Math.floor(numericUnit / 100);
  }
  
  // For 4-digit numbers (1000+), floor is first two digits
  if (numericUnit >= 1000) {
    return Math.floor(numericUnit / 100);
  }
  
  // For 1-2 digit numbers, assume floor 1
  return 1;
}

/**
 * Format floor number for display
 */
export function formatFloor(floor: number): string {
  return `Floor ${floor}`;
}

/**
 * Group apartments by floor
 */
export function groupApartmentsByFloor<T extends { unit_number: string; floor?: number }>(
  apartments: T[]
): Array<{ floor: number; apartments: T[] }> {
  const grouped = apartments.reduce((acc, apartment) => {
    // Use existing floor if available, otherwise calculate from unit number
    const floor = apartment.floor ?? calculateFloor(apartment.unit_number);
    
    if (!acc[floor]) {
      acc[floor] = [];
    }
    acc[floor].push(apartment);
    return acc;
  }, {} as Record<number, T[]>);

  return Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b)
    .map(floor => ({
      floor,
      apartments: grouped[floor].sort((a, b) => 
        a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true })
      )
    }));
}