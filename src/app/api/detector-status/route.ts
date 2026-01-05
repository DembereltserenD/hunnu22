import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../supabase/server';

export const dynamic = 'force-dynamic';

type DetectorStatus = 'ok' | 'problem' | 'warning';
type DeviceType = 'detector' | 'commonArea' | 'bell' | 'mcp' | 'relay';

// Cycle order: problem -> ok -> warning -> problem
const STATUS_CYCLE: Record<DetectorStatus, DetectorStatus> = {
  problem: 'ok',
  ok: 'warning',
  warning: 'problem',
};

interface ToggleRequest {
  buildingId: string;
  unitNumber: string;
  detectorAddress: number;
  deviceType: DeviceType;
  currentStatus: DetectorStatus;
}

// POST: Toggle detector status (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin and get user info (by email)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, role, full_name, name, email')
      .eq('email', user.email)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can toggle detector status' },
        { status: 403 }
      );
    }

    // Get display name for history
    const changedByName = userData.full_name || userData.name || userData.email || 'Admin';

    const body: ToggleRequest = await request.json();
    const { buildingId, unitNumber, detectorAddress, deviceType = 'detector', currentStatus } = body;

    if (!buildingId || !unitNumber || detectorAddress === undefined || !currentStatus) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate next status in cycle
    const newStatus = STATUS_CYCLE[currentStatus];

    // Check if override already exists (including device type)
    const { data: existingOverride } = await supabase
      .from('detector_status_overrides')
      .select('id')
      .eq('building_id', buildingId)
      .eq('unit_number', unitNumber)
      .eq('detector_address', detectorAddress)
      .eq('device_type', deviceType)
      .single();

    if (existingOverride) {
      // Update existing override
      const { error: updateError } = await supabase
        .from('detector_status_overrides')
        .update({
          status: newStatus,
          updated_by: userData.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingOverride.id);

      if (updateError) {
        console.error('Error updating detector status:', updateError);
        return NextResponse.json(
          { error: 'Failed to update detector status' },
          { status: 500 }
        );
      }
    } else {
      // Insert new override
      const { error: insertError } = await supabase
        .from('detector_status_overrides')
        .insert({
          building_id: buildingId,
          unit_number: unitNumber,
          detector_address: detectorAddress,
          device_type: deviceType,
          status: newStatus,
          updated_by: userData.id,
        });

      if (insertError) {
        console.error('Error inserting detector status:', insertError);
        return NextResponse.json(
          { error: 'Failed to create detector status override' },
          { status: 500 }
        );
      }
    }

    // Log to history
    const { error: historyError } = await supabase
      .from('detector_status_history')
      .insert({
        building_id: buildingId,
        unit_number: unitNumber,
        detector_address: detectorAddress,
        device_type: deviceType,
        old_status: currentStatus,
        new_status: newStatus,
        changed_by: userData.id,
        changed_by_name: changedByName,
      });

    if (historyError) {
      console.error('Error logging to history:', historyError);
      // Don't fail the request, history is optional
    }

    return NextResponse.json({
      success: true,
      newStatus,
      deviceType,
      message: `Device ${detectorAddress} (${deviceType}) status changed to ${newStatus}`,
    });
  } catch (error) {
    console.error('Error toggling detector status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Get all overrides for a building, or history if requested
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');
    const includeHistory = searchParams.get('history') === 'true';

    if (!buildingId) {
      return NextResponse.json(
        { error: 'buildingId is required' },
        { status: 400 }
      );
    }

    // Fetch overrides
    const { data: overrides, error } = await supabase
      .from('detector_status_overrides')
      .select('*')
      .eq('building_id', buildingId);

    if (error) {
      console.error('Error fetching detector overrides:', error);
      return NextResponse.json(
        { error: 'Failed to fetch detector overrides' },
        { status: 500 }
      );
    }

    // Convert to a map for easier lookup: { "deviceType-unitNumber-address": status }
    const overrideMap: Record<string, DetectorStatus> = {};
    overrides?.forEach((override) => {
      const deviceType = override.device_type || 'detector';
      const key = `${deviceType}-${override.unit_number}-${override.detector_address}`;
      overrideMap[key] = override.status as DetectorStatus;
    });

    // If history is requested, fetch it (admin only)
    let history: any[] = [];
    if (includeHistory) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('email', user.email)
          .single();

        if (userData?.role === 'admin') {
          const { data: historyData, error: historyError } = await supabase
            .from('detector_status_history')
            .select('*')
            .eq('building_id', buildingId)
            .order('changed_at', { ascending: false })
            .limit(100);

          if (!historyError && historyData) {
            history = historyData;
          }
        }
      }
    }

    return NextResponse.json({ overrides: overrideMap, history });
  } catch (error) {
    console.error('Error fetching detector overrides:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
