"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSafeAvatarUrl } from "@/lib/avatar";
import { sanitizeUserAuthMetadata } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";

export interface ProfileRecordInput {
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  city?: string;
  state?: string;
  campus?: string;
  course?: string;
  batch?: string;
  education?: string;
  bio?: string;
  skills?: string[];
  github?: string;
  linkedin?: string;
  avatarUrl?: string | null;
  selectedTheme?: string;
  isAlumni?: boolean;
  role?: string;
}

/**
 * Loads the user profile from the database (`alumni_profile` and `alumni_master`),
 * falling back gracefully to user_metadata if no database record exists yet.
 */
export async function getProfileData() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return { error: "Unauthorized" };
    }

    const email = user.email ? user.email.trim().toLowerCase() : "";
    const metadata = user.user_metadata || {};

    const adminClient = createAdminClient();

    // 1. Fetch from alumni_profile table
    const { data: profileRow } = await adminClient
      .from("alumni_profile")
      .select("*")
      .eq("alumni_email", email)
      .maybeSingle();

    // 2. Fetch from alumni_master table
    const { data: masterRow } = await adminClient
      .from("alumni_master")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    const safeAvatar = getSafeAvatarUrl({
      profile_photo: profileRow?.profile_photo,
      avatar_url: metadata.avatar_url,
      avatarUrl: metadata.avatarUrl,
      picture: metadata.picture,
    });

    return {
      success: true,
      profile: {
        name: masterRow?.name || metadata.full_name || metadata.name || "",
        email: email,
        phone: profileRow?.phone_number || masterRow?.phone_number || metadata.phone || "",
        gender: masterRow?.gender || metadata.gender || "",
        city: profileRow?.city || masterRow?.city || metadata.city || "",
        state: profileRow?.state || masterRow?.state || metadata.state || "",
        campus: masterRow?.campus || metadata.campus || "",
        course: masterRow?.course || metadata.course || "",
        batch: profileRow?.batch_year ? String(profileRow.batch_year) : (masterRow?.entry_year ? String(masterRow.entry_year) : (metadata.batch || "")),
        education: profileRow?.highest_education || metadata.education || "",
        bio: profileRow?.bio || metadata.bio || "",
        skills: profileRow?.skills || metadata.skills || [],
        github: profileRow?.github_profile || metadata.github || "",
        linkedin: profileRow?.linkedin_profile || masterRow?.linkedin_profile || metadata.linkedin || "",
        avatarUrl: safeAvatar || "",
        selectedTheme: metadata.selectedTheme || metadata.selected_theme || "midnight",
        isAlumni: metadata.is_alumni !== false,
        role: metadata.role || user.app_metadata?.role || "Member",
      }
    };
  } catch (err: any) {
    return { error: err.message || "Failed to load profile" };
  }
}

/**
 * Saves the rich profile details to the PostgreSQL database (`alumni_profile` and `alumni_master`),
 * and updates Supabase Auth user_metadata ONLY with allowlisted identity properties.
 */
export async function saveProfileData(input: ProfileRecordInput) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return { error: "Unauthorized. Please log in." };
    }

    const email = (user.email || input.email || "").trim().toLowerCase();
    const safeAvatar = getSafeAvatarUrl({ avatarUrl: input.avatarUrl });
    const adminClient = createAdminClient();

    // 1. Upsert into public.alumni_profile table (Rich Profile Store)
    const batchYearNum = input.batch ? parseInt(input.batch, 10) : null;
    const profileRecord = {
      alumni_email: email,
      phone_number: input.phone || null,
      city: input.city || null,
      state: input.state || null,
      highest_education: input.education || null,
      batch_year: isNaN(batchYearNum as any) ? null : batchYearNum,
      bio: input.bio || null,
      skills: Array.isArray(input.skills) ? input.skills.slice(0, 5) : [],
      linkedin_profile: input.linkedin || null,
      github_profile: input.github || null,
      profile_photo: safeAvatar || null,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    const { error: profileErr } = await adminClient
      .from("alumni_profile")
      .upsert(profileRecord, { onConflict: "alumni_email" });

    if (profileErr) {
      console.warn("[saveProfileData] alumni_profile upsert note:", profileErr.message);
    }

    // 2. Update public.alumni_master if matching record exists
    if (email) {
      await adminClient
        .from("alumni_master")
        .update({
          name: input.name,
          phone_number: input.phone || null,
          city: input.city || null,
          state: input.state || null,
          campus: input.campus || null,
          course: input.course || null,
          linkedin_profile: input.linkedin || null,
          updated_at: new Date().toISOString(),
        })
        .eq("email", email);
    }

    // 3. Update Supabase Auth user_metadata strictly with allowlisted minimal identity fields
    const minimalAuthMeta = sanitizeUserAuthMetadata({
      full_name: input.name,
      name: input.name,
      avatar_url: safeAvatar || undefined,
      avatarUrl: safeAvatar || undefined,
      picture: safeAvatar || undefined,
      is_alumni: input.isAlumni !== false,
      last_active_at: new Date().toISOString(),
    });

    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: minimalAuthMeta,
    });

    revalidatePath("/profile");
    return { success: true, avatarUrl: safeAvatar };
  } catch (err: any) {
    console.error("[saveProfileData] Exception:", err);
    return { error: err.message || "Failed to update profile." };
  }
}
