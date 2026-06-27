import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type UserRole = "Super Admin" | "Admin" | "Manager" | "Operator" | "Analyst" | "Viewer" | "Program" | "Operations" | "Volunteer";

export type UserTeam = "CEO's Office" | "Alumni Growth" | "Pay-Forward" | "None";

export type VolunteerType =
    | "external_individual"
    | "external_corporate"
    | "internal_alumni_ext"
    | "internal_alumni_staff";

/** Shape of app_metadata stored on Supabase users */
export interface UserAppMetadata {
    role?: UserRole;
    team?: UserTeam;
    volunteer_type?: VolunteerType;
    onboarding_completed?: boolean;
}

const SUPER_ADMIN_EMAILS = ["nitin@navgurukul.org", "nitinsudarshan@gmail.com"];

async function getSupabaseUserEmail() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        return user?.email || null;
    } catch {
        return null;
    }
}

/**
 * Checks if the currently authenticated user has the specified role.
 * Role check resolves true if the session claims public metadata contains the desired role.
 * 
 * Master User Bypass: If the current user's ID matches process.env.MASTER_USER_ID,
 * they automatically pass ALL role checks, making them omnipresent.
 */
export const checkRole = async (role: UserRole) => {
    const email = await getSupabaseUserEmail();
    if (email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) {
        return true; // Super Admins pass all checks
    }

    const { sessionClaims, userId } = await auth();
    const claimRole = (sessionClaims?.metadata?.role || (sessionClaims as any)?.role) as UserRole | undefined;
    const isVolunteerEnabled = sessionClaims?.metadata?.volunteerEnabled === true || (sessionClaims as any)?.volunteerEnabled === true;

    // Support role override for admins and opt-in volunteers
    const cookieStore = await cookies();
    const devRole = cookieStore.get('dev-role-override')?.value as UserRole;
    if (devRole) {
        if (userId === process.env.MASTER_USER_ID || claimRole === "Admin" || claimRole === "Super Admin") {
            return devRole === role;
        } else if (
            ["Program", "Operations"].includes(claimRole as string)
        ) {
            // Program/Ops can ONLY swap between their base role and "Volunteer", it's a safe sandbox downgrade.
            if (devRole === "Volunteer" || devRole === claimRole) {
                return devRole === role;
            }
        }
    }

    // Master User Omnipresence Check
    if (userId && userId === process.env.MASTER_USER_ID) {
        return true;
    }

    if (claimRole === "Super Admin") {
        return true; // Super Admins pass all checks
    }

    return claimRole === role;
};

/**
 * Returns the active role of the current user.
 * If the user is the MASTER_USER_ID, forcefully identifies them as "Admin".
 * If no role is found on the user's claims, forcefully sets it to 'Volunteer' 
 * in the Supabase app_metadata.
 */
export const getUserRole = async (freshUser?: any): Promise<UserRole> => {
    const email = freshUser?.email || await getSupabaseUserEmail();
    if (email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) {
        return "Super Admin";
    }

    const { sessionClaims, userId } = await auth();
    const claimRole = (freshUser?.app_metadata?.role || sessionClaims?.metadata?.role || (sessionClaims as any)?.role) as UserRole | undefined;
    const isVolunteerEnabled = freshUser?.app_metadata?.volunteerEnabled === true || sessionClaims?.metadata?.volunteerEnabled === true || (sessionClaims as any)?.volunteerEnabled === true;

    // Support role override for admins and opt-in volunteers
    const cookieStore = await cookies();
    const devRole = cookieStore.get('dev-role-override')?.value as UserRole;
    if (devRole) {
        if (userId === process.env.MASTER_USER_ID || claimRole === "Admin" || claimRole === "Super Admin") {
            return devRole;
        } else if (
            ["Program", "Operations"].includes(claimRole as string)
        ) {
            // Program/Ops can ONLY swap between their base role and "Volunteer", it's a safe sandbox downgrade.
            if (devRole === "Volunteer" || devRole === claimRole) {
                return devRole;
            }
        }
    }

    // Master User Override
    if (userId && userId === process.env.MASTER_USER_ID) {
        return "Admin";
    }

    const role = claimRole;

    // If no role is found in the JWT session claims, default to "Volunteer" for the UI.
    // We strictly do NOT persist this to Supabase here, as sessionClaims might just be stale
    // from a recent manual dashboard edit before a new JWT was issued.
    return role || "Volunteer";
};

/**
 * Validates if the user is truly an Admin without looking at dev overrides
 */
export const isTrueAdmin = async (): Promise<boolean> => {
    const email = await getSupabaseUserEmail();
    if (email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) return true;

    const { sessionClaims, userId } = await auth();
    const claimRole = (sessionClaims?.metadata?.role || (sessionClaims as any)?.role) as UserRole | undefined;
    if (userId && userId === process.env.MASTER_USER_ID) return true;
    return claimRole === "Admin" || claimRole === "Super Admin";
};
