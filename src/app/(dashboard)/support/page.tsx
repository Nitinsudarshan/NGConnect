"use client";

import React, { useState, useEffect } from "react";
import {
  LifeBuoy,
  Phone,
  Mail,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  HelpCircle,
  GraduationCap,
  Briefcase,
  HeartHandshake,
  UserCheck,
  ChevronDown,
  MessageSquare,
  Sparkles,
  Zap,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserContext } from "@/contexts/user-context";
import { toast } from "sonner";

export default function SupportPage() {
  const user = useUserContext();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Dynamic Member Support Reference ID
  const memberSupportId = user?.id
    ? `NG-SUP-${user.id.slice(0, 6).toUpperCase()}`
    : "NG-SUP-7842";

  const DUMMY_PHONE = "9999999999";
  const DUMMY_PHONE_FORMATTED = "+91 99999 99999";
  const OFFICIAL_EMAIL = "alumnigrowth@navgurukul.org";

  // Calculate helpline active status in IST (Mon-Fri 10:00 AM - 5:00 PM IST)
  const getHelplineStatus = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Asia/Kolkata",
      hour12: false,
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
    };
    const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(now);

    let weekday = "";
    let hour = 0;
    let minute = 0;

    parts.forEach((p) => {
      if (p.type === "weekday") weekday = p.value;
      if (p.type === "hour") hour = parseInt(p.value, 10);
      if (p.type === "minute") minute = parseInt(p.value, 10);
    });

    const isWorkingDay = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday);
    const currentMin = hour * 60 + minute;
    const startMin = 10 * 60; // 10:00 AM
    const endMin = 17 * 60;   // 5:00 PM

    const isActive = isWorkingDay && currentMin >= startMin && currentMin < endMin;

    let nextOpeningText = "";
    if (!isActive) {
      let daysToAdd = 0;
      if (isWorkingDay && currentMin < startMin) {
        daysToAdd = 0;
      } else if (weekday === "Fri" && currentMin >= endMin) {
        daysToAdd = 3;
      } else if (weekday === "Sat") {
        daysToAdd = 2;
      } else if (weekday === "Sun") {
        daysToAdd = 1;
      } else {
        daysToAdd = 1;
      }

      const totalMinsLeft = (daysToAdd * 24 * 60) + (startMin - currentMin);
      const hoursLeft = Math.floor(totalMinsLeft / 60);
      const minsLeft = totalMinsLeft % 60;

      if (hoursLeft > 0 && minsLeft > 0) {
        nextOpeningText = `Opens in ${hoursLeft}h ${minsLeft}m`;
      } else if (hoursLeft > 0) {
        nextOpeningText = `Opens in ${hoursLeft} hrs`;
      } else {
        nextOpeningText = `Opens in ${minsLeft} mins`;
      }
    }

    return { isActive, nextOpeningText };
  };

  const [helplineStatus, setHelplineStatus] = useState<{ isActive: boolean; nextOpeningText: string }>({
    isActive: false,
    nextOpeningText: "Mon-Fri 10:00 AM - 5:00 PM IST",
  });

  useEffect(() => {
    setHelplineStatus(getHelplineStatus());
    const interval = setInterval(() => {
      setHelplineStatus(getHelplineStatus());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const supportChannels = [
    {
      title: "Learning & Session Access",
      icon: GraduationCap,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      description: "Assistance with live Google Meet session links, course recording archives, study materials, and certificates.",
      badge: "Sessions & Content",
    },
    {
      title: "Placement & Job Opportunities",
      icon: Briefcase,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      description: "Support for mock technical interviews, resume audits, job referral requests, and career placement outreach.",
      badge: "Career Support",
    },
    {
      title: "Mentoring & Peer Connect",
      icon: HeartHandshake,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      description: "Help with alumni mentor pairings, peer study circles, and Pay-Forward initiative participation.",
      badge: "Mentorship",
    },
    {
      title: "Account & Technical Assistance",
      icon: UserCheck,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      description: "Support for profile detail updates, email verification, password resets, and platform navigation issues.",
      badge: "Account & Platform",
    },
  ];

  const faqs = [
    {
      question: "What is the official contact email for member support?",
      answer: `You can reach out directly to our Alumni Growth & Support team at ${OFFICIAL_EMAIL} or call our helpline at ${DUMMY_PHONE_FORMATTED} (${DUMMY_PHONE}). Please reference your Support Reference ID ${memberSupportId} for faster assistance.`,
    },
    {
      question: "What are the active support hours and response times?",
      answer: "Our telephone helpline operates Monday through Friday from 10:00 AM to 5:00 PM IST. General inquiries receive a response within 48 hours. Urgent login or live session access failures are prioritized with quick response within 4 hours.",
    },
    {
      question: "How do I access Learning Center live session links and recorded archives?",
      answer: "Navigate to the Learning Center tab in the left sidebar. There you can find upcoming session links under 'Dashboard' or 'Sessions', and recorded archives under 'Past Sessions'.",
    },
    {
      question: "How do I request placement assistance or mock interviews?",
      answer: "Submit a request on the Feedback & Suggestions page under 'Career & Placement', or email alumnigrowth@navgurukul.org with your target roles and updated resume.",
    },
    {
      question: "Where can I submit feature requests or report a platform bug?",
      answer: "Use the 'Feedback' link in the sidebar menu. You can select 'Platform & UI/UX' to detail feature suggestions or bug reports.",
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-8 max-w-7xl mx-auto w-full pb-20 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-primary/5 rounded-md filter blur-[80px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-blue-500/5 rounded-md filter blur-[100px] pointer-events-none -z-10" />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-primary/10 to-blue-500/10 text-primary rounded-md border border-primary/20 shadow-inner">
            <LifeBuoy className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground/80">
                Support & Help Center
              </h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-xs">
                Ref ID: {memberSupportId}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Need assistance? Connect with our Alumni Growth support team or browse member FAQs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 border-primary/20 hover:bg-primary/5"
            onClick={() => handleCopy(DUMMY_PHONE, "Support Helpline")}
          >
            <Phone className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs font-semibold">{DUMMY_PHONE}</span>
            {copiedField === "Support Helpline" ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </Button>

          <Button
            className="gap-2 shadow-sm"
            onClick={() => window.open(`mailto:${OFFICIAL_EMAIL}?subject=Support%20Request%20[${memberSupportId}]`)}
          >
            <Mail className="w-4 h-4" />
            Email Support
          </Button>
        </div>
      </div>

      {/* Main Support Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Direct Contact Card (Dynamic Active / Offline Helpline status) */}
        <Card className={`border shadow-md relative overflow-hidden rounded-lg md:col-span-2 ${
          helplineStatus.isActive
            ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-card to-card"
            : "border-red-500/30 bg-gradient-to-br from-red-500/5 via-card to-card"
        }`}>
          <div className={`absolute right-0 top-0 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
            helplineStatus.isActive ? "bg-emerald-500/10" : "bg-red-500/10"
          }`} />
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {helplineStatus.isActive ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium px-2.5 py-1 w-fit flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Helpline Active
                </Badge>
              ) : (
                <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 font-medium px-2.5 py-1 w-fit flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Helpline Offline ({helplineStatus.nextOpeningText})
                </Badge>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-primary" /> Working Hours: Mon-Fri 10:00 AM - 5:00 PM IST
              </span>
            </div>
            <CardTitle className="text-xl font-bold mt-3 flex items-center gap-2">
              <Phone className={`w-5 h-5 ${helplineStatus.isActive ? "text-emerald-500" : "text-red-500"}`} />
              Direct Member Telephone Helpline
            </CardTitle>
            <CardDescription className="text-sm">
              {helplineStatus.isActive
                ? "Our support line is currently open. Call us directly or copy details below."
                : `Telephone line is currently offline. ${helplineStatus.nextOpeningText}. You can still email us at ${OFFICIAL_EMAIL}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="p-4 rounded-lg bg-background/80 border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Helpline Number</div>
                <div className="text-2xl font-bold font-mono tracking-tight text-foreground mt-0.5">
                  {DUMMY_PHONE_FORMATTED}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Raw Number: <span className="font-mono">{DUMMY_PHONE}</span></div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-2 flex-1 sm:flex-none"
                  onClick={() => handleCopy(DUMMY_PHONE, "Phone Number")}
                >
                  {copiedField === "Phone Number" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  Copy Number
                </Button>
                <Button
                  size="sm"
                  className={`gap-2 flex-1 sm:flex-none text-white ${
                    helplineStatus.isActive
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-muted-foreground/80 hover:bg-muted-foreground cursor-not-allowed"
                  }`}
                  onClick={() => {
                    if (helplineStatus.isActive) {
                      window.open(`tel:${DUMMY_PHONE}`);
                    } else {
                      toast.info(`Telephone line is offline. ${helplineStatus.nextOpeningText}. Please email ${OFFICIAL_EMAIL}`);
                    }
                  }}
                >
                  <Phone className="w-4 h-4" /> {helplineStatus.isActive ? "Call Now" : "Offline"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground pt-2">
              <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/40 border border-border/40">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span>Support Reference ID: <strong className="font-mono text-foreground">{memberSupportId}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(memberSupportId, "Support Reference ID")}
                  className="text-primary hover:underline font-medium text-[11px]"
                >
                  {copiedField === "Support Reference ID" ? "Copied!" : "Copy"}
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/40 border border-border/40">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">Email: <strong className="text-foreground">{OFFICIAL_EMAIL}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(OFFICIAL_EMAIL, "Support Email")}
                  className="text-primary hover:underline font-medium text-[11px] shrink-0 ml-1"
                >
                  {copiedField === "Support Email" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SLA & Response Hours Card */}
        <Card className="border border-border bg-card/60 backdrop-blur-sm rounded-lg flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Response Timelines
            </CardTitle>
            <CardDescription className="text-xs">
              Expected response SLAs for member support tickets and inquiries.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-xs text-muted-foreground">
            {/* General Response Time */}
            <div className="p-3 rounded-md bg-muted/50 border border-border/50 space-y-1">
              <div className="font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" /> General Response Time
                </span>
                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                  Within 48 Hours
                </Badge>
              </div>
              <p className="text-[11px]">During working hours (Mon-Fri 10:00 AM - 5:00 PM IST)</p>
            </div>

            {/* Quick Response */}
            <div className="p-3 rounded-md bg-muted/50 border border-border/50 space-y-1">
              <div className="font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Quick Response
                </span>
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                  Within 4 hrs
                </Badge>
              </div>
              <p className="text-[11px]">For urgent login or live session access failures.</p>
            </div>

            <Button
              variant="outline"
              className="w-full gap-2 mt-2 border-primary/30 text-primary hover:bg-primary/5"
              onClick={() => handleCopy(memberSupportId, "Support Reference ID")}
            >
              {copiedField === "Support Reference ID" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              Copy Support Reference ID ({memberSupportId})
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Support Categories Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> Support Categories
          </h2>
          <span className="text-xs text-muted-foreground">Select a category or email {OFFICIAL_EMAIL}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {supportChannels.map((channel, idx) => {
            const Icon = channel.icon;
            return (
              <Card key={idx} className="border border-border/80 bg-card/60 hover:bg-card hover:border-primary/40 transition-all duration-300 rounded-lg group flex flex-col justify-between">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-md border ${channel.color} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="secondary" className="text-[9px]">
                      {channel.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-semibold mt-3 group-hover:text-primary transition-colors">
                    {channel.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 text-xs text-muted-foreground leading-relaxed space-y-3">
                  <p>{channel.description}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-xs text-primary hover:bg-primary/10 justify-start px-2 h-8 font-medium gap-1.5"
                    onClick={() => window.open(`mailto:${OFFICIAL_EMAIL}?subject=${encodeURIComponent(channel.title)}%20[${memberSupportId}]`)}
                  >
                    <Mail className="w-3.5 h-3.5" /> Request Support
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-4 pt-4 border-t border-border/60">
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" /> Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-border/80 rounded-lg bg-card/60 backdrop-blur-sm overflow-hidden transition-all duration-200"
            >
              <button
                className="w-full text-left p-4 font-semibold text-sm text-foreground flex items-center justify-between gap-4 hover:bg-muted/40 transition-colors"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <span>{faq.question}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${openFaq === idx ? "rotate-180 text-primary" : ""}`} />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground border-t border-border/40 bg-muted/20 leading-relaxed animate-in fade-in duration-200">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
