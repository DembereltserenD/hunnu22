'use client';

import { Badge } from "@/components/ui/badge";

export type DeviceStatus = 'ok' | 'problem' | 'warning';

interface DeviceStatusBadgeProps {
    address: number;
    status: DeviceStatus;
    size?: 'sm' | 'md';
}

export function DeviceStatusBadge({ address, status, size = 'sm' }: DeviceStatusBadgeProps) {
    const getStatusStyles = (status: DeviceStatus) => {
        switch (status) {
            case 'ok':
                return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'problem':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'warning':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
        }
    };

    const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';

    return (
        <span
            className={`font-mono ${sizeClass} rounded ${getStatusStyles(status)}`}
        >
            {address}
        </span>
    );
}