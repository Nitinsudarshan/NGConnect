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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "coursera" | "pay_forward" | null;
    const userEmailFilter = searchParams.get("user_email");
    const statusFilter = searchParams.get("status");

    // If user is a Member and asking for their own status, filter by user email
    let filterEmail = userEmailFilter;
    if (user?.user_metadata?.role === "Member" || !userEmailFilter) {
      if (user?.email) {
        filterEmail = user.email;
      }
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

    const body = await request.json();
    const { type } = body;

    if (!type || (type !== "coursera" && type !== "pay_forward")) {
      return NextResponse.json(
        { success: false, error: "Invalid request type" },
        { status: 400 }
      );
    }

    const userEmail = user?.email || body.email || "alumni.member@navgurukul.org";
    const userName = user?.user_metadata?.name || user?.user_metadata?.full_name || userEmail.split("@")[0];
    const userId = user?.id || "user_demo_1";

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

    const body = await request.json();
    const { requestId, status } = body;

    if (!requestId || !status) {
      return NextResponse.json(
        { success: false, error: "Missing requestId or status" },
        { status: 400 }
      );
    }

    const updated = await updateMemberRequestStatus(
      requestId,
      status,
      user?.email || "staff@navgurukul.org"
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
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
