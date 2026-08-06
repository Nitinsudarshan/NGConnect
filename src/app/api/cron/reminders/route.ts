import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

// This endpoint is meant to be called periodically (e.g. hourly) via Vercel Cron or a similar scheduler
export async function GET(request: Request) {
  try {
    // 1. Verify cron authorization to prevent public access
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = await createClient();

    // 2. Fetch master settings
    const { data: settingsData } = await supabase
      .from('learning_center_settings')
      .select('master_trigger_config')
      .eq('id', 1)
      .single();

    const masterConfig = settingsData?.master_trigger_config || {};

    // 3. Fetch upcoming sessions (next 48 hours for reminders/announcements)
    // and recently completed sessions (for feedback/thank you)
    const now = new Date();
    const futureDate = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours ahead
    const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        id, topic, date, time, duration, platform, audience, zoom_meeting_id, join_url,
        status, trigger_overrides,
        mentors (id, name, email)
      `)
      .gte('date', pastDate.toISOString().split('T')[0])
      .lte('date', futureDate.toISOString().split('T')[0]);

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ message: 'No sessions to process' });
    }

    const logs = [];

    // 4. Process each session
    for (const session of sessions) {
      // Merge master config with session overrides
      const effectiveConfig = {
        ...masterConfig,
        ...(session.trigger_overrides || {})
      };

      // Mock logic: In a real implementation, we would:
      // a) Calculate exact trigger times based on session.date + session.time
      // b) Check if `reminders_log` already has an entry for this session + trigger type
      // c) If not sent and current time is past trigger time, Send it.
      
      const sessionDateTime = new Date(`${session.date}T${session.time}`);
      const hoursUntilSession = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Example: T-1 Day Reminder
      if (effectiveConfig.reminder_1?.enabled) {
        const shouldSendReminder = hoursUntilSession > 0 && hoursUntilSession <= 24;
        
        // In reality, check if already sent:
        // const { data: sentLogs } = await supabase.from('reminders_log').select('id').eq('session_id', session.id).eq('type', 'reminder_1');
        
        if (shouldSendReminder) {
          // Send Email
          if (effectiveConfig.reminder_1.channels?.includes('email') || true) {
             const emailHtml = `
               <h2>Reminder: ${session.topic}</h2>
               <p>Your session with ${(session.mentors as any)?.name || (session.mentors as any)?.[0]?.name} is coming up!</p>
               <p><strong>When:</strong> ${session.date} at ${session.time}</p>
               <p><strong>Link:</strong> <a href="${session.join_url}">${session.join_url}</a></p>
             `;
             
             // This is a placeholder email send. It would actually fetch the audience list from DB and map to emails.
             // await sendEmail({ to: "audience@example.com", subject: `Reminder: ${session.topic}`, html: emailHtml });
             
             logs.push(`Sent reminder_1 for ${session.topic}`);
             
             // Log to DB
             await supabase.from('reminders_log').insert({
               session_id: session.id,
               type: 'reminder_1',
               channel: 'email',
               status: 'Sent'
             });
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: sessions.length,
      actions: logs
    });
  } catch (error: any) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
