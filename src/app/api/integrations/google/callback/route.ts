import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const stateUserId = req.nextUrl.searchParams.get("state")
  const error = req.nextUrl.searchParams.get("error")

  if (error) {
    return NextResponse.redirect(`${req.nextUrl.origin}/learning-center/settings?error=${error}`)
  }

  if (!code || !stateUserId) {
    return NextResponse.redirect(`${req.nextUrl.origin}/learning-center/settings?error=missing_params`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const targetUserId = user?.id

  if (!targetUserId || targetUserId !== stateUserId) {
    return NextResponse.redirect(`${req.nextUrl.origin}/learning-center/settings?error=unauthorized`)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${req.nextUrl.origin}/api/integrations/google/callback`

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${req.nextUrl.origin}/learning-center/settings?error=missing_credentials`)
  }

  try {
    // Exchange the authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error("Google OAuth token exchange error:", tokenData.error_description || tokenData.error)
      throw new Error(tokenData.error_description || tokenData.error)
    }

    const { access_token, refresh_token, id_token } = tokenData

    let email = ""
    if (id_token) {
      try {
        const payloadBase64 = id_token.split('.')[1]
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'))
        email = payload.email || ""
      } catch (e) {
        console.warn("Failed to parse id_token payload:", e)
      }
    }

    const adminSupabase = createAdminClient()

    // Check existing integration to preserve refresh_token if Google didn't issue a new one
    const { data: existingIntegration } = await adminSupabase
      .from('user_integrations')
      .select('refresh_token')
      .eq('user_id', targetUserId)
      .eq('provider', 'google_meet')
      .maybeSingle()

    const finalRefreshToken = refresh_token || existingIntegration?.refresh_token || null

    // Upsert the integration into Supabase using admin client to bypass RLS restrictions
    const { error: dbError } = await adminSupabase
      .from('user_integrations')
      .upsert({
        user_id: targetUserId,
        provider: 'google_meet',
        access_token: access_token,
        refresh_token: finalRefreshToken,
        connected_account: email || user?.email || "Google Workspace Account",
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      })

    if (dbError) {
      console.error("Database error saving integration:", dbError)
      return NextResponse.redirect(`${req.nextUrl.origin}/learning-center/settings?error=db_error`)
    }

    return NextResponse.redirect(`${req.nextUrl.origin}/learning-center/settings?gmeet=connected`)
  } catch (err) {
    console.error("Error during Google OAuth callback:", err)
    return NextResponse.redirect(`${req.nextUrl.origin}/learning-center/settings?error=server_error`)
  }
}
