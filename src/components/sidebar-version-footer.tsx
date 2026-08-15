"use client";

import React, { useState } from "react";
import { useUserContext } from "@/contexts/user-context";
import { CURRENT_VERSION, VERSION_HISTORY, VersionEntry } from "@/lib/version-config";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { History, Sparkles, Shield, Tag, Calendar, CheckCircle2 } from "lucide-react";

const TYPE_BADGE_STYLE: Record<string, string> = {
  major: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  minor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  patch: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

const CATEGORY_BADGE_STYLE: Record<string, string> = {
  Features: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  Improvements: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  Fixes: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Security: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

export function SidebarVersionFooter() {
  const user = useUserContext();
  const [isOpen, setIsOpen] = useState(false);

  // Changelog is accessible to non-Member roles (Staff, Admins, Managers, Viewers, etc.)
  const canViewChangelog = user?.role !== "Member" && !!user?.role;

  return (
    <>
      <div className="w-full shrink-0 border-t border-sidebar-border/60">
        <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-muted-foreground/80">
          {/* Version Number (Visible to everyone) */}
          <div className="flex items-center gap-1.5 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className="font-semibold text-foreground/80">
              v{CURRENT_VERSION}
            </span>
          </div>

          {/* Changelog Trigger (Only visible to non-Member roles) */}
          {canViewChangelog && (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="px-1.5 py-0.5 rounded-md text-[10px] font-sans font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors flex items-center gap-1 cursor-pointer"
              title="Click to view release notes & version changelog"
            >
              <History className="w-3 h-3 shrink-0" />
              <span>Changelog</span>
            </button>
          )}
        </div>
      </div>

      {/* Changelog Modal (Non-Members only) */}
      {canViewChangelog && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-[90vw] h-[90vh] max-h-[90vh] rounded-2xl border border-border/80 shadow-2xl p-0 overflow-hidden flex flex-col">
            <DialogHeader className="p-6 pb-4 border-b border-border/40 bg-muted/20 shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  Platform Version History & Changelog
                </DialogTitle>
                <Badge
                  variant="outline"
                  className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                >
                  Active: v{CURRENT_VERSION}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Semantic release counter: <code>x.xx.xx</code> (Major . Features/Minor . Patches)
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {VERSION_HISTORY.map((entry, idx) => (
                <div
                  key={entry.version}
                  className={`p-4 rounded-xl border transition-colors space-y-3 ${
                    idx === 0
                      ? "bg-card border-indigo-500/30 shadow-xs"
                      : "bg-muted/20 border-border/60 opacity-90"
                  }`}
                >
                  {/* Version Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-foreground">
                        v{entry.version}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-mono px-2 py-0.5 ${
                          TYPE_BADGE_STYLE[entry.type] || ""
                        }`}
                      >
                        {entry.type}
                      </Badge>
                      {idx === 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          Latest Release
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{entry.date}</span>
                    </div>
                  </div>

                  {/* Entry Title */}
                  <h4 className="font-semibold text-sm text-foreground">
                    {entry.title}
                  </h4>

                  {/* Changes List */}
                  <div className="space-y-2">
                    {entry.changes.map((item, cIdx) => (
                      <div
                        key={cIdx}
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                      >
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-mono shrink-0 px-1.5 py-0 mt-0.5 ${
                            CATEGORY_BADGE_STYLE[item.category] || ""
                          }`}
                        >
                          {item.category}
                        </Badge>
                        <span className="leading-relaxed">{item.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
