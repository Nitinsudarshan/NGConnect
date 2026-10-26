import { NextRequest, NextResponse } from 'next/server';

import { protectedAddSchema, protectedRemoveSchema } from '@/lib/coursera-prune-schema';
import { requirePruneAccess } from '@/lib/coursera-prune-auth';
import { addProtectedAccounts, listProtectedAccounts, removeProtectedAccount } from '@/lib/coursera-prune-store';

/**
 * Accounts that prune runs must never remove (staff, test accounts, etc.).
 *
 *   GET                                   list
 *   POST   { emails: [...], note? }       add (edit permission)
 *   DELETE { email }                      remove (edit permission)
 */
export async function GET() {
  const access = await requirePruneAccess('view');
  if (access.denied) return access.denied;

  try {
    return NextResponse.json({ success: true, data: await listProtectedAccounts() });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not load protected accounts.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const access = await requirePruneAccess('edit');
  if (access.denied) return access.denied;

  const parsed = protectedAddSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
  }

  try {
    await addProtectedAccounts(parsed.data.emails, parsed.data.note, access.actor);
    return NextResponse.json({ success: true, data: await listProtectedAccounts() });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not save protected accounts.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const access = await requirePruneAccess('edit');
  if (access.denied) return access.denied;

  const parsed = protectedRemoveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
  }

  try {
    await removeProtectedAccount(parsed.data.email);
    return NextResponse.json({ success: true, data: await listProtectedAccounts() });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not remove the protected account.' }, { status: 500 });
  }
}
