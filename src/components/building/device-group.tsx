'use client';

import { DeviceStatusBadge, DeviceStatus, DeviceType, DeviceHistoryEntry } from './device-status-badge';

interface DeviceAddress {
    address: number;
    status: DeviceStatus;
}

interface DeviceGroupProps {
    devices: DeviceAddress[];
    emptyText?: string;
    isAdmin?: boolean;
    onToggle?: (address: number, currentStatus: DeviceStatus) => void;
    unitNumber?: string;
    deviceType?: DeviceType;
    history?: DeviceHistoryEntry[];
    buildingName?: string;
}

export function DeviceGroup({
    devices,
    emptyText = "-",
    isAdmin = false,
    onToggle,
    unitNumber,
    deviceType = 'detector',
    history = [],
    buildingName,
}: DeviceGroupProps) {
    if (!devices || devices.length === 0) {
        return <span className="text-slate-400 text-xs">{emptyText}</span>;
    }

    return (
        <div className="flex flex-wrap gap-1">
            {devices.map((device, idx) => (
                <DeviceStatusBadge
                    key={idx}
                    address={device.address}
                    status={device.status}
                    isAdmin={isAdmin}
                    onToggle={onToggle}
                    unitNumber={unitNumber}
                    deviceType={deviceType}
                    history={history}
                    buildingName={buildingName}
                />
            ))}
        </div>
    );
}