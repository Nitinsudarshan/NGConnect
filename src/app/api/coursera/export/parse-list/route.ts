import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';
import { createClient } from '@/lib/supabase/server';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function POST(request: NextRequest) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = user.app_metadata?.role;
  if (role !== 'Admin' && role !== 'Super Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Failed to parse form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const fileName = file.name.toLowerCase();
  const isXlsx = fileName.endsWith('.xlsx');
  const isCsv = fileName.endsWith('.csv');

  if (!isXlsx && !isCsv) {
    return NextResponse.json({ error: 'Only .xlsx and .csv files are supported' }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const emailSet = new Set<string>();

  try {
    const workbook = new ExcelJS.Workbook();
    const stream = Readable.from(buffer);

    if (isCsv) {
      await workbook.csv.read(stream);
    } else {
      await workbook.xlsx.read(stream);
    }

    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.actualRowCount === 0) {
      return NextResponse.json({ error: 'Uploaded spreadsheet is empty' }, { status: 400 });
    }

    const headerRow = sheet.getRow(1);
    const headers = (headerRow.values as (string | undefined)[]).map(h => String(h ?? '').trim().toLowerCase());
    const emailColIndex = headers.findIndex(h => h.includes('email') || h.includes('mail'));

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1 && emailColIndex !== -1) return; // skip header if identified

      const values = row.values as any[];
      if (!Array.isArray(values)) return;

      if (emailColIndex !== -1 && values[emailColIndex]) {
        const val = String(values[emailColIndex]).trim().toLowerCase();
        if (EMAIL_REGEX.test(val)) {
          emailSet.add(val);
          return;
        }
      }

      // Fallback: inspect each cell in the row
      for (const val of values) {
        if (val) {
          const str = String(val).trim().toLowerCase();
          if (EMAIL_REGEX.test(str)) {
            emailSet.add(str);
          }
        }
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to parse file: ${err.message}` }, { status: 400 });
  }

  const emails = Array.from(emailSet);
  if (emails.length === 0) {
    return NextResponse.json({
      error: 'No valid email addresses found in the uploaded file. Please ensure there is an "Email" column with valid emails.',
    }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    count: emails.length,
    emails,
    filename: file.name,
  });
}
