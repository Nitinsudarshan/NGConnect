"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, HelpCircle } from "lucide-react";

interface BoardHelpModalProps {
  pipelineCode: string;
}

export function BoardHelpModal({ pipelineCode }: BoardHelpModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getTitle = () => {
    switch(pipelineCode) {
      case 'mentoring': return "Mentoring Board Guide";
      case 'placement': return "Placement Board Guide";
      case 'pay_forward': return "Pay-Forward Board Guide";
      default: return "Board Guide";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-100/50 ml-auto">
          <Info className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-[90vw] max-h-[85vh] rounded-2xl border border-border/80 shadow-2xl p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-border/40 bg-muted/20">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <HelpCircle className="w-5 h-5 text-amber-500" /> {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            A quick reference guide for understanding and managing this pipeline.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-8 text-sm max-w-4xl mx-auto">
            
            <section className="space-y-3">
              <h3 className="font-semibold text-lg text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> 1. Overview & Navigation
              </h3>
              <p className="text-muted-foreground leading-relaxed pl-4">
                This CRM Pipeline Board is designed to help you track, manage, and progress alumni through various engagement stages. You can view leads in two modes:
              </p>
              <ul className="list-disc pl-9 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground/80 font-medium">Kanban Board View:</strong> A visual drag-and-drop interface where each column represents a stage. Drag a card to the next column to update the alumni's status instantly.</li>
                <li><strong className="text-foreground/80 font-medium">List View:</strong> A compact, tabular format showing all leads. Best for quickly scanning large numbers of leads or performing bulk reviews.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold text-lg text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> 2. Roles: Owners vs Supporters
              </h3>
              <p className="text-muted-foreground leading-relaxed pl-4">
                Every alumni in the pipeline has two key staff members associated with their record:
              </p>
              <ul className="list-disc pl-9 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground/80 font-medium">Owner (Point of Contact):</strong> The person currently assigned to manage the lead. If you are the owner, it is your responsibility to contact the alumni and move them through the pipeline. When you filter by "My Leads", you are filtering by Owner.</li>
                <li><strong className="text-foreground/80 font-medium">Supporter:</strong> The staff member who originally discovered, referred, or added the alumni to this pipeline. They serve as the historical source but do not necessarily manage the active conversation.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold text-lg text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" /> 3. Core Actions
              </h3>
              <p className="text-muted-foreground leading-relaxed pl-4 pb-2">
                You can perform several critical actions directly from an alumni's card:
              </p>
              <div className="space-y-4 pl-4">
                <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                  <h4 className="font-semibold text-foreground mb-1">Logging Interactions</h4>
                  <p className="text-muted-foreground">
                    Click the <strong className="text-foreground/80">Message/Phone icon</strong> on a card to log a touchpoint. You MUST log all interactions (Calls, Emails, WhatsApp messages, In-person meetings) to ensure a complete history. Be sure to select the correct "Outcome" (e.g., Connected, No Answer, Left Voicemail) to keep reporting accurate.
                  </p>
                </div>
                <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                  <h4 className="font-semibold text-foreground mb-1">Transferring a Lead</h4>
                  <p className="text-muted-foreground">
                    If an alumni requires specialized help or if you are going on leave, you can click the <strong className="text-foreground/80">Transfer (Users) icon</strong>. This allows you to hand over the "Owner" role to another eligible staff member. The new owner will immediately see the lead in their queue.
                  </p>
                </div>
                <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                  <h4 className="font-semibold text-foreground mb-1">Viewing Full Profiles</h4>
                  <p className="text-muted-foreground">
                    Click on the alumni's <strong className="text-foreground/80">Name</strong> to open a side-panel. This panel contains their full historical timeline, previous interactions across all pipelines, and detailed contact information.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold text-lg text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" /> 4. Pipeline Stages & Flow
              </h3>
              <p className="text-muted-foreground leading-relaxed pl-4">
                Leads should always flow from left to right. Never move a lead backwards unless a genuine mistake was made.
              </p>
              <ul className="list-disc pl-9 space-y-3 text-muted-foreground">
                <li>
                  <strong className="text-foreground/80 font-medium">Initial Contact / Uncontacted:</strong> 
                  <span className="block mt-0.5">Leads recently added to the board. They require immediate first outreach. Goal: Establish contact within 48 hours.</span>
                </li>
                <li>
                  <strong className="text-foreground/80 font-medium">In Progress / Active:</strong> 
                  <span className="block mt-0.5">Contact has been made and conversations are ongoing. Use follow-up reminders to ensure they don't go stale.</span>
                </li>
                <li>
                  <strong className="text-foreground/80 font-medium">Completed / Successful:</strong> 
                  <span className="block mt-0.5">The primary goal of the pipeline was achieved (e.g. they became a mentor, got placed, or paid forward). Leads here are considered closed-won.</span>
                </li>
                <li>
                  <strong className="text-foreground/80 font-medium">Dropped / Unresponsive:</strong> 
                  <span className="block mt-0.5">If an alumni explicitly declines, or fails to respond after 3-4 outreach attempts over several weeks, you should mark them as dropped to keep the board clean.</span>
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold text-lg text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <div className="w-2 h-2 rounded-full bg-rose-500" /> 5. Advanced Filters
              </h3>
              <p className="text-muted-foreground leading-relaxed pl-4">
                Use the top filter bar to drill down into specific segments of your alumni network. You can filter by:
              </p>
              <ul className="list-disc pl-9 space-y-1.5 text-muted-foreground">
                <li><strong className="text-foreground/80">Owner:</strong> Find leads assigned to a specific team member.</li>
                <li><strong className="text-foreground/80">Supporter:</strong> Track leads sourced by a specific person.</li>
                <li><strong className="text-foreground/80">Campus & Year:</strong> Narrow down by graduation batch and location to run targeted campaigns.</li>
              </ul>
            </section>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
