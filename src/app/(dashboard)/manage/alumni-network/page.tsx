import React from 'react';
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { UsersTable } from "../users/users-table";
import { AlumniNetworkStatsCards, AlumniNetworkStatsCharts } from "./alumni-stats";

import { checkAccess } from "@/lib/permissions";

export default async function AlumniNetworkPage() {
  const clientSupabase = await createClient();
  const { data: { user } } = await clientSupabase.auth.getUser();
  const canView = await checkAccess(user?.id ?? null, "manage.alumni_network", "view");
  const canEdit = await checkAccess(user?.id ?? null, "manage.alumni_network", "edit");
  if (!canView) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        You do not have permission to view Manage Alumni Network.
      </div>
    );
  }

  const supabase = createAdminClient();
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Alumni Network</h1>
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          Failed to load network members. Ensure the service role key is correct.
          <br />
          <span className="text-sm opacity-80">{error.message}</span>
        </div>
      </div>
    );
  }

  // Filter for Team: Alumni Growth / PNC / None and Role: Member
  const alumniUsers = (users || []).filter(user => {
    const isSuperUser = user.email && ["nitin@navgurukul.org", "nitinsudarshan@gmail.com"].includes(user.email.toLowerCase());
    const role = isSuperUser ? "Super Admin" : (user.user_metadata?.role || "Member");
    const team = user.user_metadata?.team || "Alumni Growth";
    
    return role === "Member" && (team === "Alumni Growth" || team === "PNC" || team === "None" || team === "Alumni Network");
  });

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-indigo-300 dark:to-white bg-clip-text text-transparent">
            Alumni Network
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage your external Alumni Network members (Team: Alumni Growth / PNC, Role: Member).
          </p>
        </div>
      </div>

      {/* 1. Stat Cards */}
      <AlumniNetworkStatsCards users={alumniUsers} />

      {/* 2. User Table (paginated) */}
      <UsersTable initialUsers={alumniUsers} canEdit={canEdit} />

      {/* 3. Trend Charts */}
      <AlumniNetworkStatsCharts users={alumniUsers} />
    </div>
  );
}
