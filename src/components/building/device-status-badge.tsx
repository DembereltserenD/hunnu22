'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type DeviceStatus = 'ok' | 'problem' | 'warning';
export type DeviceType = 'detector' | 'commonArea' | 'bell' | 'mcp' | 'relay';

export interface DeviceHistoryEntry {
    id: string;
    unit_number: string;
    detector_address: number;
    device_type: DeviceType;
    old_status: DeviceStatus | null;
    new_status: DeviceStatus;
    changed_by_name: string | null;
    changed_at: string | null;
}

interface DeviceStatusBadgeProps {
    address: number;
    status: DeviceStatus;
    size?: 'sm' | 'md';
    isAdmin?: boolean;
    onStatusChange?: (address: number, currentStatus: DeviceStatus, nextStatus: DeviceStatus) => void;
    unitNumber?: string;
    deviceType?: DeviceType;
    history?: DeviceHistoryEntry[];
    buildingName?: string;
}

const STATUS_LABELS: Record<DeviceStatus, string> = {
    ok: 'Хэвийн',
    problem: 'Бохирдсон',
    warning: '\u0410\u0441\u0443\u0443\u0434\u0430\u043B\u0442\u0430\u0439',
};

const STATUS_ORDER: DeviceStatus[] = ['ok', 'warning', 'problem'];

export function DeviceStatusBadge({
    address,
    status,
    size = 'sm',
    onStatusChange,
}: DeviceStatusBadgeProps) {
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
    const clickableClass = onStatusChange
        ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-blue-500 transition-all active:scale-95'
        : '';

    const badge = (
        <span
            className={`font-mono ${sizeClass} rounded ${getStatusStyles(status)} ${clickableClass}`}
            role={onStatusChange ? 'button' : undefined}
            tabIndex={onStatusChange ? 0 : undefined}
        >
            {address}
        </span>
    );

    if (onStatusChange) {
        const handleStatusSelect = (nextStatus: DeviceStatus) => {
            if (nextStatus === status) return;
            onStatusChange(address, status, nextStatus);
        };

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    {badge}
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-48">
                    <DropdownMenuRadioGroup value={status} onValueChange={(value) => handleStatusSelect(value as DeviceStatus)}>
                        {STATUS_ORDER.map((option) => (
                            <DropdownMenuRadioItem key={option} value={option}>
                                {STATUS_LABELS[option]}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return badge;
}



