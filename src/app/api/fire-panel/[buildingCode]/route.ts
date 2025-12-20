import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

// Device status based on cell color
export type DeviceStatus = 'ok' | 'problem' | 'warning';

// Individual device with address and status
export interface DeviceAddress {
  address: number;
  status: DeviceStatus;
}

export interface FirePanelDevice {
  floor: number;
  unit: string;
  detectorAddresses: number[];
  detectorStatuses: DeviceAddress[];
  commonAreaAddresses: number[];
  commonAreaStatuses: DeviceAddress[];
  bellAddress: number | null;
  bellStatus: DeviceStatus | null;
  mcpAddress: number | null;  // Manual Call Point (Гар мэдээлэгч)
  mcpStatus: DeviceStatus | null;
  relayAddress: number | null;
  relayStatus: DeviceStatus | null;
  loop: string | null;
}

export interface FirePanelData {
  buildingCode: string;
  devices: FirePanelDevice[];
  loopSummaries: {
    loop: string;
    totalDetectors: number;
    contaminated: number;
    commFault: number;
    normal: number;
  }[];
  lastUpdated: string | null;
}

// Helper function to get device status from cell style
function getCellStatus(cell: XLSX.CellObject | undefined): DeviceStatus {
  if (!cell || !cell.s) return 'ok';

  const style = cell.s as { fgColor?: { rgb?: string; theme?: number } };
  const fgColor = style.fgColor;

  if (!fgColor) return 'ok';

  // Check for red color (FF0000 or variants)
  if (fgColor.rgb) {
    const rgb = fgColor.rgb.toUpperCase();
    if (rgb.includes('FF0000') || rgb === 'FF0000') {
      return 'problem';
    }
    // Yellow color (FFFF00 or variants)
    if (rgb.includes('FFFF00') || rgb === 'FFFF00') {
      return 'warning';
    }
  }

  // Theme 9 is green (OK)
  if (fgColor.theme === 9) {
    return 'ok';
  }

  return 'ok';
}

// Convert column index to Excel column letter
function getColumnLetter(col: number): string {
  let letter = '';
  while (col >= 0) {
    letter = String.fromCharCode((col % 26) + 65) + letter;
    col = Math.floor(col / 26) - 1;
  }
  return letter;
}

// Column mapping interface
interface ColumnMapping {
  floorCol: number;
  unitCol: number;
  detectorStartCol: number;
  detectorEndCol: number;
  commonAreaStartCol: number;
  commonAreaEndCol: number;
  bellCol: number;
  mcpCol: number;
  relayCol: number;
  loopCol: number;
}

// Detect column positions from header row
function detectColumnMapping(headerRow: (string | number | null)[]): ColumnMapping {
  const mapping: ColumnMapping = {
    floorCol: 0,       // Давхар is always column A
    unitCol: 1,        // Айл is always column B
    detectorStartCol: 2,
    detectorEndCol: 6,
    commonAreaStartCol: 7,
    commonAreaEndCol: 8,
    bellCol: 9,
    mcpCol: 10,
    relayCol: 11,
    loopCol: 12,
  };

  // Find each column by header text
  for (let i = 0; i < headerRow.length; i++) {
    const header = String(headerRow[i] || '').trim();

    if (header === 'Нийтийн эзэмшил' && mapping.commonAreaStartCol === 7) {
      // First occurrence of Нийтийн эзэмшил
      mapping.commonAreaStartCol = i;
      // Detectors end just before common area
      mapping.detectorEndCol = i - 1;
    } else if (header === 'Нийтийн эзэмшил' || header === ' Нийтийн эзэмшил ') {
      // Second occurrence or variant
      mapping.commonAreaEndCol = i;
    } else if (header === 'Хонх') {
      mapping.bellCol = i;
      // Common area ends just before bell if not already set
      if (mapping.commonAreaEndCol < mapping.commonAreaStartCol) {
        mapping.commonAreaEndCol = i - 1;
      }
    } else if (header === 'Гар мэдээлэгч') {
      mapping.mcpCol = i;
    } else if (header === 'Relay') {
      mapping.relayCol = i;
    } else if (header === 'Loop') {
      mapping.loopCol = i;
    }
  }

  return mapping;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ buildingCode: string }> }
) {
  try {
    const { buildingCode } = await params;

    // Path to the Excel file - adjust as needed
    const excelPath = join(process.cwd(), 'Жишиг.xlsm');

    if (!existsSync(excelPath)) {
      return NextResponse.json(
        { error: 'Fire panel data file not found' },
        { status: 404 }
      );
    }

    // Read file as buffer and parse with xlsx (with cell styles)
    const buffer = readFileSync(excelPath);
    const workbook = XLSX.read(buffer, { type: 'buffer', cellStyles: true });

    // Find the sheet that matches the building code
    const sheetName = workbook.SheetNames.find(
      name => name === buildingCode || name.startsWith(buildingCode + '-')
    );

    if (!sheetName) {
      // Return available building codes for debugging
      return NextResponse.json(
        {
          error: 'Building not found in fire panel data',
          availableBuildings: workbook.SheetNames
        },
        { status: 404 }
      );
    }

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number | null)[][];

    // Detect column mapping from header row (row 2, index 1)
    const headerRow = data[1] || [];
    const colMap = detectColumnMapping(headerRow);

    const devices: FirePanelDevice[] = [];
    let currentLoop: string | null = null;
    let currentFloor: number | null = null;

    // Parse data starting from row 4 (index 3) - skip header rows
    for (let i = 3; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const excelRow = i + 1; // Excel rows are 1-indexed

      // Check for floor number (column A, index 0)
      if (row[colMap.floorCol] && typeof row[colMap.floorCol] === 'number') {
        currentFloor = row[colMap.floorCol] as number;
      }

      // Check for loop indicator ONLY in the main loop column (Column 11)
      // Do NOT check summary area columns (Column 18+) as they contain different loop data
      const loopValue = row[colMap.loopCol];
      if (loopValue && typeof loopValue === 'string' && loopValue.startsWith('Loop')) {
        currentLoop = loopValue.trim();
      }

      // Check for unit number
      const unit = row[colMap.unitCol];
      if (!unit) continue;

      // Extract detector addresses with status (dynamic columns)
      const detectorAddresses: number[] = [];
      const detectorStatuses: DeviceAddress[] = [];
      for (let j = colMap.detectorStartCol; j <= colMap.detectorEndCol; j++) {
        const val = row[j];
        if (val && typeof val === 'number') {
          detectorAddresses.push(val);
          // Get cell reference and status
          const cellRef = getColumnLetter(j) + excelRow;
          const cell = worksheet[cellRef];
          const status = getCellStatus(cell);
          detectorStatuses.push({ address: val, status });
        }
      }

      // Extract common area addresses with status (dynamic columns)
      const commonAreaAddresses: number[] = [];
      const commonAreaStatuses: DeviceAddress[] = [];
      for (let j = colMap.commonAreaStartCol; j <= colMap.commonAreaEndCol; j++) {
        const val = row[j];
        if (val && typeof val === 'number') {
          commonAreaAddresses.push(val);
          const cellRef = getColumnLetter(j) + excelRow;
          const cell = worksheet[cellRef];
          const status = getCellStatus(cell);
          commonAreaStatuses.push({ address: val, status });
        }
      }

      // Bell address with status
      const bellAddress = typeof row[colMap.bellCol] === 'number' ? row[colMap.bellCol] as number : null;
      let bellStatus: DeviceStatus | null = null;
      if (bellAddress !== null) {
        const cellRef = getColumnLetter(colMap.bellCol) + excelRow;
        const cell = worksheet[cellRef];
        bellStatus = getCellStatus(cell);
      }

      // MCP address with status
      const mcpAddress = typeof row[colMap.mcpCol] === 'number' ? row[colMap.mcpCol] as number : null;
      let mcpStatus: DeviceStatus | null = null;
      if (mcpAddress !== null) {
        const cellRef = getColumnLetter(colMap.mcpCol) + excelRow;
        const cell = worksheet[cellRef];
        mcpStatus = getCellStatus(cell);
      }

      // Relay address with status
      const relayAddress = typeof row[colMap.relayCol] === 'number' ? row[colMap.relayCol] as number : null;
      let relayStatus: DeviceStatus | null = null;
      if (relayAddress !== null) {
        const cellRef = getColumnLetter(colMap.relayCol) + excelRow;
        const cell = worksheet[cellRef];
        relayStatus = getCellStatus(cell);
      }

      devices.push({
        floor: currentFloor || 1,
        unit: String(unit),
        detectorAddresses,
        detectorStatuses,
        commonAreaAddresses,
        commonAreaStatuses,
        bellAddress,
        bellStatus,
        mcpAddress,
        mcpStatus,
        relayAddress,
        relayStatus,
        loop: currentLoop,
      });
    }

    // Parse loop summaries from right side of sheet
    const loopSummaries: FirePanelData['loopSummaries'] = [];

    // Find all loop summary blocks - they can be in different columns
    // Look for "Нийт мэдрэгч" pattern to identify summary areas
    for (let i = 3; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;

      // Search for loop info in each column
      for (let j = colMap.loopCol; j < row.length; j++) {
        const cellValue = row[j];
        if (cellValue && typeof cellValue === 'string' && cellValue.startsWith('Loop')) {
          const loopName = cellValue;

          // Look for "Нийт мэдрэгч" to find total detectors
          let totalDetectors = 0;
          let contaminated = 0;
          let commFault = 0;
          let normal = 0;

          // Search nearby cells for statistics
          for (let k = j; k < Math.min(row.length, j + 5); k++) {
            if (row[k] === 'Нийт мэдрэгч' && typeof row[k + 1] === 'number') {
              totalDetectors = row[k + 1] as number;
            }
          }

          // Search next few rows for status data
          for (let m = i; m < Math.min(i + 5, data.length); m++) {
            const statusRow = data[m];
            if (!statusRow) continue;

            for (let k = j - 2; k < Math.min(statusRow.length, j + 5); k++) {
              const label = statusRow[k];
              const value = typeof statusRow[k + 1] === 'number' ? statusRow[k + 1] as number : 0;

              if (label === 'Бохирдсон') contaminated = value;
              else if (label === ' Comm Fault') commFault = value;
              else if (label === 'Хэвийн') normal = value;
            }
          }

          // Only add if we haven't already added this loop
          if (!loopSummaries.find(s => s.loop === loopName)) {
            loopSummaries.push({
              loop: loopName,
              totalDetectors,
              contaminated,
              commFault,
              normal,
            });
          }
        }
      }
    }

    // Sort loop summaries by loop number
    loopSummaries.sort((a, b) => {
      const numA = parseInt(a.loop.replace('Loop ', '')) || 0;
      const numB = parseInt(b.loop.replace('Loop ', '')) || 0;
      return numA - numB;
    });

    const result: FirePanelData = {
      buildingCode: sheetName,
      devices,
      loopSummaries,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error reading fire panel data:', error);
    return NextResponse.json(
      { error: 'Failed to read fire panel data' },
      { status: 500 }
    );
  }
}
