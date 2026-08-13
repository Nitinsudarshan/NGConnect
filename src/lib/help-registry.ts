/**
 * Central registry of all help content across NGConnect.
 * Each entry defines an id, title, description, and sections.
 *
 * To add a new help entry:
 *   1. Add a new HelpEntry object to HELP_REGISTRY.
 *   2. Place a <HelpModal helpId="your.id" /> wherever appropriate.
 *   3. The /manage/help page will automatically list and control it.
 */

export interface HelpSection {
  title: string;
  color: string; // Tailwind color name e.g. "blue", "emerald", "purple"
  content: React.ReactNode | string;
  type?: "text" | "bullets" | "cards";
  items?: { title?: string; text: string }[];
}

export interface HelpEntry {
  id: string;
  /** Human-readable label shown in Manage › Help Docs */
  label: string;
  /** The page / context where this appears */
  location: string;
  title: string;
  description: string;
  sections: HelpSection[];
}

// We use a plain object with serialisable section types so the registry can be
// consumed both in client components and in the server-rendered Manage page.
export const HELP_REGISTRY: HelpEntry[] = [
  /* ──────────────────────── PIPELINE BOARDS ──────────────────────── */
  {
    id: "boards.mentoring",
    label: "Mentoring Board",
    location: "Alumni Growth › Pipelines › Mentoring",
    title: "Mentoring Board Guide",
    description: "A complete reference for managing the Mentoring pipeline.",
    sections: [
      {
        title: "1. What is the Mentoring Board?",
        color: "blue",
        type: "text",
        content:
          "The Mentoring Board tracks alumni who have been identified as potential mentors for current Navgurukul students. The goal is to onboard committed mentors who will take at least one session. Leads move left-to-right through stages from initial identification to active mentoring.",
      },
      {
        title: "2. Owners vs Supporters",
        color: "emerald",
        type: "bullets",
        items: [
          { title: "Owner (POC)", text: "The staff member currently responsible for following up and moving this lead forward. Filter by 'My Leads' to see your queue." },
          { title: "Supporter", text: "The person who originally sourced or added this alumni to the pipeline. They remain on record as the referral source even after transfers." },
        ],
      },
      {
        title: "3. Core Actions",
        color: "purple",
        type: "cards",
        items: [
          { title: "Log Interaction", text: "Click the message/phone icon on a card to record a call, email, or meeting. Always pick the correct Outcome (e.g. Connected, No Answer, Left Voicemail). This feeds directly into reporting." },
          { title: "Transfer Lead", text: "Use the Users icon to reassign ownership. The new owner sees the lead in their queue immediately. Transfers are logged in the Edit Log." },
          { title: "Move Stage", text: "Drag the card to the next column in Board View, or use the stage dropdown in List View. Stage changes are recorded in history." },
          { title: "View Profile", text: "Click the alumni's name to open their full profile panel — interaction history, contact details, and cross-pipeline status." },
        ],
      },
      {
        title: "4. Pipeline Stages",
        color: "amber",
        type: "bullets",
        items: [
          { title: "Identified", text: "Alumni has been flagged as a potential mentor. No contact made yet. Goal: first outreach within 48 hours." },
          { title: "Contacted", text: "First message or call placed. Awaiting confirmation of interest." },
          { title: "Interested", text: "Alumni has expressed willingness to mentor. Schedule their first session." },
          { title: "Onboarded", text: "Mentor has been formally onboarded and connected with the Learning Center team." },
          { title: "Active", text: "Mentor has completed at least one session. Keep nurturing the relationship." },
          { title: "Dropped", text: "Alumni declined, is unresponsive after 3–4 attempts, or is no longer eligible. Mark dropped to keep the board clean." },
        ],
      },
      {
        title: "5. Filters",
        color: "rose",
        type: "bullets",
        items: [
          { title: "Owner", text: "Find all leads assigned to a specific person. Use 'Me (My Leads)' to see only your queue." },
          { title: "Supporter", text: "Filter by who sourced the lead. Useful for accountability tracking." },
          { title: "Campus & Year", text: "Narrow by graduation campus or batch year for targeted campaigns." },
        ],
      },
    ],
  },
  {
    id: "boards.pay_forward",
    label: "Pay-Forward Board",
    location: "Alumni Growth › Pipelines › Pay-Forward",
    title: "Pay-Forward Board Guide",
    description: "A complete reference for managing the Pay-Forward donation pipeline.",
    sections: [
      {
        title: "1. What is Pay-Forward?",
        color: "blue",
        type: "text",
        content:
          "Pay-Forward is Navgurukul's model where alumni contribute a portion of their salary back to fund future students. This board tracks alumni who are eligible to contribute and manages the entire outreach lifecycle — from initial pitch to active contributor.",
      },
      {
        title: "2. Eligibility Rules",
        color: "sky",
        type: "bullets",
        items: [
          { title: "Salary Floor", text: "Only alumni earning above the minimum pitch salary (configurable in Settings › Pay-Forward Rules) are eligible." },
          { title: "Completion Cap", text: "Alumni who have already paid the lifetime cap (default ₹1,20,000) are marked as 'Completed' and should not be re-pitched." },
          { title: "Cool-down Period", text: "After a 'No Answer', the system enforces a cool-down period (configured in Settings) before the alumni re-enters the workspace queue." },
        ],
      },
      {
        title: "3. Owners vs Supporters",
        color: "emerald",
        type: "bullets",
        items: [
          { title: "Owner (POC)", text: "The staff member currently managing this lead. Responsible for pitching and collecting contributions." },
          { title: "Supporter", text: "The person who originally added the alumni to the Pay-Forward pipeline." },
        ],
      },
      {
        title: "4. Core Actions",
        color: "purple",
        type: "cards",
        items: [
          { title: "Log Interaction", text: "Always log every call or message. Select outcomes carefully — 'Discussed' means you had a full conversation, 'Callback Requested' means they asked you to call later." },
          { title: "Transfer Lead", text: "Reassign to another eligible staff member. Use sparingly — consistency of contact builds trust with the alumni." },
          { title: "Move Stage", text: "Drag cards to progress through stages. Moving to 'Active Contributor' should only happen once the first payment is confirmed." },
        ],
      },
      {
        title: "5. Pipeline Stages",
        color: "amber",
        type: "bullets",
        items: [
          { title: "Eligible / Uncontacted", text: "Passed eligibility filter but no outreach made yet. First call within 48 hours." },
          { title: "Pitched", text: "Pay-Forward concept has been explained. Awaiting decision." },
          { title: "Agreed", text: "Alumni has committed to contributing. Set up payment reminder follow-up." },
          { title: "Active Contributor", text: "First payment confirmed. Maintain relationship for ongoing contributions." },
          { title: "Completed", text: "Lifetime cap reached. Mark as complete — no further pitching." },
          { title: "Declined / Dropped", text: "Alumni has said no, or is unresponsive after multiple attempts." },
        ],
      },
      {
        title: "6. Filters",
        color: "rose",
        type: "bullets",
        items: [
          { title: "Owner", text: "Your queue vs team-wide view." },
          { title: "Supporter", text: "Who sourced the lead." },
          { title: "Campus & Year", text: "Target specific batches for campaigns." },
        ],
      },
    ],
  },
  {
    id: "boards.placement",
    label: "Placement Board",
    location: "Alumni Growth › Pipelines › Placement",
    title: "Placement Support Board Guide",
    description: "A complete reference for managing the Placement pipeline.",
    sections: [
      {
        title: "1. What is the Placement Board?",
        color: "blue",
        type: "text",
        content:
          "The Placement Board tracks alumni who need career support — mock interviews, referrals, job leads, or resume help. The goal is to help every eligible alumni reach stable, quality employment. Leads are managed through stages from identification to successful placement.",
      },
      {
        title: "2. Owners vs Supporters",
        color: "emerald",
        type: "bullets",
        items: [
          { title: "Owner (POC)", text: "Responsible for coordinating career support activities with this alumni." },
          { title: "Supporter", text: "Who originally identified this alumni as needing placement support." },
        ],
      },
      {
        title: "3. Core Actions",
        color: "purple",
        type: "cards",
        items: [
          { title: "Log Interaction", text: "Log every call, mock interview, referral, or job lead shared. Use detailed notes — these help handovers and reporting." },
          { title: "Transfer Lead", text: "Transfer to a colleague if they have better connections for this alumni's target role." },
          { title: "Move Stage", text: "Update stage to reflect progress. Do not mark 'Placed' until the alumni has confirmed an offer letter." },
        ],
      },
      {
        title: "4. Pipeline Stages",
        color: "amber",
        type: "bullets",
        items: [
          { title: "Identified", text: "Needs placement support but no contact yet." },
          { title: "Assessment", text: "Skills & job readiness being evaluated." },
          { title: "Active Support", text: "Referrals, mock interviews, or applications in progress." },
          { title: "Interview Stage", text: "Alumni is currently in interview rounds." },
          { title: "Offer Received", text: "Offer extended — confirm details and ensure acceptance." },
          { title: "Placed", text: "Alumni has joined a company. Follow up after 30 days for retention check." },
          { title: "Dropped", text: "Stopped engaging or decided to pursue other options." },
        ],
      },
      {
        title: "5. Filters",
        color: "rose",
        type: "bullets",
        items: [
          { title: "Owner", text: "Filter to your personal placement queue." },
          { title: "Supporter", text: "Track who sourced each lead." },
          { title: "Campus & Year", text: "Focus on specific batches." },
        ],
      },
    ],
  },

  /* ──────────────────────── WORKSPACE ──────────────────────── */
  {
    id: "workspace",
    label: "Workspace",
    location: "Alumni Growth › Workspace",
    title: "Daily Workspace Guide",
    description: "How to use your daily prioritized work queue.",
    sections: [
      {
        title: "1. What is the Workspace?",
        color: "blue",
        type: "text",
        content:
          "The Workspace is your personal daily dashboard. It surfaces the alumni you should contact today based on pipeline ownership, overdue follow-ups, and the system's cool-down logic. Think of it as your to-do list for alumni engagement.",
      },
      {
        title: "2. KPI Cards (Top Row)",
        color: "emerald",
        type: "bullets",
        items: [
          { title: "My Active Leads", text: "Total number of alumni you currently own across all pipelines." },
          { title: "Uncontacted Leads", text: "Leads assigned to you with no interaction ever logged." },
          { title: "Follow-ups Due", text: "Scheduled callbacks and follow-ups that are due today or overdue." },
          { title: "Calls Logged Today", text: "Your interaction count for today — a quick pulse on daily productivity." },
        ],
      },
      {
        title: "3. How to Use the Queue",
        color: "purple",
        type: "cards",
        items: [
          { title: "Start with Overdue Follow-ups", text: "Any callbacks you promised but haven't completed. These alumni are waiting for you specifically." },
          { title: "Work Uncontacted Leads", text: "New leads have the highest conversion potential. Aim to contact within 48 hours of assignment." },
          { title: "Log Every Interaction", text: "Click the phone icon on a row to instantly log a call. Never finish your session without logging what happened." },
          { title: "Use Search & Sort", text: "Use the search bar and sort options to find specific alumni or prioritize by last contact date." },
        ],
      },
      {
        title: "4. Cool-down Period",
        color: "amber",
        type: "text",
        content:
          "After a 'No Answer' is logged, an alumni will temporarily disappear from the Workspace queue until the cool-down period expires (configured in Settings › Pay-Forward Rules). This prevents over-calling. They will reappear automatically when the period ends.",
      },
    ],
  },

  /* ──────────────────────── FOLLOW-UPS ──────────────────────── */
  {
    id: "follow_ups",
    label: "Follow-ups",
    location: "Alumni Growth › Follow-ups",
    title: "Follow-ups & Callbacks Guide",
    description: "How scheduled callbacks and follow-up reminders work.",
    sections: [
      {
        title: "1. What are Follow-ups?",
        color: "blue",
        type: "text",
        content:
          "When you log an interaction and select 'Callback Requested' or set a future follow-up date, a scheduled reminder is created. This page shows all pending reminders across the entire team, sorted by due date.",
      },
      {
        title: "2. Statuses",
        color: "emerald",
        type: "bullets",
        items: [
          { title: "Overdue (Red)", text: "The follow-up date has passed and it has not been marked complete. These should be actioned immediately." },
          { title: "Due Today (Amber)", text: "Scheduled for today. Plan these into your daily Workspace session." },
          { title: "Upcoming (Default)", text: "Scheduled for a future date. No immediate action needed." },
        ],
      },
      {
        title: "3. Completing a Follow-up",
        color: "purple",
        type: "text",
        content:
          "Click the green checkmark on a follow-up row to mark it as done. This will clear it from this list. You should then log a new interaction on the alumni's card to record what happened in the call.",
      },
      {
        title: "4. Best Practices",
        color: "amber",
        type: "bullets",
        items: [
          { title: "Never let overdue pile up", text: "More than 5 overdue follow-ups is a warning sign. Review this list daily." },
          { title: "Log before marking complete", text: "Always log the new interaction on the alumni's card before or after marking the follow-up done." },
          { title: "Assign realistic dates", text: "Only set follow-up dates you can realistically keep. Overdue follow-ups reduce trust with alumni." },
        ],
      },
    ],
  },

  /* ──────────────────────── REPORTS ──────────────────────── */
  {
    id: "reports",
    label: "CRM Reports",
    location: "Alumni Growth › Reports",
    title: "CRM Reports Guide",
    description: "How to build and export alumni data reports.",
    sections: [
      {
        title: "1. What is the Reports Page?",
        color: "blue",
        type: "text",
        content:
          "The Reports page lets you build a custom alumni data export and view aggregated team-activity analytics. You can select specific data fields, apply preset templates, and download to Excel for sharing with leadership or campus teams.",
      },
      {
        title: "2. Building a Report",
        color: "purple",
        type: "cards",
        items: [
          { title: "Choose a Preset", text: "Start with a preset like 'Pay-Forward Report' or 'Placement Pipeline Report' to auto-select the most relevant fields." },
          { title: "Customize Fields", text: "Check/uncheck fields from the right panel to add or remove columns from your export." },
          { title: "Download Excel", text: "Click the Download button to get a formatted .xlsx file. Data reflects the current state of alumni records." },
        ],
      },
      {
        title: "3. Team Activity Charts",
        color: "emerald",
        type: "text",
        content:
          "The Team Activity tab shows a bar chart of interactions logged by each staff member, broken down by call reason. Use this for weekly reviews to ensure everyone on the team is maintaining their outreach cadence.",
      },
      {
        title: "4. Data Freshness",
        color: "amber",
        type: "text",
        content:
          "Reports reflect real-time data directly from the database. There is no caching. Export data at the start of a meeting for the most accurate figures.",
      },
    ],
  },

  /* ──────────────────────── SETTINGS TABS ──────────────────────── */
  {
    id: "settings.pay_forward",
    label: "Settings › Pay-Forward Rules",
    location: "Alumni Growth › Settings › Pay-Forward Rules",
    title: "Pay-Forward Rules & Thresholds",
    description: "How to configure contribution caps and outreach rules.",
    sections: [
      {
        title: "Lifetime Completion Cap (₹)",
        color: "blue",
        type: "text",
        content:
          "The total cumulative amount an alumni must contribute before they are marked as 'Completed'. Default is ₹1,20,000. Once this threshold is crossed, the alumni should not be re-pitched.",
      },
      {
        title: "Minimum Pitch Salary Floor (₹/mo)",
        color: "emerald",
        type: "text",
        content:
          "Only alumni earning above this monthly salary floor are included in the workspace queue and eligible for Pay-Forward outreach. Adjust this if economic conditions or targeting criteria change.",
      },
      {
        title: "Follow-up Cool-down Period (Days)",
        color: "amber",
        type: "text",
        content:
          "After a 'No Answer' is logged, the alumni disappears from the workspace queue for this many days. This prevents over-calling and ensures alumni aren't harassed. Typical value: 7–14 days.",
      },
    ],
  },
  {
    id: "settings.active_member",
    label: "Settings › Active Member Criteria",
    location: "Alumni Growth › Settings › Active Member Criteria",
    title: "Active Member Criteria",
    description: "Rules that determine who counts as an 'Active' alumni.",
    sections: [
      {
        title: "What are Active Members?",
        color: "blue",
        type: "text",
        content:
          "Active Members are alumni who meet a minimum engagement threshold — typically having been contacted within a recent window. This status influences which alumni appear in automated queues and pipeline eligibility checks.",
      },
      {
        title: "Modifying Criteria",
        color: "amber",
        type: "text",
        content:
          "Changes to active member criteria may immediately affect the size of your engagement queues. Always inform the team before changing these values. Coordinate with the Programme Director.",
      },
    ],
  },
  {
    id: "settings.profile_scoring",
    label: "Settings › Profile Scoring",
    location: "Alumni Growth › Settings › Profile Scoring",
    title: "Profile Scoring Configuration",
    description: "How the profile completeness score is calculated.",
    sections: [
      {
        title: "What is Profile Scoring?",
        color: "blue",
        type: "text",
        content:
          "Each alumni record is assigned a completeness score (0–100%) based on how many key fields are filled in. This score appears on alumni cards and helps prioritize data collection during calls.",
      },
      {
        title: "Score Weights",
        color: "purple",
        type: "text",
        content:
          "Different fields carry different weights. For example, a missing phone number may count for more than a missing LinkedIn URL. The weights defined here directly affect every alumni's displayed score.",
      },
      {
        title: "Why it matters",
        color: "emerald",
        type: "text",
        content:
          "Higher profile completeness improves salary eligibility calculations, Pay-Forward pitching quality, and placement targeting accuracy. Encourage callers to update missing data during every call.",
      },
    ],
  },
  {
    id: "settings.pipelines",
    label: "Settings › Pipelines",
    location: "Alumni Growth › Settings › Pipelines",
    title: "Pipelines Configuration",
    description: "Manage the top-level pipeline definitions.",
    sections: [
      {
        title: "What are Pipelines?",
        color: "blue",
        type: "text",
        content:
          "Pipelines are the top-level engagement tracks (Pay-Forward, Mentoring, Placement). Each pipeline has its own set of stages, outcomes, and POC eligibility rules.",
      },
      {
        title: "Caution",
        color: "rose",
        type: "text",
        content:
          "Modifying pipeline names or codes can break references in reports and existing membership records. Only change pipeline definitions if you are absolutely certain of the downstream impact. Consult an Admin before making changes.",
      },
    ],
  },
  {
    id: "settings.pipeline_stages",
    label: "Settings › Pipeline Stages",
    location: "Alumni Growth › Settings › Pipeline Stages",
    title: "Pipeline Stages",
    description: "Manage the stages within each pipeline.",
    sections: [
      {
        title: "What are Stages?",
        color: "blue",
        type: "text",
        content:
          "Stages are the columns you see on the Kanban board. Each stage represents a point in the alumni's engagement journey within a pipeline. Stages are ordered and belong to one pipeline.",
      },
      {
        title: "Adding / Editing Stages",
        color: "purple",
        type: "bullets",
        items: [
          { title: "Order matters", text: "Stages are displayed on the board in the order defined here. Re-ordering requires updating the 'position' field." },
          { title: "Do not delete active stages", text: "Deleting a stage that has alumni cards in it will orphan those records. Archive or merge instead." },
          { title: "Labels", text: "Stage labels appear on the board columns and in all interaction logs. Keep them concise and clear." },
        ],
      },
    ],
  },
  {
    id: "settings.outcomes",
    label: "Settings › Interaction Outcomes",
    location: "Alumni Growth › Settings › Interaction Outcomes",
    title: "Interaction Outcomes",
    description: "The outcome codes available when logging an interaction.",
    sections: [
      {
        title: "What are Outcomes?",
        color: "blue",
        type: "text",
        content:
          "When you log a call or interaction, you must pick an Outcome. Outcomes represent what happened — e.g. 'Connected & Discussed', 'No Answer', 'Callback Requested'. These drive reporting and the cool-down logic.",
      },
      {
        title: "Core Outcomes (Do Not Delete)",
        color: "rose",
        type: "bullets",
        items: [
          { title: "no_answer", text: "Used to trigger the cool-down period. Critical for workspace queue logic." },
          { title: "do_not_contact", text: "Flags an alumni as permanently opt-out. Deleting this outcome would break the DNC protection." },
          { title: "discussed", text: "Standard 'connected and talked' outcome. Used heavily in reporting." },
        ],
      },
      {
        title: "Adding New Outcomes",
        color: "purple",
        type: "text",
        content:
          "New outcomes are available immediately in the Log Interaction modal. Make sure the code is lowercase with underscores. Update Outcome Mapping if legacy data needs to map to the new code.",
      },
    ],
  },
  {
    id: "settings.call_reasons",
    label: "Settings › Call Reasons",
    location: "Alumni Growth › Settings › Call Reasons",
    title: "Call Reasons",
    description: "The call reason categories shown in the Log Interaction modal.",
    sections: [
      {
        title: "What are Call Reasons?",
        color: "blue",
        type: "text",
        content:
          "Call Reasons categorize why you contacted an alumni — e.g. 'Pay-Forward Pitch', 'Career Check-in', 'Mentoring Invite'. They appear in the dropdown when logging an interaction and are used in team activity reports.",
      },
      {
        title: "Best Practices",
        color: "emerald",
        type: "bullets",
        items: [
          { title: "Keep them specific", text: "Vague reasons like 'General Call' reduce reporting value. Use specific reasons." },
          { title: "Coordinate with the team", text: "Before adding new reasons, align with the team so everyone uses the same vocabulary." },
        ],
      },
    ],
  },
  {
    id: "settings.pipeline_pocs",
    label: "Settings › Pipeline POCs",
    location: "Alumni Growth › Settings › Pipeline POCs",
    title: "Pipeline POC Eligibility",
    description: "Which staff members can be assigned as POC on each pipeline.",
    sections: [
      {
        title: "What is POC Eligibility?",
        color: "blue",
        type: "text",
        content:
          "Not all staff can own leads on all pipelines. This table defines which users are eligible to be assigned as Point of Contact (POC) on each pipeline. Only eligible users appear in the 'Transfer Lead' dropdown.",
      },
      {
        title: "How it is enforced",
        color: "purple",
        type: "text",
        content:
          "Eligibility is now automatically derived from RBAC permissions. Users with 'edit' access to a pipeline resource (e.g. crm.pipelines.mentoring) are automatically eligible. This table reflects the current state.",
      },
    ],
  },
  {
    id: "settings.contributions",
    label: "Settings › Contribution Types",
    location: "Alumni Growth › Settings › Contribution Types",
    title: "Contribution Types",
    description: "The categories of Pay-Forward contributions.",
    sections: [
      {
        title: "What are Contribution Types?",
        color: "blue",
        type: "text",
        content:
          "Contribution types classify how an alumni is paying forward — e.g. 'Monthly EMI', 'One-time Lump Sum', 'Skills Contribution'. These are selected when recording a donation.",
      },
      {
        title: "Impact on Reporting",
        color: "amber",
        type: "text",
        content:
          "Contribution type breakdown is visible in the Reports page. Ensure new types are named clearly so they can be filtered and aggregated meaningfully.",
      },
    ],
  },
  {
    id: "settings.outcome_mapping",
    label: "Settings › Outcome Mapping",
    location: "Alumni Growth › Settings › Outcome Mapping",
    title: "Legacy Outcome Mapping",
    description: "Maps old data source values to current outcome codes.",
    sections: [
      {
        title: "What is Outcome Mapping?",
        color: "blue",
        type: "text",
        content:
          "During legacy data import (from Google Sheets, old dashboards etc.), interaction statuses were recorded in non-standard text. Outcome Mapping translates those old strings to standardized outcome codes used by the current system.",
      },
      {
        title: "When to Update",
        color: "amber",
        type: "text",
        content:
          "Only update mappings when importing a new historical dataset that uses terminology not already covered. Test on a small batch before a full import.",
      },
    ],
  },
  {
    id: "settings.mentors",
    label: "Settings › Mentors Directory",
    location: "Alumni Growth › Settings › Mentors Directory",
    title: "Mentors Directory",
    description: "The shared database of registered Navgurukul mentors.",
    sections: [
      {
        title: "What is the Mentors Directory?",
        color: "blue",
        type: "text",
        content:
          "This is the shared master list of all confirmed mentors. It is the same data used by the Learning Center. Adding a mentor here makes them available for session scheduling in the Learning Center module.",
      },
      {
        title: "Data Ownership",
        color: "amber",
        type: "text",
        content:
          "The Alumni Growth team owns the sourcing and onboarding. The Learning Center team manages active session assignments. Changes made here sync instantly to the Learning Center.",
      },
    ],
  },
  {
    id: "settings.edit_log",
    label: "Settings › Edit Log",
    location: "Alumni Growth › Settings › Edit Log",
    title: "Settings Edit Log",
    description: "An audit trail of all changes made to settings.",
    sections: [
      {
        title: "What is the Edit Log?",
        color: "blue",
        type: "text",
        content:
          "Every configuration change made in Settings is recorded here with the timestamp, the user who made the change, and what was changed. This is your audit trail for accountability and rollback.",
      },
      {
        title: "Who can see it?",
        color: "purple",
        type: "text",
        content:
          "Only users with 'view' permission for crm.settings.edit_log can access this tab. If you believe a setting was changed incorrectly, review this log first, then escalate to an Admin.",
      },
    ],
  },
];

/**
 * Look up a single help entry by ID.
 */
export function getHelpEntry(id: string): HelpEntry | undefined {
  return HELP_REGISTRY.find((e) => e.id === id);
}
