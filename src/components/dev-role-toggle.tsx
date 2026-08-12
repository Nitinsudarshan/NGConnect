"use client";

import React, { useState, useEffect } from "react";
import { Fingerprint, Check } from "lucide-react";
import { useUserContext } from "@/contexts/user-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const ROLES = [
  { label: "Original Role", value: "" },
  { label: "Super Admin", value: "Super Admin" },
  { label: "Admin", value: "Admin" },
  { label: "Manager", value: "Manager" },
  { label: "Program", value: "Program" },
  { label: "Operations", value: "Operations" },
  { label: "Viewer", value: "Viewer" },
  { label: "Member", value: "Member" },
];

export function DevRoleToggle({ isSuperAdmin }: { isSuperAdmin?: boolean }) {
  const user = useUserContext();
  const [activeOverride, setActiveOverride] = useState<string>("");

  useEffect(() => {
    // Read the initial override cookie
    const match = document.cookie.match(/dev-role-override=([^;]+)/);
    if (match) {
      setActiveOverride(decodeURIComponent(match[1]));
    }
  }, []);

  const handleSelectRole = (value: string) => {
    if (value) {
      document.cookie = `dev-role-override=${encodeURIComponent(value)}; path=/; max-age=86400`;
    } else {
      document.cookie = `dev-role-override=; path=/; max-age=0`;
    }
    setActiveOverride(value);
    window.location.reload();
  };

  if (!user) return null;
  if (process.env.NODE_ENV === "production") return null;
  if (!isSuperAdmin) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-9 px-2.5 rounde-md border flex items-center gap-1.5 transition-all duration-200 ${activeOverride
              ? "border-amber-300 bg-amber-50/50 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-400 animate-pulse-subtle"
              : "border-slate-200 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            }`}
        >
          <Fingerprint className={`h-4.5 w-4.5 ${activeOverride ? "text-amber-500" : "text-muted-foreground"}`} />
          <span className="text-xs font-bold tracking-tight hidden md:inline-block">
            {activeOverride ? `Testing: ${activeOverride}` : "Dev Role Override"}
          </span>
          {activeOverride && (
            <Badge variant="destructive" className="h-4.5 px-1 text-[9px] uppercase font-black bg-amber-500 text-white leading-none border-none">
              Dev
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-md border bg-card p-1 shadow-xl">
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
          Testing Role Switcher
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="-mx-1 my-1" />
        {ROLES.map((role) => {
          const isSelected = activeOverride === role.value;
          return (
            <DropdownMenuItem
              key={role.value}
              onClick={() => handleSelectRole(role.value)}
              className="flex items-center justify-between px-2.5 py-2 text-sm rounded-lg cursor-default focus:bg-accent focus:text-accent-foreground"
            >
              <span className={role.value === "" ? "font-bold text-muted-foreground" : "font-medium"}>
                {role.label}
              </span>
              {isSelected && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
