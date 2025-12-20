'use client';

import { DeviceStatusBadge, DeviceStatus } from './device-status-badge';

interface DeviceAddress {
    address: number;
    status: DeviceStatus;
}

interface DeviceGroupProps {
    devices: DeviceAddress[];
    emptyText?: string;
}

export function DeviceGroup({ devices, emptyText = "-" }: DeviceGroupProps) {
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
                />
            ))}
        </div>
    );
}