import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

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

export async function getMemberRequests(filters?: {
  type?: "coursera" | "pay_forward";
  user_email?: string;
  status?: string;
}): Promise<MemberRequest[]> {
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

  if (error) {
    console.error("[getMemberRequests] Supabase error:", error);
    throw new Error(`Failed to fetch member requests: ${error.message}`);
  }

  return (data || []) as MemberRequest[];
}

export async function createMemberRequest(input: {
  type: "coursera" | "pay_forward";
  user_id: string;
  user_email: string;
  user_name: string;
}): Promise<MemberRequest> {
  const supabase = createAdminClient();

  // Check if existing pending request exists for this user and type
  const { data: existing } = await supabase
    .from("alumni_member_requests")
    .select("*")
    .eq("type", input.type)
    .ilike("user_email", input.user_email)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return existing as MemberRequest;
  }

  const prefix = input.type === "coursera" ? "cs" : "pf";
  const newReq: MemberRequest = {
    id: `req_${prefix}_${crypto.randomUUID()}`,
    type: input.type,
    user_id: input.user_id,
    user_email: input.user_email,
    user_name: input.user_name || input.user_email.split("@")[0],
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("alumni_member_requests")
    .insert(newReq)
    .select()
    .single();

  if (error) {
    console.error("[createMemberRequest] Supabase insert error:", error);
    throw new Error(`Failed to create member request: ${error.message}`);
  }

  return data as MemberRequest;
}

export async function updateMemberRequestStatus(
  requestId: string,
  newStatus: "approved" | "received" | "rejected",
  processedBy: string
): Promise<MemberRequest | null> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("alumni_member_requests")
    .update({
      status: newStatus,
      updated_at: now,
      processed_by: processedBy,
    })
    .eq("id", requestId)
    .select()
    .single();

  if (error) {
    console.error("[updateMemberRequestStatus] Supabase update error:", error);
    throw new Error(`Failed to update member request status: ${error.message}`);
  }

  return data as MemberRequest | null;
}
