import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "GOOGLE_CLIENT_ID is not configured" }, { status: 500 })
  }

  const redirectUri = `${req.nextUrl.origin}/api/integrations/google/callback`
  
  // Scopes for Google Calendar
  const scopes = [
    "https://www.googleapis.com/auth/calendar.events"
  ].join(" ")

  // Construct the Google OAuth URL
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", scopes)
  authUrl.searchParams.set("access_type", "offline")
  authUrl.searchParams.set("prompt", "consent") // Force consent to ensure we get a refresh token
  authUrl.searchParams.set("hd", "navgurukul.org") // Hint to use navgurukul.org domain
  
  // Pass the user ID in the state so we can link the integration when the callback returns
  authUrl.searchParams.set("state", user.id)

  return NextResponse.redirect(authUrl.toString())
}
