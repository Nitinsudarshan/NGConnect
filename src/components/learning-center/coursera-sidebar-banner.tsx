"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Clock, ExternalLink, Send, X } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { toast } from "sonner";

export function CourseraSidebarBanner() {
  const [show, setShow] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState<"none" | "pending" | "approved">("none");
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem("coursera_banner_dismissed");
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Check member request status
    fetch("/api/member-requests?type=coursera")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data && resData.data.length > 0) {
          const req = resData.data[0];
          if (req.status === "approved") {
            setRequestStatus("approved");
          } else if (req.status === "pending") {
            setRequestStatus("pending");
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    sessionStorage.setItem("coursera_banner_dismissed", "1");
  };

  const handleRequestAccess = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/member-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "coursera" }),
      });
      const data = await res.json();
      if (data.success) {
        setRequestStatus("pending");
        toast.success("Coursera access request submitted! Our team will review it.");
      } else {
        toast.error(data.error || "Failed to submit request.");
      }
    } catch (e) {
      toast.error("Error submitting request.");
    } finally {
      setLoading(false);
    }
  };

  if (!show || dismissed || isCollapsed) return null;

  return (
    <div className="mx-2 mb-3 shrink-0 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 p-3 shadow-sm relative overflow-hidden transition-all duration-300">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-1.5 right-1.5 p-0.5 rounded-md text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Render based on state */}
      {requestStatus === "approved" ? (
        <>
          <div className="flex items-center gap-2 mb-1.5 pr-4">
            <div className="p-1 bg-emerald-100 dark:bg-emerald-900/50 rounded-md shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 leading-tight">
              Access Granted!
            </p>
          </div>
          <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed mb-2">
            Your Coursera Enterprise license is active. You can now login to start learning.
          </p>
          <a
            href="https://www.coursera.org/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[10px] font-medium text-white bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded-md px-2 py-1.5 w-full justify-center transition-colors shadow-xs"
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            Click here to login to Coursera
          </a>
        </>
      ) : requestStatus === "pending" ? (
        <>
          <div className="flex items-center gap-2 mb-1.5 pr-4">
            <div className="p-1 bg-amber-100 dark:bg-amber-900/50 rounded-md shrink-0">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
            </div>
            <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 leading-tight">
              Request Sent
            </p>
          </div>
          <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed mb-2">
            Your request for Coursera Enterprise access has been submitted and is pending staff approval.
          </p>
          <div className="flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-100/80 dark:bg-amber-900/40 border border-amber-300/40 rounded-md px-2 py-1 w-full justify-center">
            <Clock className="w-3 h-3 shrink-0" />
            Pending Team Review
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-1.5 pr-4">
            <div className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded-md shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 leading-tight">
              Get Coursera Access
            </p>
          </div>
          <p className="text-[10px] text-blue-700/80 dark:text-blue-400/80 leading-relaxed mb-2">
            Your account doesn&apos;t have an active Coursera Enterprise license yet.
          </p>
          <button
            onClick={handleRequestAccess}
            disabled={loading}
            className="flex items-center gap-1 text-[10px] font-medium text-white bg-blue-600 hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-md px-2 py-1.5 w-full justify-center transition-colors shadow-xs disabled:opacity-50"
          >
            <Send className="w-3 h-3 shrink-0" />
            {loading ? "Submitting..." : "Request Access"}
          </button>
        </>
      )}
    </div>
  );
}
