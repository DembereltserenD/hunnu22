'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, AlertTriangle, CheckCircle2, Activity } from "lucide-react";
import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from '../../../supabase/client';

interface BuildingHealth {
  buildingCode: string;
  totalDevices: number;
  normal: number;
  contaminated: number;
  commFault: number;
  healthPercent: number;
  status: 'healthy' | 'warning' | 'danger';
}

export default function HealthStatsPage() {
  const [buildings, setBuildings] = useState<BuildingHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    totalDevices: 0,
    normal: 0,
    contaminated: 0,
    commFault: 0
  });

  useEffect(() => {
    loadHealthData();

    // Refresh data every 30 seconds
    const interval = setInterval(loadHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadHealthData = async () => {
    try {
      const supabase = createClient();
      const { data: buildingsList } = await supabase.from('buildings').select('id, name');
      const buildingIdByName = new Map(
        (buildingsList || []).map((b: any) => [b.name, b.id])
      );

      const firePanelRes = await fetch('/api/fire-panel');
      const firePanelData = await firePanelRes.json();

      if (firePanelData.buildings && firePanelData.buildings.length > 0) {
        const healthData: BuildingHealth[] = [];
        let totalDevices = 0, totalNormal = 0, totalContaminated = 0, totalCommFault = 0;

        const buildingPromises = firePanelData.buildings.map((buildingCode: string) => {
          const buildingId = buildingIdByName.get(buildingCode);
          const firePanelPromise = fetch(`/api/fire-panel/${encodeURIComponent(buildingCode)}`)
            .then(res => res.json());
          const overridesPromise = buildingId
            ? fetch(`/api/detector-status?buildingId=${buildingId}`)
                .then(res => res.ok ? res.json() : { overrides: {} })
                .catch(() => ({ overrides: {} }))
            : Promise.resolve({ overrides: {} });

          return Promise.all([firePanelPromise, overridesPromise])
            .then(([data, overridesData]) => ({
              buildingCode,
              data,
              overrides: overridesData?.overrides || {},
            }));
        });

        const buildingResults = await Promise.all(buildingPromises);

        const applyOverride = (
          overrides: Record<string, string>,
          deviceType: 'detector' | 'commonArea' | 'bell' | 'mcp' | 'relay',
          unitNumber: string,
          address: number,
          originalStatus: 'ok' | 'problem' | 'warning'
        ) => {
          const key = `${deviceType}-${unitNumber}-${address}`;
          return (overrides[key] as 'ok' | 'problem' | 'warning') || originalStatus;
        };

        buildingResults.forEach(({ buildingCode, data: buildingData, overrides }: { buildingCode: string; data: any; overrides: Record<string, string> }) => {
          let bTotal = 0, bNormal = 0, bContaminated = 0, bCommFault = 0;

          // Count from devices array (same as building page)
          if (buildingData.devices && buildingData.devices.length > 0) {
            buildingData.devices.forEach((device: any) => {
              // Count detectors
              const detectors = device.detectorStatuses || device.detectorAddresses?.map((addr: number) => ({ address: addr, status: 'ok' })) || [];
              detectors.forEach((d: any) => {
                bTotal++;
                const status = applyOverride(overrides, 'detector', String(device.unit), d.address, d.status);
                if (status === 'problem') bContaminated++;
                else if (status === 'warning') bCommFault++;
                else bNormal++;
              });

              // Count common area
              const commonArea = device.commonAreaStatuses || device.commonAreaAddresses?.map((addr: number) => ({ address: addr, status: 'ok' })) || [];
              commonArea.forEach((d: any) => {
                bTotal++;
                const status = applyOverride(overrides, 'commonArea', String(device.unit), d.address, d.status);
                if (status === 'problem') bContaminated++;
                else if (status === 'warning') bCommFault++;
                else bNormal++;
              });

              // Count bell, mcp, relay
              if (device.bellAddress) {
                bTotal++;
                const status = applyOverride(overrides, 'bell', String(device.unit), device.bellAddress, device.bellStatus || 'ok');
                if (status === 'problem') bContaminated++;
                else if (status === 'warning') bCommFault++;
                else bNormal++;
              }
              if (device.mcpAddress) {
                bTotal++;
                const status = applyOverride(overrides, 'mcp', String(device.unit), device.mcpAddress, device.mcpStatus || 'ok');
                if (status === 'problem') bContaminated++;
                else if (status === 'warning') bCommFault++;
                else bNormal++;
              }
              if (device.relayAddress) {
                bTotal++;
                const status = applyOverride(overrides, 'relay', String(device.unit), device.relayAddress, device.relayStatus || 'ok');
                if (status === 'problem') bContaminated++;
                else if (status === 'warning') bCommFault++;
                else bNormal++;
              }
            });
          }

          const healthPercent = bTotal > 0 ? Math.round((bNormal / bTotal) * 100) : 100;
          let status: 'healthy' | 'warning' | 'danger' = 'healthy';

          if (healthPercent < 80) {
            status = 'danger';
          } else if (healthPercent < 95) {
            status = 'warning';
          }

          healthData.push({
            buildingCode,
            totalDevices: bTotal,
            normal: bNormal,
            contaminated: bContaminated,
            commFault: bCommFault,
            healthPercent,
            status
          });

          totalDevices += bTotal;
          totalNormal += bNormal;
          totalContaminated += bContaminated;
          totalCommFault += bCommFault;
        });

        // Sort by health percent (worst first)
        healthData.sort((a, b) => a.healthPercent - b.healthPercent);

        setBuildings(healthData);
        setTotals({
          totalDevices,
          normal: totalNormal,
          contaminated: totalContaminated,
          commFault: totalCommFault
        });
      }
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <DashboardNavbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Ачааллаж байна...</p>
          </div>
        </div>
      </div>
    );
  }

  const overallHealthPercent = totals.totalDevices > 0
    ? Math.round((totals.normal / totals.totalDevices) * 100)
    : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <DashboardNavbar />

      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-lg shadow-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Барилгын эрүүл мэнд
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-14">
            Галын мэдрэгчийн төхөөрөмжүүдийн байдлын хяналт
          </p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totals.totalDevices.toLocaleString()}</div>
            <div className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium mt-1">Нийт төхөөрөмж</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{totals.normal.toLocaleString()}</div>
            <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium mt-1">Хэвийн</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{totals.contaminated.toLocaleString()}</div>
            <div className="text-xs text-red-600/70 dark:text-red-400/70 font-medium mt-1">Бохирдсон</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{totals.commFault.toLocaleString()}</div>
            <div className="text-xs text-yellow-600/70 dark:text-yellow-400/70 font-medium mt-1">Холболтын алдаа</div>
          </div>
        </div>

        {/* Overall Health Bar */}
        <Card className="mb-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Нийт эрүүл мэндийн байдал</span>
              <span className={`text-2xl font-bold ${
                overallHealthPercent >= 95 ? 'text-emerald-600' :
                overallHealthPercent >= 80 ? 'text-amber-600' :
                'text-red-600'
              }`}>{overallHealthPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  overallHealthPercent >= 95 ? 'bg-emerald-500' :
                  overallHealthPercent >= 80 ? 'bg-amber-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${overallHealthPercent}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Buildings Health Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buildings.map((building) => (
            <Card
              key={building.buildingCode}
              className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl bg-white dark:bg-slate-900 ${
                building.status === 'healthy' ? 'border-emerald-200 dark:border-emerald-800' :
                building.status === 'warning' ? 'border-amber-200 dark:border-amber-800' :
                'border-red-200 dark:border-red-800'
              }`}
            >
              {/* Status Indicator Bar */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                building.status === 'healthy' ? 'bg-emerald-500' :
                building.status === 'warning' ? 'bg-amber-500' :
                'bg-red-500 animate-pulse'
              }`}></div>

              <CardHeader className="pb-2 pt-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    {building.buildingCode}
                  </CardTitle>
                  <div className={`p-1.5 rounded-full ${
                    building.status === 'healthy' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                    building.status === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30' :
                    'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    {building.status === 'healthy' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertTriangle className={`h-5 w-5 ${
                        building.status === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                      }`} />
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-1.5">
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{building.totalDevices}</div>
                    <div className="text-[9px] text-blue-600/70 dark:text-blue-400/70">Нийт</div>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded p-1.5">
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{building.normal}</div>
                    <div className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70">Хэвийн</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded p-1.5">
                    <div className="text-sm font-bold text-red-600 dark:text-red-400">{building.contaminated}</div>
                    <div className="text-[9px] text-red-600/70 dark:text-red-400/70">Бохирдсон</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-1.5">
                    <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{building.commFault}</div>
                    <div className="text-[9px] text-yellow-600/70 dark:text-yellow-400/70">Холболтын алдаа</div>
                  </div>
                </div>

                {/* Health Score Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Эрүүл мэнд</span>
                    <span className={`font-bold ${
                      building.status === 'healthy' ? 'text-emerald-600 dark:text-emerald-400' :
                      building.status === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>{building.healthPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        building.status === 'healthy' ? 'bg-emerald-500' :
                        building.status === 'warning' ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${building.healthPercent}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {buildings.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Барилга олдсонгүй
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Галын самбарын мэдээлэл олдсонгүй
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


