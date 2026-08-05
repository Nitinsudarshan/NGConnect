/**
 * Zoom Server-to-Server OAuth Integration
 * Requires the following environment variables:
 * ZOOM_ACCOUNT_ID
 * ZOOM_CLIENT_ID
 * ZOOM_CLIENT_SECRET
 */

const ZOOM_OAUTH_ENDPOINT = "https://zoom.us/oauth/token"
const ZOOM_API_BASE_URL = "https://api.zoom.us/v2"

/**
 * Gets a Server-to-Server OAuth token for the Zoom API
 */
export async function getZoomAccessToken(): Promise<string | null> {
  const accountId = process.env.ZOOM_ACCOUNT_ID
  const clientId = process.env.ZOOM_CLIENT_ID
  const clientSecret = process.env.ZOOM_CLIENT_SECRET

  if (!accountId || !clientId || !clientSecret) {
    console.warn("Zoom credentials not found in environment variables.")
    return null
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  try {
    const response = await fetch(`${ZOOM_OAUTH_ENDPOINT}?grant_type=account_credentials&account_id=${accountId}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
      next: { revalidate: 3500 }, // Zoom tokens usually last 1 hour, cache for slightly less
    })

    if (!response.ok) {
      throw new Error(`Failed to get Zoom token: ${response.statusText}`)
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error("Zoom Auth Error:", error)
    return null
  }
}

export interface ZoomMeetingOptions {
  topic: string
  startTime: string // ISO 8601 UTC format
  duration: number // in minutes
  timezone?: string // e.g. "Asia/Kolkata"
}

/**
 * Creates a meeting on the Zoom account
 */
export async function createZoomMeeting(options: ZoomMeetingOptions) {
  const token = await getZoomAccessToken()
  
  if (!token) {
    throw new Error("Unable to authenticate with Zoom API")
  }

  const response = await fetch(`${ZOOM_API_BASE_URL}/users/me/meetings`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: options.topic,
      type: 2, // Scheduled meeting
      start_time: options.startTime,
      duration: options.duration,
      timezone: options.timezone || "Asia/Kolkata",
      settings: {
        host_video: true,
        participant_video: false,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true,
        auto_recording: "cloud", // Always auto-record to cloud as per requirements
      },
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`Zoom API Error: ${errorData.message || response.statusText}`)
  }

  return await response.json()
}

/**
 * Validates connection to Zoom
 */
export async function testZoomConnection(): Promise<{ success: boolean; message: string }> {
  const token = await getZoomAccessToken()
  if (!token) return { success: false, message: "Authentication failed. Check credentials." }
  
  try {
    const response = await fetch(`${ZOOM_API_BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (response.ok) {
      const data = await response.json()
      return { success: true, message: `Connected successfully to account: ${data.first_name || ''} ${data.last_name || ''}` }
    }
    return { success: false, message: "API Request failed. Ensure scopes are correct." }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}
