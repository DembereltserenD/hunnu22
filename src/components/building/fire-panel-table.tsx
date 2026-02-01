'use client';

import { Badge } from "@/components/ui/badge";
import { DeviceGroup } from './device-group';
import { SingleDevice } from './single-device';
import { DeviceStatus, DeviceType, DeviceHistoryEntry } from './device-status-badge';

interface DeviceAddress {
    address: number;
    status: DeviceStatus;
}

interface FirePanelDevice {
    floor: number;
    unit: string;
    loop: string | null;
    detectors: DeviceAddress[];
    commonArea: DeviceAddress[];
    bell: { address: number; status: DeviceStatus } | null;
    mcp: { address: number; status: DeviceStatus } | null;
    relay: { address: number; status: DeviceStatus } | null;
    hasProblems: boolean;
}

interface FirePanelTableProps {
    units: FirePanelDevice[];
    isAdmin?: boolean;
    onDeviceStatusChange?: (unitNumber: string, address: number, deviceType: DeviceType, currentStatus: DeviceStatus, nextStatus: DeviceStatus) => void;
    history?: DeviceHistoryEntry[];
    buildingName?: string;
}

export function FirePanelTable({
    units,
    isAdmin = false,
    onDeviceStatusChange,
    history = [],
    buildingName,
}: FirePanelTableProps) {
    if (units.length === 0) {
        return (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800">
                            <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Давхар</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Айл</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Мэдрэгч</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Нийтийн эзэмшил</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Хонх</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Гар мэдээлэгч</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Relay</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Loop</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                                Төхөөрөмж олдсонгүй
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[900px]">
                <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800">
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Давхар</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Айл</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Мэдрэгч</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Нийтийн эзэмшил</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Хонх</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Гар мэдээлэгч</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Relay</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Loop</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {units.map((unit, index) => (
                        <tr
                            key={`${unit.unit}-${index}`}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${unit.hasProblems ? 'bg-red-50 dark:bg-red-900/10' : ''
                                }`}
                        >
                            <td className="px-3 py-2">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {unit.floor}
                                </span>
                            </td>
                            <td className="px-3 py-2">
                                <span className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400">
                                    {unit.unit}
                                </span>
                            </td>
                            <td className="px-3 py-2">
                                <DeviceGroup
                                    devices={unit.detectors}
                                    isAdmin={isAdmin}
                                    onStatusChange={onDeviceStatusChange
                                        ? (address, status, nextStatus) => onDeviceStatusChange(unit.unit, address, 'detector', status, nextStatus)
                                        : undefined
                                    }
                                    unitNumber={unit.unit}
                                    deviceType="detector"
                                    history={history}
                                    buildingName={buildingName}
                                />
                            </td>
                            <td className="px-3 py-2">
                                <DeviceGroup
                                    devices={unit.commonArea}
                                    isAdmin={isAdmin}
                                    onStatusChange={onDeviceStatusChange
                                        ? (address, status, nextStatus) => onDeviceStatusChange(unit.unit, address, 'commonArea', status, nextStatus)
                                        : undefined
                                    }
                                    unitNumber={unit.unit}
                                    deviceType="commonArea"
                                    history={history}
                                    buildingName={buildingName}
                                />
                            </td>
                            <td className="px-3 py-2">
                                <SingleDevice
                                    address={unit.bell?.address || null}
                                    status={unit.bell?.status || null}
                                    isAdmin={isAdmin}
                                    onStatusChange={onDeviceStatusChange && unit.bell
                                        ? (address, status, nextStatus) => onDeviceStatusChange(unit.unit, address, 'bell', status, nextStatus)
                                        : undefined
                                    }
                                    unitNumber={unit.unit}
                                    deviceType="bell"
                                    history={history}
                                    buildingName={buildingName}
                                />
                            </td>
                            <td className="px-3 py-2">
                                <SingleDevice
                                    address={unit.mcp?.address || null}
                                    status={unit.mcp?.status || null}
                                    isAdmin={isAdmin}
                                    onStatusChange={onDeviceStatusChange && unit.mcp
                                        ? (address, status, nextStatus) => onDeviceStatusChange(unit.unit, address, 'mcp', status, nextStatus)
                                        : undefined
                                    }
                                    unitNumber={unit.unit}
                                    deviceType="mcp"
                                    history={history}
                                    buildingName={buildingName}
                                />
                            </td>
                            <td className="px-3 py-2">
                                <SingleDevice
                                    address={unit.relay?.address || null}
                                    status={unit.relay?.status || null}
                                    isAdmin={isAdmin}
                                    onStatusChange={onDeviceStatusChange && unit.relay
                                        ? (address, status, nextStatus) => onDeviceStatusChange(unit.unit, address, 'relay', status, nextStatus)
                                        : undefined
                                    }
                                    unitNumber={unit.unit}
                                    deviceType="relay"
                                    history={history}
                                    buildingName={buildingName}
                                />
                            </td>
                            <td className="px-3 py-2">
                                <Badge className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                    {unit.loop || 'Unknown'}
                                </Badge>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
