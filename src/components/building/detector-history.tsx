'use client';

import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight } from "lucide-react";

type DeviceStatus = 'ok' | 'problem' | 'warning';

interface HistoryEntry {
    id: string;
    building_id: string;
    unit_number: string;
    detector_address: number;
    old_status: DeviceStatus | null;
    new_status: DeviceStatus;
    changed_by: string | null;
    changed_by_name: string | null;
    changed_at: string | null;
}

interface DetectorHistoryProps {
    history: HistoryEntry[];
}

const STATUS_LABELS: Record<DeviceStatus, string> = {
    ok: 'Хэвийн',
    problem: 'Бохирдсон',
    warning: 'Холболтын алдаа',
};

const STATUS_COLORS: Record<DeviceStatus, string> = {
    ok: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    problem: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

function StatusBadge({ status }: { status: DeviceStatus | null }) {
    if (!status) {
        return <span className="text-slate-400 text-xs">-</span>;
    }
    return (
        <Badge className={`${STATUS_COLORS[status]} text-xs`}>
            {STATUS_LABELS[status]}
        </Badge>
    );
}

export function DetectorHistory({ history }: DetectorHistoryProps) {
    if (history.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Түүх байхгүй</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {history.map((entry) => (
                <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                    <div className="flex items-center gap-3">
                        <div className="text-sm">
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                                {entry.unit_number}
                            </span>
                            <span className="text-slate-400 mx-1">-</span>
                            <span className="font-mono text-slate-600 dark:text-slate-300">
                                #{entry.detector_address}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <StatusBadge status={entry.old_status} />
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                            <StatusBadge status={entry.new_status} />
                        </div>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                        <div>{entry.changed_by_name || 'Admin'}</div>
                        <div>
                            {entry.changed_at
                                ? new Date(entry.changed_at).toLocaleString('mn-MN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })
                                : '-'}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
