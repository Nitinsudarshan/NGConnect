"use client";

import React, { useState, useEffect } from "react";
import { HELP_REGISTRY, HelpEntry } from "@/lib/help-registry";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, RotateCcw, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const LS_KEY = "ng_help_hidden";

function getHiddenSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LS_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveHiddenSet(set: Set<string>) {
  localStorage.setItem(LS_KEY, JSON.stringify(Array.from(set)));
}

export default function HelpDocsClient() {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setHidden(getHiddenSet());
    setMounted(true);
  }, []);

  const toggle = (id: string) => {
    const next = new Set(hidden);
    if (next.has(id)) {
      next.delete(id);
      toast.success("Help tooltip enabled");
    } else {
      next.add(id);
      toast.info("Help tooltip hidden");
    }
    setHidden(next);
    saveHiddenSet(next);
  };

  const enableAll = () => {
    const empty = new Set<string>();
    setHidden(empty);
    saveHiddenSet(empty);
    toast.success("All help tooltips enabled");
  };

  const visibleCount = HELP_REGISTRY.length - hidden.size;

  // Group by cluster
  const groups = HELP_REGISTRY.reduce<Record<string, HelpEntry[]>>((acc, entry) => {
    const cluster = entry.location.split(" › ")[0];
    if (!acc[cluster]) acc[cluster] = [];
    acc[cluster].push(entry);
    return acc;
  }, {});

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {/* Summary bar */}
      <div className="flex items-center justify-between bg-muted/30 border border-border/60 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {visibleCount} of {HELP_REGISTRY.length} help tooltips visible
            </p>
            <p className="text-xs text-muted-foreground">
              Toggle visibility per page. Changes take effect immediately across the app.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs rounded-lg"
          onClick={enableAll}
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
                    Visible
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {entries.map((entry) => {
                  const isHidden = hidden.has(entry.id);
                  return (
                    <tr
                      key={entry.id}
                      className={`transition-colors ${isHidden ? "bg-muted/10 opacity-60" : "hover:bg-muted/20"}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isHidden ? (
                            <EyeOff className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          <span className="font-medium text-foreground text-xs">
                            {entry.label}
                          </span>
                        </div>
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
                          checked={!isHidden}
                          onCheckedChange={() => toggle(entry.id)}
                          className="data-[state=checked]:bg-amber-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
