'use client';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowRight } from "lucide-react";

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
    onToggle?: (address: number, currentStatus: DeviceStatus) => void;
    unitNumber?: string;
    deviceType?: DeviceType;
    history?: DeviceHistoryEntry[];
    buildingName?: string;
}

const STATUS_LABELS: Record<DeviceStatus, string> = {
    ok: 'Хэвийн',
    problem: 'Бохирдсон',
    warning: 'Анхааруулга',
};

const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
    detector: 'Мэдрэгч',
    commonArea: 'Нийтийн эзэмшил',
    bell: 'Хонх',
    mcp: 'Гар мэдээлэгч',
    relay: 'Relay',
};

export function DeviceStatusBadge({
    address,
    status,
    size = 'sm',
    isAdmin = false,
    onToggle,
    unitNumber,
    deviceType = 'detector',
    history = [],
    buildingName,
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
    const clickableClass = isAdmin && onToggle
        ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-blue-500 transition-all active:scale-95'
        : '';

    const handleClick = (e: React.MouseEvent) => {
        if (isAdmin && onToggle) {
            e.preventDefault();
            e.stopPropagation();
            onToggle(address, status);
        }
    };

    // Filter history for this specific device
    // Handle legacy data where device_type might be null/undefined (defaults to 'detector')
    const deviceHistory = history.filter(
        h => h.detector_address === address &&
            (h.device_type === deviceType || (!h.device_type && deviceType === 'detector')) &&
            h.unit_number === unitNumber
    ).slice(0, 5); // Show last 5 changes

    const badge = (
        <span
            className={`font-mono ${sizeClass} rounded ${getStatusStyles(status)} ${clickableClass}`}
            onClick={handleClick}
            role={isAdmin && onToggle ? 'button' : undefined}
            tabIndex={isAdmin && onToggle ? 0 : undefined}
        >
            {address}
        </span>
    );

    // If admin and has history, show tooltip
    if (isAdmin && (deviceHistory.length > 0 || onToggle)) {
        return (
            <TooltipProvider delayDuration={300}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {badge}
                    </TooltipTrigger>
                    <TooltipContent
                        side="top"
                        className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-3 max-w-xs shadow-lg border border-slate-200 dark:border-slate-700"
                    >
                        <div className="space-y-2">
                            <div className="font-medium text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
                                {buildingName && <span className="text-blue-600 dark:text-blue-400">{buildingName}</span>}
                                {buildingName && ' - '}
                                <span>{unitNumber} тоот</span>
                                {' - '}
                                <span className="text-slate-500">{DEVICE_TYPE_LABELS[deviceType]} #{address}</span>
                            </div>

                            {deviceHistory.length > 0 ? (
                                <div className="space-y-1.5">
                                    <div className="text-xs text-slate-500 font-medium">Өөрчлөлтийн түүх:</div>
                                    {deviceHistory.map((entry) => (
                                        <div key={entry.id} className="text-xs py-1.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className={`px-1 py-0.5 rounded ${getStatusStyles(entry.old_status || 'ok')}`}>
                                                    {entry.old_status ? STATUS_LABELS[entry.old_status] : '-'}
                                                </span>
                                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                                <span className={`px-1 py-0.5 rounded ${getStatusStyles(entry.new_status)}`}>
                                                    {STATUS_LABELS[entry.new_status]}
                                                </span>
                                            </div>
                                            <div className="text-slate-500 flex items-center justify-between">
                                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                                    {entry.changed_by_name || 'Admin'}
                                                </span>
                                                <span>
                                                    {entry.changed_at
                                                        ? new Date(entry.changed_at).toLocaleDateString('mn-MN', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })
                                                        : ''}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-slate-500">Өөрчлөлт хийгдээгүй байна</div>
                            )}

                            {onToggle && (
                                <div className="text-xs text-blue-600 dark:text-blue-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                                    Дарж статус өөрчлөх
                                </div>
                            )}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return badge;
}