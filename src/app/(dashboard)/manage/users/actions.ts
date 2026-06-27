"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { UserRole, UserTeam } from "@/lib/roles";

const SUPER_ADMINS = ["nitin@navgurukul.org", "nitinsudarshan@gmail.com"];

export async function updateUserRoleAndTeam(userId: string, role: UserRole, team: UserTeam, isAlumni: boolean) {
    try {
        const clientSupabase = await createClient();
        const { data: { user: currentUser } } = await clientSupabase.auth.getUser();
        if (!currentUser) {
            return { error: "Unauthorized. Please log in." };
        }

        const email = currentUser.email;
        const isSuper = email && SUPER_ADMINS.includes(email.toLowerCase());
        const isUserAdmin = isSuper || currentUser.user_metadata?.role === "Admin" || currentUser.user_metadata?.role === "Super Admin";

        if (!isUserAdmin) {
            return { error: "Unauthorized. Only administrators can perform this action." };
        }

        const adminSupabase = createAdminClient();
        const { data: { user }, error: getError } = await adminSupabase.auth.admin.getUserById(userId);
        if (getError || !user) {
            return { error: getError?.message || "Target user not found." };
        }

        // Preserve other metadata fields
        const updatedUserMetadata = {
            ...(user.user_metadata || {}),
            role,
            team,
            is_alumni: isAlumni
        };

        const updatedAppMetadata = {
            ...(user.app_metadata || {}),
            role,
            team,
            is_alumni: isAlumni
        };

        const { error: updateError } = await adminSupabase.auth.admin.updateUserById(userId, {
            user_metadata: updatedUserMetadata,
            app_metadata: updatedAppMetadata
        });

        if (updateError) {
            return { error: updateError.message };
        }

        revalidatePath("/manage/users");
        return { success: true };
    } catch (e: any) {
        return { error: e.message || "An unexpected error occurred." };
    }
}
