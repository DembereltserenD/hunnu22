'use client';

import { DeviceStatusBadge, DeviceStatus, DeviceType, DeviceHistoryEntry } from './device-status-badge';

interface SingleDeviceProps {
    address: number | null;
    status: DeviceStatus | null;
    emptyText?: string;
    isAdmin?: boolean;
    onStatusChange?: (address: number, currentStatus: DeviceStatus, nextStatus: DeviceStatus) => void;
    unitNumber?: string;
    deviceType?: DeviceType;
    history?: DeviceHistoryEntry[];
    buildingName?: string;
}

export function SingleDevice({
    address,
    status,
    emptyText = "-",
    isAdmin = false,
    onStatusChange,
    unitNumber,
    deviceType = 'detector',
    history = [],
    buildingName,
}: SingleDeviceProps) {
    if (!address) {
        return <span className="text-slate-400 text-xs">{emptyText}</span>;
    }

    return (
        <DeviceStatusBadge
            address={address}
            status={status || 'ok'}
            isAdmin={isAdmin}
            onStatusChange={onStatusChange}
            unitNumber={unitNumber}
            deviceType={deviceType}
            history={history}
            buildingName={buildingName}
        />
    );
}
