"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { UserRole, UserTeam } from "@/lib/roles";
import { createUser } from "../actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2, Mail, User, Shield, Users, GraduationCap } from "lucide-react";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded?: () => void;
}

export function AddUserDialog({ open, onOpenChange, onUserAdded }: AddUserDialogProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("Member");
  const [team, setTeam] = useState<UserTeam>("None");
  const [isAlumni, setIsAlumni] = useState<"Yes" | "No">("Yes");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setEmail("");
    setFullName("");
    setRole("Member");
    setTeam("None");
    setIsAlumni("Yes");
  };

  const handleClose = (newOpen: boolean) => {
    if (!isSubmitting) {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.trim()) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createUser({
        email: email.trim(),
        fullName: fullName.trim(),
        role,
        team,
        isAlumni: isAlumni === "Yes",
      });

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`User ${email} created successfully!`);
        resetForm();
        onOpenChange(false);
        if (onUserAdded) onUserAdded();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[460px] rounded-2xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-1.5 pb-2">
            <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-zinc-100">
              <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl">
                <UserPlus className="h-5 w-5" />
              </div>
              Add New User
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs font-medium">
              Create a new user account with role, team allocation, and alumni status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="user-email" className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email Address <span className="text-rose-500">*</span>
              </label>
              <Input
                id="user-email"
                type="email"
                placeholder="e.g. user@navgurukul.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="h-10 rounded-xl text-sm"
                required
              />
            </div>

            {/* Full Name Field */}
            <div className="space-y-1.5">
              <label htmlFor="user-fullname" className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Full Name
              </label>
              <Input
                id="user-fullname"
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSubmitting}
                className="h-10 rounded-xl text-sm"
              />
            </div>

            {/* Role Select */}
            <div className="space-y-1.5">
              <label htmlFor="new-role-select" className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                Assign Role
              </label>
              <Select value={role} onValueChange={(val: UserRole) => setRole(val)} disabled={isSubmitting}>
                <SelectTrigger id="new-role-select" className="w-full h-10 rounded-xl">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Member" className="rounded-lg">Member</SelectItem>
                  <SelectItem value="Viewer" className="rounded-lg">Viewer</SelectItem>
                  <SelectItem value="Operations" className="rounded-lg">Operations</SelectItem>
                  <SelectItem value="Program" className="rounded-lg">Program</SelectItem>
                  <SelectItem value="Manager" className="rounded-lg">Manager</SelectItem>
                  <SelectItem value="Admin" className="rounded-lg">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Team Select & Is Alumni Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="new-team-select" className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  Assign Team
                </label>
                <Select value={team} onValueChange={(val: UserTeam) => setTeam(val)} disabled={isSubmitting}>
                  <SelectTrigger id="new-team-select" className="w-full h-10 rounded-xl">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="None" className="rounded-lg">No Team</SelectItem>
                    <SelectItem value="CEO's Office" className="rounded-lg">CEO's Office</SelectItem>
                    <SelectItem value="Alumni Growth" className="rounded-lg">Alumni Growth</SelectItem>
                    <SelectItem value="PNC" className="rounded-lg">PNC</SelectItem>
                    <SelectItem value="Finance" className="rounded-lg">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="new-alumni-select" className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                  Is Alumni
                </label>
                <Select value={isAlumni} onValueChange={(val: "Yes" | "No") => setIsAlumni(val)} disabled={isSubmitting}>
                  <SelectTrigger id="new-alumni-select" className="w-full h-10 rounded-xl">
                    <SelectValue placeholder="Is Alumni?" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Yes" className="rounded-lg">Yes</SelectItem>
                    <SelectItem value="No" className="rounded-lg">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleClose(false)}
              className="rounded-xl h-10 hover:bg-slate-50 dark:hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
