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

export interface CreateUserData {
    email: string;
    fullName: string;
    role: UserRole;
    team: UserTeam;
    isAlumni: boolean;
}

export async function createUser(data: CreateUserData) {
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

        if (!data.email || !data.email.trim()) {
            return { error: "Email address is required." };
        }

        const adminSupabase = createAdminClient();
        const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
            email: data.email.trim().toLowerCase(),
            email_confirm: true,
            user_metadata: {
                full_name: data.fullName?.trim() || data.email.split("@")[0],
                role: data.role || "Member",
                team: data.team || "None",
                is_alumni: data.isAlumni !== false,
            },
            app_metadata: {
                role: data.role || "Member",
                team: data.team || "None",
                is_alumni: data.isAlumni !== false,
            },
        });

        if (createError) {
            return { error: createError.message };
        }

        revalidatePath("/manage/users");
        return { success: true, user: newUser.user };
    } catch (e: any) {
        return { error: e.message || "An unexpected error occurred while creating user." };
    }
}

export interface BulkUserRow {
    email: string;
    full_name?: string;
    role?: string;
    team?: string;
    is_alumni?: boolean;
}

export async function bulkCreateUsers(users: BulkUserRow[]) {
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

        if (!users || !Array.isArray(users) || users.length === 0) {
            return { error: "No valid user records provided." };
        }

        const adminSupabase = createAdminClient();

        // Fetch existing users to identify duplicates
        const { data: { users: existingUsers } } = await adminSupabase.auth.admin.listUsers();
        const existingEmailMap = new Map<string, any>();
        (existingUsers || []).forEach((u) => {
            if (u.email) {
                existingEmailMap.set(u.email.toLowerCase(), u);
            }
        });

        let createdCount = 0;
        let updatedCount = 0;
        let failedCount = 0;
        const errors: { email: string; error: string }[] = [];

        const VALID_ROLES = ["Admin", "Manager", "Program", "Operations", "Viewer", "Member"];
        const VALID_TEAMS = ["None", "CEO's Office", "Alumni Growth", "PNC", "Finance"];

        for (const row of users) {
            const rowEmail = (row.email || "").trim().toLowerCase();
            if (!rowEmail || !rowEmail.includes("@")) {
                failedCount++;
                errors.push({ email: row.email || "(blank)", error: "Invalid or missing email address" });
                continue;
            }

            // Parse and normalize role & team
            let role: UserRole = "Member";
            if (row.role) {
                const matchedRole = VALID_ROLES.find(r => r.toLowerCase() === row.role?.trim().toLowerCase());
                if (matchedRole) role = matchedRole as UserRole;
            }

            let team: UserTeam = "None";
            if (row.team) {
                const matchedTeam = VALID_TEAMS.find(t => t.toLowerCase() === row.team?.trim().toLowerCase());
                if (matchedTeam) team = matchedTeam as UserTeam;
            }

            const isAlumni = row.is_alumni !== false;
            const fullName = (row.full_name || "").trim() || rowEmail.split("@")[0];

            const existingUser = existingEmailMap.get(rowEmail);
            if (existingUser) {
                // Update metadata for existing user
                const updatedUserMetadata = {
                    ...(existingUser.user_metadata || {}),
                    full_name: fullName || existingUser.user_metadata?.full_name,
                    role,
                    team,
                    is_alumni: isAlumni,
                };
                const updatedAppMetadata = {
                    ...(existingUser.app_metadata || {}),
                    role,
                    team,
                    is_alumni: isAlumni,
                };

                const { error: updateErr } = await adminSupabase.auth.admin.updateUserById(existingUser.id, {
                    user_metadata: updatedUserMetadata,
                    app_metadata: updatedAppMetadata,
                });

                if (updateErr) {
                    failedCount++;
                    errors.push({ email: rowEmail, error: updateErr.message });
                } else {
                    updatedCount++;
                }
            } else {
                // Create new user
                const { error: createErr } = await adminSupabase.auth.admin.createUser({
                    email: rowEmail,
                    email_confirm: true,
                    user_metadata: {
                        full_name: fullName,
                        role,
                        team,
                        is_alumni: isAlumni,
                    },
                    app_metadata: {
                        role,
                        team,
                        is_alumni: isAlumni,
                    },
                });

                if (createErr) {
                    failedCount++;
                    errors.push({ email: rowEmail, error: createErr.message });
                } else {
                    createdCount++;
                }
            }
        }

        revalidatePath("/manage/users");

        return {
            success: true,
            records_processed: users.length,
            records_created: createdCount,
            records_updated: updatedCount,
            records_failed: failedCount,
            errors,
        };
    } catch (e: any) {
        return { error: e.message || "An unexpected error occurred during bulk import." };
    }
}

