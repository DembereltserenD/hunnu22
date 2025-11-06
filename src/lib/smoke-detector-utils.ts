import { PhoneIssue } from '@/types/admin';

export interface SmokeDetectorStats {
  totalCleaned: number;
  recentlyCleaned: number; // Last 30 days
  pendingIssues: number;
  lastCleanedDate?: Date;
}

// Helper function to extract quantity from description
function extractQuantityFromDescription(description: string | null | undefined): number {
  if (!description) return 1; // Default to 1 if no description
  
  // Look for patterns like "Cleared 3 smoke detectors" or "Cleared 1 smoke detector"
  const match = description.match(/Cleared (\d+) smoke detector/i);
  return match ? parseInt(match[1]) : 1;
}

export function calculateSmokeDetectorStats(
  phoneIssues: PhoneIssue[],
  apartmentId?: string,
  buildingApartmentIds?: string[]
): SmokeDetectorStats {
  // Filter for smoke detector issues
  let relevantIssues = phoneIssues.filter(issue => issue.issue_type === 'smoke_detector');
  
  // Filter by apartment or building
  if (apartmentId) {
    relevantIssues = relevantIssues.filter(issue => issue.apartment_id === apartmentId);
  } else if (buildingApartmentIds) {
    relevantIssues = relevantIssues.filter(issue => 
      buildingApartmentIds.includes(issue.apartment_id)
    );
  }

  const resolvedIssues = relevantIssues.filter(issue => issue.status === 'болсон');
  const pendingIssues = relevantIssues.filter(issue => issue.status !== 'болсон');
  
  // Calculate total quantity cleaned by parsing descriptions
  const totalCleaned = resolvedIssues.reduce((total, issue) => {
    return total + extractQuantityFromDescription(issue.description);
  }, 0);
  
  // Calculate recently cleaned (last 30 days) with quantities
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentlyCleaned = resolvedIssues
    .filter(issue => issue.resolved_at && new Date(issue.resolved_at) >= thirtyDaysAgo)
    .reduce((total, issue) => {
      return total + extractQuantityFromDescription(issue.description);
    }, 0);

  // Find last cleaned date
  const lastCleanedIssue = resolvedIssues
    .filter(issue => issue.resolved_at)
    .sort((a, b) => new Date(b.resolved_at!).getTime() - new Date(a.resolved_at!).getTime())[0];

  return {
    totalCleaned,
    recentlyCleaned,
    pendingIssues: pendingIssues.length,
    lastCleanedDate: lastCleanedIssue?.resolved_at ? new Date(lastCleanedIssue.resolved_at) : undefined
  };
}

export function parseSmokeDetectorCode(code: string): {
  buildingNumber: string;
  unitNumber: string;
  quantity: number;
  phoneNumber: string;
} | null {
  // Parse formats like: 224-1002-3SD 99354845
  const match = code.match(/(\d+)[-\s]+(\d+)[-\s]+(\d+)SD\s+(\d+)/i);
  
  if (!match) return null;
  
  const [, buildingNum, unitNum, quantity, phoneNum] = match;
  
  return {
    buildingNumber: buildingNum,
    unitNumber: unitNum,
    quantity: parseInt(quantity),
    phoneNumber: phoneNum
  };
}