import { createClient } from "@/lib/supabase/server"

export async function createGoogleMeetLink(topic: string, startTime: Date, durationMinutes: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Fetch the refresh token
  const { data: integration, error } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'google_meet')
    .single()

  if (error || !integration || !integration.refresh_token) {
    throw new Error("Google Meet is not connected or refresh token is missing.")
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("Server missing Google OAuth credentials.")
  }

  // Get a fresh access token using the refresh token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: integration.refresh_token,
      grant_type: "refresh_token",
    }),
  })

  const tokenData = await tokenRes.json()

  if (tokenData.error) {
    throw new Error("Failed to refresh Google token.")
  }

  const accessToken = tokenData.access_token

  // Calculate end time
  const endTime = new Date(startTime.getTime() + durationMinutes * 60000)

  // Call Google Calendar API to create an event with a Meet link
  const eventRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: topic,
      description: "Mentorship Session via NGConnect",
      start: {
        dateTime: startTime.toISOString(),
      },
      end: {
        dateTime: endTime.toISOString(),
      },
      conferenceData: {
        createRequest: {
          requestId: `ngconnect-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet"
          }
        }
      }
    })
  })

  const eventData = await eventRes.json()

  if (eventData.error) {
    throw new Error(eventData.error.message || "Failed to create Google Calendar event")
  }

  const meetLink = eventData.hangoutLink

  return { meetLink, eventId: eventData.id }
}
