'use client';

import { useMemo } from 'react';

export type DeviceStatus = 'ok' | 'problem' | 'warning';

interface DeviceAddress {
  address: number;
  status: DeviceStatus;
}

interface FirePanelDevice {
  floor: number;
  unit: string;
  detectorAddresses: number[];
  detectorStatuses: DeviceAddress[];
  commonAreaAddresses: number[];
  commonAreaStatuses: DeviceAddress[];
  bellAddress: number | null;
  bellStatus: DeviceStatus | null;
  mcpAddress: number | null;
  mcpStatus: DeviceStatus | null;
  relayAddress: number | null;
  relayStatus: DeviceStatus | null;
  loop: string | null;
}

interface FirePanelData {
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

interface ProcessedUnitData {
  floor: number;
  unit: string;
  loop: string;
  detectors: DeviceAddress[];
  commonArea: DeviceAddress[];
  bell: { address: number; status: DeviceStatus } | null;
  mcp: { address: number; status: DeviceStatus } | null;
  relay: { address: number; status: DeviceStatus } | null;
  hasProblems: boolean;
}

interface FirePanelStats {
  totalDevices: number;
  contaminated: number;
  commFault: number;
  normal: number;
}

interface ProcessedFirePanelData {
  unitRows: ProcessedUnitData[];
  availableLoops: string[];
  stats: FirePanelStats;
  problemStats: {
    problems: number;
    warnings: number;
    ok: number;
    total: number;
  };
}

export function useFirePanelData(firePanelData: FirePanelData | null): ProcessedFirePanelData {
  return useMemo(() => {
    if (!firePanelData?.devices) {
      return {
        unitRows: [],
        availableLoops: [],
        stats: { totalDevices: 0, contaminated: 0, commFault: 0, normal: 0 },
        problemStats: { problems: 0, warnings: 0, ok: 0, total: 0 }
      };
    }

    // Process unit rows
    const unitRows: ProcessedUnitData[] = firePanelData.devices.map(device => {
      const detectors = device.detectorStatuses?.length > 0 
        ? device.detectorStatuses 
        : device.detectorAddresses.map(addr => ({ address: addr, status: 'ok' as DeviceStatus }));
      
      const commonArea = device.commonAreaStatuses?.length > 0 
        ? device.commonAreaStatuses 
        : device.commonAreaAddresses.map(addr => ({ address: addr, status: 'ok' as DeviceStatus }));

      const hasProblems = (
        detectors.some(d => d.status !== 'ok') ||
        commonArea.some(d => d.status !== 'ok') ||
        (device.bellStatus && device.bellStatus !== 'ok') ||
        (device.mcpStatus && device.mcpStatus !== 'ok') ||
        (device.relayStatus && device.relayStatus !== 'ok')
      ) || false;

      return {
        floor: device.floor,
        unit: device.unit,
        loop: device.loop || 'Unknown',
        detectors,
        commonArea,
        bell: device.bellAddress ? { address: device.bellAddress, status: device.bellStatus || 'ok' } : null,
        mcp: device.mcpAddress ? { address: device.mcpAddress, status: device.mcpStatus || 'ok' } : null,
        relay: device.relayAddress ? { address: device.relayAddress, status: device.relayStatus || 'ok' } : null,
        hasProblems
      };
    });

    // Get available loops
    const loops = new Set<string>();
    firePanelData.devices.forEach(device => {
      if (device.loop) loops.add(device.loop);
    });
    const availableLoops = Array.from(loops).sort();

    // Calculate problem stats from unit data - categorize by actual device status
    let problems = 0;
    let warnings = 0;
    let ok = 0;
    let total = 0;
    let contaminated = 0;
    let commFault = 0;

    unitRows.forEach(unit => {
      unit.detectors.forEach(d => {
        total++;
        if (d.status === 'problem') {
          problems++;
          contaminated++; // Treat 'problem' status as contaminated for detectors
        } else if (d.status === 'warning') {
          warnings++;
          commFault++; // Treat 'warning' status as communication fault
        } else {
          ok++;
        }
      });
      
      unit.commonArea.forEach(d => {
        total++;
        if (d.status === 'problem') {
          problems++;
          contaminated++;
        } else if (d.status === 'warning') {
          warnings++;
          commFault++;
        } else {
          ok++;
        }
      });

      if (unit.bell) {
        total++;
        if (unit.bell.status === 'problem') {
          problems++;
          contaminated++;
        } else if (unit.bell.status === 'warning') {
          warnings++;
          commFault++;
        } else {
          ok++;
        }
      }

      if (unit.mcp) {
        total++;
        if (unit.mcp.status === 'problem') {
          problems++;
          contaminated++;
        } else if (unit.mcp.status === 'warning') {
          warnings++;
          commFault++;
        } else {
          ok++;
        }
      }

      if (unit.relay) {
        total++;
        if (unit.relay.status === 'problem') {
          problems++;
          contaminated++;
        } else if (unit.relay.status === 'warning') {
          warnings++;
          commFault++;
        } else {
          ok++;
        }
      }
    });

    // Use our calculated stats for consistency
    const stats = {
      totalDevices: total,
      contaminated: contaminated,
      commFault: commFault,
      normal: ok
    };

    return {
      unitRows,
      availableLoops,
      stats,
      problemStats: { problems, warnings, ok, total }
    };
  }, [firePanelData]);
}