"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { UserRole, UserTeam } from "@/lib/roles";
import { updateUserRoleAndTeam } from "./actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Users, Edit3, Loader2 } from "lucide-react";

interface UsersTableProps {
  initialUsers: any[];
  isAdmin: boolean;
}

function formatRelativeTime(dateString?: string | null) {
  if (!dateString) return "Never";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0) return "Just now"; // Handle slight future drift

  const totalMins = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMins / 1440);
  const hours = Math.floor((totalMins % 1440) / 60);
  const mins = totalMins % 60;

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}, ${hours} hr${hours !== 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hr${hours !== 1 ? 's' : ''}, ${mins} min${mins !== 1 ? 's' : ''} ago`;
  } else if (mins > 0) {
    return `${mins} min${mins !== 1 ? 's' : ''} ago`;
  } else {
    return "Just now";
  }
}

export function UsersTable({ initialUsers, isAdmin }: UsersTableProps) {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole>("Viewer");
  const [team, setTeam] = useState<UserTeam>("None");
  const [isSaving, setIsSaving] = useState(false);

  const handleEditClick = (user: any) => {
    setSelectedUser(user);
    const metadata = user.user_metadata || {};
    const email = user.email || "";
    const isHardcodedSuper = ["nitin@navgurukul.org", "nitinsudarshan@gmail.com"].includes(email.toLowerCase());
    
    setRole(isHardcodedSuper ? "Super Admin" : (metadata.role || "Viewer"));
    setTeam(metadata.team || "None");
  };

  const handleSaveChanges = async () => {
    if (!selectedUser) return;
    setIsSaving(true);

    try {
      const result = await updateUserRoleAndTeam(selectedUser.id, role, team);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Successfully updated access for ${selectedUser.user_metadata?.full_name || selectedUser.email}`);
        setSelectedUser(null);
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to update user access.");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to determine role badge classes
  const getRoleBadgeClasses = (role: UserRole) => {
    switch (role) {
      case "Super Admin":
        return "bg-purple-500 hover:bg-purple-600 text-white font-semibold border-purple-400 px-2.5 py-0.5 shadow-xs transition-all";
      case "Admin":
        return "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50 px-2.5 py-0.5";
      case "Manager":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50 px-2.5 py-0.5";
      case "Operator":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50 px-2.5 py-0.5";
      case "Analyst":
        return "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50 px-2.5 py-0.5";
      case "Viewer":
        return "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800 px-2.5 py-0.5";
      default:
        return "bg-secondary text-secondary-foreground px-2.5 py-0.5";
    }
  };

  // Helper to determine team badge classes
  const getTeamBadgeClasses = (team: UserTeam) => {
    switch (team) {
      case "CEO's Office":
        return "bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-900/50 px-2.5 py-0.5";
      case "Alumni Growth":
        return "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50 px-2.5 py-0.5";
      case "Pay-Forward":
        return "bg-pink-50 text-pink-700 border border-pink-200 dark:bg-pink-950/30 dark:text-pink-400 dark:border-pink-900/50 px-2.5 py-0.5";
      default:
        return "";
    }
  };

  const isHardcodedSuper = selectedUser && ["nitin@navgurukul.org", "nitinsudarshan@gmail.com"].includes((selectedUser.email || "").toLowerCase());

  return (
    <div className="w-full">
      <div className="rounded-xl border bg-card/60 backdrop-blur-md p-1 sm:p-2 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px]">User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Last Login</TableHead>
              {isAdmin && <TableHead className="w-[100px] text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialUsers && initialUsers.length > 0 ? (
              initialUsers.map((user) => {
                const metadata = user.user_metadata || {};
                const name = metadata.full_name || metadata.name || "Unknown";
                const avatar = metadata.avatar_url || metadata.picture || "";
                const initials = name !== "Unknown"
                  ? name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                  : "U";

                const email = user.email || "";
                const isSuper = ["nitin@navgurukul.org", "nitinsudarshan@gmail.com"].includes(email.toLowerCase());
                
                const appRole = (isSuper ? "Super Admin" : (metadata.role || "Viewer")) as UserRole;
                const appTeam = (metadata.team || "None") as UserTeam;

                const lastSignIn = formatRelativeTime(user.last_sign_in_at);

                return (
                  <TableRow key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                    <TableCell className="flex items-center gap-3 py-3.5">
                      <Avatar className="h-9 w-9 border border-border group-hover:scale-105 transition-transform duration-200">
                        <AvatarImage src={avatar} alt={name} />
                        <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">{name}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium">{email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeClasses(appRole)}>
                        {appRole}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {appTeam !== "None" ? (
                        <Badge className={getTeamBadgeClasses(appTeam)}>
                          {appTeam}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic font-medium">No Team</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-medium">
                      {lastSignIn}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(user)}
                          className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg group-hover:opacity-100 transition-opacity"
                        >
                          <Edit3 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          <span className="sr-only">Edit Access</span>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-[425px] overflow-hidden rounded-2xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-xl font-bold tracking-tight">Edit Access Control</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs font-medium">
              Modify the role and team allocation for this user.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 mb-2">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={selectedUser.user_metadata?.avatar_url || selectedUser.user_metadata?.picture || ""} alt={selectedUser.user_metadata?.full_name || "User"} />
                <AvatarFallback className="bg-slate-100 text-slate-700 font-semibold">
                  {(selectedUser.user_metadata?.full_name || selectedUser.user_metadata?.name || "U")
                    .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-slate-900 dark:text-zinc-100 truncate">
                  {selectedUser.user_metadata?.full_name || selectedUser.user_metadata?.name || "Unknown User"}
                </span>
                <span className="text-xs text-muted-foreground truncate font-medium">{selectedUser.email}</span>
              </div>
            </div>
          )}

          {isHardcodedSuper && (
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs font-medium leading-relaxed">
              💡 This user is a hardcoded Super Admin. Their role cannot be modified.
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="role-select" className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                Assign Role
              </label>
              <Select
                value={role}
                onValueChange={(val: UserRole) => setRole(val)}
                disabled={isHardcodedSuper || isSaving}
              >
                <SelectTrigger id="role-select" className="w-full h-10 border-input rounded-xl focus:ring-primary/20 dark:bg-input/20">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border bg-popover shadow-xl">
                  {isHardcodedSuper ? (
                    <SelectItem value="Super Admin" className="rounded-lg">Super Admin</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="Admin" className="rounded-lg">Admin</SelectItem>
                      <SelectItem value="Manager" className="rounded-lg">Manager</SelectItem>
                      <SelectItem value="Operator" className="rounded-lg">Operator</SelectItem>
                      <SelectItem value="Analyst" className="rounded-lg">Analyst</SelectItem>
                      <SelectItem value="Viewer" className="rounded-lg">Viewer</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="team-select" className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                Assign Team
              </label>
              <Select
                value={team}
                onValueChange={(val: UserTeam) => setTeam(val)}
                disabled={isSaving}
              >
                <SelectTrigger id="team-select" className="w-full h-10 border-input rounded-xl focus:ring-primary/20 dark:bg-input/20">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border bg-popover shadow-xl">
                  <SelectItem value="None" className="rounded-lg">No Team</SelectItem>
                  <SelectItem value="CEO's Office" className="rounded-lg">CEO's Office</SelectItem>
                  <SelectItem value="Alumni Growth" className="rounded-lg">Alumni Growth</SelectItem>
                  <SelectItem value="Pay-Forward" className="rounded-lg">Pay-Forward</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-2 gap-2 sm:gap-0">
            <Button
              variant="outline"
              disabled={isSaving}
              onClick={() => setSelectedUser(null)}
              className="rounded-xl h-10 hover:bg-slate-50 dark:hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              disabled={isSaving}
              onClick={handleSaveChanges}
              className="rounded-xl h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 flex items-center gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
