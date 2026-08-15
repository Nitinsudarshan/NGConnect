import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      category,
      focusArea,
      rating,
      comments,
      categorySpecificSuggestion,
      isAnonymous,
    } = body;

    // Server-side validation
    if (!category || typeof category !== "string") {
      return NextResponse.json(
        { success: false, error: "Feedback category is required" },
        { status: 400 }
      );
    }

    if (!comments || typeof comments !== "string" || !comments.trim()) {
      return NextResponse.json(
        { success: false, error: "Feedback comments cannot be empty" },
        { status: 400 }
      );
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const feedbackEntry = {
      id: `fb_${crypto.randomUUID()}`,
      user_id: isAnonymous ? null : user.id,
      user_email: isAnonymous ? null : user.email,
      category: category.trim(),
      focus_area: focusArea ? String(focusArea).trim() : null,
      rating: numericRating,
      comments: comments.trim(),
      category_specific_suggestion: categorySpecificSuggestion ? String(categorySpecificSuggestion).trim() : null,
      is_anonymous: Boolean(isAnonymous),
      created_at: new Date().toISOString(),
    };

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("alumni_member_feedback")
      .insert(feedbackEntry)
      .select()
      .single();

    if (error) {
      console.error("[POST /api/feedback] Supabase error:", error);
      return NextResponse.json(
        { success: false, error: error.message || "Failed to save feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userRole = user.app_metadata?.role;
    const isStaff = userRole === "Admin" || userRole === "Super Admin";

    const adminSupabase = createAdminClient();
    let query = adminSupabase.from("alumni_member_feedback").select("*");

    if (!isStaff && user.email) {
      query = query.eq("user_email", user.email);
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(20);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}
