import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

  if (!user || user.id !== stateUserId) {
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
      throw new Error(tokenData.error_description || tokenData.error)
    }

    const { access_token, refresh_token, id_token } = tokenData

    // We can decode the id_token to check the email and domain
    // A simple JWT decoding (the payload is the second part)
    if (id_token) {
      const payloadBase64 = id_token.split('.')[1]
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'))
      
      const email = payload.email || ""
      const domain = payload.hd || ""

      if (!email.endsWith("@navgurukul.org") && domain !== "navgurukul.org") {
        // If not navgurukul, we shouldn't save the token. 
        // Note: For testing, you might want to comment this out if you are using a regular gmail account
        // return NextResponse.redirect(`${req.nextUrl.origin}/learning-center/settings?error=unauthorized_domain`)
      }
      
      // Upsert the integration into Supabase
      const { error: dbError } = await supabase
        .from('user_integrations')
        .upsert({
          user_id: user.id,
          provider: 'google_meet',
          access_token: access_token, // Ideally this should be encrypted, but we are keeping it simple
          refresh_token: refresh_token || null, // refresh_token might be null if already authorized
          connected_account: email,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,provider'
        })

      if (dbError) {
        console.error("Database error saving integration:", dbError)
        return NextResponse.redirect(`${req.nextUrl.origin}/learning-center/settings?error=db_error`)
      }
    }

    return NextResponse.redirect(`${req.nextUrl.origin}/learning-center/settings?gmeet=connected`)
  } catch (err) {
    console.error("Error during Google OAuth callback:", err)
    return NextResponse.redirect(`${req.nextUrl.origin}/learning-center/settings?error=server_error`)
  }
}
