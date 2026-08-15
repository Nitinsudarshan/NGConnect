import { NextRequest, NextResponse } from 'next/server';
import { processAllPendingQueue } from '@/lib/notifications/pipeline';

export async function GET(request: NextRequest) {
  return handleAuthAndProcess(request);
}

export async function POST(request: NextRequest) {
  return handleAuthAndProcess(request);
}

async function handleAuthAndProcess(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secretParam = new URL(request.url).searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET || 'ngconnect-cron-secret-dev';

  const isAuthorized =
    authHeader === `Bearer ${cronSecret}` ||
    secretParam === cronSecret ||
    process.env.NODE_ENV === 'development';

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
  }

  try {
    const result = await processAllPendingQueue();
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[Process Queue Cron] Error:', err);
    return NextResponse.json({ error: err?.message || 'Queue processing failed' }, { status: 500 });
  }
}
