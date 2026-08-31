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
  const rawNext = searchParams.get('next')
  const next = sanitizeNextPath(rawNext)
  const baseUrl = getSafeBaseUrl(request, origin)

  console.info(`[AUTH_CALLBACK_START] reqId=${requestId} host=${urlObj.host} hasCode=${Boolean(code)}`)

  try {
    if (!code) {
      console.warn(`[AUTH_CALLBACK_MISSING_CODE] reqId=${requestId}`)
      return NextResponse.redirect(`${baseUrl}/login?error=MissingOAuthCode&reqId=${requestId}`)
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error(`[AUTH_CALLBACK_EXCHANGE_FAILED] reqId=${requestId} code=${error.name} msg=${error.message}`)
      return NextResponse.redirect(`${baseUrl}/login?error=AuthExchangeFailed&reqId=${requestId}`)
    }

    if (data?.user) {
      const user = data.user
      const normalizedEmail = user.email ? user.email.trim().toLowerCase() : null
      const metadata = user.user_metadata || {}

      // Set default registration role/team if missing
      if (!metadata.role || !metadata.team) {
        const defaultRole = metadata.role || "Member"
        const defaultTeam = metadata.team || "None"
        try {
          const { createAdminClient } = await import("@/lib/supabase/admin")
          const adminClient = createAdminClient()
          await adminClient.auth.admin.updateUserById(user.id, {
            user_metadata: { ...metadata, role: defaultRole, team: defaultTeam },
            app_metadata: { ...(user.app_metadata || {}), role: defaultRole, team: defaultTeam }
          })
          console.info(`[AUTH_CALLBACK_DEFAULT_ROLE_SET] reqId=${requestId} role=${defaultRole} team=${defaultTeam}`)
        } catch (adminErr: any) {
          console.error(`[AUTH_CALLBACK_METADATA_UPDATE_FAILED] reqId=${requestId} msg=${adminErr?.message}`)
        }
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

