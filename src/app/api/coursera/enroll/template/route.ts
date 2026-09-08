import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
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
  workbook.creator = 'NGConnect Coursera Portal';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Enrollment Template', {
    views: [{ showGridLines: true }],
  });

  // Define columns
  sheet.columns = [
    { header: 'Email Address *', key: 'email', width: 35 },
    { header: 'Full Name (Optional)', key: 'fullName', width: 30 },
    { header: 'Notes', key: 'notes', width: 40 },
  ];

  // Header style
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' }, // Indigo
  };
  headerRow.height = 28;
  headerRow.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  // Sample data rows
  sheet.addRow({
    email: 'learner.one@navgurukul.org',
    fullName: 'Learner One',
    notes: 'Optional note: Student / Batch 2024',
  });

  sheet.addRow({
    email: 'learner.two@navgurukul.org',
    fullName: 'Learner Two',
    notes: 'If Full Name is left blank, the portal auto-resolves it from NGConnect records',
  });

  // Borders and row styling
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.height = 22;
      row.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="coursera_enrollment_template.xlsx"',
    },
  });
}
