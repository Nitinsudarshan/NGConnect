import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

const TEMPLATE_HEADERS = [
  'Name',
  'Email',
  'Course',
  'Course ID',
  'Course Slug',
  'University',
  'Enrollment Time',
  'Last Course Activity Time',
  'Overall Progress',
  'Completed',
  'Removed From Program',
  'Program Name',
  'Completion Time',
  'Course Grade',
  'Course Certificate URL',
  'Learning Hours',
  'Course Type',
];

const EXAMPLE_ROW = [
  'Anjali Tiwari',
  'anjalit22@navgurukul.org',
  'Neural Networks and Deep Learning',
  'W_mOXCrdEeeNPQ68_4aPpA',
  'neural-networks-deep-learning',
  'DeepLearning.AI',
  '2024-01-26 10:16:04',
  '2024-01-26 10:26:59',
  1.41,
  'No',
  'No',
  'NavGurukul',
  '',
  0.0,
  '',
  0.73,
  'Course',
];

export async function GET() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, EXAMPLE_ROW]);

  // Column widths
  const colWidths = [
    { wch: 20 }, // Name
    { wch: 30 }, // Email
    { wch: 40 }, // Course
    { wch: 26 }, // Course ID
    { wch: 36 }, // Course Slug
    { wch: 20 }, // University
    { wch: 22 }, // Enrollment Time
    { wch: 26 }, // Last Course Activity Time
    { wch: 18 }, // Overall Progress
    { wch: 12 }, // Completed
    { wch: 22 }, // Removed From Program
    { wch: 20 }, // Program Name
    { wch: 20 }, // Completion Time
    { wch: 14 }, // Course Grade
    { wch: 40 }, // Course Certificate URL
    { wch: 16 }, // Learning Hours
    { wch: 20 }, // Course Type
  ];
  ws['!cols'] = colWidths;

  // Freeze first row
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  XLSX.utils.book_append_sheet(wb, ws, 'Learner Activity');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="coursera_upload_template.xlsx"',
    },
  });
}
