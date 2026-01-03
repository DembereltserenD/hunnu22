import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

// Device status based on cell color
type DeviceStatus = 'ok' | 'problem' | 'warning';

interface DeviceInfo {
  address: string;
  status: DeviceStatus;
}

interface ApartmentFromXlsm {
  id: string;
  unit_number: string;
  floor: number;
  smoke_detector_count: number;
  smoke_detector_addresses: string[];
  smoke_detectors: DeviceInfo[];
  smoke_detector_loops: string[];
  // Additional device info
  common_area_devices: DeviceInfo[];
  bell: DeviceInfo | null;
  mcp: DeviceInfo | null;  // Manual Call Point
  relay: DeviceInfo | null;
  // Status summary
  has_problem: boolean;
  has_warning: boolean;
  problem_count: number;
  warning_count: number;
  building: {
    id: string;
    name: string;
    address: string;
    total_units: number;
    created_at: string;
    updated_at: string;
  };
  created_at: string;
  updated_at: string;
}

interface BuildingData {
  code: string;
  apartments: ApartmentFromXlsm[];
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

// Helper function to get device status from cell style
function getCellStatus(cell: XLSX.CellObject | undefined): DeviceStatus {
  if (!cell || !cell.s) return 'ok';

  const style = cell.s as { fgColor?: { rgb?: string; theme?: number } };
  const fgColor = style.fgColor;

  if (!fgColor) return 'ok';

  // Check for red color (problem)
  if (fgColor.rgb) {
    const rgb = fgColor.rgb.toUpperCase();
    if (rgb.includes('FF0000') || rgb === 'FF0000') {
      return 'problem';
    }
    // Yellow color (warning)
    if (rgb.includes('FFFF00') || rgb === 'FFFF00') {
      return 'warning';
    }
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

// Detect column positions from header row
function detectColumnMapping(headerRow: (string | number | null)[]): ColumnMapping {
  const mapping: ColumnMapping = {
    floorCol: 0,
    unitCol: 1,
    detectorStartCol: 2,
    detectorEndCol: 6, // Will be adjusted based on actual headers
    commonAreaStartCol: 7,
    commonAreaEndCol: 8,
    bellCol: 9,
    mcpCol: 10,
    relayCol: 11,
    loopCol: 12,
  };

  let commonAreaFound = false;

  for (let i = 0; i < headerRow.length; i++) {
    const header = String(headerRow[i] || '').trim();

    if (header === 'Нийтийн эзэмшил' && !commonAreaFound) {
      // First occurrence of "Нийтийн эзэмшил" marks the start of common area
      mapping.commonAreaStartCol = i;
      mapping.detectorEndCol = i - 1; // Smoke detectors end before common area starts
      commonAreaFound = true;
    } else if (header === 'Нийтийн эзэмшил' && commonAreaFound) {
      // Second occurrence marks the end of common area
      mapping.commonAreaEndCol = i;
    } else if (header === 'Хонх') {
      mapping.bellCol = i;
      if (!commonAreaFound) {
        // If no common area found yet, assume detectors end before bell
        mapping.detectorEndCol = i - 1;
      }
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

  // Debug logging to see the actual mapping (remove in production)
  // console.log('Column mapping detected:', mapping);
  // console.log('Header row:', headerRow);

  return mapping;
}

function parseBuilding(workbook: XLSX.WorkBook, sheetName: string): BuildingData {
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number | null)[][];

  const headerRow = data[1] || [];
  const colMap = detectColumnMapping(headerRow);

  const apartments: ApartmentFromXlsm[] = [];
  let currentLoop: string | null = null;
  let currentFloor: number | null = null;
  const now = new Date().toISOString();

  const building = {
    id: sheetName,
    name: sheetName,
    address: sheetName,
    total_units: 0,
    created_at: now,
    updated_at: now,
  };

  for (let i = 3; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const excelRow = i + 1;

    if (row[colMap.floorCol] && typeof row[colMap.floorCol] === 'number') {
      currentFloor = row[colMap.floorCol] as number;
    }

    const loopValue = row[colMap.loopCol];
    if (loopValue && typeof loopValue === 'string' && loopValue.startsWith('Loop')) {
      currentLoop = loopValue.trim();
    }

    const unit = row[colMap.unitCol];
    if (!unit) continue;

    // Extract smoke detectors with status
    const detectorAddresses: string[] = [];
    const smokeDetectors: DeviceInfo[] = [];
    for (let j = colMap.detectorStartCol; j <= colMap.detectorEndCol; j++) {
      const val = row[j];
      if (val && typeof val === 'number') {
        const addr = String(val);
        detectorAddresses.push(addr);
        const cellRef = getColumnLetter(j) + excelRow;
        const cell = worksheet[cellRef];
        smokeDetectors.push({ address: addr, status: getCellStatus(cell) });
      }
    }

    // Extract common area devices with status
    const commonAreaDevices: DeviceInfo[] = [];
    for (let j = colMap.commonAreaStartCol; j <= colMap.commonAreaEndCol; j++) {
      const val = row[j];
      if (val && typeof val === 'number') {
        const cellRef = getColumnLetter(j) + excelRow;
        const cell = worksheet[cellRef];
        commonAreaDevices.push({ address: String(val), status: getCellStatus(cell) });
      }
    }

    // Bell
    let bell: DeviceInfo | null = null;
    if (typeof row[colMap.bellCol] === 'number') {
      const cellRef = getColumnLetter(colMap.bellCol) + excelRow;
      const cell = worksheet[cellRef];
      bell = { address: String(row[colMap.bellCol]), status: getCellStatus(cell) };
    }

    // MCP (Manual Call Point)
    let mcp: DeviceInfo | null = null;
    if (typeof row[colMap.mcpCol] === 'number') {
      const cellRef = getColumnLetter(colMap.mcpCol) + excelRow;
      const cell = worksheet[cellRef];
      mcp = { address: String(row[colMap.mcpCol]), status: getCellStatus(cell) };
    }

    // Relay
    let relay: DeviceInfo | null = null;
    if (typeof row[colMap.relayCol] === 'number') {
      const cellRef = getColumnLetter(colMap.relayCol) + excelRow;
      const cell = worksheet[cellRef];
      relay = { address: String(row[colMap.relayCol]), status: getCellStatus(cell) };
    }

    // Calculate status summary - exclude common area devices from problem calculation
    const allDevices = [...smokeDetectors]; // Only include smoke detectors
    if (bell) allDevices.push(bell);
    if (mcp) allDevices.push(mcp);
    if (relay) allDevices.push(relay);

    const problemCount = allDevices.filter(d => d.status === 'problem').length;
    const warningCount = allDevices.filter(d => d.status === 'warning').length;

    const unitStr = String(unit);
    apartments.push({
      id: `${sheetName}-${unitStr}`,
      unit_number: unitStr,
      floor: currentFloor || 1,
      smoke_detector_count: smokeDetectors.length,
      smoke_detector_addresses: detectorAddresses,
      smoke_detectors: smokeDetectors,
      smoke_detector_loops: currentLoop ? [currentLoop] : [],
      common_area_devices: commonAreaDevices,
      bell,
      mcp,
      relay,
      has_problem: problemCount > 0,
      has_warning: warningCount > 0,
      problem_count: problemCount,
      warning_count: warningCount,
      building,
      created_at: now,
      updated_at: now,
    });
  }

  building.total_units = apartments.length;

  return {
    code: sheetName,
    apartments,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const buildingId = searchParams.get('building_id') || '';
    const floorFilter = searchParams.get('floor');
    const statusFilter = searchParams.get('status'); // 'problem', 'warning', 'ok'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000');

    const excelPath = join(process.cwd(), 'Жишиг.xlsm');

    if (!existsSync(excelPath)) {
      return NextResponse.json(
        { error: 'Fire panel data file not found', data: [], totalPages: 0, page: 1, total: 0 },
        { status: 404 }
      );
    }

    const buffer = readFileSync(excelPath);
    const workbook = XLSX.read(buffer, { type: 'buffer', cellStyles: true });

    let allApartments: ApartmentFromXlsm[] = [];

    for (const sheetName of workbook.SheetNames) {
      const buildingData = parseBuilding(workbook, sheetName);
      allApartments = allApartments.concat(buildingData.apartments);
    }

    let filteredApartments = allApartments;

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filteredApartments = filteredApartments.filter(apt =>
        apt.unit_number.toLowerCase().includes(searchLower) ||
        apt.building.name.toLowerCase().includes(searchLower) ||
        apt.smoke_detector_addresses.some(addr => addr.includes(search))
      );
    }

    // Filter by building
    if (buildingId) {
      filteredApartments = filteredApartments.filter(apt =>
        apt.building.id === buildingId
      );
    }

    // Filter by floor
    if (floorFilter) {
      const floorNum = parseInt(floorFilter);
      if (!isNaN(floorNum)) {
        filteredApartments = filteredApartments.filter(apt => apt.floor === floorNum);
      }
    }

    // Filter by status
    if (statusFilter === 'problem') {
      filteredApartments = filteredApartments.filter(apt => apt.has_problem);
    } else if (statusFilter === 'warning') {
      filteredApartments = filteredApartments.filter(apt => apt.has_warning);
    } else if (statusFilter === 'ok') {
      filteredApartments = filteredApartments.filter(apt => !apt.has_problem && !apt.has_warning);
    }

    // Sort: problems first, then warnings, then ok
    filteredApartments.sort((a, b) => {
      // First by problem status
      if (a.has_problem !== b.has_problem) return a.has_problem ? -1 : 1;
      if (a.has_warning !== b.has_warning) return a.has_warning ? -1 : 1;
      // Then by building
      if (a.building.name !== b.building.name) {
        return a.building.name.localeCompare(b.building.name);
      }
      // Then by floor
      if (a.floor !== b.floor) return a.floor - b.floor;
      // Then by unit
      return a.unit_number.localeCompare(b.unit_number);
    });

    // Calculate summary stats
    const stats = {
      total: allApartments.length,
      withProblems: allApartments.filter(a => a.has_problem).length,
      withWarnings: allApartments.filter(a => a.has_warning && !a.has_problem).length,
      ok: allApartments.filter(a => !a.has_problem && !a.has_warning).length,
    };

    const total = filteredApartments.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedApartments = filteredApartments.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      data: paginatedApartments,
      total,
      page,
      limit,
      totalPages,
      stats,
    });
  } catch (error) {
    console.error('Error reading apartments from XLSM:', error);
    return NextResponse.json(
      { error: 'Failed to read apartments data', data: [], totalPages: 0, page: 1, total: 0 },
      { status: 500 }
    );
  }
}

// Get list of buildings from XLSM for filter dropdown
export async function POST() {
  try {
    const excelPath = join(process.cwd(), 'Жишиг.xlsm');

    if (!existsSync(excelPath)) {
      return NextResponse.json({ buildings: [] });
    }

    const buffer = readFileSync(excelPath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const buildings = workbook.SheetNames.map(name => ({
      id: name,
      name: name,
      address: name,
    }));

    return NextResponse.json({ buildings });
  } catch (error) {
    console.error('Error reading buildings from XLSM:', error);
    return NextResponse.json({ buildings: [] });
  }
}
