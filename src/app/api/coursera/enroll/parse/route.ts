import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

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
  const parsedMap = new Map<string, { email: string; fullName?: string }>();

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
    
    // Find email and name column indexes
    const emailColIndex = headers.findIndex(h => h.includes('email') || h.includes('mail'));
    const nameColIndex = headers.findIndex(h => 
      h.includes('full name') || h.includes('fullname') || h.includes('name') || h.includes('learner name')
    );

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1 && emailColIndex !== -1) return; // skip header row

      const values = row.values as any[];
      if (!Array.isArray(values)) return;

      let foundEmail = '';
      let foundName = '';

      if (emailColIndex !== -1 && values[emailColIndex]) {
        const val = String(values[emailColIndex]).trim().toLowerCase();
        if (EMAIL_REGEX.test(val)) {
          foundEmail = val;
        }
      }

      if (nameColIndex !== -1 && values[nameColIndex]) {
        foundName = String(values[nameColIndex]).trim();
      }

      // If email wasn't in designated column, search all cells in row
      if (!foundEmail) {
        for (let c = 1; c < values.length; c++) {
          const val = values[c];
          if (val) {
            const str = String(val).trim().toLowerCase();
            if (EMAIL_REGEX.test(str)) {
              foundEmail = str;
              break;
            }
          }
        }
      }

      if (foundEmail && !parsedMap.has(foundEmail)) {
        parsedMap.set(foundEmail, {
          email: foundEmail,
          ...(foundName ? { fullName: foundName } : {}),
        });
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to parse file: ${err.message}` }, { status: 400 });
  }

  const items = Array.from(parsedMap.values());
  if (items.length === 0) {
    return NextResponse.json({
      error: 'No valid email addresses found in the uploaded file. Please ensure there is an "Email" column with valid emails.',
    }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    count: items.length,
    items,
    filename: file.name,
  });
}
