'use client';

import { Badge } from "@/components/ui/badge";
import { DeviceStatus } from './device-status-badge';

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

interface ApartmentDeviceInfoProps {
    detectorInfo: FirePanelDevice | null;
}

export function ApartmentDeviceInfo({ detectorInfo }: ApartmentDeviceInfoProps) {
    if (!detectorInfo) return null;

    const getStatusClass = (status: DeviceStatus | null) => {
        switch (status) {
            case 'ok':
                return 'bg-green-50 text-green-700 border border-green-200';
            case 'problem':
                return 'bg-red-50 text-red-700 border border-red-200';
            case 'warning':
                return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
            default:
                return 'bg-green-50 text-green-700 border border-green-200';
        }
    };

    return (
        <div className="text-sm text-gray-600 space-y-1">
            {/* Main detector addresses */}
            {detectorInfo.detectorAddresses.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-medium">Хаяг:</span>
                    {detectorInfo.detectorStatuses?.map((detector, idx) => (
                        <span
                            key={idx}
                            className={`font-mono px-1.5 py-0.5 rounded ${getStatusClass(detector.status)}`}
                        >
                            {detector.address}
                        </span>
                    )) || (
                            <span className="font-mono text-blue-600">
                                {detectorInfo.detectorAddresses.join(', ')}
                            </span>
                        )}
                    {detectorInfo.loop && (
                        <Badge variant="outline" className="text-xs ml-2">
                            {detectorInfo.loop}
                        </Badge>
                    )}
                </div>
            )}

            {/* Additional devices */}
            {(detectorInfo.commonAreaStatuses?.length > 0 ||
                detectorInfo.bellAddress ||
                detectorInfo.mcpAddress ||
                detectorInfo.relayAddress) && (
                    <div className="flex flex-wrap items-center gap-1 text-xs mt-1">
                        {/* Common area devices */}
                        {detectorInfo.commonAreaStatuses?.map((common, idx) => (
                            <span
                                key={`common-${idx}`}
                                className={`font-mono px-1 py-0.5 rounded text-xs ${getStatusClass(common.status)}`}
                                title="Нийтийн эзэмшил"
                            >
                                НЭ:{common.address}
                            </span>
                        ))}

                        {/* Bell */}
                        {detectorInfo.bellAddress && (
                            <span
                                className={`font-mono px-1 py-0.5 rounded text-xs ${getStatusClass(detectorInfo.bellStatus)}`}
                                title="Хонх"
                            >
                                Хонх:{detectorInfo.bellAddress}
                            </span>
                        )}

                        {/* Manual call point */}
                        {detectorInfo.mcpAddress && (
                            <span
                                className={`font-mono px-1 py-0.5 rounded text-xs ${getStatusClass(detectorInfo.mcpStatus)}`}
                                title="Гар мэдээлэгч"
                            >
                                ГМ:{detectorInfo.mcpAddress}
                            </span>
                        )}

                        {/* Relay */}
                        {detectorInfo.relayAddress && (
                            <span
                                className={`font-mono px-1 py-0.5 rounded text-xs ${getStatusClass(detectorInfo.relayStatus)}`}
                                title="Relay"
                            >
                                R:{detectorInfo.relayAddress}
                            </span>
                        )}
                    </div>
                )}
        </div>
    );
}