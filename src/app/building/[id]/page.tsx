'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Phone, Flame, Home, ChevronUp, ChevronDown, AlertTriangle, AlertCircle } from "lucide-react";
import { createClient } from '../../../../supabase/client';
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardNavbar from "@/components/dashboard-navbar";
import { FirePanelTable } from "@/components/building/fire-panel-table";
import { ApartmentDeviceInfo } from "@/components/building/apartment-device-info";
import { useFirePanelData } from "@/hooks/use-fire-panel-data";

type DeviceStatus = 'ok' | 'problem' | 'warning';

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

interface FirePanelData {
  buildingCode: string;
  devices: FirePanelDevice[];
  loopSummaries: {
    loop: string;
    totalDetectors: number;
    contaminated: number;
    commFault: number;
    normal: number;
  }[];
  lastUpdated: string | null;
}

export default function BuildingDetailPage() {
  const [data, setData] = useState<{
    building: any;
    apartments: any[];
    phoneIssues: any[];
  }>({
    building: null,
    apartments: [],
    phoneIssues: []
  });
  const [firePanelData, setFirePanelData] = useState<FirePanelData | null>(null);
  const [firePanelError, setFirePanelError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLoop, setSelectedLoop] = useState<string | null>(null);
  const params = useParams();
  const buildingId = params.id as string;

  const ITEMS_PER_PAGE = 20;

  // Process fire panel data using the smart hook
  const { unitRows, availableLoops, stats: firePanelStats, problemStats } = useFirePanelData(firePanelData);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();

        // Get building
        const { data: building, error: buildingError } = await supabase
          .from('buildings')
          .select('*')
          .eq('id', buildingId)
          .single();

        if (buildingError) {
          console.error('Error fetching building:', buildingError);
        }

        // Get apartments for this building
        const { data: apartments, error: apartmentsError } = await supabase
          .from('apartments')
          .select('*')
          .eq('building_id', buildingId)
          .order('unit_number');

        if (apartmentsError) {
          console.error('Error fetching apartments:', apartmentsError);
        }

        // Get phone issues for apartments in this building with worker data
        const apartmentIds = apartments?.map(apt => apt.id) || [];
        let phoneIssues: any[] = [];
        if (apartmentIds.length > 0) {
          const { data: issues, error: issuesError } = await supabase
            .from('phone_issues')
            .select('*')
            .in('apartment_id', apartmentIds)
            .order('created_at', { ascending: false });

          if (issuesError) {
            console.error('Error fetching phone issues:', issuesError);
          }

          // Get worker data separately
          if (issues && issues.length > 0) {
            const workerIds = issues.filter(issue => issue.worker_id).map(issue => issue.worker_id);
            if (workerIds.length > 0) {
              const { data: workers } = await supabase
                .from('workers')
                .select('id, name, email, phone')
                .in('id', workerIds);

              // Attach worker data to phone issues
              phoneIssues = issues.map(issue => ({
                ...issue,
                worker: workers?.find(worker => worker.id === issue.worker_id) || null
              }));
            } else {
              phoneIssues = issues || [];
            }
          }
        }

        setData({
          building: building || null,
          apartments: apartments || [],
          phoneIssues: phoneIssues || []
        });

        // Fetch fire panel data using building name
        if (building?.name) {
          try {
            const response = await fetch(`/api/fire-panel/${encodeURIComponent(building.name)}`);
            if (response.ok) {
              const fpData = await response.json();
              setFirePanelData(fpData);
            } else {
              const errorData = await response.json();
              setFirePanelError(errorData.error || 'Failed to load fire panel data');
            }
          } catch (err) {
            console.error('Error fetching fire panel data:', err);
            setFirePanelError('Failed to connect to fire panel API');
          }
        }
      } catch (error: any) {
        console.error('Error loading building data:', {
          message: error?.message || 'Unknown error',
          name: error?.name || 'Error'
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [buildingId]);

  // Filter unit rows by selected loop
  const filteredUnitRows = useMemo(() => {
    if (selectedLoop) {
      return unitRows.filter(row => row.loop === selectedLoop);
    }
    return unitRows;
  }, [unitRows, selectedLoop]);

  // Pagination for unit rows
  const totalPages = Math.ceil(filteredUnitRows.length / ITEMS_PER_PAGE);
  const paginatedUnits = filteredUnitRows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Барилгын мэдээлэл ачаалж байна...</p>
        </div>
      </div>
    );
  }

  if (!data.building) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar />
        <div className="p-4">
          <div className="max-w-4xl mx-auto text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900">Барилга олдсонгүй</h1>
            <p className="text-gray-600 mt-2">Таны хайж буй барилга байхгүй байна.</p>
            <Link href="/dashboard">
              <Button className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Хяналтын самбар руу буцах
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Group apartments by floor
  const floorGroups = data.apartments.reduce((acc: any, apartment: any) => {
    const floor = apartment.floor || 1;
    if (!acc[floor]) {
      acc[floor] = [];
    }
    acc[floor].push(apartment);
    return acc;
  }, {});

  const sortedFloors = Object.keys(floorGroups)
    .map(Number)
    .sort((a, b) => a - b)
    .map(floor => ({
      floor,
      apartments: floorGroups[floor].sort((a: any, b: any) => a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true }))
    }));

  // Calculate comprehensive maintenance statistics
  const maintenanceStats = {
    totalSmokeDetectorsCleaned: data.phoneIssues
      .filter(issue => issue.issue_type === 'smoke_detector' && issue.status === 'болсон')
      .reduce((total, issue) => {
        const quantityMatch = issue.description?.match(/Cleared (\d+)/);
        return total + (quantityMatch ? parseInt(quantityMatch[1]) : 1);
      }, 0),

    completedMaintenanceRecords: data.phoneIssues.filter(issue => issue.status === 'болсон').length,

    openIssues: data.phoneIssues.filter(issue =>
      issue.status === 'open' || issue.status === 'тусламж хэрэгтэй' || issue.status === 'цэвэрлэх хэрэгтэй'
    ).length,

    maintenanceRecords: data.phoneIssues.filter(issue =>
      issue.issue_type === 'smoke_detector'
    )
  };

  // Get detector addresses for a specific apartment from fire panel data
  const getApartmentDetectors = (unitNumber: string): FirePanelDevice | null => {
    if (!firePanelData?.devices) return null;
    return firePanelData.devices.find(d => d.unit === unitNumber) || null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard">
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Хяналтын самбар руу буцах
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{data.building.name}</h1>
              <p className="text-gray-600">{data.building.address}</p>
            </div>
          </div>

          {/* Fire System Panel - Modern UI */}
          <div className="mb-8">
            <Card className="overflow-hidden border-0 shadow-xl bg-white dark:bg-slate-900">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 to-orange-500 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Flame className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Галын аюулгүй байдлын систем</h2>
                      <p className="text-white/80 text-sm">{data.building.name}</p>
                    </div>
                  </div>
                  <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                    {firePanelData?.buildingCode || 'Өгөгдөл байхгүй'}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6">
                {firePanelError ? (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <span className="text-amber-800 dark:text-amber-200">{firePanelError}</span>
                  </div>
                ) : (
                  <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{firePanelStats.totalDevices}</div>
                        <div className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium mt-1">Нийт төхөөрөмж</div>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{firePanelStats.normal}</div>
                        <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium mt-1">Хэвийн</div>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{firePanelStats.contaminated}</div>
                        <div className="text-xs text-amber-600/70 dark:text-amber-400/70 font-medium mt-1">Бохирдсон</div>
                      </div>
                      <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{firePanelStats.commFault}</div>
                        <div className="text-xs text-red-600/70 dark:text-red-400/70 font-medium mt-1">Холболтын алдаа</div>
                      </div>
                    </div>

                    {/* Loop Filter */}
                    {availableLoops.length > 0 && (
                      <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Loop шүүлтүүр:</span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => { setSelectedLoop(null); setCurrentPage(1); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!selectedLoop
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                              }`}
                          >
                            Бүгд
                          </button>
                          {availableLoops.map((loop) => (
                            <button
                              key={loop}
                              onClick={() => { setSelectedLoop(selectedLoop === loop ? null : loop); setCurrentPage(1); }}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedLoop === loop
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                                }`}
                            >
                              {loop}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Device Table - Smart Component */}
                    <FirePanelTable units={paginatedUnits} />

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Нийт <span className="font-medium">{filteredUnitRows.length}</span> айл
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage <= 1}
                          className="h-9"
                        >
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Өмнөх
                        </Button>
                        <div className="flex items-center gap-1 px-3">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{currentPage}</span>
                          <span className="text-sm text-slate-400">/</span>
                          <span className="text-sm text-slate-500">{totalPages || 1}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentPage(Math.min(totalPages || 1, currentPage + 1))}
                          disabled={currentPage >= (totalPages || 1)}
                          className="h-9"
                        >
                          Дараах
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                      <div className="text-xs text-slate-500">
                        {firePanelData?.lastUpdated && new Date(firePanelData.lastUpdated).toLocaleString('mn-MN')}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Maintenance Activity */}
          {maintenanceStats.maintenanceRecords.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-600" />
                  Сүүлийн үйлчилгээний бүртгэл
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {maintenanceStats.maintenanceRecords.slice(0, 5).map((record: any) => {
                    const apartment = data.apartments.find(apt => apt.id === record.apartment_id);
                    const quantityMatch = record.description?.match(/Cleared (\d+)/);
                    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;

                    return (
                      <div key={record.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <Flame className="w-5 h-5 text-green-500" />
                          <div>
                            <p className="font-medium text-sm">
                              {apartment?.unit_number} тоот - {quantity} Утааны мэдрэгч
                            </p>
                            <p className="text-xs text-gray-600">
                              {record.worker?.name || 'Тодорхойгүй'} • {record.phone_number}
                            </p>
                            {record.description && (
                              <p className="text-xs text-gray-500 mt-1">{record.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              record.status === 'болсон' ? 'default' :
                                record.status === 'хүлээж авсан' ? 'secondary' :
                                  record.status === 'тусламж хэрэгтэй' ? 'destructive' :
                                    record.status === 'цэвэрлэх хэрэгтэй' ? 'secondary' : 'outline'
                            }
                            className={
                              record.status === 'болсон' ? 'bg-green-100 text-green-800' :
                                record.status === 'хүлээж авсан' ? 'bg-blue-100 text-blue-800' :
                                  record.status === 'тусламж хэрэгтэй' ? 'bg-orange-100 text-orange-800' :
                                    record.status === 'цэвэрлэх хэрэгтэй' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                            }
                          >
                            {record.status === 'болсон' && 'Дууссан'}
                            {record.status === 'хүлээж авсан' && 'Хүлээгдэж байна'}
                            {record.status === 'тусламж хэрэгтэй' && 'Тусламж хэрэгтэй'}
                            {record.status === 'цэвэрлэх хэрэгтэй' && 'Цэвэрлэх хэрэгтэй'}
                            {record.status === 'open' && 'Нээлттэй'}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(record.created_at).toLocaleDateString('mn-MN')}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {maintenanceStats.maintenanceRecords.length > 5 && (
                    <div className="text-center pt-2">
                      <p className="text-sm text-gray-500">
                        +{maintenanceStats.maintenanceRecords.length - 5} нэмэлт бүртгэл
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Apartments by Floor */}
          {sortedFloors.length > 0 ? (
            <div className="space-y-6">
              {sortedFloors.map((floorGroup) => (
                <Card key={floorGroup.floor}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{floorGroup.floor} давхар</span>
                      <Badge variant="outline" className="font-mono">
                        {floorGroup.apartments.length} айл
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {floorGroup.apartments.map((apartment: any) => {
                        const apartmentPhoneIssues = data.phoneIssues.filter(issue => issue.apartment_id === apartment.id);
                        const openIssues = apartmentPhoneIssues.filter(issue => issue.status === 'open').length;
                        const resolvedIssues = apartmentPhoneIssues.filter(issue => issue.status === 'болсон').length;
                        const needsCleaningIssues = apartmentPhoneIssues.filter(issue => issue.status === 'цэвэрлэх хэрэгтэй').length;

                        // Get detector info from fire panel data
                        const detectorInfo = getApartmentDetectors(apartment.unit_number);

                        return (
                          <Link key={apartment.id} href={`/apartment/${apartment.id}`}>
                            <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h3 className="text-lg font-semibold">{apartment.unit_number} тоот</h3>

                                      {detectorInfo && detectorInfo.detectorAddresses.length > 0 && (
                                        <Badge className="bg-blue-100 text-blue-800">
                                          <Flame className="w-3 h-3 mr-1" />
                                          {detectorInfo.detectorAddresses.length} мэдрэгч
                                        </Badge>
                                      )}

                                      {resolvedIssues > 0 && (
                                        <Badge className="bg-green-100 text-green-800">
                                          <CheckCircle2 className="w-3 h-3 mr-1" />
                                          {resolvedIssues} дууссан
                                        </Badge>
                                      )}

                                      {needsCleaningIssues > 0 && (
                                        <Badge className="bg-yellow-100 text-yellow-800">
                                          <Flame className="w-3 h-3 mr-1" />
                                          {needsCleaningIssues} цэвэрлэх
                                        </Badge>
                                      )}

                                      {openIssues > 0 && (
                                        <Badge variant="destructive">
                                          <Phone className="w-3 h-3 mr-1" />
                                          {openIssues} нээлттэй
                                        </Badge>
                                      )}
                                    </div>

                                    <ApartmentDeviceInfo detectorInfo={detectorInfo} />
                                    {apartmentPhoneIssues.length > 0 && (
                                      <div className="text-sm text-gray-600">{apartmentPhoneIssues.length} үйлчилгээний бүртгэл</div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Home className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Айл олдсонгүй</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Энэ барилгад айл бүртгэгдээгүй байна. Админ хэсгээс нэмэхэд бэлэн.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
