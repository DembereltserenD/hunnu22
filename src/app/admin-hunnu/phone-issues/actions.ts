'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '../../../../supabase/server';
import { PhoneIssueFormData, PhoneIssue, PhoneIssueSummary } from '../../../types/admin';

export async function getPhoneIssues() {
  const supabase = await createClient();
  
  // Get phone issues without complex joins first
  const { data: issues, error } = await supabase
    .from('phone_issues')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching phone issues:', error);
    throw new Error('Failed to fetch phone issues');
  }

  if (!issues || issues.length === 0) {
    return [];
  }

  // Get apartments and buildings separately
  const { data: apartments } = await supabase
    .from('apartments')
    .select(`
      id,
      unit_number,
      floor,
      building_id,
      building:buildings(
        id,
        name,
        address
      )
    `);

  // Get workers separately
  const { data: workers } = await supabase
    .from('workers')
    .select('id, name, email, phone');

  // Create lookup maps
  const apartmentMap = new Map(apartments?.map(apt => [apt.id, apt]) || []);
  const workerMap = new Map(workers?.map(worker => [worker.id, worker]) || []);

  // Combine the data
  return issues.map(issue => ({
    ...issue,
    apartment: apartmentMap.get(issue.apartment_id),
    worker: issue.worker_id ? workerMap.get(issue.worker_id) : null
  })) as PhoneIssue[];
}

export async function getPhoneIssuesSummary(dateRange?: { from?: Date; to?: Date }) {
    const supabase = createClient();

    try {
        let query = supabase
            .from('phone_issues')
            .select(`
                *,
                apartment:apartments(
                    id,
                    unit_number,
                    building:buildings(
                        id,
                        name
                    )
                ),
                worker:workers(
                    id,
                    name
                )
            `)
            .order('created_at', { ascending: false });

        // Apply date range filter if provided
        if (dateRange?.from) {
            query = query.gte('created_at', dateRange.from.toISOString());
        }
        if (dateRange?.to) {
            // Add one day to include the entire end date
            const endDate = new Date(dateRange.to);
            endDate.setDate(endDate.getDate() + 1);
            query = query.lt('created_at', endDate.toISOString());
        }

        const { data: phoneIssues, error } = await query;

        if (error) {
            console.error('Error fetching phone issues:', error);
            throw error;
        }

        // If no phone issues exist, return empty array
        if (!phoneIssues || phoneIssues.length === 0) {
            return [];
        }

        // Get apartments and buildings separately to avoid complex joins
        const { data: apartments, error: apartmentsError } = await supabase
          .from('apartments')
          .select(`
            id,
            unit_number,
            floor,
            building_id,
            building:buildings(
              id,
              name,
              address
            )
          `);

        if (apartmentsError) {
          console.error('Error fetching apartments:', apartmentsError);
          throw new Error(`Failed to fetch apartments: ${apartmentsError.message}`);
        }

        // Get workers separately
        const { data: workers, error: workersError } = await supabase
          .from('workers')
          .select('id, name, email, phone');

        if (workersError) {
          console.error('Error fetching workers:', workersError);
          throw new Error(`Failed to fetch workers: ${workersError.message}`);
        }

        // Create lookup maps
        const apartmentMap = new Map(apartments?.map(apt => [apt.id, apt]) || []);
        const workerMap = new Map(workers?.map(worker => [worker.id, worker]) || []);

        // Combine the data
        const enrichedIssues = phoneIssues.map(issue => ({
          ...issue,
          apartment: apartmentMap.get(issue.apartment_id),
          worker: issue.worker_id ? workerMap.get(issue.worker_id) : null
        }));

        // Group issues by phone number
        const phoneGroups = new Map<string, PhoneIssue[]>();
        
        enrichedIssues.forEach((issue: any) => {
          if (issue.phone_number) {
            const existing = phoneGroups.get(issue.phone_number) || [];
            phoneGroups.set(issue.phone_number, [...existing, issue]);
          }
        });

        // Create summary for each phone number
        const summaries: PhoneIssueSummary[] = [];
        
        phoneGroups.forEach((phoneIssues, phoneNumber) => {
          const totalIssues = phoneIssues.length;
          const openIssues = phoneIssues.filter(i => i.status === 'open').length;
          const receivedIssues = phoneIssues.filter(i => i.status === 'хүлээж авсан').length;
          const completedIssues = phoneIssues.filter(i => i.status === 'болсон').length;
          const needsHelpIssues = phoneIssues.filter(i => i.status === 'тусламж хэрэгтэй').length;
          
          // Since we're filtering out smoke detectors, these should be 0
          const smokeDetectorIssues = 0;
          const domophoneIssues = phoneIssues.filter(i => i.issue_type === 'domophone').length;
          const lightBulbIssues = phoneIssues.filter(i => i.issue_type === 'light_bulb').length;
          
          const smokeDetectorResolved = 0; // No smoke detectors to resolve

          // Count resolved issues by worker
          const workerCounts = new Map<string, number>();
          phoneIssues
            .filter(i => i.status === 'болсон' && i.worker?.name)
            .forEach(i => {
              const workerName = i.worker!.name;
              workerCounts.set(workerName, (workerCounts.get(workerName) || 0) + 1);
            });

          const resolvedByWorkers = Array.from(workerCounts.entries()).map(([worker_name, count]) => ({
            worker_name,
            count
          }));

          summaries.push({
            phone_number: phoneNumber,
            total_issues: totalIssues,
            open_issues: openIssues,
            received_issues: receivedIssues,
            completed_issues: completedIssues,
            needs_help_issues: needsHelpIssues,
            smoke_detector_issues: smokeDetectorIssues,
            domophone_issues: domophoneIssues,
            light_bulb_issues: lightBulbIssues,
            smoke_detector_resolved: smokeDetectorResolved,
            resolved_by_workers: resolvedByWorkers,
            latest_issue: phoneIssues[0] // Most recent issue
          });
        });

        return summaries.sort((a, b) => b.total_issues - a.total_issues);
    } catch (error) {
        console.error('Error in getPhoneIssuesSummary:', error);
        throw error;
    }
}

export async function getPhoneIssue(id: string) {
  const supabase = await createClient();
  
  const { data: issue, error } = await supabase
    .from('phone_issues')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching phone issue:', error);
    throw new Error('Failed to fetch phone issue');
  }

  if (!issue) {
    throw new Error('Phone issue not found');
  }

  // Get apartment and building data separately
  const { data: apartment } = await supabase
    .from('apartments')
    .select(`
      id,
      unit_number,
      floor,
      building_id,
      building:buildings(
        id,
        name,
        address
      )
    `)
    .eq('id', issue.apartment_id)
    .single();

  // Get worker data if assigned
  let worker = null;
  if (issue.worker_id) {
    const { data: workerData } = await supabase
      .from('workers')
      .select('id, name, email, phone')
      .eq('id', issue.worker_id)
      .single();
    worker = workerData;
  }

  return {
    ...issue,
    apartment,
    worker
  } as PhoneIssue;
}

export async function createPhoneIssue(formData: PhoneIssueFormData) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('phone_issues')
    .insert([{
      apartment_id: formData.apartment_id,
      phone_number: formData.phone_number,
      issue_type: formData.issue_type,
      status: formData.status,
      worker_id: formData.worker_id || null,
      description: formData.description || null,
      worker_notes: formData.worker_notes || null,
      resolved_at: formData.status === 'болсон' ? new Date().toISOString() : null
    }]);

  if (error) {
    console.error('Error creating phone issue:', error);
    throw new Error('Failed to create phone issue');
  }

  revalidatePath('/admin-hunnu/phone-issues');
  redirect('/admin-hunnu/phone-issues');
}

export async function createPhoneIssueWithoutRedirect(formData: PhoneIssueFormData) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('phone_issues')
    .insert([{
      apartment_id: formData.apartment_id,
      phone_number: formData.phone_number,
      issue_type: formData.issue_type,
      status: formData.status,
      worker_id: formData.worker_id || null,
      description: formData.description || null,
      worker_notes: formData.worker_notes || null,
      resolved_at: formData.status === 'болсон' ? new Date().toISOString() : null
    }]);

  if (error) {
    console.error('Error creating phone issue:', error);
    throw new Error('Failed to create phone issue');
  }

  return true;
}

export async function updatePhoneIssue(id: string, formData: PhoneIssueFormData) {
  const supabase = await createClient();
  
  const updateData: any = {
    apartment_id: formData.apartment_id,
    phone_number: formData.phone_number,
    issue_type: formData.issue_type,
    status: formData.status,
    worker_id: formData.worker_id || null,
    description: formData.description || null,
    worker_notes: formData.worker_notes || null,
    updated_at: new Date().toISOString()
  };

  // Set resolved_at when status changes to болсон (completed)
  if (formData.status === 'болсон') {
    updateData.resolved_at = new Date().toISOString();
  } else {
    updateData.resolved_at = null;
  }

  const { error } = await supabase
    .from('phone_issues')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating phone issue:', error);
    throw new Error('Failed to update phone issue');
  }

  revalidatePath('/admin-hunnu/phone-issues');
  redirect('/admin-hunnu/phone-issues');
}

export async function deletePhoneIssue(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('phone_issues')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting phone issue:', error);
    throw new Error('Failed to delete phone issue');
  }

  revalidatePath('/admin-hunnu/phone-issues');
}

// Helper functions for form data
export async function getApartmentsForSelect() {
  const supabase = await createClient();
  
  // First, let's get all buildings to ensure we have complete data
  const { data: buildings, error: buildingsError } = await supabase
    .from('buildings')
    .select('*')
    .order('name');

  if (buildingsError) {
    console.error('Error fetching buildings:', buildingsError);
    throw new Error('Failed to fetch buildings');
  }

  // Then get all apartments with their building data
  const { data: apartments, error: apartmentsError } = await supabase
    .from('apartments')
    .select(`
      id,
      unit_number,
      floor,
      building_id,
      building:buildings(*)
    `)
    .order('building_id, floor, unit_number');

  if (apartmentsError) {
    console.error('Error fetching apartments for select:', apartmentsError);
    throw new Error('Failed to fetch apartments');
  }

  // Log for debugging
  console.log('Buildings found:', buildings?.length || 0);
  console.log('Apartments found:', apartments?.length || 0);
  
  // Create a map of buildings for easy lookup
  const buildingMap = new Map(buildings?.map(b => [b.id, b]) || []);
  
  // Ensure each apartment has proper building data
  const enrichedApartments = apartments?.map(apartment => ({
    ...apartment,
    building: apartment.building || buildingMap.get(apartment.building_id)
  })) || [];

  return enrichedApartments;
}

export async function getWorkersForSelect() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('workers')
    .select('id, name, email, phone')
    .order('name');

  if (error) {
    console.error('Error fetching workers for select:', error);
    throw new Error('Failed to fetch workers');
  }

  return data || [];
}

export async function getBuildingsForSelect() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('buildings')
    .select('id, name, address')
    .order('name');

  if (error) {
    console.error('Error fetching buildings for select:', error);
    throw new Error('Failed to fetch buildings');
  }

  console.log('Buildings for select:', data?.length || 0);
  return data || [];
}

// Test function to verify database connectivity
export async function testPhoneIssuesConnection() {
  try {
    const supabase = await createClient();
    
    // Simple count query to test connection
    const { count, error } = await supabase
      .from('phone_issues')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Database connection test failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, count };
  } catch (err) {
    console.error('Connection test error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}