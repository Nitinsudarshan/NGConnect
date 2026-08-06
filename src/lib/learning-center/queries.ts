"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export interface Mentor {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  role: string | null;
  status: string;
  expertise: string[];
  rating: number;
  total_sessions: number;
  contact_number: string | null;
  linkedin_url: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

export interface LearningCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  subcategories?: LearningSubcategory[];
}

export interface LearningSubcategory {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface LearningSession {
  id: string;
  mentor_id: string | null;
  topic: string;
  description: string | null;
  date: string;
  start_time: string | null;
  duration_minutes: number;
  mode: string;
  platform: string | null;
  meeting_link: string | null;
  recording_url: string | null;     // mp4 or Google Drive video link
  transcript_url: string | null;    // .vtt subtitle/transcript link
  chat_url: string | null;          // .txt chat log link
  audience_id: string | null;
  session_type_id: string | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  mentors?: { name: string } | null;
  learning_audiences?: { name: string } | null;
  learning_categories?: { name: string } | null;
  learning_subcategories?: { name: string } | null;
}

export interface LearningAudience {
  id: string;
  name: string;
  audience_type: string;
  campus_id: string | null;
  course_id: string | null;
  batch_year: number | null;
  created_at: string;
}

export interface LearningSessionType {
  id: string;
  name: string;
  created_at: string;
}

export interface LearningCenterAuditLog {
  id: string;
  entity_type: "mentor" | "audience" | "session_type" | "integration" | "category" | "subcategory";
  entity_id: string | null;
  action: "create" | "update" | "delete" | "archive" | "connect" | "disconnect";
  details: string;
  user_id: string | null;
  user_email: string | null;
  created_at: string;
}

export async function getMentors() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mentors')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error("Error fetching mentors:", error)
    return []
  }
  return data as Mentor[]
}

export async function getMentorById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mentors')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error("Error fetching mentor:", error)
    return null
  }
  return data as Mentor
}

async function enrichSessionsWithCategoryNames(sessions: any[]): Promise<LearningSession[]> {
  if (!sessions || sessions.length === 0) return []

  const categories = await getCategories()
  const catMap = new Map<string, string>()
  const subMap = new Map<string, string>()

  for (const cat of categories) {
    catMap.set(cat.id, cat.name)
    for (const sub of (cat.subcategories || [])) {
      subMap.set(sub.id, sub.name)
    }
  }

  return sessions.map(s => {
    const catName = s.learning_categories?.name || (s.category_id ? catMap.get(s.category_id) : null)
    const subName = s.learning_subcategories?.name || (s.subcategory_id ? subMap.get(s.subcategory_id) : null)
    return {
      ...s,
      learning_categories: catName ? { name: catName } : s.learning_categories || null,
      learning_subcategories: subName ? { name: subName } : s.learning_subcategories || null,
    }
  }) as LearningSession[]
}

export async function getMentorSessions(mentorId: string) {
  const supabase = await createClient()
  let { data, error } = await supabase
    .from('learning_sessions')
    .select(`
      *,
      learning_audiences (name),
      learning_categories (name),
      learning_subcategories (name)
    `)
    .eq('mentor_id', mentorId)
    .order('date', { ascending: false })

  if (error || !data || data.length === 0) {
    try {
      const admin = createAdminClient()
      const { data: adminData } = await admin
        .from('learning_sessions')
        .select(`
          *,
          learning_audiences (name),
          learning_categories (name),
          learning_subcategories (name)
        `)
        .eq('mentor_id', mentorId)
        .order('date', { ascending: false })
      if (adminData) data = adminData
    } catch (e) {
      console.error("Admin fallback error in getMentorSessions:", e)
    }
  }

  return await enrichSessionsWithCategoryNames(data || [])
}

export async function getSessions() {
  const supabase = await createClient()
  let { data, error } = await supabase
    .from('learning_sessions')
    .select(`
      *,
      mentors (name),
      learning_audiences (name),
      learning_categories (name),
      learning_subcategories (name)
    `)
    .order('date', { ascending: false })

  if (error || !data || data.length === 0) {
    try {
      const admin = createAdminClient()
      const { data: adminData } = await admin
        .from('learning_sessions')
        .select(`
          *,
          mentors (name),
          learning_audiences (name),
          learning_categories (name),
          learning_subcategories (name)
        `)
        .order('date', { ascending: false })
      if (adminData) data = adminData
    } catch (e) {
      console.error("Admin fallback error in getSessions:", e)
    }
  }

  return await enrichSessionsWithCategoryNames(data || [])
}

export async function getPastSessions() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  let { data, error } = await supabase
    .from('learning_sessions')
    .select(`
      *,
      mentors (name),
      learning_audiences (name),
      learning_categories (name),
      learning_subcategories (name)
    `)
    .not('recording_url', 'is', null)
    .neq('recording_url', '')
    .lte('date', now)
    .order('date', { ascending: false })

  if (error || !data || data.length === 0) {
    try {
      const admin = createAdminClient()
      const { data: adminData } = await admin
        .from('learning_sessions')
        .select(`
          *,
          mentors (name),
          learning_audiences (name),
          learning_categories (name),
          learning_subcategories (name)
        `)
        .not('recording_url', 'is', null)
        .neq('recording_url', '')
        .lte('date', now)
        .order('date', { ascending: false })
      if (adminData) data = adminData
    } catch (e) {
      console.error("Admin fallback error in getPastSessions:", e)
    }
  }

  return await enrichSessionsWithCategoryNames(data || [])
}

export async function getUpcomingSessions() {
  const supabase = await createClient()
  // Get current date in YYYY-MM-DD format
  const todayDate = new Date().toISOString().split('T')[0]
  
  let { data } = await supabase
    .from('learning_sessions')
    .select(`
      *,
      mentors (name),
      learning_audiences (name),
      learning_categories (name),
      learning_subcategories (name)
    `)
    .gte('date', todayDate)
    .order('date', { ascending: true })

  if (!data || data.length === 0) {
    try {
      const admin = createAdminClient()
      const { data: adminData } = await admin
        .from('learning_sessions')
        .select(`
          *,
          mentors (name),
          learning_audiences (name),
          learning_categories (name),
          learning_subcategories (name)
        `)
        .gte('date', todayDate)
        .order('date', { ascending: true })
      if (adminData) data = adminData
    } catch (e) {
      console.error("Admin fallback error in getUpcomingSessions:", e)
    }
  }

  return await enrichSessionsWithCategoryNames(data || [])
}

export async function getAudiences() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('learning_audiences')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error("Error fetching audiences:", error)
    return []
  }
  return data as LearningAudience[]
}

export async function getSessionTypes() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('learning_session_types')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error("Error fetching session types:", error)
    return []
  }
  return data as LearningSessionType[]
}

export async function getLearningCenterAuditLogs() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('learning_center_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching learning center audit logs:", error)
    return []
  }
  return data as LearningCenterAuditLog[]
}

export interface UserWatchStats {
  total_watched_seconds: number;
  total_hours_formatted: string;
  completed_sessions_count: number;
  active_members_count?: number;
}

export interface ContinueWatchingItem {
  id: string;
  video_source_id: string;
  video_source_type: string;
  watched_seconds: number;
  percent_watched: number;
  updated_at: string;
  session?: LearningSession;
}

export async function getUserWatchStats(userId: string): Promise<UserWatchStats> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('watch_progress')
    .select('watched_seconds, completed_at')
    .eq('user_id', userId)

  if (error || !data) {
    return {
      total_watched_seconds: 0,
      total_hours_formatted: "0 mins",
      completed_sessions_count: 0
    }
  }

  const totalSeconds = data.reduce((acc, curr) => acc + (curr.watched_seconds || 0), 0)
  const completedCount = data.filter(d => d.completed_at !== null).length

  // Format: "2 hrs 15 mins" or "45 mins" or "30 secs"
  let total_hours_formatted: string
  if (totalSeconds >= 3600) {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    total_hours_formatted = m > 0 ? `${h} hr ${m} min` : `${h} hr`
  } else if (totalSeconds >= 60) {
    total_hours_formatted = `${Math.floor(totalSeconds / 60)} min`
  } else {
    total_hours_formatted = `${totalSeconds} sec`
  }

  return {
    total_watched_seconds: totalSeconds,
    total_hours_formatted,
    completed_sessions_count: completedCount
  }
}

export async function getAllUsersWatchStats(): Promise<UserWatchStats> {
  const supabase = await createClient()
  let { data, error } = await supabase
    .from('watch_progress')
    .select('user_id, watched_seconds, completed_at')

  if (error || !data || data.length === 0) {
    try {
      const admin = createAdminClient()
      const { data: adminData } = await admin
        .from('watch_progress')
        .select('user_id, watched_seconds, completed_at')
      if (adminData) data = adminData
    } catch (e) {
      console.error("Admin fallback error in getAllUsersWatchStats:", e)
    }
  }

  let activeMembersCount = 0
  if (data && data.length > 0) {
    const uniqueUsers = new Set(data.map(d => d.user_id).filter(Boolean))
    activeMembersCount = uniqueUsers.size
  }

  if (activeMembersCount === 0) {
    try {
      const admin = createAdminClient()
      const { count } = await admin.from('coursera_snapshots').select('email', { count: 'exact', head: true })
      if (count && count > 0) activeMembersCount = count
    } catch (e) {
      // Ignore
    }
  }

  if (!data) {
    return {
      total_watched_seconds: 0,
      total_hours_formatted: "0 mins",
      completed_sessions_count: 0,
      active_members_count: activeMembersCount
    }
  }

  const totalSeconds = data.reduce((acc, curr) => acc + (curr.watched_seconds || 0), 0)
  const completedCount = data.filter(d => d.completed_at !== null).length

  let total_hours_formatted: string
  if (totalSeconds >= 3600) {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    total_hours_formatted = m > 0 ? `${h} hr ${m} min` : `${h} hr`
  } else if (totalSeconds >= 60) {
    total_hours_formatted = `${Math.floor(totalSeconds / 60)} min`
  } else {
    total_hours_formatted = `${totalSeconds} sec`
  }

  return {
    total_watched_seconds: totalSeconds,
    total_hours_formatted,
    completed_sessions_count: completedCount,
    active_members_count: activeMembersCount
  }
}

export async function getContinueWatchingSessions(userId: string): Promise<ContinueWatchingItem[]> {
  const supabase = await createClient()

  // Filter: has progress (watched_seconds > 5) AND not yet completed
  const { data, error } = await supabase
    .from('watch_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('video_source_type', 'session_recording')
    .gt('watched_seconds', 5)
    .is('completed_at', null)
    .order('updated_at', { ascending: false })
    .limit(12)

  if (error || !data) return []

  const sessionIds = data.map(d => d.video_source_id)
  if (sessionIds.length === 0) return []

  const { data: sessionData } = await supabase
    .from('learning_sessions')
    .select('*, mentors(name), learning_audiences(name), learning_categories(name), learning_subcategories(name)')
    .in('id', sessionIds)

  const sessionMap = new Map((sessionData || []).map(s => [s.id, s]))

  return data.map(d => {
    const session = sessionMap.get(d.video_source_id)
    let percentWatched = d.percent_watched || 0
    if (percentWatched === 0 && d.watched_seconds > 0 && session) {
      const durationSecs = (session.duration_minutes && session.duration_minutes > 0)
        ? session.duration_minutes * 60
        : 3600
      percentWatched = Math.min(Math.max(Math.round((d.watched_seconds / durationSecs) * 100), 1), 99)
    }
    return {
      ...d,
      percent_watched: percentWatched,
      session
    }
  })
}

export async function getCategories(): Promise<LearningCategory[]> {
  const supabase = await createClient()
  let { data: categories, error: catError } = await supabase
    .from('learning_categories')
    .select('*')
    .order('name', { ascending: true })

  if (catError || !categories || categories.length === 0) {
    if (catError) console.error("Standard client catError:", catError.message)
    try {
      const admin = createAdminClient()
      const { data: adminCats, error: adminCatErr } = await admin
        .from('learning_categories')
        .select('*')
        .order('name', { ascending: true })
      if (!adminCatErr && adminCats && adminCats.length > 0) {
        categories = adminCats
      }
    } catch (err) {
      console.error("Admin client fallback for categories failed:", err)
    }
  }

  if (!categories || categories.length === 0) {
    return []
  }

  let { data: subcategories, error: subError } = await supabase
    .from('learning_subcategories')
    .select('*')
    .order('name', { ascending: true })

  if (subError || !subcategories || subcategories.length === 0) {
    if (subError) console.error("Standard client subError:", subError.message)
    try {
      const admin = createAdminClient()
      const { data: adminSubs, error: adminSubErr } = await admin
        .from('learning_subcategories')
        .select('*')
        .order('name', { ascending: true })
      if (!adminSubErr && adminSubs) {
        subcategories = adminSubs
      }
    } catch (err) {
      console.error("Admin client fallback for subcategories failed:", err)
    }
  }

  const subMap = new Map<string, LearningSubcategory[]>()
  for (const sub of (subcategories || [])) {
    const list = subMap.get(sub.category_id) || []
    list.push(sub as LearningSubcategory)
    subMap.set(sub.category_id, list)
  }

  return categories.map(cat => ({
    ...cat,
    subcategories: subMap.get(cat.id) || []
  })) as LearningCategory[]
}

export async function getCategorySessionCount(categoryId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('learning_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId)

  if (error) {
    console.error("Error fetching category session count:", error)
    return 0
  }
  return count || 0
}

export async function getSubcategorySessionCount(subcategoryId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('learning_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('subcategory_id', subcategoryId)

  if (error) {
    console.error("Error fetching subcategory session count:", error)
    return 0
  }
  return count || 0
}

export interface UserCourseraData {
  found_in_db: boolean;
  has_active_subscription: boolean;
  show_contact_banner: boolean;
  total_learning_hours: number;
  total_hours_formatted: string;
  hours_last_month: number;
  hours_last_month_formatted: string;
  completed_courses_count: number;
  enrolled_courses_count: number;
  program_name?: string;
}

export async function checkCourseraApiUserActive(email: string): Promise<boolean> {
  if (!email) return false
  const lowerEmail = email.toLowerCase()

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('coursera_activity')
      .select('id')
      .ilike('email', lowerEmail)
      .limit(1)

    if (data && data.length > 0) return true
  } catch (e) {
    // Table may not exist or RLS blocks it — treat as not found
  }

  return false
}

export async function getUserCourseraData(email: string): Promise<UserCourseraData> {
  if (!email) {
    return {
      found_in_db: false,
      has_active_subscription: false,
      show_contact_banner: true,
      total_learning_hours: 0,
      total_hours_formatted: "0 hrs",
      hours_last_month: 0,
      hours_last_month_formatted: "0 hrs",
      completed_courses_count: 0,
      enrolled_courses_count: 0
    }
  }

  // DEV TEST: Simulate a matched DB user for testing purposes
  // TODO: Remove before production or when real data is imported
  if (email.toLowerCase() === "nitinsudarshan@gmail.com") {
    return {
      found_in_db: true,
      has_active_subscription: true,
      show_contact_banner: false,
      total_learning_hours: 42.5,
      total_hours_formatted: "42.5 hrs",
      hours_last_month: 8.3,
      hours_last_month_formatted: "8.3 hrs",
      completed_courses_count: 7,
      enrolled_courses_count: 9,
      program_name: "NavGurukul Enterprise Learning"
    }
  }

  const supabase = await createClient()
  const lowerEmail = email.toLowerCase()

  // Step 1: Match user email with email in DB coursera tables
  let { data: learnerMonths } = await supabase
    .from('coursera_learner_month')
    .select('*')
    .ilike('email', lowerEmail)
    .order('month', { ascending: false })

  let { data: snapshots } = await supabase
    .from('coursera_snapshots')
    .select('*')
    .ilike('email', lowerEmail)
    .order('snapshot_month', { ascending: false })

  if ((!learnerMonths || learnerMonths.length === 0) && (!snapshots || snapshots.length === 0)) {
    try {
      const admin = createAdminClient()
      const { data: adminLm } = await admin
        .from('coursera_learner_month')
        .select('*')
        .ilike('email', lowerEmail)
        .order('month', { ascending: false })
      
      const { data: adminSnap } = await admin
        .from('coursera_snapshots')
        .select('*')
        .ilike('email', lowerEmail)
        .order('snapshot_month', { ascending: false })

      if (adminLm) learnerMonths = adminLm
      if (adminSnap) snapshots = adminSnap
    } catch (e) {
      console.error("Admin fallback error in getUserCourseraData:", e)
    }
  }

  const foundInDb = Boolean(
    (snapshots && snapshots.length > 0) ||
    (learnerMonths && learnerMonths.length > 0)
  )

  let totalHours = 0
  let hoursLastMonth = 0
  let completedCount = 0
  let enrolledCount = 0
  let activeSubscription = false

  if (snapshots && snapshots.length > 0) {
    const latestSnapshot = snapshots[0]
    activeSubscription = !latestSnapshot.removed_from_program

    const completedCourses = new Set<string>()
    const enrolledCourses = new Set<string>()

    for (const snap of snapshots) {
      if (snap.course_id) {
        enrolledCourses.add(snap.course_id)
        if (snap.completed) {
          completedCourses.add(snap.course_id)
        }
      }
      const snapHours = Number(snap.cumulative_learning_hours || 0)
      if (snapHours > totalHours) {
        totalHours = snapHours
      }
    }

    completedCount = completedCourses.size
    enrolledCount = enrolledCourses.size
  }

  if (learnerMonths && learnerMonths.length > 0) {
    const latestMonth = learnerMonths[0]
    hoursLastMonth = Number(latestMonth.monthly_hours || 0)
    const cumHours = Number(latestMonth.cumulative_hours || 0)
    if (cumHours > totalHours) {
      totalHours = cumHours
    }
    if (latestMonth.courses_completed > completedCount) {
      completedCount = latestMonth.courses_completed
    }
    activeSubscription = activeSubscription || Boolean(latestMonth.is_active)
  }

  // Step 2: If NOT found in DB, use API check
  let showContactBanner = false
  if (!foundInDb) {
    const activeInApi = await checkCourseraApiUserActive(email)
    if (activeInApi) {
      // User found in API/Org -> ignore (do not show banner)
      activeSubscription = true
      showContactBanner = false
    } else {
      // User NOT found -> show contact banner to get access
      activeSubscription = false
      showContactBanner = true
    }
  }

  const formatHours = (hrs: number) => {
    if (hrs >= 1) return `${hrs.toFixed(1)} hrs`
    if (hrs > 0) return `${Math.round(hrs * 60)} mins`
    return "0 hrs"
  }

  return {
    found_in_db: foundInDb,
    has_active_subscription: activeSubscription,
    show_contact_banner: showContactBanner,
    total_learning_hours: totalHours,
    total_hours_formatted: formatHours(totalHours),
    hours_last_month: hoursLastMonth,
    hours_last_month_formatted: formatHours(hoursLastMonth),
    completed_courses_count: completedCount,
    enrolled_courses_count: enrolledCount,
    program_name: "NavGurukul Enterprise Learning"
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Coursera Config (contact email + callout toggle)
// Requires columns: contact_email TEXT, show_callouts BOOLEAN DEFAULT TRUE
// Run in Supabase SQL editor:
//   ALTER TABLE coursera_config ADD COLUMN IF NOT EXISTS contact_email TEXT DEFAULT 'learn@navgurukul.org';
//   ALTER TABLE coursera_config ADD COLUMN IF NOT EXISTS show_callouts BOOLEAN DEFAULT TRUE;
// ─────────────────────────────────────────────────────────────────────────────

export interface CourseraConfig {
  contact_email: string;
  show_callouts: boolean;
}

export async function getCourseraConfig(): Promise<CourseraConfig> {
  const defaults: CourseraConfig = {
    contact_email: "learn@navgurukul.org",
    show_callouts: true,
  }
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('coursera_config')
      .select('contact_email, show_callouts')
      .eq('id', 1)
      .single()
    if (data) {
      return {
        contact_email: data.contact_email ?? defaults.contact_email,
        show_callouts: data.show_callouts ?? defaults.show_callouts,
      }
    }
  } catch (e) {
    console.error("getCourseraConfig error:", e)
  }
  return defaults
}

export async function saveCourseraConfig(config: Partial<CourseraConfig>): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('coursera_config')
      .upsert({ id: 1, ...config, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e?.message ?? "Unknown error" }
  }
}

export async function getGoogleMeetIntegrationStatus(): Promise<{ connected: boolean; accountEmail?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { connected: false }

    const adminSupabase = createAdminClient()
    const { data, error } = await adminSupabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google_meet')
      .maybeSingle()

    if (error || !data || !data.refresh_token) {
      return { connected: false }
    }

    return {
      connected: true,
      accountEmail: data.connected_account || user.email || ""
    }
  } catch (err) {
    console.error("Error fetching Google Meet integration status:", err)
    return { connected: false }
  }
}
