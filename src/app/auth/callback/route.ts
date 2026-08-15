import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Set default registration role/team if missing
      if (data?.user) {
        const user = data.user
        const metadata = user.user_metadata || {}
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
          } catch (adminErr) {
            console.error("Failed to assign default signup role/team:", adminErr)
          }
        }

        // Log platform_login engagement event if account matches alumni_master
        if (user.email) {
          try {
            const { createAdminClient } = await import("@/lib/supabase/admin")
            const adminClient = createAdminClient()
            const { data: alumni } = await adminClient
              .from('alumni_master')
              .select('email')
              .eq('email', user.email)
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
          } catch (loginEventErr) {
            console.error("Failed to log platform login engagement event:", loginEventErr)
          }
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=AuthError`)
}
