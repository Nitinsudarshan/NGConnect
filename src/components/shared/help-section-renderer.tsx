"use client";

import React, { useEffect, useState } from "react";
import { HelpSection } from "@/lib/help-registry";
import { ArrowRight, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";

/** Tailwind color map for section badge/dot */
const COLOR_DOT: Record<string, string> = {
  blue: "bg-blue-500 text-blue-500",
  emerald: "bg-emerald-500 text-emerald-500",
  purple: "bg-purple-500 text-purple-500",
  amber: "bg-amber-500 text-amber-500",
  rose: "bg-rose-500 text-rose-500",
  sky: "bg-sky-500 text-sky-500",
};

/**
 * Client component to render Mermaid diagrams dynamically.
 * Attempts to dynamically import 'mermaid' and render SVG diagram.
 */
function MermaidDiagram({ chart }: { chart: string }) {
  const [svg, setSvg] = useState<string>("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadAndRender() {
      try {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default;

        const isDark =
          document.documentElement.classList.contains("dark") ||
          document.body.classList.contains("dark");

        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "neutral",
          securityLevel: "loose",
          fontFamily: "var(--font-sans), sans-serif",
        });

        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, chart);

        if (active) {
          setSvg(renderedSvg);
          setFailed(false);
        }
      } catch (err) {
        console.warn("Mermaid rendering warning, fallback to styled representation:", err);
        if (active) setFailed(true);
      }
    }

    loadAndRender();
    return () => {
      active = false;
    };
  }, [chart]);

  if (failed || !svg) {
    // Parse simple Mermaid nodes for clean visual flowchart fallback
    const lines = chart
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.includes("-->") || l.includes("---"));

    if (lines.length > 0) {
      return (
        <div className="bg-muted/20 border border-border/60 rounded-2xl p-4 my-3 overflow-x-auto">
          <div className="flex flex-wrap items-center gap-3 justify-center min-w-[300px]">
            {lines.map((line, idx) => {
              const parts = line.split(/-->|---/).map((p) =>
                p
                  .replace(/\[|\]|\(|\)|\|/g, " ")
                  .replace(/flowchart|graph|TD|LR/g, "")
                  .trim()
              );
              return (
                <React.Fragment key={idx}>
                  <div className="px-3 py-2 bg-card border border-border/80 rounded-xl shadow-2xs text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{parts[0] || "Step"}</span>
                  </div>
                  {parts[1] && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                  )}
                  {parts[1] && idx === lines.length - 1 && (
                    <div className="px-3 py-2 bg-primary/10 border border-primary/30 text-primary rounded-xl shadow-2xs text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>{parts[1]}</span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-muted/20 border border-border/60 rounded-xl p-4 font-mono text-xs text-muted-foreground overflow-x-auto my-3 whitespace-pre">
        {chart}
      </div>
    );
  }

  return (
    <div
      className="p-4 bg-muted/20 dark:bg-muted/10 rounded-2xl border border-border/60 shadow-2xs overflow-x-auto flex justify-center items-center my-3 text-foreground"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function HelpSectionRenderer({
  section,
  index,
}: {
  section: HelpSection;
  index: number;
}) {
  const dotColor = COLOR_DOT[section.color]?.split(" ")[0] ?? "bg-slate-400";
  const textColor = COLOR_DOT[section.color]?.split(" ")[1] ?? "text-slate-500";

  return (
    <section key={index} className="space-y-3">
      <h3 className="font-semibold text-base text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
        <span className="text-foreground">{section.title}</span>
      </h3>

      {/* 1. Text Type */}
      {section.type === "text" && (
        <p className="text-muted-foreground leading-relaxed pl-4 text-sm">
          {section.content as string}
        </p>
      )}

      {/* 2. Bullets Type */}
      {section.type === "bullets" && (
        <ul className="list-disc pl-9 space-y-2 text-sm text-muted-foreground">
          {section.items?.map((item, i) => (
            <li key={i}>
              {item.title && (
                <strong className="text-foreground/90 font-semibold">
                  {item.title}:{" "}
                </strong>
              )}
              {item.text}
            </li>
          ))}
        </ul>
      )}

      {/* 3. Cards Type */}
      {section.type === "cards" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4">
          {section.items?.map((item, i) => (
            <div
              key={i}
              className="bg-muted/30 hover:bg-muted/50 transition-colors p-3.5 rounded-xl border border-border/60 flex flex-col justify-between"
            >
              {item.title && (
                <h4 className="font-semibold text-sm text-foreground mb-1 flex items-center justify-between">
                  <span>{item.title}</span>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {item.badge}
                    </span>
                  )}
                </h4>
              )}
              <p className="text-xs leading-relaxed text-muted-foreground">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 4. Steps Workflow Type */}
      {section.type === "steps" && (
        <div className="space-y-2.5 pl-4">
          {section.items?.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-muted/20 p-3 rounded-xl border border-border/50"
            >
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                {i + 1}
              </div>
              <div>
                {item.title && (
                  <h4 className="font-semibold text-sm text-foreground">
                    {item.title}
                  </h4>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Mermaid / Diagram Type */}
      {(section.type === "mermaid" || section.type === "diagram" || section.mermaid) && (
        <div className="pl-4 space-y-2">
          {section.content && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {section.content as string}
            </p>
          )}
          {section.mermaid && <MermaidDiagram chart={section.mermaid} />}
        </div>
      )}
    </section>
  );
}
