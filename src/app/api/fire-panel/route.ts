import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const excelPath = join(process.cwd(), 'Жишиг.xlsm');

    if (!existsSync(excelPath)) {
      return NextResponse.json(
        { error: 'Fire panel data file not found', buildings: [] },
        { status: 404 }
      );
    }

    // Read file as buffer and parse with xlsx
    const buffer = readFileSync(excelPath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    return NextResponse.json({
      buildings: workbook.SheetNames,
      file: 'Жишиг.xlsm'
    });
  } catch (error) {
    console.error('Error reading fire panel data:', error);
    return NextResponse.json(
      { error: 'Failed to read fire panel data', buildings: [] },
      { status: 500 }
    );
  }
}
