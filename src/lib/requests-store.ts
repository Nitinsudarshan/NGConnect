import { createAdminClient } from "@/lib/supabase/admin";

export interface MemberRequest {
  id: string;
  type: "coursera" | "pay_forward";
  user_id: string;
  user_email: string;
  user_name: string;
  status: "pending" | "approved" | "received" | "rejected";
  created_at: string;
  updated_at: string;
  processed_by?: string | null;
}

// In-memory fallback cache for dev session state persistence
let memoryRequests: MemberRequest[] = [
  {
    id: "req_cs_101",
    type: "coursera",
    user_id: "user_alumni_01",
    user_email: "alumni.demo@navgurukul.org",
    user_name: "Priya Sharma",
    status: "pending",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "req_pf_102",
    type: "pay_forward",
    user_id: "user_alumni_02",
    user_email: "rahul.alumni@navgurukul.org",
    user_name: "Rahul Verma",
    status: "pending",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export async function getMemberRequests(filters?: {
  type?: "coursera" | "pay_forward";
  user_email?: string;
  status?: string;
}): Promise<MemberRequest[]> {
  try {
    const supabase = createAdminClient();
    let query = supabase.from("alumni_member_requests").select("*");

    if (filters?.type) {
      query = query.eq("type", filters.type);
    }
    if (filters?.user_email) {
      query = query.ilike("user_email", filters.user_email);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (!error && data) {
      return data as MemberRequest[];
    }
  } catch (e) {
    // Supabase table fallback to memory store
  }

  // Filter memory store
  let results = [...memoryRequests];
  if (filters?.type) {
    results = results.filter((r) => r.type === filters.type);
  }
  if (filters?.user_email) {
    results = results.filter((r) => r.user_email.toLowerCase() === filters.user_email?.toLowerCase());
  }
  if (filters?.status) {
    results = results.filter((r) => r.status === filters.status);
  }

  return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createMemberRequest(input: {
  type: "coursera" | "pay_forward";
  user_id: string;
  user_email: string;
  user_name: string;
}): Promise<MemberRequest> {
  const newReq: MemberRequest = {
    id: `req_${input.type === "coursera" ? "cs" : "pf"}_${Date.now().toString().slice(-5)}`,
    type: input.type,
    user_id: input.user_id,
    user_email: input.user_email,
    user_name: input.user_name || input.user_email.split("@")[0],
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("alumni_member_requests").insert(newReq).select().single();
    if (!error && data) {
      return data as MemberRequest;
    }
  } catch (e) {
    // Fallback to memory
  }

  // Check if existing pending request exists in memory
  const existingIdx = memoryRequests.findIndex(
    (r) => r.type === input.type && r.user_email.toLowerCase() === input.user_email.toLowerCase() && r.status === "pending"
  );
  if (existingIdx >= 0) {
    return memoryRequests[existingIdx];
  }

  memoryRequests.unshift(newReq);
  return newReq;
}

export async function updateMemberRequestStatus(
  requestId: string,
  newStatus: "approved" | "received" | "rejected",
  processedBy?: string
): Promise<MemberRequest | null> {
  const now = new Date().toISOString();

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("alumni_member_requests")
      .update({
        status: newStatus,
        updated_at: now,
        processed_by: processedBy || null,
      })
      .eq("id", requestId)
      .select()
      .single();

    if (!error && data) {
      return data as MemberRequest;
    }
  } catch (e) {
    // Fallback to memory
  }

  const idx = memoryRequests.findIndex((r) => r.id === requestId);
  if (idx >= 0) {
    memoryRequests[idx] = {
      ...memoryRequests[idx],
      status: newStatus,
      updated_at: now,
      processed_by: processedBy || null,
    };
    return memoryRequests[idx];
  }

  return null;
}
