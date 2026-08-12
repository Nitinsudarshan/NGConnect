import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

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
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Learner Activity', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  // Column widths
  ws.columns = [
    { header: TEMPLATE_HEADERS[0], width: 20 }, // Name
    { header: TEMPLATE_HEADERS[1], width: 30 }, // Email
    { header: TEMPLATE_HEADERS[2], width: 40 }, // Course
    { header: TEMPLATE_HEADERS[3], width: 26 }, // Course ID
    { header: TEMPLATE_HEADERS[4], width: 36 }, // Course Slug
    { header: TEMPLATE_HEADERS[5], width: 20 }, // University
    { header: TEMPLATE_HEADERS[6], width: 22 }, // Enrollment Time
    { header: TEMPLATE_HEADERS[7], width: 26 }, // Last Course Activity Time
    { header: TEMPLATE_HEADERS[8], width: 18 }, // Overall Progress
    { header: TEMPLATE_HEADERS[9], width: 12 }, // Completed
    { header: TEMPLATE_HEADERS[10], width: 22 }, // Removed From Program
    { header: TEMPLATE_HEADERS[11], width: 20 }, // Program Name
    { header: TEMPLATE_HEADERS[12], width: 20 }, // Completion Time
    { header: TEMPLATE_HEADERS[13], width: 14 }, // Course Grade
    { header: TEMPLATE_HEADERS[14], width: 40 }, // Course Certificate URL
    { header: TEMPLATE_HEADERS[15], width: 16 }, // Learning Hours
    { header: TEMPLATE_HEADERS[16], width: 20 }, // Course Type
  ];

  ws.addRow(EXAMPLE_ROW);

  const buf = await workbook.xlsx.writeBuffer();

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="coursera_upload_template.xlsx"',
    },
  });
}
