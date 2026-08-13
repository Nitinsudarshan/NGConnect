"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, HelpCircle } from "lucide-react";
import { getHelpEntry, HelpSection } from "@/lib/help-registry";

// LS key used by the Manage › Help Docs page to hide entries
const LS_KEY = "ng_help_hidden";

function getHiddenSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

/** Map a color name → Tailwind utility for the dot */
const COLOR_DOT: Record<string, string> = {
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  purple: "bg-purple-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
};

function renderSection(section: HelpSection, idx: number) {
  const dot = COLOR_DOT[section.color] ?? "bg-slate-400";

  return (
    <section key={idx} className="space-y-3">
      <h3 className="font-semibold text-base text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
        <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
        {section.title}
      </h3>

      {section.type === "text" && (
        <p className="text-muted-foreground leading-relaxed pl-4 text-sm">
          {section.content as string}
        </p>
      )}

      {section.type === "bullets" && (
        <ul className="list-disc pl-9 space-y-2 text-sm text-muted-foreground">
          {section.items?.map((item, i) => (
            <li key={i}>
              {item.title && (
                <strong className="text-foreground/80 font-medium">
                  {item.title}:{" "}
                </strong>
              )}
              {item.text}
            </li>
          ))}
        </ul>
      )}

      {section.type === "cards" && (
        <div className="space-y-3 pl-4">
          {section.items?.map((item, i) => (
            <div
              key={i}
              className="bg-muted/30 p-3 rounded-xl border border-border/50"
            >
              {item.title && (
                <h4 className="font-semibold text-sm text-foreground mb-1">
                  {item.title}
                </h4>
              )}
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

interface HelpModalProps {
  helpId: string;
}

/**
 * Generic help/info modal. Place anywhere in the app using a helpId.
 * Visibility is controlled by the Manage › Help Docs admin page (localStorage).
 */
export function HelpModal({ helpId }: HelpModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    setIsHidden(getHiddenSet().has(helpId));
  }, [helpId]);

  // Re-check when the dialog opens (in case admin toggled it in another tab)
  const handleOpen = (open: boolean) => {
    if (open) setIsHidden(getHiddenSet().has(helpId));
    setIsOpen(open);
  };

  if (isHidden) return null;

  const entry = getHelpEntry(helpId);
  if (!entry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-100/50 shrink-0"
          title="Help & Documentation"
        >
          <Info className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-[90vw] max-h-[85vh] rounded-2xl border border-border/80 shadow-2xl p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-border/40 bg-muted/20 shrink-0">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            {entry.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {entry.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-8 text-sm max-w-5xl mx-auto">
            {entry.sections.map((s, i) => renderSection(s, i))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
