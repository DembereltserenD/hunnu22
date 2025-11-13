"use server";

import { createClient } from "../../../../supabase/server";

interface GetWorkerRequestsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  request_type?: string;
}

export async function getWorkerRequests(params: GetWorkerRequestsParams = {}) {
  const {
    page = 1,
    limit = 10,
    search = "",
    status,
    request_type,
  } = params;

  try {
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from("worker_requests")
      .select("*", { count: "exact" });

    // Apply search filter
    if (search) {
      query = query.or(`worker_name.ilike.%${search}%,title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply status filter
    if (status) {
      query = query.eq("status", status);
    }

    // Apply request_type filter
    if (request_type) {
      query = query.eq("request_type", request_type);
    }

    // Apply pagination and ordering
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching worker requests:", error);
      return {
        success: false,
        error: error.message,
        data: [],
        page,
        totalPages: 0,
        total: 0,
      };
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return {
      success: true,
      data: data || [],
      page,
      totalPages,
      total: count || 0,
    };
  } catch (error) {
    console.error("Error in getWorkerRequests:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      data: [],
      page,
      totalPages: 0,
      total: 0,
    };
  }
}

export async function updateRequestStatus(requestId: string, status: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("worker_requests")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      console.error("Error updating request status:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error in updateRequestStatus:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
