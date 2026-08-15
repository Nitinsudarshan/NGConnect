"use client";

import React, { useState, useEffect } from "react";
import { HELP_REGISTRY, HelpEntry, getHelpEntry } from "@/lib/help-registry";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Info, RotateCcw, Eye, EyeOff, HelpCircle, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import { HelpSectionRenderer } from "@/components/shared/help-section-renderer";

const LS_KEY_GLOBAL = "ng_help_hidden";
const LS_KEY_MEMBERS = "ng_help_hidden_members";

function getSetFromLS(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveSetToLS(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify(Array.from(set)));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ng_help_updated"));
  }
}

export default function HelpDocsClient() {
  const [hiddenGlobal, setHiddenGlobal] = useState<Set<string>>(new Set());
  const [hiddenMembers, setHiddenMembers] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [previewHelpId, setPreviewHelpId] = useState<string | null>(null);

  useEffect(() => {
    setHiddenGlobal(getSetFromLS(LS_KEY_GLOBAL));
    setHiddenMembers(getSetFromLS(LS_KEY_MEMBERS));
    setMounted(true);
  }, []);

  const toggleGlobal = (id: string) => {
    const next = new Set(hiddenGlobal);
    if (next.has(id)) {
      next.delete(id);
      toast.success("Help tooltip enabled globally");
    } else {
      next.add(id);
      toast.info("Help tooltip hidden globally");
    }
    setHiddenGlobal(next);
    saveSetToLS(LS_KEY_GLOBAL, next);
  };

  const toggleMembers = (id: string) => {
    const next = new Set(hiddenMembers);
    if (next.has(id)) {
      next.delete(id);
      toast.success("Help tooltip visible to members");
    } else {
      next.add(id);
      toast.info("Help tooltip hidden for members");
    }
    setHiddenMembers(next);
    saveSetToLS(LS_KEY_MEMBERS, next);
  };

  const resetAll = () => {
    const empty = new Set<string>();
    setHiddenGlobal(empty);
    setHiddenMembers(empty);
    saveSetToLS(LS_KEY_GLOBAL, empty);
    saveSetToLS(LS_KEY_MEMBERS, empty);
    toast.success("All help tooltips enabled for everyone");
  };

  const globalVisibleCount = HELP_REGISTRY.length - hiddenGlobal.size;
  const memberAccessibleEntries = HELP_REGISTRY.filter((e) => e.memberAccessible);
  const hiddenMembersCount = Array.from(hiddenMembers).filter((id) =>
    HELP_REGISTRY.some((e) => e.id === id && e.memberAccessible)
  ).length;
  const memberVisibleCount = memberAccessibleEntries.length - hiddenMembersCount;

  // Group by cluster
  const groups = HELP_REGISTRY.reduce<Record<string, HelpEntry[]>>((acc, entry) => {
    const cluster = entry.location.split(" › ")[0];
    if (!acc[cluster]) acc[cluster] = [];
    acc[cluster].push(entry);
    return acc;
  }, {});

  const selectedEntry = previewHelpId ? getHelpEntry(previewHelpId) : null;

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {/* Summary bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/30 border border-border/60 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg shrink-0">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground flex items-center gap-3 flex-wrap">
              <span>{globalVisibleCount} of {HELP_REGISTRY.length} visible globally</span>
              <span className="text-muted-foreground font-normal">|</span>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                {memberVisibleCount} of {memberAccessibleEntries.length} member-accessible guides active for Members
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Toggle global visibility or hide guides for Member role users. Controls only appear on pages Members can access.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs rounded-lg shrink-0"
          onClick={resetAll}
        >
          <RotateCcw className="w-3.5 h-3.5" /> Enable All
        </Button>
      </div>

      {/* Table per cluster */}
      {Object.entries(groups).map(([cluster, entries]) => (
        <div key={cluster} className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            {cluster}
          </h3>
          <div className="border border-border/60 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border/60">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground w-1/4">
                    Label
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground w-1/3">
                    Location
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                    Help ID
                  </th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground w-28">
                    Enabled
                  </th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground w-36">
                    Hide for Members
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {entries.map((entry) => {
                  const isHiddenGlobal = hiddenGlobal.has(entry.id);
                  const isHiddenMembers = hiddenMembers.has(entry.id);
                  const isMemberPage = !!entry.memberAccessible;

                  return (
                    <tr
                      key={entry.id}
                      className={`transition-colors ${
                        isHiddenGlobal
                          ? "bg-muted/10 opacity-50"
                          : isHiddenMembers && isMemberPage
                          ? "bg-indigo-50/20 dark:bg-indigo-950/20"
                          : "hover:bg-muted/20"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setPreviewHelpId(entry.id)}
                          className="flex items-center gap-2 text-left hover:underline focus:outline-none group cursor-pointer"
                          title="Click to preview help content"
                        >
                          {isHiddenGlobal ? (
                            <EyeOff className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 group-hover:text-foreground" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-amber-500 shrink-0 group-hover:text-amber-600" />
                          )}
                          <span className="font-medium text-foreground text-xs group-hover:text-primary transition-colors">
                            {entry.label}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {entry.location}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0.5">
                          {entry.id}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Switch
                          checked={!isHiddenGlobal}
                          onCheckedChange={() => toggleGlobal(entry.id)}
                          className="data-[state=checked]:bg-amber-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isMemberPage ? (
                          <Switch
                            checked={isHiddenMembers}
                            disabled={isHiddenGlobal}
                            onCheckedChange={() => toggleMembers(entry.id)}
                            className="data-[state=checked]:bg-indigo-600"
                          />
                        ) : (
                          <span className="text-[10px] text-muted-foreground/40 font-mono italic">
                            N/A
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Preview Dialog */}
      <Dialog open={!!previewHelpId} onOpenChange={(open) => { if (!open) setPreviewHelpId(null); }}>
        <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-[90vw] max-h-[85vh] rounded-2xl border border-border/80 shadow-2xl p-0 overflow-hidden flex flex-col">
          {selectedEntry && (
            <>
              <DialogHeader className="p-6 pb-4 border-b border-border/40 bg-muted/20 shrink-0">
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <HelpCircle className="w-5 h-5 text-amber-500" />
                  {selectedEntry.title}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {selectedEntry.description}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-8 text-sm max-w-5xl mx-auto">
                  {selectedEntry.sections.map((s, i) => (
                    <HelpSectionRenderer key={i} section={s} index={i} />
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


