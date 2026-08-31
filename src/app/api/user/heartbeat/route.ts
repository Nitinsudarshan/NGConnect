import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const clientSupabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await clientSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date().toISOString();
    const metadata = user.user_metadata || {};

    const { sanitizeUserAuthMetadata } = await import("@/lib/auth-guard");
    const cleanMeta = sanitizeUserAuthMetadata({
      ...metadata,
      last_active_at: now,
      last_login_at: metadata.last_login_at || now,
    });

    const adminClient = createAdminClient();
    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: cleanMeta,
    });

    return NextResponse.json({ success: true, timestamp: now });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal error" },
      { status: 500 }
    );
  }
}
