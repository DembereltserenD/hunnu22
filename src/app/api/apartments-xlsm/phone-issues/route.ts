import { NextResponse } from 'next/server';
import { createClient } from '../../../../../supabase/server';

export const dynamic = 'force-dynamic';

interface PhoneIssueWithDetails {
  id: string;
  phone_number: string;
  issue_type: 'smoke_detector' | 'domophone' | 'light_bulb';
  status: string;
  description: string | null;
  worker_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  worker: {
    id: string;
    name: string;
  } | null;
  apartment: {
    id: string;
    unit_number: string;
    building: {
      id: string;
      name: string;
    } | null;
  } | null;
}

// GET /api/apartments-xlsm/phone-issues?building=222&unit=101
// or GET /api/apartments-xlsm/phone-issues?building=222 (all issues for building)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buildingName = searchParams.get('building');
    const unitNumber = searchParams.get('unit');

    if (!buildingName) {
      return NextResponse.json(
        { error: 'Building name is required', issues: [] },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // First find the building by name
    const { data: buildings, error: buildingError } = await supabase
      .from('buildings')
      .select('id, name')
      .eq('name', buildingName);

    if (buildingError) {
      console.error('Error finding building:', buildingError);
      return NextResponse.json({ error: 'Database error', issues: [] }, { status: 500 });
    }

    if (!buildings || buildings.length === 0) {
      // Building doesn't exist in DB - return empty (no phone issues yet)
      return NextResponse.json({ issues: [], building_exists: false });
    }

    const buildingId = buildings[0].id;

    // Build query for phone issues
    let query = supabase
      .from('phone_issues')
      .select(`
        id,
        phone_number,
        issue_type,
        status,
        description,
        worker_notes,
        resolved_at,
        created_at,
        updated_at,
        worker:workers(id, name),
        apartment:apartments!inner(
          id,
          unit_number,
          building_id,
          building:buildings(id, name)
        )
      `)
      .eq('apartment.building_id', buildingId)
      .order('updated_at', { ascending: false });

    // Filter by unit if provided
    if (unitNumber) {
      query = query.eq('apartment.unit_number', unitNumber);
    }

    const { data: issues, error: issuesError } = await query;

    if (issuesError) {
      console.error('Error fetching phone issues:', issuesError);
      return NextResponse.json({ error: 'Failed to fetch phone issues', issues: [] }, { status: 500 });
    }

    // Group issues by unit for easier consumption
    const issuesByUnit: Record<string, PhoneIssueWithDetails[]> = {};

    for (const issue of (issues || [])) {
      // Handle Supabase relation arrays - get first element
      const apartmentData = Array.isArray(issue.apartment) ? issue.apartment[0] : issue.apartment;
      const workerData = Array.isArray(issue.worker) ? issue.worker[0] : issue.worker;

      const unit = apartmentData?.unit_number || 'unknown';
      if (!issuesByUnit[unit]) {
        issuesByUnit[unit] = [];
      }

      // Transform to proper structure
      const transformedIssue: PhoneIssueWithDetails = {
        id: issue.id,
        phone_number: issue.phone_number,
        issue_type: issue.issue_type,
        status: issue.status,
        description: issue.description,
        worker_notes: issue.worker_notes,
        resolved_at: issue.resolved_at,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        worker: workerData || null,
        apartment: apartmentData ? {
          id: apartmentData.id,
          unit_number: apartmentData.unit_number,
          building: Array.isArray(apartmentData.building) ? apartmentData.building[0] : apartmentData.building,
        } : null,
      };

      issuesByUnit[unit].push(transformedIssue);
    }

    // Flatten all transformed issues
    const allTransformedIssues = Object.values(issuesByUnit).flat();

    // Calculate summary stats
    const stats = {
      total: allTransformedIssues.length,
      byStatus: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      resolved: allTransformedIssues.filter(i => i.resolved_at).length,
      pending: allTransformedIssues.filter(i => !i.resolved_at).length,
    };

    for (const issue of allTransformedIssues) {
      stats.byStatus[issue.status] = (stats.byStatus[issue.status] || 0) + 1;
      stats.byType[issue.issue_type] = (stats.byType[issue.issue_type] || 0) + 1;
    }

    return NextResponse.json({
      issues: allTransformedIssues,
      issuesByUnit,
      stats,
      building_exists: true,
    });
  } catch (error) {
    console.error('Error in phone issues API:', error);
    return NextResponse.json(
      { error: 'Internal server error', issues: [] },
      { status: 500 }
    );
  }
}
