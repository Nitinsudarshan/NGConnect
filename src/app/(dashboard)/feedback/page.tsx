"use client";

import React, { useState, useEffect } from "react";
import {
  Send,
  Star,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  Laptop,
  Briefcase,
  Lightbulb,
  User,
  EyeOff,
  Clock,
  ThumbsUp,
  Target,
  Wrench,
  Compass,
  Building2,
  FileCode,
  BookOpen,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useUserContext } from "@/contexts/user-context";
import { toast } from "sonner";

type FeedbackCategory = "general" | "platform" | "sessions" | "career";

interface SubmittedFeedback {
  id: string;
  category: FeedbackCategory;
  focusArea?: string;
  rating: number;
  comments: string;
  categorySpecificSuggestion?: string;
  isAnonymous: boolean;
  timestamp: string;
}

export default function FeedbackPage() {
  const user = useUserContext();
  const [category, setCategory] = useState<FeedbackCategory>("sessions");
  const [focusArea, setFocusArea] = useState<string>("");
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comments, setComments] = useState<string>("");
  const [categorySpecificSuggestion, setCategorySpecificSuggestion] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [history, setHistory] = useState<SubmittedFeedback[]>([]);

  useEffect(() => {
    fetch("/api/feedback")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && Array.isArray(resData.data)) {
          const formatted: SubmittedFeedback[] = resData.data.map((item: any) => ({
            id: item.id,
            category: item.category as FeedbackCategory,
            focusArea: item.focus_area || undefined,
            rating: item.rating,
            comments: item.comments,
            categorySpecificSuggestion: item.category_specific_suggestion || undefined,
            isAnonymous: item.is_anonymous,
            timestamp: new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }));
          setHistory(formatted);
        }
      })
      .catch(() => {});
  }, []);

  const categoryConfigs: Record<
    FeedbackCategory,
    {
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      description: string;
      color: string;
      ratingLabel: string;
      commentsPlaceholder: string;
      focusAreas: string[];
      suggestionLabel: string;
      suggestionPlaceholder: string;
      suggestionSubtext: string;
    }
  > = {
    sessions: {
      label: "Sessions & Learning",
      icon: GraduationCap,
      description: "Feedback on live workshops, recorded sessions, and suggest upcoming learning topics.",
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      ratingLabel: "How would you rate the quality of recent live & recorded sessions?",
      commentsPlaceholder: "Share feedback on recent learning sessions, instructors, course clarity, or recorded materials...",
      focusAreas: [
        "Frontend & Web Dev",
        "Backend & Databases",
        "System Design & Architecture",
        "DSA & Problem Solving",
        "Soft Skills & Interview Prep",
        "AI & Machine Learning",
      ],
      suggestionLabel: "Suggest Upcoming Session Topics or Workshops",
      suggestionPlaceholder: "e.g. System Design Mock Interviews, Advanced Next.js 15, LLM Prompt Engineering, Microservices Architecture...",
      suggestionSubtext: "Tell us what topics, skills, or guest experts you'd like to see in upcoming live sessions.",
    },
    career: {
      label: "Career & Placement",
      icon: Briefcase,
      description: "Placement assistance, mock interviews, mentoring connections, and Pay-Forward initiative feedback.",
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      ratingLabel: "How would you rate the placement, career guidance, and mentoring support?",
      commentsPlaceholder: "Share your experience with placement outreach, mentoring sessions, job preparation, or career support...",
      focusAreas: [
        "Mock Technical Interviews",
        "Resume & Portfolio Audit",
        "Job Openings & Referrals",
        "Mentoring & Peer Connect",
        "Pay-Forward Program",
        "Salary Negotiation & Career Transitions",
      ],
      suggestionLabel: "Specific Career Support Needed & Target Roles/Companies",
      suggestionPlaceholder: "e.g. Mock interview for Fullstack Developer role, referral assistance for remote React positions, resume feedback...",
      suggestionSubtext: "Detail the specific placement assistance, target roles, or interview prep you need.",
    },
    platform: {
      label: "Platform & UI/UX",
      icon: Laptop,
      description: "Feedback on navigation ease, Learning Center video player, member profile, and platform experience.",
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      ratingLabel: "How would you rate the platform usability and UI experience?",
      commentsPlaceholder: "Detail any UI suggestions, feature requests, mobile navigation friction, or technical improvements...",
      focusAreas: [
        "Dashboard & Navigation",
        "Learning Center & Video Player",
        "Content & Learning Hub",
        "Pay-Forward & Learning Banners",
        "Profile & Account Settings",
        "Help & Support Center",
      ],
      suggestionLabel: "Feature Specs or UI Suggestions (Optional)",
      suggestionPlaceholder: "e.g. Add dark mode toggle memory, enable video player playback speed control, improve mobile layout...",
      suggestionSubtext: "Provide specific details to help our engineering team improve your member platform experience.",
    },
    general: {
      label: "General Feedback",
      icon: MessageSquare,
      description: "Overall platform experience, community engagement, and general suggestions.",
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      ratingLabel: "How would you rate your overall experience with NavGurukul & NGConnect?",
      commentsPlaceholder: "Enter your overall thoughts, ideas, or feedback for the NGConnect team...",
      focusAreas: [
        "Overall Member Experience",
        "Campus & Operations",
        "Community & Events",
        "Communications & Announcements",
      ],
      suggestionLabel: "Suggestions for Community & Program Improvements",
      suggestionPlaceholder: "e.g. Weekly peer coding meetups, campus hackathons, community project showcase days...",
      suggestionSubtext: "Any additional ideas or initiatives for the NavGurukul community.",
    },
  };

  const currentCfg = categoryConfigs[category];

  const handleCategoryChange = (cat: FeedbackCategory) => {
    setCategory(cat);
    setFocusArea("");
    setCategorySpecificSuggestion("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comments.trim()) {
      toast.error("Please enter your feedback comments before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          focusArea: focusArea || null,
          rating,
          comments: comments.trim(),
          categorySpecificSuggestion: categorySpecificSuggestion.trim() || null,
          isAnonymous,
        }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        const newEntry: SubmittedFeedback = {
          id: data.data.id,
          category: data.data.category as FeedbackCategory,
          focusArea: data.data.focus_area || undefined,
          rating: data.data.rating,
          comments: data.data.comments,
          categorySpecificSuggestion: data.data.category_specific_suggestion || undefined,
          isAnonymous: data.data.is_anonymous,
          timestamp: new Date(data.data.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setHistory((prev) => [newEntry, ...prev]);
        setIsSubmitted(true);
        toast.success("Thank you! Your feedback has been recorded.");
      } else {
        toast.error(data.error || "Failed to submit feedback.");
      }
    } catch (e: any) {
      toast.error("Error submitting feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setComments("");
    setCategorySpecificSuggestion("");
    setFocusArea("");
    setIsSubmitted(false);
  };

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-8 max-w-7xl mx-auto w-full pb-20 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-purple-500/5 rounded-md filter blur-[80px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-primary/5 rounded-md filter blur-[100px] pointer-events-none -z-10" />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500/10 to-primary/10 text-primary rounded-md border border-primary/20 shadow-inner">
            <Send className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground/80">
                Member Feedback & Suggestions
              </h1>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-xs">
                Your Voice Matters
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Help us shape NGConnect! Share session feedback, request workshops, or submit placement assistance needs.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Feedback Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/80 bg-card/60 backdrop-blur-sm shadow-md rounded-lg overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> Submit Your Feedback
                </span>
                <Badge variant="secondary" className="font-normal text-xs">
                  {user?.role ? `Role: ${user.role}` : "Member"}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Select a feedback category below to reveal tailored questions and topic suggestion options.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 animate-in zoom-in-95 duration-300">
                  <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-inner">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <div className="space-y-1 max-w-md">
                    <h3 className="text-xl font-bold text-foreground">Feedback Submitted!</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Thank you for sharing your input. Your session topic requests, placement support needs, and platform suggestions directly shape our roadmap.
                    </p>
                  </div>
                  <Button onClick={handleReset} className="gap-2 mt-2">
                    <Send className="w-4 h-4" /> Submit Another Feedback
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Step 1: Category Selector Tabs */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      1. Select Feedback Category
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(Object.keys(categoryConfigs) as FeedbackCategory[]).map((catKey) => {
                        const cfg = categoryConfigs[catKey];
                        const Icon = cfg.icon;
                        const isSelected = category === catKey;
                        return (
                          <button
                            key={catKey}
                            type="button"
                            onClick={() => handleCategoryChange(catKey)}
                            className={`p-3 rounded-lg border text-left transition-all duration-200 flex flex-col justify-between gap-2 ${
                              isSelected
                                ? "border-primary bg-primary/10 shadow-sm"
                                : "border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className={`p-1.5 rounded-md border ${cfg.color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <div className="font-semibold text-xs text-foreground mt-1">{cfg.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Contextual Focus Area Selector */}
                  {currentCfg.focusAreas.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/40 animate-in fade-in duration-300">
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-primary" />
                        2. Focus Area / Topic Track (Optional)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {currentCfg.focusAreas.map((area) => {
                          const isSelected = focusArea === area;
                          return (
                            <button
                              key={area}
                              type="button"
                              onClick={() => setFocusArea(isSelected ? "" : area)}
                              className={`px-3 py-1.5 rounded-md text-xs border transition-all ${
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                                  : "bg-muted/30 text-muted-foreground border-border/60 hover:bg-muted/60 hover:text-foreground"
                              }`}
                            >
                              {area}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Rating Selector */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
                      <span>3. Rating</span>
                      <span className="text-primary font-bold font-mono text-xs">{hoverRating ?? rating} / 5 Stars</span>
                    </label>
                    <p className="text-xs text-muted-foreground">{currentCfg.ratingLabel}</p>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50 w-fit">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = (hoverRating ?? rating) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            onClick={() => setRating(star)}
                            className="p-1 transition-transform hover:scale-125 focus:outline-none"
                          >
                            <Star
                              className={`w-7 h-7 transition-colors ${
                                active ? "fill-amber-400 text-amber-400 drop-shadow-sm" : "text-muted-foreground/40"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 4: Detailed Feedback Text Input */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      4. Detailed Feedback & Comments <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder={currentCfg.commentsPlaceholder}
                      rows={4}
                      className="resize-none text-sm bg-background/80 focus:ring-primary"
                    />
                    <div className="text-[11px] text-muted-foreground text-right">{comments.length} characters</div>
                  </div>

                  {/* Step 5: Category-Specific Suggestions Input (Sessions Topics, Placement Needs, Specs) */}
                  <div className="space-y-2 pt-2 border-t border-border/40 bg-muted/10 p-3.5 rounded-lg border border-border/50 animate-in fade-in duration-300">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      {category === "sessions" ? (
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                      ) : category === "career" ? (
                        <Briefcase className="w-4 h-4 text-emerald-500" />
                      ) : category === "platform" ? (
                        <Wrench className="w-4 h-4 text-purple-500" />
                      ) : (
                        <Compass className="w-4 h-4 text-blue-500" />
                      )}
                      5. {currentCfg.suggestionLabel}
                    </label>
                    <Input
                      value={categorySpecificSuggestion}
                      onChange={(e) => setCategorySpecificSuggestion(e.target.value)}
                      placeholder={currentCfg.suggestionPlaceholder}
                      className="text-sm bg-background/90"
                    />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {currentCfg.suggestionSubtext}
                    </p>
                  </div>

                  {/* Step 6: Anonymous Toggle & User Context */}
                  <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsAnonymous(!isAnonymous)}
                        className={`w-10 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                          isAnonymous ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            isAnonymous ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <div className="text-xs">
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          {isAnonymous ? <EyeOff className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-muted-foreground" />}
                          {isAnonymous ? "Submit Anonymously" : "Include Profile Identity"}
                        </span>
                        <p className="text-muted-foreground text-[11px]">
                          {isAnonymous
                            ? "Your identity will be hidden from staff and managers."
                            : `Submitting as ${user?.email || "Authenticated Member"}`}
                        </p>
                      </div>
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="gap-2 shadow-md min-w-[140px]">
                      <Send className="w-4 h-4" />
                      {isSubmitting ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Category Highlights & Recent Submissions */}
        <div className="space-y-6">
          {/* Card: Category Focus Info */}
          <Card className="border border-border/80 bg-card/60 backdrop-blur-sm rounded-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-emerald-500" /> How We Action Your Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <strong className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" /> Sessions & Workshops:
                </strong>
                Topic suggestions are compiled weekly to schedule new guest mentors and hands-on coding sessions in the Learning Center.
              </div>
              <div className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20 space-y-1">
                <strong className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" /> Career & Placement:
                </strong>
                Specific placement requests trigger alumni team follow-ups for mock interviews and job referral board matching.
              </div>
              <div className="p-2.5 rounded-md bg-purple-500/10 border border-purple-500/20 space-y-1">
                <strong className="text-purple-700 dark:text-purple-400 font-semibold flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5" /> Platform & UI/UX:
                </strong>
                UI feedback and bug reports are routed directly to the product release backlog.
              </div>
            </CardContent>
          </Card>

          {/* Submissions Log (Local Session Preview) */}
          <Card className="border border-border/80 bg-card/60 backdrop-blur-sm rounded-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Session Submissions ({history.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Feedback submitted during your current browser session.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.length === 0 ? (
                <div className="p-4 rounded-md border border-dashed border-border text-center text-xs text-muted-foreground py-8">
                  No submissions yet in this session.
                </div>
              ) : (
                history.map((item) => {
                  const cfg = categoryConfigs[item.category];
                  return (
                    <div key={item.id} className="p-3 rounded-md bg-muted/40 border border-border/60 space-y-2 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {cfg.label}
                          </Badge>
                          {item.focusArea && (
                            <Badge variant="secondary" className="text-[9px]">
                              {item.focusArea}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span className="font-mono text-foreground font-semibold">{item.rating}/5</span>
                        </div>
                      </div>

                      <p className="text-foreground italic leading-relaxed">"{item.comments}"</p>

                      {item.categorySpecificSuggestion && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20 space-y-0.5">
                          <strong>
                            {item.category === "sessions"
                              ? "Suggested Session Topic:"
                              : item.category === "career"
                              ? "Career Support Request:"
                              : item.category === "platform"
                              ? "Feature Spec / Details:"
                              : "Community Idea:"}
                          </strong>{" "}
                          <span>{item.categorySpecificSuggestion}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/40 pt-1.5">
                        <span>{item.isAnonymous ? "Anonymous" : user?.email || "User"}</span>
                        <span>{item.timestamp}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
