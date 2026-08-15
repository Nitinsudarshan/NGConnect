import { NextRequest, NextResponse } from 'next/server';
import { processAllPendingQueue } from '@/lib/notifications/pipeline';

export async function GET(request: NextRequest) {
  return handleAuthAndProcess(request);
}

export async function POST(request: NextRequest) {
  return handleAuthAndProcess(request);
}

async function handleAuthAndProcess(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET environment variable is not configured' }, { status: 401 });
  }

  const authHeader = request.headers.get('authorization');
  const secretParam = new URL(request.url).searchParams.get('secret');

  const isAuthorized =
    authHeader === `Bearer ${cronSecret}` ||
    secretParam === cronSecret;

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
