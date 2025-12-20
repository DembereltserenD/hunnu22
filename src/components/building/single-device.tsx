'use client';

import { DeviceStatusBadge, DeviceStatus } from './device-status-badge';

interface SingleDeviceProps {
    address: number | null;
    status: DeviceStatus | null;
    emptyText?: string;
}

export function SingleDevice({ address, status, emptyText = "-" }: SingleDeviceProps) {
    if (!address) {
        return <span className="text-slate-400 text-xs">{emptyText}</span>;
    }

    return (
        <DeviceStatusBadge
            address={address}
            status={status || 'ok'}
        />
    );
}