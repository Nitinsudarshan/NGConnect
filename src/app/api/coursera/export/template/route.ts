import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = user.app_metadata?.role;
  if (role !== 'Admin' && role !== 'Super Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Learner Emails', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  ws.columns = [
    { header: 'Email', key: 'email', width: 35 },
    { header: 'Notes (Optional)', key: 'notes', width: 30 },
  ];

  // Header style
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
  headerRow.height = 24;

  // Example sample rows
  ws.addRow(['learner1@example.com', 'Sample learner 1']);
  ws.addRow(['learner2@example.com', 'Sample learner 2']);
  ws.addRow(['learner3@example.com', 'Sample learner 3']);

  const buf = await workbook.xlsx.writeBuffer();

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="coursera_user_list_template.xlsx"',
    },
  });
}
