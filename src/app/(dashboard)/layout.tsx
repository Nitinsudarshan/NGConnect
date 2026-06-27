import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { UserProvider } from "@/contexts/user-context"
import { getUserRole } from "@/lib/roles"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Read the dev override from cookies directly
    const cookieStore = await cookies()
    const rawDevOverride = cookieStore.get('dev-role-override')?.value
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const userMetadata = user?.user_metadata || {}
    const displayName = userMetadata.full_name || userMetadata.name || "User"
    const displayEmail = user?.email || "user@example.com"
    const displayAvatar = userMetadata.avatar_url || userMetadata.picture || ""
    const activeRole = await getUserRole(user)
    const isAlumni = userMetadata.is_alumni !== false

    return (
        <UserProvider user={{
            id: user?.id || "1",
            name: displayName,
            email: displayEmail,
            avatar: displayAvatar,
            role: activeRole,
            isAlumni,
        }}>
            <div className="[--header-height:calc(--spacing(14))] h-svh w-full flex flex-col overflow-hidden bg-background">
                <SidebarProvider className="flex flex-col flex-1 h-full w-full overflow-hidden">
                    <SiteHeader />
                    <div className="flex flex-1 min-h-0 w-full overflow-hidden">
                        <AppSidebar />
                        <SidebarInset className="flex-1 min-w-0 w-full overflow-y-auto bg-background">
                            {children}
                        </SidebarInset>
                    </div>
                </SidebarProvider>
            </div>
        </UserProvider>
    )
}
