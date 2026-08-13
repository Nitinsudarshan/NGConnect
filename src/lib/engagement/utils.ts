import { OrgSettings } from "@/types/engagement";

export function formatINR(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '—';
  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-IN').format(num);
}

export function calculateProfileScore(
  alumnus: {
    name?: string | null;
    email?: string | null;
    phone_number?: string | null;
    gender?: string | null;
    campus?: string | null;
    course?: string | null;
    entry_year?: string | number | null;
    city?: string | null;
    state?: string | null;
    company?: string | null;
    current_company?: string | null;
    starting_salary?: number | null;
    has_salary_records?: boolean;
    linkedin_url?: string | null;
    linkedin_profile?: string | null;
    technology_stack?: string | null;
  },
  settings?: OrgSettings
): {
  score: number;
  stage: 'RED' | 'AMBER' | 'GREEN';
  badgeColor: string;
  missingFields: string[];
} {
  const wName = settings?.weight_name ?? 10;
  const wEmail = settings?.weight_email ?? 10;
  const wPhone = settings?.weight_phone ?? 10;
  const wGender = settings?.weight_gender ?? 5;
  const wCampus = settings?.weight_campus ?? 5;
  const wCourse = settings?.weight_course ?? 5;
  const wEntryYear = settings?.weight_entry_year ?? 5;
  const wLocation = settings?.weight_location ?? 10;
  const wCompany = settings?.weight_company ?? 15;
  const wSalary = settings?.weight_salary ?? 15;
  const wLinkedin = settings?.weight_linkedin ?? 5;
  const wTechStack = settings?.weight_tech_stack ?? 5;

  const redThreshold = settings?.profile_score_red_threshold ?? 50;
  const greenThreshold = settings?.profile_score_green_threshold ?? 100;

  const hasName = Boolean(alumnus.name);
  const hasEmail = Boolean(alumnus.email);
  const hasPhone = Boolean(alumnus.phone_number);
  const hasGender = Boolean(alumnus.gender);
  const hasCampus = Boolean(alumnus.campus);
  const hasCourse = Boolean(alumnus.course);
  const hasEntryYear = Boolean(alumnus.entry_year);
  const hasLocation = Boolean(alumnus.city || alumnus.state);
  const hasCompany = Boolean(alumnus.company || alumnus.current_company);
  const hasSalary = Boolean(alumnus.starting_salary || alumnus.has_salary_records);
  const hasLinkedin = Boolean(alumnus.linkedin_url || alumnus.linkedin_profile);
  const hasTechStack = Boolean(alumnus.technology_stack);

  let earned = 0;
  const missingFields: string[] = [];

  if (hasName) earned += wName; else missingFields.push('Full Name');
  if (hasEmail) earned += wEmail; else missingFields.push('Email');
  if (hasPhone) earned += wPhone; else missingFields.push('Phone Number');
  if (hasGender) earned += wGender; else missingFields.push('Gender');
  if (hasCampus) earned += wCampus; else missingFields.push('Campus');
  if (hasCourse) earned += wCourse; else missingFields.push('Course');
  if (hasEntryYear) earned += wEntryYear; else missingFields.push('Entry Cohort');
  if (hasLocation) earned += wLocation; else missingFields.push('Location');
  if (hasCompany) earned += wCompany; else missingFields.push('Company');
  if (hasSalary) earned += wSalary; else missingFields.push('Salary');
  if (hasLinkedin) earned += wLinkedin; else missingFields.push('LinkedIn Profile');
  if (hasTechStack) earned += wTechStack; else missingFields.push('Tech Stack');

  const totalPossible = wName + wEmail + wPhone + wGender + wCampus + wCourse + wEntryYear + wLocation + wCompany + wSalary + wLinkedin + wTechStack;
  const score = totalPossible > 0 ? Math.round((earned / totalPossible) * 100) : 0;

  let stage: 'RED' | 'AMBER' | 'GREEN' = 'GREEN';
  let badgeColor = 'bg-emerald-500 text-white';

  if (score < redThreshold) {
    stage = 'RED';
    badgeColor = 'bg-destructive text-destructive-foreground';
  } else if (score < greenThreshold) {
    stage = 'AMBER';
    badgeColor = 'bg-amber-500 text-white';
  }

  return { score, stage, badgeColor, missingFields };
}

export function getStageBadgeVariant(count: number, stageCode: string): "default" | "secondary" | "destructive" | "success" | "warning" | "danger" | "outline" {
  if (count === 0) return "secondary";

  const positive = [
    'committed_not_started', 'paying_monthly', 'completed', 'completed_continuing', // Pay Forward
    'matched_with_mentor', 'in_session', // Mentoring
    'interviewing', 'placed' // Placement
  ];
  const warning = [
    'paying_irregular', 'paused_expected_return' // Pay Forward
  ];
  const danger = [
    'not_eligible', 'not_paying_no_plan', 'unreachable', 'declined_opted_out', // Pay Forward
    'closed', // Mentoring
    'not_placed_closed' // Placement
  ];

  if (positive.includes(stageCode)) return "success";
  if (warning.includes(stageCode)) return "warning";
  if (danger.includes(stageCode)) return "danger";
  
  return "default";
}
