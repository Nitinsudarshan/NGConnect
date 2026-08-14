"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { PipelineOwnership } from "@/types/engagement";

export function PipelineOwnerTag({
  label,
  data,
  userEmail,
}: {
  label: string;
  data?: { state: string; owner: string | null };
  userEmail: string;
}) {
  if (!data || data.state === "n/a") {
    return (
      <Badge
        variant="outline"
        className="text-[9px] px-1.5 py-0 bg-slate-50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 font-medium"
      >
        {label}: N/A
      </Badge>
    );
  }

  if (data.state === "unassigned") {
    return (
      <Badge
        variant="outline"
        className="text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-400/40 font-semibold"
      >
        {label}: Unassigned
      </Badge>
    );
  }

  const isYou = data.owner === userEmail;
  const displayName = isYou ? "You" : data.owner?.split("@")[0] || data.owner;

  return (
    <Badge
      variant="outline"
      className={`text-[9px] px-1.5 py-0 font-semibold ${
        isYou
          ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-400/40 font-bold"
          : "bg-muted/50 text-foreground border-border/60"
      }`}
    >
      {label}: {displayName}
    </Badge>
  );
}

export function OwnershipTags({
  ownership,
  userEmail,
}: {
  ownership?: PipelineOwnership;
  userEmail: string;
}) {
  if (!ownership) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <PipelineOwnerTag label="Pay-Forward" data={ownership.payForward} userEmail={userEmail} />
      <PipelineOwnerTag label="Career Support" data={ownership.careerSupport} userEmail={userEmail} />
      {ownership.careerSupport?.mismatch && (
        <Badge
          variant="destructive"
          className="text-[9px] px-1.5 py-0 bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 font-semibold flex items-center gap-1"
        >
          <AlertTriangle className="w-2.5 h-2.5" /> Ownership mismatch
        </Badge>
      )}
    </div>
  );
}
