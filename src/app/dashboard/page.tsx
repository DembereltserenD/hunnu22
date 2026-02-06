'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Phone, Flame, AlertCircle, AlertTriangle, Search, Home, Filter } from "lucide-react";
import Link from "next/link";
import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from '../../../supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Types for problem devices
interface DeviceInfo {
    address: string;
    status: 'ok' | 'problem' | 'warning';
}

interface ProblemApartment {
    id: string;
    unit_number: string;
    floor: number;
    smoke_detectors: DeviceInfo[];
    common_area_devices: DeviceInfo[];
    bell: DeviceInfo | null;
    has_problem: boolean;
    has_warning: boolean;
    problem_count: number;
    warning_count: number;
    building: {
        id: string;
        name: string;
    };
}

export default function DashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<{
        buildings: any[];
        apartments: any[];
        phoneIssues: any[];
    }>({
        buildings: [],
        apartments: [],
        phoneIssues: []
    });
    const [buildingFirePanelData, setBuildingFirePanelData] = useState<Record<string, {
        totalDevices: number;
        normal: number;
        contaminated: number;
        commFault: number;
    }>>({});
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    // Problem devices state
    const [problemApartments, setProblemApartments] = useState<ProblemApartment[]>([]);
    const [xlsmBuildings, setXlsmBuildings] = useState<{ id: string; name: string }[]>([]);
    const [problemDevicesLoading, setProblemDevicesLoading] = useState(true);
    const [visitSchedules, setVisitSchedules] = useState<any[]>([]);
    const [visitSchedulesLoading, setVisitSchedulesLoading] = useState(true);
    const [visitStatusFilter, setVisitStatusFilter] = useState<string>("all");
    const [visitBuildingFilter, setVisitBuildingFilter] = useState<string>("all");
    const [visitFromDate, setVisitFromDate] = useState<string>("");
    const [visitToDate, setVisitToDate] = useState<string>("");
    const [visitSearchQuery, setVisitSearchQuery] = useState<string>("");
    const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
    const [editBuildingName, setEditBuildingName] = useState<string>("");
    const [editUnitNumber, setEditUnitNumber] = useState<string>("");
    const [editDate, setEditDate] = useState<string>("");
    const [editTime, setEditTime] = useState<string>("");
    const [editNote, setEditNote] = useState<string>("");

    // Filters for problem devices
    const [problemBuildingFilter, setProblemBuildingFilter] = useState<string>("all");
    const [problemStatusFilter, setProblemStatusFilter] = useState<string>("all");
    const [problemSearchQuery, setProblemSearchQuery] = useState<string>("");

    const VISIT_STATUS_OPTIONS = [
        { value: "not_visited", label: "Ороогүй" },
        { value: "visited", label: "Орсон" },
        { value: "no_answer", label: "Байхгүй" },
        { value: "issue", label: "Асуудалтай" },
    ];

    const STATUS_STYLES: Record<string, string> = {
        not_visited: "bg-slate-100 text-slate-700 border-slate-200",
        visited: "bg-emerald-100 text-emerald-700 border-emerald-200",
        no_answer: "bg-amber-100 text-amber-700 border-amber-200",
        issue: "bg-red-100 text-red-700 border-red-200",
    };

    const filteredVisitSchedules = visitSchedules.filter((schedule: any) => {
        const statusValue = schedule.status || "not_visited";
        const buildingName = schedule.building_name
            || data.buildings.find((b: any) => b.id === schedule.building_id)?.name
            || "-";

        if (visitStatusFilter !== "all" && statusValue !== visitStatusFilter) {
            return false;
        }

        if (visitBuildingFilter !== "all" && buildingName !== visitBuildingFilter) {
            return false;
        }

        const scheduledAt = schedule.scheduled_at ? new Date(schedule.scheduled_at).getTime() : null;
        if (!scheduledAt) return false;

        if (visitFromDate) {
            const fromTs = new Date(`${visitFromDate}T00:00:00`).getTime();
            if (!Number.isNaN(fromTs) && scheduledAt < fromTs) return false;
        }
        if (visitToDate) {
            const toTs = new Date(`${visitToDate}T23:59:59`).getTime();
            if (!Number.isNaN(toTs) && scheduledAt > toTs) return false;
        }

        if (visitSearchQuery.trim()) {
            const q = visitSearchQuery.toLowerCase();
            const building = (buildingName || "").toLowerCase();
            const unit = (schedule.unit_number || "").toString().toLowerCase();
            const note = (schedule.note || "").toString().toLowerCase();
            if (!building.includes(q) && !unit.includes(q) && !note.includes(q)) {
                return false;
            }
        }

        return true;
    });


    useEffect(() => {
        const supabase = createClient();

        async function loadCoreData() {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError) {
                    console.error('Auth error:', authError);
                }
                if (user) {
                    setUser(user);
                }

                const [buildingsRes, apartmentsRes, phoneIssuesRes] = await Promise.all([
                    supabase.from('buildings').select('*'),
                    supabase.from('apartments').select('*'),
                    supabase.from('phone_issues').select('*')
                ]);

                setData({
                    buildings: buildingsRes.data || [],
                    apartments: apartmentsRes.data || [],
                    phoneIssues: phoneIssuesRes.data || []
                });
                await loadFirePanelStats(buildingsRes.data || []);

                // Load upcoming visit schedules from local storage (temporary)
                try {
                    setVisitSchedulesLoading(true);
                    if (typeof window !== "undefined") {
                        const raw = window.localStorage.getItem("visit_schedules_local");
                        const parsed = raw ? JSON.parse(raw) : [];
                        const items = Array.isArray(parsed) ? parsed : [];
                        const sorted = items
                            .filter((item) => item?.scheduled_at)
                            .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
                        setVisitSchedules(sorted.slice(0, 10));
                    } else {
                        setVisitSchedules([]);
                    }
                } catch (scheduleError) {
                    console.error('Error loading visit schedules:', scheduleError);
                    setVisitSchedules([]);
                } finally {
                    setVisitSchedulesLoading(false);
                }
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }

        async function loadFirePanelStats(buildingsList: any[]) {
            try {
                const firePanelRes = await fetch('/api/fire-panel');
                const firePanelData = await firePanelRes.json();

                if (firePanelData.buildings && firePanelData.buildings.length > 0) {
                    const buildingIdByName = new Map(
                        (buildingsList || []).map((b: any) => [b.name, b.id])
                    );
                    const perBuildingData: Record<string, { totalDevices: number; normal: number; contaminated: number; commFault: number }> = {};

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

                        if (buildingData.devices && buildingData.devices.length > 0) {
                            buildingData.devices.forEach((device: any) => {
                                const detectors = device.detectorStatuses || device.detectorAddresses?.map((addr: number) => ({ address: addr, status: 'ok' })) || [];
                                detectors.forEach((d: any) => {
                                    bTotal++;
                                    const status = applyOverride(overrides, 'detector', String(device.unit), d.address, d.status);
                                    if (status === 'problem') bContaminated++;
                                    else if (status === 'warning') bCommFault++;
                                    else bNormal++;
                                });

                                const commonArea = device.commonAreaStatuses || device.commonAreaAddresses?.map((addr: number) => ({ address: addr, status: 'ok' })) || [];
                                commonArea.forEach((d: any) => {
                                    bTotal++;
                                    const status = applyOverride(overrides, 'commonArea', String(device.unit), d.address, d.status);
                                    if (status === 'problem') bContaminated++;
                                    else if (status === 'warning') bCommFault++;
                                    else bNormal++;
                                });

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

                        perBuildingData[buildingCode] = {
                            totalDevices: bTotal,
                            normal: bNormal,
                            contaminated: bContaminated,
                            commFault: bCommFault
                        };
                    });

                    setBuildingFirePanelData(perBuildingData);
                }
            } catch (firePanelError) {
                console.error('Error loading fire panel data:', firePanelError);
            }
        }

        async function loadProblemDevices() {
            try {
                setProblemDevicesLoading(true);
                const buildingsRes = await fetch('/api/apartments-xlsm', { method: 'POST' });
                const buildingsData = await buildingsRes.json();
                setXlsmBuildings(buildingsData.buildings || []);

                const apartmentsRes = await fetch('/api/apartments-xlsm?limit=1000');
                const apartmentsData = await apartmentsRes.json();

                const problemOnly = (apartmentsData.data || []).filter(
                    (apt: ProblemApartment) => apt.has_problem || apt.has_warning
                );
                setProblemApartments(problemOnly);
            } catch (problemError) {
                console.error('Error loading problem devices:', problemError);
            } finally {
                setProblemDevicesLoading(false);
            }
        }

        loadCoreData();
        loadProblemDevices();
    }, [router]);

    const updateVisitStatus = (id: string, nextStatus: string) => {
        setVisitSchedules((prev) => {
            const next = prev.map((item) =>
                item.id === id ? { ...item, status: nextStatus } : item
            );
            if (typeof window !== "undefined") {
                try {
                    const raw = window.localStorage.getItem("visit_schedules_local");
                    const parsed = raw ? JSON.parse(raw) : [];
                    const items = Array.isArray(parsed) ? parsed : [];
                    const updated = items.map((item) =>
                        item.id === id ? { ...item, status: nextStatus } : item
                    );
                    window.localStorage.setItem("visit_schedules_local", JSON.stringify(updated));
                } catch (error) {
                    console.error("Error updating visit schedule status:", error);
                }
            }
            return next;
        });
    };

    const removeVisit = (id: string) => {
        if (typeof window !== "undefined") {
            const ok = window.confirm("Энэ товлолыг устгах уу?");
            if (!ok) return;
            try {
                const raw = window.localStorage.getItem("visit_schedules_local");
                const parsed = raw ? JSON.parse(raw) : [];
                const items = Array.isArray(parsed) ? parsed : [];
                const updated = items.filter((item) => item.id !== id);
                window.localStorage.setItem("visit_schedules_local", JSON.stringify(updated));
                setVisitSchedules(updated);
            } catch (error) {
                console.error("Error removing visit schedule:", error);
            }
        }
    };

    const startEditVisit = (schedule: any) => {
        setEditingVisitId(schedule.id);
        setEditBuildingName(schedule.building_name || "");
        setEditUnitNumber(schedule.unit_number || "");
        if (schedule.scheduled_at) {
            const d = new Date(schedule.scheduled_at);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            const hh = String(d.getHours()).padStart(2, "0");
            const min = String(d.getMinutes()).padStart(2, "0");
            setEditDate(`${yyyy}-${mm}-${dd}`);
            setEditTime(`${hh}:${min}`);
        } else {
            setEditDate("");
            setEditTime("");
        }
        setEditNote(schedule.note || "");
    };

    const saveEditVisit = (id: string) => {
        const nextScheduledAt = editDate && editTime ? new Date(`${editDate}T${editTime}`).toISOString() : null;
        setVisitSchedules((prev) => {
            const next = prev.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        building_name: editBuildingName.trim(),
                        unit_number: editUnitNumber.trim(),
                        scheduled_at: nextScheduledAt || item.scheduled_at,
                        note: editNote.trim(),
                    }
                    : item
            );
            if (typeof window !== "undefined") {
                try {
                    const raw = window.localStorage.getItem("visit_schedules_local");
                    const parsed = raw ? JSON.parse(raw) : [];
                    const items = Array.isArray(parsed) ? parsed : [];
                    const updated = items.map((item) =>
                        item.id === id
                            ? {
                                ...item,
                                building_name: editBuildingName.trim(),
                                unit_number: editUnitNumber.trim(),
                                scheduled_at: nextScheduledAt || item.scheduled_at,
                                note: editNote.trim(),
                            }
                            : item
                    );
                    window.localStorage.setItem("visit_schedules_local", JSON.stringify(updated));
                } catch (error) {
                    console.error("Error saving visit schedule:", error);
                }
            }
            return next;
        });
        setEditingVisitId(null);
    };

    const cancelEditVisit = () => {
        setEditingVisitId(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-100 via-orange-50 to-pink-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
                <DashboardNavbar />
                <div className="p-4 flex items-center justify-center min-h-[80vh]">
                    <div className="text-center">
                        <div className="relative w-16 h-16 mx-auto mb-4">
                            <div className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-800"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-purple-600 dark:border-purple-400 border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 font-medium">Уншиж байна...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-orange-50 to-pink-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 transition-colors duration-300">
            <DashboardNavbar />
            <div className="p-4 md:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8 animate-fade-in">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gradient-to-br from-purple-600 to-orange-500 rounded-lg shadow-lg">
                                <Flame className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-normal bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent font-['Clash_Display']">
                                Утаа мэдрэгчийн самбар
                            </h1>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 ml-14 font-medium">Бүх барилгын утаа мэдрэгчийн засвар үйлчилгээг хянах</p>
                    </div>

                    {/* Main Content with Sidebar Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Main Content - Buildings Grid */}
                        <div className="lg:col-span-3">
                            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                                {data.buildings.map((building: any, index: any) => {
                                    // Get fire panel data for this building (match by building name/code)
                                    const fpData = buildingFirePanelData[building.name] || null;
                                    const hasIssues = fpData && (fpData.contaminated > 0 || fpData.commFault > 0);

                                    return (
                                        <Link key={building.id} href={`/building/${building.id}`}>
                                            <Card
                                                className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer animate-slide-up bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-slate-800/60 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)] ${
                                                    hasIssues ? 'border-orange-400/60' : 'border-white/10 dark:border-white/5'
                                                }`}
                                                style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                <div className={`absolute left-0 top-0 h-1.5 w-full ${
                                                    hasIssues ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-500' : 'bg-gradient-to-r from-slate-500/40 via-slate-400/30 to-slate-500/40'
                                                }`} />
                                                <CardHeader className="pb-2 pt-5 relative">
                                                    <CardTitle className="flex items-start justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2.5 bg-purple-500/20 rounded-xl ring-1 ring-purple-500/30 group-hover:ring-purple-400/60 transition-colors">
                                                                <Building2 className="w-5 h-5 text-purple-200" />
                                                            </div>
                                                            <div>
                                                                <span className="text-lg font-semibold text-white">{building.name}</span>
                                                                {building.address && (
                                                                    <p className="text-xs text-slate-300 font-normal mt-0.5">{building.address}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                            hasIssues ? 'bg-orange-500/20 text-orange-200 ring-1 ring-orange-400/40' : 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30'
                                                        }`}>
                                                            {hasIssues ? 'Асуудалтай' : 'Хэвийн'}
                                                        </span>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="relative pt-2">
                                                    {fpData ? (
                                                        <div className="grid grid-cols-4 gap-2">
                                                            <div className="rounded-xl p-2 text-center bg-gradient-to-br from-blue-500/15 to-blue-500/5 ring-1 ring-blue-400/20">
                                                                <div className="text-lg font-bold text-blue-200">{fpData.totalDevices}</div>
                                                                <div className="text-[10px] text-blue-200/70 font-medium">Нийт</div>
                                                            </div>
                                                            <div className="rounded-xl p-2 text-center bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 ring-1 ring-emerald-400/20">
                                                                <div className="text-lg font-bold text-emerald-200">{fpData.normal}</div>
                                                                <div className="text-[10px] text-emerald-200/70 font-medium">Хэвийн</div>
                                                            </div>
                                                            <div className="rounded-xl p-2 text-center bg-gradient-to-br from-red-500/15 to-red-500/5 ring-1 ring-red-400/20">
                                                                <div className="text-lg font-bold text-red-200">{fpData.contaminated}</div>
                                                                <div className="text-[10px] text-red-200/70 font-medium">Бохирдсон</div>
                                                            </div>
                                                            <div className="rounded-xl p-2 text-center bg-gradient-to-br from-yellow-500/15 to-yellow-500/5 ring-1 ring-yellow-400/20">
                                                                <div className="text-lg font-bold text-yellow-200">{fpData.commFault}</div>
                                                                <div className="text-[10px] text-yellow-200/70 font-medium">Холболтын алдаа</div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-4 text-sm text-slate-300 bg-white/5 rounded-lg ring-1 ring-white/10">
                                                            <Building2 className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                                                            Мэдээлэл байхгүй
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    );
                                })}
                            </div>

                            {data.buildings.length === 0 && (
                                <Card className="border-0 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-md">
                                    <CardContent className="text-center py-16">
                                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                                            <Building2 className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Барилга олдсонгүй</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Админ самбараас барилга үүсгэнэ үү.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar - Recent Maintenance Records */}
                        <div className="lg:col-span-1">
                            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                                <div className="h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400" />
                                <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                            <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-pulse"></div>
                                            Сүүлийн бичлэг
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {data.phoneIssues.filter((issue: any) => issue.issue_type !== 'smoke_detector').length > 0 ? (
                                        <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                                            {data.phoneIssues
                                                .filter((issue: any) => issue.issue_type !== 'smoke_detector')
                                                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                                .slice(0, 10)
                                                .map((issue: any) => {
                                                    const apartment = data.apartments.find((apt: any) => apt.id === issue.apartment_id);
                                                    const building = apartment ? data.buildings.find((b: any) => b.id === apartment.building_id) : null;

                                                    return (
                                                        <div key={issue.id} className="p-4 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors">
                                                            <div className="flex items-start gap-3">
                                                                <div className="flex-shrink-0 mt-0.5">
                                                                    {issue.issue_type === 'domophone' && (
                                                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                                            <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                                        </div>
                                                                    )}
                                                                    {issue.issue_type === 'light_bulb' && (
                                                                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                                                            <div className="h-4 w-4 bg-yellow-500 dark:bg-yellow-400 rounded-full" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                                        {issue.issue_type === 'domophone' && 'Домофон'}
                                                                        {issue.issue_type === 'light_bulb' && 'Гэрэл'}
                                                                    </p>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                                                                        {building?.name} - {apartment?.unit_number} байр
                                                                    </p>
                                                                    <div className="flex items-center justify-between mt-2">
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className={
                                                                                issue.status === 'болсон' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                                                                    issue.status === 'хүлээж авсан' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                                                        issue.status === 'тусламж хэрэгтэй' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                                                                                            'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                                            }
                                                                        >
                                                                            {issue.status === 'болсон' && 'Болсон'}
                                                                            {issue.status === 'хүлээж авсан' && 'Хүлээж авсан'}
                                                                            {issue.status === 'тусламж хэрэгтэй' && 'Тусламж'}
                                                                            {issue.status === 'open' && 'Нээлттэй'}
                                                                        </Badge>
                                                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                                                            {new Date(issue.created_at).toLocaleDateString('mn-MN')}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center">
                                            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                                                <Phone className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Дуудлага байхгүй</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Домофон болон гэрлийн дуудлага энд харагдана.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="mt-4 border border-red-200/70 dark:border-red-900/40 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                                <div className="h-1 bg-gradient-to-r from-red-400 via-rose-400 to-orange-300" />
                                <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                            {"\u0422\u043E\u0432\u043B\u043E\u0441\u043E\u043D \u0430\u0439\u043B\u0443\u0443\u0434"}
                                        </CardTitle>
                                        <Link href="/operator" className="text-purple-600 dark:text-purple-400 hover:underline text-xs font-medium">
                                            {"\u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440"} →
                                        </Link>
                                    </div>
                                    <div className="mt-3 grid grid-cols-1 gap-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <Select value={visitStatusFilter} onValueChange={setVisitStatusFilter}>
                                                <SelectTrigger className="h-8 bg-white dark:bg-gray-700 text-xs">
                                                    <SelectValue placeholder="Төлөв" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Бүгд</SelectItem>
                                                    {VISIT_STATUS_OPTIONS.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Select value={visitBuildingFilter} onValueChange={setVisitBuildingFilter}>
                                                <SelectTrigger className="h-8 bg-white dark:bg-gray-700 text-xs">
                                                    <SelectValue placeholder="Барилга" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Бүгд</SelectItem>
                                                    {Array.from(new Set(visitSchedules.map((s: any) =>
                                                        s.building_name || data.buildings.find((b: any) => b.id === s.building_id)?.name || "-"
                                                    ))).map((name) => (
                                                        <SelectItem key={name} value={name}>
                                                            {name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <Input
                                                type="date"
                                                value={visitFromDate}
                                                onChange={(e) => setVisitFromDate(e.target.value)}
                                                className="h-8 text-xs bg-white dark:bg-gray-700"
                                                placeholder="Эхлэх өдөр"
                                            />
                                            <Input
                                                type="date"
                                                value={visitToDate}
                                                onChange={(e) => setVisitToDate(e.target.value)}
                                                className="h-8 text-xs bg-white dark:bg-gray-700"
                                                placeholder="Дуусах өдөр"
                                            />
                                        </div>
                                        <Input
                                            value={visitSearchQuery}
                                            onChange={(e) => setVisitSearchQuery(e.target.value)}
                                            className="h-8 text-xs bg-white dark:bg-gray-700"
                                            placeholder="Хайлт (барилга, тоот, тэмдэглэл)"
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {visitSchedulesLoading ? (
                                        <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                            {"\u0423\u043D\u0448\u0438\u0436 \u0431\u0430\u0439\u043D\u0430..."}
                                        </div>
                                    ) : filteredVisitSchedules.length > 0 ? (
                                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {filteredVisitSchedules.map((schedule: any) => {
                                                const buildingName = schedule.building_name
                                                    || data.buildings.find((b: any) => b.id === schedule.building_id)?.name
                                                    || "-";
                                                const unitNumber = schedule.unit_number || data.apartments.find((a: any) => a.id === schedule.apartment_id)?.unit_number || "-";
                                                const statusValue = schedule.status || "not_visited";
                                                const statusLabel = VISIT_STATUS_OPTIONS.find((s) => s.value === statusValue)?.label || "Ороогүй";
                                                const isEditing = editingVisitId === schedule.id;
                                                return (
                                                    <div key={schedule.id} className="p-4 text-sm">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                                {buildingName} — {unitNumber}
                                                            </div>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_STYLES[statusValue] || STATUS_STYLES.not_visited}`}>
                                                                {statusLabel}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {schedule.scheduled_at
                                                                ? new Date(schedule.scheduled_at).toLocaleString('mn-MN', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                })
                                                                : "-"}
                                                        </div>
                                                        {schedule.note && (
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                Тэмдэглэл: {schedule.note}
                                                            </div>
                                                        )}
                                                        <div className="mt-3">
                                                            <Select
                                                                value={statusValue}
                                                                onValueChange={(value) => updateVisitStatus(schedule.id, value)}
                                                            >
                                                                <SelectTrigger className="h-8 bg-white dark:bg-gray-700 text-xs">
                                                                    <SelectValue placeholder="Төлөв сонгох" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {VISIT_STATUS_OPTIONS.map((option) => (
                                                                        <SelectItem key={option.value} value={option.value}>
                                                                            {option.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="mt-3 flex gap-2">
                                                            {!isEditing ? (
                                                                <>
                                                                    <button
                                                                        className="text-xs text-purple-600 hover:underline"
                                                                        onClick={() => startEditVisit(schedule)}
                                                                    >
                                                                        Засах
                                                                    </button>
                                                                    <button
                                                                        className="text-xs text-red-600 hover:underline"
                                                                        onClick={() => removeVisit(schedule.id)}
                                                                    >
                                                                        Устгах
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        className="text-xs text-green-600 hover:underline"
                                                                        onClick={() => saveEditVisit(schedule.id)}
                                                                    >
                                                                        Хадгалах
                                                                    </button>
                                                                    <button
                                                                        className="text-xs text-gray-500 hover:underline"
                                                                        onClick={cancelEditVisit}
                                                                    >
                                                                        Болих
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                        {isEditing && (
                                                            <div className="mt-3 grid grid-cols-1 gap-2">
                                                                <Input
                                                                    value={editBuildingName}
                                                                    onChange={(e) => setEditBuildingName(e.target.value)}
                                                                    className="h-8 text-xs bg-white dark:bg-gray-700"
                                                                    placeholder="Барилга"
                                                                />
                                                                <Input
                                                                    value={editUnitNumber}
                                                                    onChange={(e) => setEditUnitNumber(e.target.value)}
                                                                    className="h-8 text-xs bg-white dark:bg-gray-700"
                                                                    placeholder="Айлын тоот"
                                                                />
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <Input
                                                                        type="date"
                                                                        value={editDate}
                                                                        onChange={(e) => setEditDate(e.target.value)}
                                                                        className="h-8 text-xs bg-white dark:bg-gray-700"
                                                                    />
                                                                    <Input
                                                                        type="time"
                                                                        value={editTime}
                                                                        onChange={(e) => setEditTime(e.target.value)}
                                                                        className="h-8 text-xs bg-white dark:bg-gray-700"
                                                                    />
                                                                </div>
                                                                <Input
                                                                    value={editNote}
                                                                    onChange={(e) => setEditNote(e.target.value)}
                                                                    className="h-8 text-xs bg-white dark:bg-gray-700"
                                                                    placeholder="Тэмдэглэл"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                            {"\u0422\u043E\u0432\u043B\u043E\u0441\u043E\u043D \u0446\u0430\u0433 \u043E\u043B\u0434\u0441\u043E\u043D\u0433\u04AF\u0439"}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Problem Devices Section */}
                    <div className="mt-8">
                        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                            </div>
                                            Асуудалтай төхөөрөмжүүд
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="destructive" className="text-sm">
                                                {problemApartments.filter(a => a.has_problem).length} бохирдсон
                                            </Badge>
                                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-sm">
                                                {problemApartments.filter(a => a.has_warning && !a.has_problem).length} холболтын алдаа
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Filters */}
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                placeholder="Хайх (айл, хаяг)..."
                                                value={problemSearchQuery}
                                                onChange={(e) => setProblemSearchQuery(e.target.value)}
                                                className="pl-10 bg-white dark:bg-gray-700"
                                            />
                                        </div>
                                        <Select value={problemBuildingFilter} onValueChange={setProblemBuildingFilter}>
                                            <SelectTrigger className="w-full sm:w-40 bg-white dark:bg-gray-700">
                                                <SelectValue placeholder="Барилга" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Бүх барилга</SelectItem>
                                                {xlsmBuildings.map(building => (
                                                    <SelectItem key={building.id} value={building.id}>
                                                        {building.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={problemStatusFilter} onValueChange={setProblemStatusFilter}>
                                            <SelectTrigger className="w-full sm:w-40 bg-white dark:bg-gray-700">
                                                <SelectValue placeholder="Төлөв" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Бүгд</SelectItem>
                                                <SelectItem value="problem">🔴 Бохирдсон</SelectItem>
                                                <SelectItem value="warning">🟡 Холболтын алдаа</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {problemDevicesLoading ? (
                                    <div className="p-8 text-center">
                                        <div className="relative w-12 h-12 mx-auto mb-3">
                                            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
                                            <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent animate-spin"></div>
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400">Уншиж байна...</p>
                                    </div>
                                ) : (() => {
                                    // Filter apartments
                                    let filtered = problemApartments;

                                    if (problemBuildingFilter !== "all") {
                                        filtered = filtered.filter(apt => apt.building.id === problemBuildingFilter);
                                    }

                                    if (problemStatusFilter === "problem") {
                                        filtered = filtered.filter(apt => apt.has_problem);
                                    } else if (problemStatusFilter === "warning") {
                                        filtered = filtered.filter(apt => apt.has_warning && !apt.has_problem);
                                    }

                                    if (problemSearchQuery) {
                                        const query = problemSearchQuery.toLowerCase();
                                        filtered = filtered.filter(apt =>
                                            apt.unit_number.toLowerCase().includes(query) ||
                                            apt.building.name.toLowerCase().includes(query) ||
                                            apt.smoke_detectors.some(sd => sd.address.includes(query))
                                        );
                                    }

                                    if (filtered.length === 0) {
                                        return (
                                            <div className="p-8 text-center">
                                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                                                    <Flame className="h-8 w-8 text-green-500 dark:text-green-400" />
                                                </div>
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                                    {problemSearchQuery || problemBuildingFilter !== "all" || problemStatusFilter !== "all"
                                                        ? "Шүүлтүүрт тохирох асуудал олдсонгүй"
                                                        : "Асуудалтай төхөөрөмж байхгүй"}
                                                </h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Бүх төхөөрөмж хэвийн ажиллаж байна.</p>
                                            </div>
                                        );
                                    }

                                    // Group by building
                                    const groupedByBuilding = filtered.reduce((acc, apt) => {
                                        const buildingName = apt.building.name;
                                        if (!acc[buildingName]) {
                                            acc[buildingName] = [];
                                        }
                                        acc[buildingName].push(apt);
                                        return acc;
                                    }, {} as Record<string, ProblemApartment[]>);

                                    return (
                                        <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
                                            {Object.entries(groupedByBuilding).map(([buildingName, apartments]) => (
                                                <div key={buildingName}>
                                                    {/* Building header */}
                                                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 sticky top-0 flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{buildingName}</span>
                                                        <Badge variant="secondary" className="text-xs">{apartments.length} айл</Badge>
                                                    </div>

                                                    {/* Apartments in this building */}
                                                    {apartments.map((apt) => {
                                                        // Get problem and warning devices - exclude common area devices
                                                        const problemDevices = apt.smoke_detectors.filter(d => d.status === 'problem');
                                                        const warningDevices = apt.smoke_detectors.filter(d => d.status === 'warning');
                                                        // Don't include common area devices in problematic devices display
                                                        // const problemCommon = apt.common_area_devices?.filter(d => d.status === 'problem') || [];
                                                        // const warningCommon = apt.common_area_devices?.filter(d => d.status === 'warning') || [];

                                                        return (
                                                            <div key={apt.id} className="p-4 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`p-2 rounded-lg ${apt.has_problem ? 'bg-red-100 dark:bg-red-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                                                                        {apt.has_problem ? (
                                                                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                                        ) : (
                                                                            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <Home className="h-4 w-4 text-gray-400" />
                                                                            <span className="font-bold text-gray-900 dark:text-gray-100">{apt.unit_number}</span>
                                                                            <Badge variant="outline" className="text-xs">{apt.floor}F</Badge>
                                                                        </div>

                                                                        {/* Problem devices (red) - only smoke detectors, bell, mcp, relay */}
                                                                        {problemDevices.length > 0 && (
                                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                                <span className="text-xs text-red-600 dark:text-red-400 font-medium">🔴 Бохирдсон:</span>
                                                                                {problemDevices.map((d, i) => (
                                                                                    <span key={`sd-${i}`} className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded text-xs font-mono">
                                                                                        SD-{d.address}
                                                                                    </span>
                                                                                ))}
                                                                                {/* Bell, MCP, Relay problems would be shown here if needed */}
                                                                            </div>
                                                                        )}

                                                                        {/* Warning devices (yellow) - only smoke detectors, bell, mcp, relay */}
                                                                        {warningDevices.length > 0 && (
                                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                                <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">🟡 Холболтын алдаа:</span>
                                                                                {warningDevices.map((d, i) => (
                                                                                    <span key={`sd-${i}`} className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded text-xs font-mono">
                                                                                        SD-{d.address}
                                                                                    </span>
                                                                                ))}
                                                                                {/* Bell, MCP, Relay warnings would be shown here if needed */}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <Link
                                                                        href="/admin-hunnu/apartments"
                                                                        className="text-purple-600 dark:text-purple-400 hover:underline text-xs"
                                                                    >
                                                                        Дэлгэрэнгүй →
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}





