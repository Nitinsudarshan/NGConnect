import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// 1x1 transparent GIF buffer
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (token) {
    // Record open asynchronously
    const supabase = createAdminClient();
    try {
      const { data: sendRecord } = await supabase
        .from('notification_sends')
        .select('id, open_count, opened_at')
        .eq('tracking_token', token)
        .maybeSingle();

      if (sendRecord) {
        await supabase
          .from('notification_sends')
          .update({
            opened_at: sendRecord.opened_at || new Date().toISOString(),
            open_count: (sendRecord.open_count || 0) + 1,
          })
          .eq('id', sendRecord.id);
      }
    } catch (err) {
      console.error('[Tracking Pixel] Failed to update open count:', err);
    }
  }

  return new NextResponse(TRANSPARENT_GIF_BUFFER, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': TRANSPARENT_GIF_BUFFER.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
