"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { MentorFormValues } from "./schema"
import { createGoogleMeetLink } from "@/lib/google-meet"

export async function logLearningCenterActivity(
  entityType: "mentor" | "audience" | "session_type" | "integration" | "category" | "subcategory",
  entityId: string | null,
  action: "create" | "update" | "delete" | "archive" | "connect" | "disconnect",
  details: string
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase.from("learning_center_audit_logs").insert([
      {
        entity_type: entityType,
        entity_id: entityId,
        action,
        details,
        user_id: user?.id || null,
        user_email: user?.email || null,
      },
    ])
  } catch (err) {
    console.error("Failed to insert audit log:", err)
  }
}

export async function createMentor(data: MentorFormValues) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthenticated' }
  }

  const { data: inserted, error } = await supabase
    .from('mentors')
    .insert([{ ...data, user_id: user.id }])
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  await logLearningCenterActivity("mentor", inserted?.id || null, "create", `Created mentor '${data.name}' with status '${data.status}'`)

  revalidatePath("/learning-center/settings")
  return { success: true }
}

export async function updateMentor(id: string, data: MentorFormValues) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('mentors')
    .update(data)
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  await logLearningCenterActivity("mentor", id, "update", `Updated mentor details for '${data.name}'`)

  revalidatePath("/learning-center/settings")
  revalidatePath(`/learning-center/settings/mentors/${id}`)
  return { success: true }
}

export async function archiveMentorAction(id: string, name: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('mentors')
    .update({ status: 'Inactive' })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  await logLearningCenterActivity("mentor", id, "archive", `Archived mentor '${name}' (Status set to Inactive)`)

  revalidatePath("/learning-center/settings")
  return { success: true }
}

export async function saveAudienceAction(id: string | null, data: { name: string; audience_type: string; campus_id?: string; course_id?: string; batch_year?: string }) {
  const supabase = await createClient()
  const payload = {
    name: data.name,
    audience_type: data.audience_type,
    campus_id: data.campus_id || null,
    course_id: data.course_id || null,
    batch_year: data.batch_year ? parseInt(data.batch_year, 10) : null,
  }

  if (id) {
    const { error } = await supabase.from('learning_audiences').update(payload).eq('id', id)
    if (error) return { success: false, error: error.message }
    await logLearningCenterActivity("audience", id, "update", `Updated audience '${data.name}'`)
  } else {
    const { data: inserted, error } = await supabase.from('learning_audiences').insert([payload]).select().single()
    if (error) return { success: false, error: error.message }
    await logLearningCenterActivity("audience", inserted?.id || null, "create", `Created new audience '${data.name}' (${data.audience_type})`)
  }

  revalidatePath("/learning-center/settings")
  return { success: true }
}

export async function deleteAudienceAction(id: string, name: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('learning_audiences').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  await logLearningCenterActivity("audience", id, "delete", `Deleted audience target '${name}'`)

  revalidatePath("/learning-center/settings")
  return { success: true }
}

export async function saveSessionTypeAction(id: string | null, name: string) {
  const supabase = await createClient()

  if (id) {
    const { error } = await supabase.from('learning_session_types').update({ name }).eq('id', id)
    if (error) return { success: false, error: error.message }
    await logLearningCenterActivity("session_type", id, "update", `Updated session type name to '${name}'`)
  } else {
    const { data: inserted, error } = await supabase.from('learning_session_types').insert([{ name }]).select().single()
    if (error) return { success: false, error: error.message }
    await logLearningCenterActivity("session_type", inserted?.id || null, "create", `Created new session type '${name}'`)
  }

  revalidatePath("/learning-center/settings")
  return { success: true }
}

export async function deleteSessionTypeAction(id: string, name: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('learning_session_types').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  await logLearningCenterActivity("session_type", id, "delete", `Deleted session type '${name}'`)

  revalidatePath("/learning-center/settings")
  return { success: true }
}

export async function saveCategoryAction(id: string | null, name: string, description?: string | null) {
  const supabase = await createClient()

  if (id) {
    const { error } = await supabase.from('learning_categories').update({ name, description: description || null }).eq('id', id)
    if (error) return { success: false, error: error.message }
    await logLearningCenterActivity("category", id, "update", `Updated category '${name}'`)
  } else {
    const { data: inserted, error } = await supabase.from('learning_categories').insert([{ name, description: description || null }]).select().single()
    if (error) return { success: false, error: error.message }
    await logLearningCenterActivity("category", inserted?.id || null, "create", `Created new category '${name}'`)
  }

  revalidatePath("/learning-center/settings")
  return { success: true }
}

export async function deleteCategoryAction(id: string, name: string) {
  const supabase = await createClient()

  // Server-side safety check: Ensure 0 subcategories exist
  const { count: subCount, error: subErr } = await supabase
    .from('learning_subcategories')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)

  if (subErr) return { success: false, error: subErr.message }
  if (subCount && subCount > 0) {
    return { success: false, error: "Cannot delete category that still has subcategories. Please remove or reassign subcategories first." }
  }

  const { error } = await supabase.from('learning_categories').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  await logLearningCenterActivity("category", id, "delete", `Deleted category '${name}'`)

  revalidatePath("/learning-center/settings")
  return { success: true }
}

export async function saveSubcategoryAction(id: string | null, categoryId: string, name: string, description?: string | null) {
  const supabase = await createClient()

  const payload = {
    category_id: categoryId,
    name,
    description: description || null,
  }

  if (id) {
    const { error } = await supabase.from('learning_subcategories').update(payload).eq('id', id)
    if (error) return { success: false, error: error.message }
    await logLearningCenterActivity("subcategory", id, "update", `Updated subcategory '${name}'`)
  } else {
    const { data: inserted, error } = await supabase.from('learning_subcategories').insert([payload]).select().single()
    if (error) return { success: false, error: error.message }
    await logLearningCenterActivity("subcategory", inserted?.id || null, "create", `Created new subcategory '${name}'`)
  }

  revalidatePath("/learning-center/settings")
  return { success: true }
}

export async function deleteSubcategoryAction(id: string, name: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('learning_subcategories').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  await logLearningCenterActivity("subcategory", id, "delete", `Deleted subcategory '${name}'`)

  revalidatePath("/learning-center/settings")
  return { success: true }
}

export async function logIntegrationAction(integrationName: string, action: "connect" | "disconnect" | "update", details: string) {
  await logLearningCenterActivity("integration", null, action, `${integrationName} Integration: ${details}`)
  revalidatePath("/learning-center/settings")
  return { success: true }
}

export async function disconnectGoogleMeetAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Unauthenticated" }

    const { error } = await supabase
      .from('user_integrations')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'google_meet')

    if (error) return { success: false, error: error.message }

    await logLearningCenterActivity("integration", null, "disconnect", "Disconnected Google Meet integration")
    revalidatePath("/learning-center/settings")
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to disconnect Google Meet" }
  }
}

export async function generateGoogleMeetLinkAction(
  topic: string,
  dateStr: string,
  timeStr?: string | null,
  durationMinutes: number = 60
) {
  try {
    let startTime: Date
    if (dateStr && timeStr) {
      startTime = new Date(`${dateStr}T${timeStr}:00`)
    } else if (dateStr) {
      startTime = new Date(`${dateStr}T10:00:00`)
    } else {
      startTime = new Date()
    }

    const result = await createGoogleMeetLink(topic, startTime, durationMinutes)
    return { success: true, meetLink: result.meetLink, eventId: result.eventId }
  } catch (err: any) {
    console.error("[generateGoogleMeetLinkAction] error:", err)
    return { success: false, error: err.message || "Failed to generate Google Meet link" }
  }
}

export async function createSessionAction(
  data: {
    topic: string
    mentor_id?: string | null
    date: string
    start_time?: string | null
    duration_minutes: number
    mode?: string
    platform?: string | null
    meeting_link?: string | null
    audience_id?: string | null
    category_id?: string | null
    subcategory_id?: string | null
    description?: string | null
    recording_url?: string | null
    transcript_url?: string | null
    chat_url?: string | null
  }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Unauthenticated" }

    const adminSupabase = createAdminClient()
    const { data: inserted, error } = await adminSupabase
      .from("learning_sessions")
      .insert([{
        ...data,
        created_by: user.id,
      }])
      .select()
      .single()

    if (error) {
      console.error("[createSessionAction] error:", error.message)
      return { success: false, error: error.message }
    }

    revalidatePath("/learning-center/sessions")
    revalidatePath("/learning-center")
    return { success: true, data: inserted }
  } catch (err: any) {
    console.error("[createSessionAction] exception:", err)
    return { success: false, error: err.message }
  }
}

export async function updateSessionMedia(
  sessionId: string,
  data: {
    recording_url?: string | null
    transcript_url?: string | null
    chat_url?: string | null
    duration_minutes?: number | null
  }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Unauthenticated" }

    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase
      .from("learning_sessions")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)

    if (error) {
      console.error("[updateSessionMedia] error:", error.message)
      return { success: false, error: error.message }
    }

    revalidatePath("/learning-center/sessions")
    revalidatePath("/learning-center")
    return { success: true }
  } catch (err: any) {
    console.error("[updateSessionMedia] exception:", err)
    return { success: false, error: err.message }
  }
}

export async function updateSessionAction(
  sessionId: string,
  data: {
    topic: string
    mentor_id?: string | null
    date: string
    start_time?: string | null
    duration_minutes: number
    mode?: string
    platform?: string | null
    meeting_link?: string | null
    audience_id?: string | null
    category_id?: string | null
    subcategory_id?: string | null
    description?: string | null
  }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Unauthenticated" }

    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase
      .from("learning_sessions")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)

    if (error) {
      console.error("[updateSessionAction] error:", error.message)
      return { success: false, error: error.message }
    }

    revalidatePath("/learning-center/sessions")
    revalidatePath("/learning-center")
    revalidatePath("/learning-center/recordings")
    return { success: true }
  } catch (err: any) {
    console.error("[updateSessionAction] exception:", err)
    return { success: false, error: err.message }
  }
}

export async function syncSessionDurationAction(sessionId: string, durationMinutes: number) {
  try {
    if (!sessionId || durationMinutes <= 0) return { success: false }

    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase
      .from("learning_sessions")
      .update({
        duration_minutes: durationMinutes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)

    if (error) return { success: false, error: error.message }
    revalidatePath("/learning-center/sessions")
    revalidatePath("/learning-center")
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}


export async function fetchExternalTextAction(url: string): Promise<string | null> {
  try {
    let targetUrl = url
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                       url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/) ||
                       url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/)
    if (driveMatch) {
      const fileId = driveMatch[1]
      targetUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
    }

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      cache: "no-store"
    })

    if (!res.ok) {
      console.error("[fetchExternalTextAction] HTTP Error:", res.status)
      return null
    }

    return await res.text()
  } catch (err: any) {
    console.error("[fetchExternalTextAction] Exception:", err)
    return null
  }
}



/**
 * saveWatchProgressAction — kept as server action for SSR-triggered saves
 * (e.g. from dashboard "Resume" button). For in-player tracking, the VideoPlayer
 * component uses direct client-side Supabase upserts to avoid server round-trips.
 */
export async function saveWatchProgressAction(
  sourceType: 'session_recording' | 'course_item',
  sourceId: string,
  seconds: number,
  pct: number
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthenticated' }

    const isCompleted = pct >= 90
    const { error } = await supabase
      .from('watch_progress')
      .upsert({
        user_id: user.id,
        video_source_type: sourceType,
        video_source_id: sourceId,
        watched_seconds: Math.floor(seconds),
        percent_watched: Math.min(Math.floor(pct), 100),
        updated_at: new Date().toISOString(),
        ...(isCompleted && { completed_at: new Date().toISOString() })
      }, {
        onConflict: 'user_id, video_source_type, video_source_id'
      })

    if (error) {
      console.error("Error upserting watch progress:", error)
      return { success: false, error: error.message }
    }
    // Only revalidate on explicit user-triggered saves, not on every periodic sync
    return { success: true }
  } catch (err: any) {
    console.error("Failed to save watch progress:", err)
    return { success: false, error: err.message }
  }
}
