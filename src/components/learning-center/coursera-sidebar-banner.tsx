"use client"

import React, { useEffect, useState } from "react"
import { BookOpen, Mail, X } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"

export function CourseraSidebarBanner() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [contactEmail, setContactEmail] = useState("learn@navgurukul.org")
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem("coursera_banner_dismissed")
    if (wasDismissed) return

    fetch("/api/learning-center/coursera-status")
      .then((r) => r.json())
      .then((data) => {
        // Respect admin toggle — if callouts disabled, never show
        if (!data.show_callouts) return
        if (data.show_contact_banner) {
          setShow(true)
          if (data.contact_email) setContactEmail(data.contact_email)
        }
      })
      .catch(() => {})
  }, [])

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDismissed(true)
    sessionStorage.setItem("coursera_banner_dismissed", "1")
  }

  if (!show || dismissed || isCollapsed) return null

  const mailtoHref = `mailto:${contactEmail}?subject=Request%20Coursera%20Enterprise%20Access`

  return (
    <div className="mx-2 mb-3 shrink-0 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 p-3 shadow-sm relative overflow-hidden">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-1.5 right-1.5 p-0.5 rounded-md text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Icon + Title */}
      <div className="flex items-center gap-2 mb-1.5 pr-4">
        <div className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded-md shrink-0">
          <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        </div>
        <p className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 leading-tight">
          Get Coursera Access
        </p>
      </div>

      {/* Body */}
      <p className="text-[10px] text-blue-700/80 dark:text-blue-400/80 leading-relaxed mb-2">
        Your account doesn&apos;t have an active Coursera Enterprise license yet.
      </p>

      {/* CTA */}
      <a
        href={mailtoHref}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1 text-[10px] font-medium text-white bg-blue-600 hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-md px-2 py-1 w-full justify-center transition-colors"
      >
        <Mail className="w-3 h-3 shrink-0" />
        Contact Us
      </a>
    </div>
  )
}
