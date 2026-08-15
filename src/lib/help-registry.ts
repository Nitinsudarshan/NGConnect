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
  color: string; // Tailwind color name e.g. "blue", "emerald", "purple", "amber", "rose", "sky"
  content?: React.ReactNode | string;
  type?: "text" | "bullets" | "cards" | "steps" | "diagram" | "mermaid";
  mermaid?: string;
  items?: { title?: string; text: string; badge?: string }[];
}

export interface HelpEntry {
  id: string;
  /** Human-readable label shown in Manage › Help Docs */
  label: string;
  /** The page / context where this appears */
  location: string;
  title: string;
  description: string;
  /** Whether regular member role users have access to this page/context */
  memberAccessible?: boolean;
  sections: HelpSection[];
}

export const HELP_REGISTRY: HelpEntry[] = [
  /* ──────────────────────── MAIN DASHBOARD & REPORTS ──────────────────────── */
  {
    id: "dashboard.overview",
    label: "Platform Overview",
    location: "Main Platform › Dashboard",
    title: "NGConnect Main Executive Dashboard",
    description: "Your operational command center for alumni engagement, learning progress, and platform performance.",
    memberAccessible: true,
    sections: [
      {
        title: "1. What is the Main Dashboard?",
        color: "blue",
        type: "text",
        content:
          "The Main Dashboard aggregates high-level metrics across all major modules in NGConnect: Alumni Growth pipelines, Coursera learning activity, mentoring sessions, and system throughput. Use this overview to monitor team cadence and identify priority areas.",
      },
      {
        title: "2. Key Metrics & Cards",
        color: "emerald",
        type: "bullets",
        items: [
          { title: "Total Alumni", text: "Count of all verified alumni records registered in the system." },
          { title: "Active Pipeline Leads", text: "Alumni currently undergoing active outreach across Mentoring, Pay-Forward, and Placement." },
          { title: "Learning Engagement", text: "Active Coursera learners and completed mentoring sessions over the last 30 days." },
          { title: "Pay-Forward Collections", text: "Cumulative financial contributions collected towards funding future cohorts." },
        ],
      },
      {
        title: "3. Navigation & Quick Links",
        color: "purple",
        type: "cards",
        items: [
          { title: "Alumni Growth", text: "Jump straight into your daily Workspace queue or review Kanban boards." },
          { title: "Learning Center", text: "Schedule sessions, review recordings, or check course completion rates." },
          { title: "Data Management", text: "Import new spreadsheets, review Coursera progress, or view system audit logs." },
          { title: "System Manage", text: "Manage user permissions (RBAC), user accounts, or master data options." },
        ],
      },
      {
        title: "4. Platform Operational Flowchart",
        color: "amber",
        type: "mermaid",
        content: "High-level architectural flow showing how alumni data flows through NGConnect:",
        mermaid: `graph TD
          A[Alumni Excel Ingestion] --> B[Alumni Master Record]
          B --> C{Eligibility Assessment}
          C -->|Salary Threshold Met| D[Pay-Forward Pipeline]
          C -->|Mentoring Skill Matched| E[Mentoring Pipeline]
          C -->|Career Support Needed| F[Placement Support]
          D --> G[Daily Workspace Queue]
          E --> G
          F --> G
          G --> H[Outreach & Interaction Log]
          H --> I[Analytics & Executive Reports]`,
      },
    ],
  },
  {
    id: "reports.generator",
    label: "Global Report Exporter",
    location: "Main Platform › Reports",
    title: "Global Custom Report Exporter",
    description: "Generate, filter, and export comprehensive cross-module analytical reports.",
    sections: [
      {
        title: "1. Executive Export Suite",
        color: "blue",
        type: "text",
        content:
          "The Global Report Exporter allows administrators and program leads to assemble custom data extractions combining demographic data, placement outcomes, Pay-Forward records, and Coursera learning progress into formatted Excel workbooks.",
      },
      {
        title: "2. Export Workflow Steps",
        color: "purple",
        type: "steps",
        items: [
          { title: "Select Data Scope", text: "Choose between full alumni export, pipeline-specific status reports, or learning progress summaries." },
          { title: "Apply Date & Campus Filters", text: "Narrow down records by cohort graduation year, campus location, or placement cycle." },
          { title: "Choose Output Format", text: "Export as structured CSV or multi-tab Excel workbooks (.xlsx)." },
          { title: "Download & Audit", text: "File is generated client-side and logged in System Audit Trail." },
        ],
      },
      {
        title: "3. Report Generation Process Flow",
        color: "amber",
        type: "mermaid",
        content: "Step-by-step pipeline for exporting system analytics:",
        mermaid: `graph TD
          A[Configure Filter Parameters] --> B[Fetch Supabase Database Records]
          B --> C[Format Fields & Group Datasets]
          C --> D[ExcelJS / CSV File Stream Generation]
          D --> E[Log Export Event in System Audit Log]
          E --> F[Trigger Direct Browser Download]`,
      },
      {
        title: "4. Data Safety & Privacy",
        color: "rose",
        type: "bullets",
        items: [
          { title: "Privacy Compliance", text: "Exports contain personal identifying information (PII). Handle strictly in accordance with Navgurukul data protection policies." },
          { title: "Audit Trail", text: "All export operations are logged in the System Audit Logs for security monitoring." },
        ],
      },
    ],
  },

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
        title: "5. Mentoring Process Flowchart",
        color: "emerald",
        type: "mermaid",
        content: "Lifecycle of an alumnus moving through the Mentoring pipeline:",
        mermaid: `graph TD
          A[Identified Candidate] -->|First Outreach Call| B[Contacted]
          B -->|Agrees to Mentor| C[Interested]
          C -->|Orientation & Schedule Set| D[Onboarded]
          D -->|First Session Conducted| E[Active Mentor]
          B -->|Declined / Unresponsive| F[Dropped Lead]`,
      },
      {
        title: "6. Filters & Segmentation",
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
        title: "3. Pay-Forward Lifecycle Flowchart",
        color: "emerald",
        type: "mermaid",
        content: "Detailed process flow from eligibility check to completed contributions:",
        mermaid: `graph TD
          A[Eligible Uncontacted] -->|Outreach Call| B[Pitched]
          B -->|Alumni Agrees| C[Agreed]
          C -->|First EMI Contribution Received| D[Active Contributor]
          D -->|Cumulative Paid = ₹1,20,000 Cap| E[Completed]
          B -->|No Answer / Unreachable| F[Enforce Cool-down Days]
          F -->|Cool-down Expires| A
          B -->|Explicit Rejection| G[Declined / Dropped]`,
      },
      {
        title: "4. Owners vs Supporters",
        color: "purple",
        type: "bullets",
        items: [
          { title: "Owner (POC)", text: "The staff member currently managing this lead. Responsible for pitching and collecting contributions." },
          { title: "Supporter", text: "The person who originally added the alumni to the Pay-Forward pipeline." },
        ],
      },
      {
        title: "5. Core Actions",
        color: "amber",
        type: "cards",
        items: [
          { title: "Log Interaction", text: "Always log every call or message. Select outcomes carefully — 'Discussed' means you had a full conversation, 'Callback Requested' means they asked you to call later." },
          { title: "Transfer Lead", text: "Reassign to another eligible staff member. Use sparingly — consistency of contact builds trust with the alumni." },
          { title: "Move Stage", text: "Drag cards to progress through stages. Moving to 'Active Contributor' should only happen once the first payment is confirmed." },
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
        title: "2. Placement Support Process Flowchart",
        color: "emerald",
        type: "mermaid",
        content: "Career support pipeline from candidate identification to confirmed placement:",
        mermaid: `graph TD
          A[Identified Candidate] -->|Skills & Resume Audit| B[Assessment / Resume Ready]
          B -->|Mock Interviews & Referrals| C[Active Job Outreach]
          C -->|Employer Shortlist| D[Interview Stage]
          D -->|Offer Letter Handed| E[Offer Received]
          E -->|Employment Confirmed| F[Placed Alumni]
          C -->|Not Looking / Opted Out| G[Dropped]`,
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

  /* ──────────────────────── WORKSPACE & ALUMNI GROWTH ──────────────────────── */
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
        title: "4. Daily Queue Prioritization Engine",
        color: "amber",
        type: "mermaid",
        content: "How the Workspace queue evaluates and sorts daily alumni contacts:",
        mermaid: `graph TD
          A[Raw Assigned Alumni List] --> B{Check Call Cooldown}
          B -->|Cooldown Active| C[Hidden from Workspace Queue]
          B -->|Cooldown Expired| D[Calculate Queue Priority]
          D -->|Overdue Scheduled Callback| E[Priority 1: Overdue Callbacks]
          D -->|Uncontacted Lead < 48h| F[Priority 2: New Uncontacted]
          D -->|Regular Cadence Outreach| G[Priority 3: Standard Outreach]
          E --> H[Action Call / Log Interaction]
          F --> H
          G --> H`,
      },
      {
        title: "5. Cool-down Period Governance",
        color: "rose",
        type: "text",
        content:
          "After a 'No Answer' is logged, an alumni will temporarily disappear from the Workspace queue until the cool-down period expires (configured in Settings › Pay-Forward Rules). This prevents over-calling. They will reappear automatically when the period ends.",
      },
    ],
  },
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
        title: "2. Follow-up Lifecycle Flowchart",
        color: "emerald",
        type: "mermaid",
        content: "Scheduled callback lifecycle from creation to completion:",
        mermaid: `graph TD
          A[Log Interaction & Set Next Action Date] --> B{Check Scheduled Date vs Today}
          B -->|Date in Future| C[Upcoming Reminders List]
          B -->|Date is Today| D[Due Today Alert]
          B -->|Date is Past| E[Overdue Action Required]
          D --> F[Place Callback / WhatsApp Outreach]
          E --> F
          F --> G[Mark Completed & Log New Interaction Outcome]`,
      },
      {
        title: "3. Statuses",
        color: "sky",
        type: "bullets",
        items: [
          { title: "Overdue (Red)", text: "The follow-up date has passed and it has not been marked complete. These should be actioned immediately." },
          { title: "Due Today (Amber)", text: "Scheduled for today. Plan these into your daily Workspace session." },
          { title: "Upcoming (Default)", text: "Scheduled for a future date. No immediate action needed." },
        ],
      },
      {
        title: "4. Completing a Follow-up",
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
  {
    id: "alumni.detail",
    label: "Alumni Profile Detail",
    location: "Alumni Growth › Alumni Profile",
    title: "Alumni 360° Profile Guide",
    description: "Comprehensive view of an alumni's employment, pipeline status, interaction history, and learning activity.",
    sections: [
      {
        title: "1. What is the 360° Profile?",
        color: "blue",
        type: "text",
        content:
          "The Alumni Profile view brings together every touchpoint recorded for an alumni across all pipelines (Mentoring, Pay-Forward, Placement), Coursera learning metrics, historical call logs, and contact details in a single view.",
      },
      {
        title: "2. Profile Sections",
        color: "purple",
        type: "cards",
        items: [
          { title: "Overview & Contacts", text: "Primary phone, email, current employment, city, campus, and cohort year." },
          { title: "Pipeline Statuses", text: "Current stage and owner across Mentoring, Pay-Forward, and Placement tracks." },
          { title: "Interaction Timeline", text: "Chronological log of calls, WhatsApp notes, and stage movement history." },
          { title: "Coursera & Skills", text: "Enrolled courses, total learning hours, and completion certifications." },
        ],
      },
      {
        title: "3. Action Controls",
        color: "emerald",
        type: "bullets",
        items: [
          { title: "Log Call / Interaction", text: "Add a touchpoint directly to this alumni's record with immediate outcome categorization." },
          { title: "Edit Employment & Profile Data", text: "Update salary, current company, or position details to ensure data completeness." },
          { title: "Reassign POC", text: "Transfer ownership on specific pipelines to eligible team members." },
        ],
      },
    ],
  },
  {
    id: "alumni.all_data",
    label: "All Alumni Master Grid",
    location: "Alumni Growth › All Alumni",
    title: "Master Alumni Directory & Data Table",
    description: "Filter, search, and manage all registered alumni in a unified table layout.",
    sections: [
      {
        title: "1. Unified Data Directory",
        color: "blue",
        type: "text",
        content:
          "The Master Data Grid displays all alumni records in NGConnect. It supports multi-column sorting, quick search by name or email, campus filtering, and inline profile access.",
      },
      {
        title: "2. Key Operations",
        color: "purple",
        type: "cards",
        items: [
          { title: "Global Search", text: "Filter instantly by typing any keyword (name, phone number, company, or campus)." },
          { title: "Multi-Filter Bar", text: "Segment by graduation batch, employment status, gender, or pipeline state." },
          { title: "Export Selection", text: "Download selected rows or filtered sets directly to CSV." },
        ],
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

  /* ──────────────────────── LEARNING CENTER ──────────────────────── */
  {
    id: "learning_center.dashboard",
    label: "Learning Center Overview",
    location: "Learning Center › Dashboard",
    title: "Learning Center & Mentoring Hub Guide",
    description: "Overview of student learning sessions, mentor scheduling, course materials, and recording archives.",
    memberAccessible: true,
    sections: [
      {
        title: "1. What is the Learning Center?",
        color: "blue",
        type: "text",
        content:
          "The Learning Center manages all academic and professional mentoring interactions between alumni mentors, industry experts, and Navgurukul students. It integrates session scheduling, student feedback, curriculum content, and recorded video archives.",
      },
      {
        title: "2. Key Metrics & Features",
        color: "emerald",
        type: "bullets",
        items: [
          { title: "Upcoming Sessions", text: "View live and scheduled mentoring classes for the coming week." },
          { title: "Active Mentors", text: "List of onboarded alumni and volunteers available for session assignment." },
          { title: "Course Content Hub", text: "Curriculum tracks, technical modules, and learning resources." },
          { title: "Session Recordings", text: "Searchable repository of recorded video sessions for student revision." },
        ],
      },
      {
        title: "3. Learning Center Operations Flowchart",
        color: "amber",
        type: "mermaid",
        content: "Complete workflow from mentor session creation to student learning archiving:",
        mermaid: `graph TD
          A[Schedule Mentoring Session] --> B[Assign Onboarded Mentor & Campus Target]
          B --> C[Generate Zoom / Meet Meeting Link]
          C --> D[Notify Students & Publish on Schedule]
          D --> E[Deliver Live Session]
          E --> F[Upload Recording Link & Collect Student Ratings]`,
      },
      {
        title: "4. Best Practices",
        color: "purple",
        type: "cards",
        items: [
          { title: "Schedule Ahead", text: "Create sessions at least 48 hours prior to allow student notification." },
          { title: "Collect Feedback", text: "Ensure post-session attendance and feedback forms are filled promptly." },
        ],
      },
    ],
  },
  {
    id: "learning_center.sessions",
    label: "Sessions Directory",
    location: "Learning Center › Sessions",
    title: "Mentoring & Class Sessions Directory",
    description: "Manage, filter, and schedule live or upcoming mentoring sessions.",
    sections: [
      {
        title: "1. Managing Sessions",
        color: "blue",
        type: "text",
        content:
          "The Sessions Directory provides a comprehensive list of past, live, and upcoming mentoring sessions. Filter by mentor, campus, status (Scheduled, Live, Completed, Cancelled), or course topic.",
      },
      {
        title: "2. Quick Actions",
        color: "purple",
        type: "cards",
        items: [
          { title: "Create New Session", text: "Click 'Schedule Session' to assign a mentor, pick a room link, and specify date & time." },
          { title: "View Attendance & Feedback", text: "Open session details to inspect student attendance rates and feedback ratings." },
          { title: "Upload Recording Link", text: "Attach Zoom/Google Meet recording URLs to completed sessions for archive." },
        ],
      },
    ],
  },
  {
    id: "learning_center.create_session",
    label: "Schedule Session Wizard",
    location: "Learning Center › Create Session",
    title: "Session Scheduling Wizard",
    description: "Step-by-step guide to creating and publishing a mentoring session.",
    sections: [
      {
        title: "1. Scheduling Workflow",
        color: "blue",
        type: "text",
        content:
          "Follow the step-by-step form to register a new mentoring session. Ensure mentor availability is confirmed before publishing.",
      },
      {
        title: "2. Required Fields",
        color: "amber",
        type: "bullets",
        items: [
          { title: "Session Title & Topic", text: "Be descriptive e.g. 'Advanced React State Management & Hooks'." },
          { title: "Assigned Mentor", text: "Select an onboarded mentor from the directory." },
          { title: "Target Campus / Cohort", text: "Specify which student group should attend." },
          { title: "Meeting Link", text: "Provide a valid Zoom, Google Meet, or MS Teams link." },
        ],
      },
    ],
  },
  {
    id: "learning_center.session_feedback",
    label: "Session Feedback",
    location: "Learning Center › Feedback",
    title: "Student & Mentor Feedback Review",
    description: "Analyze post-session evaluation forms and quality scores.",
    sections: [
      {
        title: "1. Feedback System",
        color: "blue",
        type: "text",
        content:
          "Post-session feedback helps monitor mentor effectiveness, session relevance, and student satisfaction. Students submit 1–5 star ratings alongside qualitative comments.",
      },
      {
        title: "2. Key Indicators",
        color: "emerald",
        type: "bullets",
        items: [
          { title: "Average Rating", text: "Overall rating out of 5 stars calculated across all submissions." },
          { title: "Punctuality & Clarity", text: "Metrics evaluating mentor presentation and time management." },
          { title: "Flagged Issues", text: "Submissions with ratings under 3 stars are flagged for team review." },
        ],
      },
    ],
  },
  {
    id: "learning_center.recordings",
    label: "Session Recordings",
    location: "Learning Center › Recordings",
    title: "Video & Audio Recordings Archive",
    description: "Browse, search, and stream recorded mentoring sessions and masterclasses.",
    memberAccessible: true,
    sections: [
      {
        title: "1. Recordings Library",
        color: "blue",
        type: "text",
        content:
          "All recorded mentoring sessions are stored and tagged by topic, course, and mentor. Students and staff can rewatch past lectures at any time.",
      },
      {
        title: "2. Search & Categories",
        color: "purple",
        type: "cards",
        items: [
          { title: "Filter by Course Track", text: "Narrow recordings by Web Development, Python, Soft Skills, or Placement Prep." },
          { title: "Mentor Search", text: "Find all lectures conducted by a specific mentor." },
          { title: "Playback Speed & Notes", text: "Stream directly with adjustable playback options and attached session notes." },
        ],
      },
    ],
  },
  {
    id: "learning_center.content_hub",
    label: "Content & Course Hub",
    location: "Learning Center › Content Hub",
    title: "Curriculum Content Hub",
    description: "Central repository of courses, learning paths, and technical modules.",
    memberAccessible: true,
    sections: [
      {
        title: "1. Course Repository",
        color: "blue",
        type: "text",
        content:
          "The Content Hub organizes Navgurukul's learning material into structured courses and modules. Manage course titles, descriptions, prerequisites, and resource links.",
      },
      {
        title: "2. Structuring Courses",
        color: "purple",
        type: "bullets",
        items: [
          { title: "Modules & Lessons", text: "Courses are subdivided into ordered modules and lesson topics." },
          { title: "Attached Resources", text: "Include GitHub links, Google Docs, slides, and code sandboxes." },
        ],
      },
    ],
  },
  {
    id: "learning_center.course_detail",
    label: "Course Detail View",
    location: "Learning Center › Course Detail",
    title: "Course Curriculum & Lesson Plan",
    description: "Detailed view of course syllabus, enrolled students, and associated sessions.",
    memberAccessible: true,
    sections: [
      {
        title: "1. Syllabus Overview",
        color: "blue",
        type: "text",
        content:
          "View the full lesson hierarchy for a specific course, including completion stats and upcoming scheduled sessions.",
      },
      {
        title: "2. Actions",
        color: "emerald",
        type: "cards",
        items: [
          { title: "Edit Curriculum", text: "Update module order, lesson titles, or linked assignments." },
          { title: "Link Mentoring Session", text: "Attach a live mentoring session directly to a lesson topic." },
        ],
      },
    ],
  },
  {
    id: "learning_center.settings",
    label: "Learning Center Settings",
    location: "Learning Center › Settings",
    title: "Learning Center & Mentor Management Settings",
    description: "Configure session categories, feedback rules, and active mentor roster.",
    sections: [
      {
        title: "1. Module Settings",
        color: "blue",
        type: "text",
        content:
          "Manage global parameters for the Learning Center, including session categories, zoom integration keys, and mentor approval status.",
      },
      {
        title: "2. Active Mentor Roster",
        color: "purple",
        type: "bullets",
        items: [
          { title: "Mentor Onboarding", text: "Approve newly added alumni mentors and assign topic expertise tags." },
          { title: "Availability Limits", text: "Set maximum weekly session caps per mentor to prevent burnout." },
        ],
      },
    ],
  },

  /* ──────────────────────── DATA MANAGEMENT ──────────────────────── */
  {
    id: "data_management.overview",
    label: "Data Management Hub",
    location: "Data Management › Hub Overview",
    title: "Data Management & Ingestion Hub",
    description: "Central command for data imports, Coursera syncing, audit trails, and data safety tools.",
    sections: [
      {
        title: "1. What is Data Management?",
        color: "blue",
        type: "text",
        content:
          "The Data Management Hub is the core ingestion and data governance center of NGConnect. It supports uploading Excel spreadsheets, monitoring Coursera learning integrations, inspecting field-level change histories, and rolling back bad batch imports.",
      },
      {
        title: "2. Data Ingestion Architecture",
        color: "emerald",
        type: "mermaid",
        content: "How external data feeds into NGConnect master database records:",
        mermaid: `graph TD
          A[Raw Alumni Excel File] --> B[Spreadsheet Import Wizard]
          C[Coursera API Data Feed] --> D[Coursera Ingestion Pipeline]
          B --> E{Primary Key Match: Email}
          D --> E
          E --> F[Atomic Database Upsert]
          F --> G[System Audit Logs & Field Edit History]
          F --> H[Batch Record Logged for Rollback]`,
      },
      {
        title: "3. Ingestion Sub-modules",
        color: "purple",
        type: "cards",
        items: [
          { title: "Alumni Excel Import", text: "Upload and map raw alumni spreadsheets into verified DB records." },
          { title: "Coursera Integration", text: "Track automated Coursera enrollment, learning hours, and course completions." },
          { title: "Audit Logs & History", text: "Track who modified what data point, when, and from what IP address." },
          { title: "Rollback Operations", text: "Revert batch imports safely without data corruption." },
        ],
      },
      {
        title: "4. Operational Rules",
        color: "rose",
        type: "bullets",
        items: [
          { title: "Primary Key Matching", text: "All imports use email address as the primary unique key." },
          { title: "Server-side Re-validation", text: "All uploads undergo strict server-side schema and type validation." },
        ],
      },
    ],
  },
  {
    id: "data_management.import",
    label: "Excel Data Import",
    location: "Data Management › Excel Import",
    title: "Alumni Data Import Wizard",
    description: "Upload Excel/CSV spreadsheets to import or update alumni records safely.",
    sections: [
      {
        title: "1. How Data Import Works",
        color: "blue",
        type: "text",
        content:
          "The Import Wizard parses .xlsx or .csv files, allows interactive column mapping to NGConnect fields, performs pre-flight validation checks, and performs upserts (update existing / insert new) into the database.",
      },
      {
        title: "2. Bulk Import Workflow Flowchart",
        color: "amber",
        type: "mermaid",
        content: "Step-by-step ingestion process for spreadsheet imports:",
        mermaid: `graph TD
          A[Select .xlsx / .csv File] --> B[Interactive Column Mapping]
          B --> C[Pre-flight Validation Run]
          C -->|Errors / Warnings Detected| D[Inspect Preview Table & Fix]
          C -->|Valid Rows Confirmed| E[Execute Atomic Database Import]
          E --> F[Generate Unique Batch Audit ID]
          F --> G[View Import Summary & History Log]`,
      },
      {
        title: "3. Step-by-Step Instructions",
        color: "purple",
        type: "cards",
        items: [
          { title: "Step 1: File Upload", text: "Select a valid .xlsx or .csv spreadsheet (max 10MB)." },
          { title: "Step 2: Column Mapping", text: "Map your spreadsheet columns to NGConnect standard fields (Email is mandatory)." },
          { title: "Step 3: Preview & Validation", text: "Inspect valid rows, warning rows, and errors before committing to database." },
          { title: "Step 4: Execute Import", text: "Click Import Data. A batch record ID will be generated for audit and rollback purposes." },
        ],
      },
      {
        title: "3. Import Rules & Safety",
        color: "rose",
        type: "bullets",
        items: [
          { title: "Primary Key", text: "Email is used to check for existing records. If email exists, record is updated." },
          { title: "Atomic Batches", text: "Every import run creates a batch log entry in Import History so it can be rolled back if needed." },
        ],
      },
    ],
  },
  {
    id: "data_management.import_history",
    label: "Import History",
    location: "Data Management › Import History",
    title: "Data Import Audit History",
    description: "Complete log of all bulk spreadsheet imports executed in NGConnect.",
    sections: [
      {
        title: "1. Ingestion Audit Trail",
        color: "blue",
        type: "text",
        content:
          "This page records every spreadsheet import attempt, including total rows processed, successful upserts, skipped rows, errors, timestamp, and performing user.",
      },
      {
        title: "2. Key Information",
        color: "emerald",
        type: "bullets",
        items: [
          { title: "Batch ID", text: "Unique tracking code assigned to every import execution." },
          { title: "Inserted vs Updated", text: "Breakdown of new alumni profiles created versus existing profiles updated." },
          { title: "Rollback Availability", text: "Batches that can be safely undone show an active 'Rollback' button." },
        ],
      },
    ],
  },
  {
    id: "data_management.coursera",
    label: "Coursera Integration Dashboard",
    location: "Data Management › Coursera Integration",
    title: "Coursera Analytics & Learning Performance Dashboard",
    description: "Monitor alumni learning progress, course completion rates, and total learning hours synced from Coursera.",
    sections: [
      {
        title: "1. Coursera Integration Overview",
        color: "blue",
        type: "text",
        content:
          "NGConnect automatically ingests Coursera learning telemetry for registered alumni. Use this dashboard to measure course engagement, skill acquisition, and platform adoption.",
      },
      {
        title: "2. Key Metrics & Views",
        color: "purple",
        type: "cards",
        items: [
          { title: "Total Enrolled Learners", text: "Active alumni with registered Coursera licenses." },
          { title: "Learning Hours Logged", text: "Cumulative video and assignment hours spent on Coursera." },
          { title: "Course Completions", text: "Verified certificate awards earned across technical tracks." },
          { title: "Learner Directory", text: "Search individual learners by email or campus location." },
        ],
      },
    ],
  },
  {
    id: "data_management.coursera_learner",
    label: "Coursera Learner Detail",
    location: "Data Management › Learner Detail",
    title: "Learner Performance & Course History",
    description: "Detailed Coursera transcript and course activity log for an individual alumni.",
    sections: [
      {
        title: "1. Individual Telemetry",
        color: "blue",
        type: "text",
        content:
          "Inspect an individual learner's complete Coursera profile — enrolled courses, module completion percentages, quiz scores, and certificate issuance dates.",
      },
      {
        title: "2. Use Cases",
        color: "emerald",
        type: "bullets",
        items: [
          { title: "Placement Readiness", text: "Verify technical skills and course completions prior to job referral." },
          { title: "Mentoring Match", text: "Identify high-performing learners who can become peer mentors." },
        ],
      },
    ],
  },
  {
    id: "data_management.coursera_logs",
    label: "Coursera Activity Logs",
    location: "Data Management › Coursera Logs",
    title: "Coursera Data Synchronization Logs",
    description: "Audit trail of API sync runs, CSV ingestions, and Coursera webhook payloads.",
    sections: [
      {
        title: "1. Sync Technical Audit",
        color: "blue",
        type: "text",
        content:
          "Logs every automated Coursera data sync event, API status, imported records count, and processing errors.",
      },
      {
        title: "2. Troubleshooting",
        color: "amber",
        type: "bullets",
        items: [
          { title: "Failed Syncs", text: "Rows marked red indicate network timeouts or missing alumni email matches." },
          { title: "Manual Sync Trigger", text: "Admins can trigger an immediate re-sync if data appears stale." },
        ],
      },
    ],
  },
  {
    id: "data_management.audit_logs",
    label: "System Security Audit Logs",
    location: "Data Management › Audit Logs",
    title: "Security & Operations Audit Trail",
    description: "System-wide log tracking user logins, permission changes, exports, and sensitive data updates.",
    sections: [
      {
        title: "1. Security Monitoring",
        color: "blue",
        type: "text",
        content:
          "The Audit Log records all security-sensitive actions across NGConnect to guarantee accountability, security compliance, and forensic traceability.",
      },
      {
        title: "2. Logged Events",
        color: "purple",
        type: "cards",
        items: [
          { title: "Authentication", text: "User logins, password resets, and session terminations." },
          { title: "RBAC & Role Edits", text: "Changes to user roles, pipeline access, or admin privileges." },
          { title: "Data Exports", text: "Who exported alumni CSV/Excel workbooks and when." },
          { title: "Bulk Updates", text: "Mass lead transfers, stage updates, or spreadsheet imports." },
        ],
      },
    ],
  },
  {
    id: "data_management.record_history",
    label: "Field-Level Record History",
    location: "Data Management › Record History",
    title: "Field-Level Change History",
    description: "Inspect line-by-line field modifications made to any alumni record over time.",
    sections: [
      {
        title: "1. Granular Field Auditing",
        color: "blue",
        type: "text",
        content:
          "Every field update (e.g. salary change from ₹30,000 to ₹45,000) stores the old value, new value, timestamp, and user ID responsible.",
      },
      {
        title: "2. Searching History",
        color: "emerald",
        type: "bullets",
        items: [
          { title: "Search by Email", text: "Filter change logs for a specific alumni record." },
          { title: "Search by Field Name", text: "Track changes specifically to salary, stage, or owner fields." },
        ],
      },
    ],
  },
  {
    id: "data_management.rollback",
    label: "Import Rollback & Undo",
    location: "Data Management › Rollback",
    title: "Import Batch Rollback Tool",
    description: "Revert accidental or corrupt spreadsheet imports without damaging surrounding data.",
    sections: [
      {
        title: "1. Batch Rollback System",
        color: "blue",
        type: "text",
        content:
          "If a faulty Excel file was imported, the Rollback tool restores affected alumni records to their state prior to the import batch.",
      },
      {
        title: "2. Batch Rollback Process Flowchart",
        color: "emerald",
        type: "mermaid",
        content: "Safely reversing a bulk spreadsheet import:",
        mermaid: `graph TD
          A[Select Import Batch ID] --> B[Retrieve Pre-import Record Snapshots]
          B --> C[Admin Safety Confirmation Dialog]
          C --> D[Execute Atomic DB Restore]
          D --> E[Restore Original Alumni Field Values]
          E --> F[Log Rollback Event in System Audit Logs]`,
      },
      {
        title: "3. Safety Warnings",
        color: "rose",
        type: "bullets",
        items: [
          { title: "Irreversible", text: "Rollback operations immediately alter active DB records. Execute with extreme caution." },
          { title: "Admin Only", text: "Only users with Super Admin permissions can execute a batch rollback." },
        ],
      },
    ],
  },

  /* ──────────────────────── SYSTEM ADMINISTRATION / MANAGE ──────────────────────── */
  {
    id: "manage.users",
    label: "User Accounts Management",
    location: "System Admin › User Management",
    title: "User Accounts & Staff Administration",
    description: "Create, invite, edit, and deactivate staff user accounts in NGConnect.",
    sections: [
      {
        title: "1. User Account Control",
        color: "blue",
        type: "text",
        content:
          "Manage staff credentials, assigned roles, campus scopes, and active status. Only authorized administrators can add or deactivate user accounts.",
      },
      {
        title: "2. Account Management Actions",
        color: "purple",
        type: "cards",
        items: [
          { title: "Invite New Staff", text: "Send an email invitation link to join the platform with pre-assigned permissions." },
          { title: "Assign Roles", text: "Select RBAC roles (e.g. Admin, Pipeline Manager, Caller, Read Only)." },
          { title: "Deactivate User", text: "Safely disable accounts for departed staff while preserving their interaction history." },
        ],
      },
    ],
  },
  {
    id: "manage.rbac",
    label: "RBAC Permissions Grid",
    location: "System Admin › RBAC Permissions",
    title: "Role-Based Access Control (RBAC) Matrix",
    description: "Configure granular read, edit, delete, and admin permissions across all platform resources.",
    sections: [
      {
        title: "1. RBAC Architecture",
        color: "blue",
        type: "text",
        content:
          "NGConnect utilizes a strict RBAC architecture governing resource-level access (e.g. crm.pipelines.mentoring, crm.settings.edit_log, learning.sessions). Roles define exact permissions for every screen and button.",
      },
      {
        title: "2. RBAC Permission Resolution Flowchart",
        color: "amber",
        type: "mermaid",
        content: "How permissions are evaluated when a user interacts with the app:",
        mermaid: `graph TD
          A[User Navigates or Clicks Action] --> B[Fetch User Role: Super Admin / Admin / Manager / Member]
          B --> C[Lookup Resource Permission Matrix]
          C -->|Has Capability Permission| D[Grant Access / Render Action Control]
          C -->|Permission Missing| E[Deny Access / Hide Trigger Button]`,
      },
      {
        title: "3. Modifying Permissions",
        color: "purple",
        type: "bullets",
        items: [
          { title: "Permission Matrix", text: "Check or uncheck permission cells per role to grant or restrict capabilities." },
          { title: "Immediate Effect", text: "Permission changes apply immediately upon saving across active user sessions." },
          { title: "Audit Trail", text: "All RBAC changes are logged in the System Audit Logs." },
        ],
      },
    ],
  },
  {
    id: "manage.master_data",
    label: "Master Data Management",
    location: "System Admin › Master Data",
    title: "Master Data & Dropdown Taxonomies",
    description: "Manage standard drop-down options: Campuses, Courses, Companies, Cities, and Tech Stacks.",
    sections: [
      {
        title: "1. Taxonomy Management",
        color: "blue",
        type: "text",
        content:
          "Master Data controls the dropdown options used throughout NGConnect for alumni profiles, spreadsheet imports, and filter bars. Standardizing these values prevents data fragmentation.",
      },
      {
        title: "2. Supported Taxonomies",
        color: "emerald",
        type: "bullets",
        items: [
          { title: "Campuses", text: "Official Navgurukul campus names (e.g. Dharamshala, Pune, Bengaluru, Amdavad)." },
          { title: "Courses / Schools", text: "Academic tracks e.g. School of Programming, School of Finance." },
          { title: "Technology Stacks", text: "Tech skill categories e.g. React, Node.js, Data Analytics, Python." },
          { title: "Placement Companies", text: "Verified employer hiring partners." },
        ],
      },
    ],
  },
  {
    id: "manage.alumni_network",
    label: "Alumni Network Analytics",
    location: "System Admin › Alumni Network",
    title: "Alumni Network Demographics & Insights",
    description: "Macro-level analytics on alumni geographic distribution, gender ratios, salary progression, and employment rates.",
    sections: [
      {
        title: "1. Demographics & Impact Insights",
        color: "blue",
        type: "text",
        content:
          "Provides executive leadership with macro-level visualizations detailing the health, growth, and socioeconomic mobility of the alumni network.",
      },
      {
        title: "2. Key Charts & Indicators",
        color: "purple",
        type: "cards",
        items: [
          { title: "Geographic Spread", text: "Heatmap of alumni work locations across cities and states." },
          { title: "Salary Distribution", text: "Banded breakdown of monthly earning levels across graduation cohorts." },
          { title: "Employment Rate", text: "Percentage of alumni currently employed in relevant technical roles." },
        ],
      },
    ],
  },
  {
    id: "manage.help",
    label: "Help & Documentation Control",
    location: "System Admin › Help Management",
    title: "Help & Tooltip Control Center",
    description: "Enable or disable [i] information tooltips and manage global help entries.",
    sections: [
      {
        title: "1. Central Help Governance",
        color: "blue",
        type: "text",
        content:
          "This admin page lists all registered help modals across NGConnect. Admins can toggle individual tooltips on or off to customize the interface for users.",
      },
      {
        title: "2. Controls",
        color: "emerald",
        type: "bullets",
        items: [
          { title: "Visibility Switch", text: "Toggle off a tooltip to hide its [i] button on the target page immediately." },
          { title: "Enable All", text: "Reset all tooltips to visible with a single click." },
        ],
      },
    ],
  },
  {
    id: "greetings",
    label: "Greetings & Announcements",
    location: "Main Platform › Greetings",
    title: "Special Greetings & Broadcast Announcements",
    description: "Manage broadcast festival greetings, birthday messages, and network announcements.",
    sections: [
      {
        title: "1. Broadcast Messaging",
        color: "blue",
        type: "text",
        content:
          "Send scheduled or automated broadcast messages (WhatsApp / Email) to alumni for festivals, work anniversaries, and community milestones.",
      },
      {
        title: "2. Features",
        color: "purple",
        type: "cards",
        items: [
          { title: "Templates", text: "Pre-approved templates with dynamic merge tags (e.g. {{name}}, {{campus}})." },
          { title: "Schedule Date", text: "Set dispatch date and time for campaign execution." },
        ],
      },
    ],
  },
  {
    id: "profile",
    label: "User Preferences & Profile",
    location: "Main Platform › Profile",
    title: "Staff Account & Profile Settings",
    description: "Manage your account password, notification preferences, and display settings.",
    sections: [
      {
        title: "1. Personal Account Control",
        color: "blue",
        type: "text",
        content:
          "Update your personal profile details, notification preferences, dark/light theme options, and security settings.",
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

/**
 * Map a route pathname and optional searchParams to a corresponding HelpEntry ID.
 */
export function getHelpIdForRoute(
  pathname: string,
  searchParams?: { get: (key: string) => string | null } | null
): string | undefined {
  if (!pathname) return undefined;

  // Clean trailing slashes except root
  const cleanPath =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  // Exact & Prefix Mappings
  if (cleanPath === "/" || cleanPath === "/dashboard") return "dashboard.overview";
  if (cleanPath === "/reports") return "reports.generator";
  if (cleanPath === "/profile") return "profile";
  if (cleanPath === "/greetings") return "greetings";

  // Manage Cluster
  if (cleanPath === "/manage/help") return "manage.help";
  if (cleanPath === "/manage/users") return "manage.users";
  if (cleanPath === "/manage/rbac") return "manage.rbac";
  if (cleanPath === "/manage/master-data") return "manage.master_data";
  if (cleanPath === "/manage/alumni-network") return "manage.alumni_network";

  // Learning Center Cluster
  if (cleanPath === "/learning-center" || cleanPath === "/learning-center/dashboard") return "learning_center.dashboard";
  if (cleanPath === "/learning-center/sessions/create") return "learning_center.create_session";
  if (cleanPath === "/learning-center/sessions") return "learning_center.sessions";
  if (cleanPath === "/learning-center/recordings") return "learning_center.recordings";
  if (cleanPath === "/learning-center/settings") return "learning_center.settings";
  if (cleanPath === "/learning-center/content-hub") return "learning_center.content_hub";
  if (cleanPath.startsWith("/learning-center/content-hub/courses/")) return "learning_center.course_detail";

  // Data Management Cluster
  if (cleanPath === "/data-management") return "data_management.overview";
  if (cleanPath === "/data-management/import") return "data_management.import";
  if (cleanPath === "/data-management/import-history") return "data_management.import_history";
  if (cleanPath === "/data-management/record-history") return "data_management.record_history";
  if (cleanPath === "/data-management/rollback") return "data_management.rollback";
  if (cleanPath === "/data-management/audit-logs") return "data_management.audit_logs";
  if (cleanPath === "/data-management/coursera/activity-logs") return "data_management.coursera_logs";
  if (cleanPath.startsWith("/data-management/coursera/learner/")) return "data_management.coursera_learner";
  if (cleanPath === "/data-management/coursera") return "data_management.coursera";

  // Alumni Growth Cluster
  if (cleanPath === "/alumni-growth/workspace") return "workspace";
  if (cleanPath === "/alumni-growth/follow-ups") return "follow_ups";
  if (cleanPath === "/alumni-growth/reports") return "reports";
  if (cleanPath === "/alumni-growth/pipelines/placement") return "boards.placement";
  if (cleanPath === "/alumni-growth/pipelines/pay-forward") return "boards.pay_forward";
  if (cleanPath === "/alumni-growth/pipelines/mentoring") return "boards.mentoring";

  if (cleanPath === "/alumni-growth/settings") {
    const tab = searchParams?.get("tab") || "pay_forward";
    const tabMap: Record<string, string> = {
      pay_forward: "settings.pay_forward",
      active_member: "settings.active_member",
      profile_scoring: "settings.profile_scoring",
      pipelines: "settings.pipelines",
      pipeline_stages: "settings.pipeline_stages",
      outcomes: "settings.outcomes",
      call_reasons: "settings.call_reasons",
      pipeline_pocs: "settings.pipeline_pocs",
      contributions: "settings.contributions",
      outcome_mapping: "settings.outcome_mapping",
      mentors: "settings.mentors",
      edit_log: "settings.edit_log",
    };
    return tabMap[tab] || "settings.pay_forward";
  }

  if (cleanPath.startsWith("/alumni-growth/alumni/") && cleanPath !== "/alumni-growth/alumni") {
    return "alumni.detail";
  }
  if (cleanPath === "/alumni-growth/alumni") return "alumni.all_data";

  return undefined;
}

