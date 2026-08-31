import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * Safely resolves the redirect base URL taking into account reverse proxies,
 * load balancers, and multi-tier Vercel deployments.
 */
function getSafeBaseUrl(request: Request, rawOrigin: string): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const isLocalEnv = process.env.NODE_ENV === 'development'

  if (isLocalEnv) {
    return rawOrigin
  }

  if (forwardedHost) {
    // In multi-proxy setups, x-forwarded-host may contain a comma-separated list
    const primaryHost = forwardedHost.split(',')[0].trim()
    return `${forwardedProto}://${primaryHost}`
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }

  return rawOrigin
}

/**
 * Sanitizes the 'next' query parameter to prevent open redirect vulnerabilities.
 */
function sanitizeNextPath(nextParam: string | null): string {
  if (!nextParam) return '/'
  // Ensure the destination is an absolute path on the same host and not a protocol-relative link
  if (nextParam.startsWith('/') && !nextParam.startsWith('//')) {
    return nextParam
  }
  return '/'
}

export async function GET(request: Request) {
  const requestId = crypto.randomUUID()
  const urlObj = new URL(request.url)
  const origin = urlObj.origin
  const searchParams = urlObj.searchParams
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash') || searchParams.get('token')
  const rawType = searchParams.get('type')
  const type = (rawType === 'email' || rawType === 'signup' || rawType === 'invite' || rawType === 'recovery' || rawType === 'email_change' ? rawType : 'magiclink') as any
  const authErrorParam = searchParams.get('error')
  const authErrorDesc = searchParams.get('error_description')
  const rawNext = searchParams.get('next')
  const next = sanitizeNextPath(rawNext)
  const baseUrl = getSafeBaseUrl(request, origin)

  console.info(`[AUTH_CALLBACK_START] reqId=${requestId} host=${urlObj.host} hasCode=${Boolean(code)} hasTokenHash=${Boolean(token_hash)}`)

  if (authErrorParam) {
    console.error(`[AUTH_CALLBACK_PARAM_ERROR] reqId=${requestId} error=${authErrorParam} desc=${authErrorDesc}`)
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(authErrorDesc || authErrorParam)}&reqId=${requestId}`)
  }

  try {
    if (!code && !token_hash) {
      console.warn(`[AUTH_CALLBACK_MISSING_CODE_AND_TOKEN] reqId=${requestId}`)
      return NextResponse.redirect(`${baseUrl}/login?error=MissingOAuthCode&reqId=${requestId}`)
    }

    const supabase = await createClient()
    let data: any = null
    let error: any = null

    if (code) {
      const res = await supabase.auth.exchangeCodeForSession(code)
      data = res.data
      error = res.error
    } else if (token_hash) {
      const res = await supabase.auth.verifyOtp({
        token_hash,
        type,
      })
      data = res.data
      error = res.error
    }

    if (error) {
      console.error(`[AUTH_CALLBACK_AUTH_FAILED] reqId=${requestId} code=${error.name} msg=${error.message}`)
      return NextResponse.redirect(`${baseUrl}/login?error=AuthExchangeFailed&reqId=${requestId}`)
    }

    if (data?.user) {
      const user = data.user
      const normalizedEmail = user.email ? user.email.trim().toLowerCase() : null
      const rawMetadata = user.user_metadata || {}
      const now = new Date().toISOString()

      try {
        const { sanitizeUserAuthMetadata, sanitizeAppAuthMetadata } = await import("@/lib/auth-guard")
        const { getSafeAvatarUrl } = await import("@/lib/avatar")
        const safeAvatar = getSafeAvatarUrl(rawMetadata)
        const defaultRole = rawMetadata.role || user.app_metadata?.role || "Member"
        const defaultTeam = rawMetadata.team || user.app_metadata?.team || "None"
        const isAlumni = rawMetadata.is_alumni !== false && rawMetadata.isAlumni !== false

        const cleanUserMeta = sanitizeUserAuthMetadata({
          full_name: rawMetadata.full_name || rawMetadata.name || "",
          name: rawMetadata.name || rawMetadata.full_name || "",
          avatar_url: safeAvatar || undefined,
          avatarUrl: safeAvatar || undefined,
          picture: safeAvatar || undefined,
          is_alumni: isAlumni,
          last_login_at: now,
          last_active_at: now,
        })

        const cleanAppMeta = sanitizeAppAuthMetadata({
          role: defaultRole,
          team: defaultTeam,
          is_alumni: isAlumni,
        })

        const { createAdminClient } = await import("@/lib/supabase/admin")
        const adminClient = createAdminClient()
        await adminClient.auth.admin.updateUserById(user.id, {
          user_metadata: cleanUserMeta,
          app_metadata: cleanAppMeta,
        })
        console.info(`[AUTH_CALLBACK_METADATA_UPDATED] reqId=${requestId} role=${defaultRole} team=${defaultTeam} hasSafeAvatar=${Boolean(safeAvatar)} last_login_at=${now}`)
      } catch (adminErr: any) {
        console.error(`[AUTH_CALLBACK_METADATA_UPDATE_FAILED] reqId=${requestId} msg=${adminErr?.message}`)
      }

      // Log platform_login engagement event if account matches alumni_master
      if (normalizedEmail) {
        try {
          const { createAdminClient } = await import("@/lib/supabase/admin")
          const adminClient = createAdminClient()
          const { data: alumni } = await adminClient
            .from('alumni_master')
            .select('email')
            .eq('email', normalizedEmail)
            .maybeSingle()

          if (alumni) {
            const { data: eventType } = await adminClient
              .from('engagement_event_types')
              .select('id')
              .eq('code', 'platform_login')
              .maybeSingle()

            if (eventType) {
              await adminClient.from('alumni_engagement_events').insert({
                alumni_email: alumni.email,
                channel: 'platform',
                event_type_id: eventType.id,
                occurred_at: new Date().toISOString(),
              })
            }
          }
        } catch (loginEventErr: any) {
          console.error(`[AUTH_CALLBACK_ENGAGEMENT_EVENT_FAILED] reqId=${requestId} msg=${loginEventErr?.message}`)
        }
      }

      console.info(`[AUTH_CALLBACK_SUCCESS] reqId=${requestId} userId=${user.id}`)
    }

    const redirectTarget = new URL(next, baseUrl).toString()
    return NextResponse.redirect(redirectTarget)
  } catch (err: any) {
    console.error(`[AUTH_CALLBACK_INTERNAL_ERROR] reqId=${requestId} msg=${err?.message}`)
    return NextResponse.redirect(`${baseUrl}/login?error=OAuthCallbackError&reqId=${requestId}`)
  }
}

