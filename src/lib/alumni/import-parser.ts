import ExcelJS from 'exceljs';
import { Readable } from 'stream';
import type { GharColumnMap, ParsedImportRow } from '@/types/import';
import columnMap from './ghar-column-map.json';

const defaultColumnMap = columnMap as GharColumnMap;

/**
 * Parses a CSV or XLSX file buffer into an array of ParsedImportRow objects.
 * Uses the GHAR column map to translate export headers → DB field names.
 *
 * @param buffer   Raw file bytes
 * @param fileType 'csv' | 'xlsx'
 * @param map      Optional column map override (defaults to ghar-column-map.json)
 */
export async function parseImportFile(
  buffer: ArrayBuffer,
  fileType: 'csv' | 'xlsx',
  map: GharColumnMap = defaultColumnMap
): Promise<ParsedImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  const stream = Readable.from(Buffer.from(buffer));

  if (fileType === 'csv') {
    await workbook.csv.read(stream);
  } else {
    await workbook.xlsx.read(stream);
  }

  const sheet = workbook.worksheets[0];
  const rawRows: Record<string, string>[] = [];
  
  if (sheet.rowCount > 10000) {
    throw new Error('File has too many rows (max 10000 allowed)');
  }

  const headerRow = sheet.getRow(1);
  const headers = headerRow.values as (string | undefined)[];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const rowObj: Record<string, string> = {};
    (row.values as any[]).forEach((val, colIndex) => {
      const headerName = headers[colIndex];
      if (headerName) {
        rowObj[headerName] = val !== null && val !== undefined ? String(val) : '';
      }
    });
    rawRows.push(rowObj);
  });

  // Invert the map: GHAR header → DB field name
  const headerToField = Object.entries(map).reduce<Record<string, string>>(
    (acc, [dbField, gharHeader]) => {
      if (gharHeader) acc[gharHeader.trim().toLowerCase()] = dbField;
      return acc;
    },
    {}
  );

  return rawRows.map((raw) => {
    const row: Partial<ParsedImportRow> = {};

    for (const [rawHeader, rawValue] of Object.entries(raw)) {
      const dbField = headerToField[rawHeader.trim().toLowerCase()];
      if (!dbField) continue;
      const value = String(rawValue).trim();

      switch (dbField) {
        case 'entry_year':
        case 'year_of_placement':
          row[dbField as 'entry_year' | 'year_of_placement'] = value ? parseInt(value, 10) : undefined;
          break;
        case 'starting_salary':
          row.starting_salary = value ? parseFloat(value.replace(/[^0-9.]/g, '')) : undefined;
          break;
        default:
          (row as any)[dbField] = value || undefined;
      }
    }

    return row as ParsedImportRow;
  });
}
