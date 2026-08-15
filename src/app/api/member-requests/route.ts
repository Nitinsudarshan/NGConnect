import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getMemberRequests,
  createMemberRequest,
  updateMemberRequestStatus,
} from "@/lib/requests-store";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "coursera" | "pay_forward" | null;
    const userEmailFilter = searchParams.get("user_email");
    const statusFilter = searchParams.get("status");

    const userRole = user.app_metadata?.role;
    const isStaff = userRole === "Admin" || userRole === "Super Admin";

    // Non-staff users can strictly view only their own requests
    let filterEmail: string | undefined = userEmailFilter || undefined;
    if (!isStaff) {
      filterEmail = user.email || undefined;
    }

    const requests = await getMemberRequests({
      type: type || undefined,
      user_email: filterEmail || undefined,
      status: statusFilter || undefined,
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch member requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;

    if (!type || (type !== "coursera" && type !== "pay_forward")) {
      return NextResponse.json(
        { success: false, error: "Invalid request type" },
        { status: 400 }
      );
    }

    // Always enforce authenticated session identity - no body email overrides or fallbacks
    const userEmail = user.email;
    const userName = user.user_metadata?.name || user.user_metadata?.full_name || userEmail.split("@")[0];
    const userId = user.id;

    const memberReq = await createMemberRequest({
      type,
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
    });

    return NextResponse.json({ success: true, data: memberReq });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Role check via app_metadata
    const userRole = user.app_metadata?.role;
    if (userRole !== "Admin" && userRole !== "Super Admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Staff role required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { requestId, status } = body;

    if (!requestId || !status || (status !== "approved" && status !== "received" && status !== "rejected")) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid requestId or status" },
        { status: 400 }
      );
    }

    const updated = await updateMemberRequestStatus(
      requestId,
      status,
      user.email
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Request not found or failed to update" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update request status" },
      { status: 500 }
    );
  }
}
