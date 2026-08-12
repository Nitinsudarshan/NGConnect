import { createClient } from '@/lib/supabase/server';

export async function auth() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            userId: null,
            sessionClaims: null
        };
    }

    const role = user.app_metadata?.role || 'Member';

    return {
        userId: user.id,
        sessionClaims: {
            metadata: {
                role
            },
            role
        } as any
    };
}

export async function currentUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const role = user.app_metadata?.role || 'Member';

    return {
        id: user.id,
        emailAddresses: [{ emailAddress: user.email || "" }],
        primaryEmailAddress: { emailAddress: user.email || "" },
        firstName: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || "",
        lastName: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || "",
        fullName: user.user_metadata?.full_name || "",
        imageUrl: user.user_metadata?.avatar_url || "",
        publicMetadata: {
            role
        }
    };
}
