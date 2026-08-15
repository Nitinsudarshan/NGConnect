"use client";

import React, { useEffect, useState } from "react";
import { HeartHandshake, CheckCircle2, Clock, Send, X } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { toast } from "sonner";

export function PayForwardSidebarBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState<"none" | "pending" | "received">("none");
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  useEffect(() => {
    fetch("/api/member-requests?type=pay_forward")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data && resData.data.length > 0) {
          const req = resData.data[0];
          if (req.status === "pending") {
            setRequestStatus("pending");
          } else if (req.status === "received") {
            // Once staff receives it, banner resets back to normal state
            setRequestStatus("none");
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
  };

  const handleSendRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/member-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "pay_forward" }),
      });
      const data = await res.json();
      if (data.success) {
        setRequestStatus("pending");
        toast.success("Pay-Forward request sent! Our Alumni team will get in touch.");
      } else {
        toast.error(data.error || "Failed to send request.");
      }
    } catch (e) {
      toast.error("Error submitting request.");
    } finally {
      setLoading(false);
    }
  };

  if (dismissed || isCollapsed) return null;

  return (
    <div className="mx-2 mb-3 shrink-0 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 p-3 shadow-sm relative overflow-hidden transition-all duration-300">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-1.5 right-1.5 p-0.5 rounded-md text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3 h-3" />
      </button>

      {requestStatus === "pending" ? (
        <>
          <div className="flex items-center gap-2 mb-1.5 pr-4">
            <div className="p-1 bg-emerald-100 dark:bg-emerald-900/50 rounded-md shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 leading-tight">
              Request Sent
            </p>
          </div>
          <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed mb-2">
            Thank you! Our Alumni Growth team has received your request and will reach out shortly.
          </p>
          <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-100/80 dark:bg-emerald-900/40 border border-emerald-300/40 rounded-md px-2 py-1 w-full justify-center">
            <Clock className="w-3 h-3 shrink-0 text-emerald-600" />
            Request Sent
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-1.5 pr-4">
            <div className="p-1 bg-emerald-100 dark:bg-emerald-900/50 rounded-md shrink-0">
              <HeartHandshake className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 leading-tight">
              Pay It Forward
            </p>
          </div>
          <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed mb-2">
            Help fellow alumni by mentoring or sharing opportunities.
          </p>
          <button
            onClick={handleSendRequest}
            disabled={loading}
            className="flex items-center gap-1 text-[10px] font-medium text-white bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded-md px-2 py-1.5 w-full justify-center transition-colors shadow-xs disabled:opacity-50"
          >
            <Send className="w-3 h-3 shrink-0" />
            {loading ? "Sending..." : "Get Started"}
          </button>
        </>
      )}
    </div>
  );
}
