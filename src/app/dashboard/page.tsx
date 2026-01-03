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

    // Filters for problem devices
    const [problemBuildingFilter, setProblemBuildingFilter] = useState<string>("all");
    const [problemStatusFilter, setProblemStatusFilter] = useState<string>("all");
    const [problemSearchQuery, setProblemSearchQuery] = useState<string>("");


    useEffect(() => {
        async function checkAuthAndLoadData() {
            try {
                const supabase = createClient();

                // Get user (middleware should have already verified auth)
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError) {
                    console.error('Auth error:', authError);
                }

                // Set user if available (middleware handles redirects)
                if (user) {
                    setUser(user);
                }

                // Load dashboard data
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

                // Fetch fire panel statistics from all buildings
                try {
                    const firePanelRes = await fetch('/api/fire-panel');
                    const firePanelData = await firePanelRes.json();

                    if (firePanelData.buildings && firePanelData.buildings.length > 0) {
                        const perBuildingData: Record<string, { totalDevices: number; normal: number; contaminated: number; commFault: number }> = {};

                        const buildingPromises = firePanelData.buildings.map((buildingCode: string) =>
                            fetch(`/api/fire-panel/${encodeURIComponent(buildingCode)}`).then(res => res.json()).then(data => ({ buildingCode, data }))
                        );

                        const buildingResults = await Promise.all(buildingPromises);

                        buildingResults.forEach(({ buildingCode, data: buildingData }: { buildingCode: string; data: any }) => {
                            let bTotal = 0, bNormal = 0, bContaminated = 0, bCommFault = 0;

                            // Count from devices array (same as building page)
                            if (buildingData.devices && buildingData.devices.length > 0) {
                                buildingData.devices.forEach((device: any) => {
                                    // Count detectors
                                    const detectors = device.detectorStatuses || device.detectorAddresses?.map((addr: number) => ({ address: addr, status: 'ok' })) || [];
                                    detectors.forEach((d: any) => {
                                        bTotal++;
                                        if (d.status === 'problem') bContaminated++;
                                        else if (d.status === 'warning') bCommFault++;
                                        else bNormal++;
                                    });

                                    // Count common area
                                    const commonArea = device.commonAreaStatuses || device.commonAreaAddresses?.map((addr: number) => ({ address: addr, status: 'ok' })) || [];
                                    commonArea.forEach((d: any) => {
                                        bTotal++;
                                        if (d.status === 'problem') bContaminated++;
                                        else if (d.status === 'warning') bCommFault++;
                                        else bNormal++;
                                    });

                                    // Count bell, mcp, relay
                                    if (device.bellAddress) {
                                        bTotal++;
                                        if (device.bellStatus === 'problem') bContaminated++;
                                        else if (device.bellStatus === 'warning') bCommFault++;
                                        else bNormal++;
                                    }
                                    if (device.mcpAddress) {
                                        bTotal++;
                                        if (device.mcpStatus === 'problem') bContaminated++;
                                        else if (device.mcpStatus === 'warning') bCommFault++;
                                        else bNormal++;
                                    }
                                    if (device.relayAddress) {
                                        bTotal++;
                                        if (device.relayStatus === 'problem') bContaminated++;
                                        else if (device.relayStatus === 'warning') bCommFault++;
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

                // Load problem devices from XLSM
                try {
                    setProblemDevicesLoading(true);

                    // Get buildings list
                    const buildingsRes = await fetch('/api/apartments-xlsm', { method: 'POST' });
                    const buildingsData = await buildingsRes.json();
                    setXlsmBuildings(buildingsData.buildings || []);

                    // Get all apartments with problems or warnings
                    const apartmentsRes = await fetch('/api/apartments-xlsm?limit=1000');
                    const apartmentsData = await apartmentsRes.json();

                    // Filter only apartments with problems or warnings
                    const problemOnly = (apartmentsData.data || []).filter(
                        (apt: ProblemApartment) => apt.has_problem || apt.has_warning
                    );
                    setProblemApartments(problemOnly);
                } catch (problemError) {
                    console.error('Error loading problem devices:', problemError);
                } finally {
                    setProblemDevicesLoading(false);
                }
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }

        checkAuthAndLoadData();
    }, [router]);

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
                                            <Card className={`border-0 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer group overflow-hidden animate-slide-up bg-white/80 dark:bg-gray-800/80 backdrop-blur-md ${hasIssues ? 'ring-2 ring-orange-400 dark:ring-orange-500' : ''}`}
                                                style={{ animationDelay: `${index * 50}ms` }}>
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-orange-500/5 dark:from-purple-400/10 dark:to-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                <CardHeader className="pb-3 relative">
                                                    <CardTitle className="flex items-center gap-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg group-hover:scale-110 transition-transform">
                                                            <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                        </div>
                                                        <div>
                                                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{building.name}</span>
                                                            {building.address && (
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-normal mt-0.5">{building.address}</p>
                                                            )}
                                                        </div>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="relative">
                                                    {fpData ? (
                                                        <div className="grid grid-cols-4 gap-2">
                                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-2 text-center">
                                                                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{fpData.totalDevices}</div>
                                                                <div className="text-[10px] text-blue-600/70 dark:text-blue-400/70 font-medium">Нийт</div>
                                                            </div>
                                                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-lg p-2 text-center">
                                                                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{fpData.normal}</div>
                                                                <div className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-medium">Хэвийн</div>
                                                            </div>
                                                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-lg p-2 text-center">
                                                                <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{fpData.contaminated}</div>
                                                                <div className="text-[10px] text-amber-600/70 dark:text-amber-400/70 font-medium">Бохир</div>
                                                            </div>
                                                            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-lg p-2 text-center">
                                                                <div className="text-lg font-bold text-red-600 dark:text-red-400">{fpData.commFault}</div>
                                                                <div className="text-[10px] text-red-600/70 dark:text-red-400/70 font-medium">Алдаа</div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                                                            <Building2 className="w-5 h-5 mx-auto mb-1 text-gray-400 dark:text-gray-500" />
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
                            <Card className="sticky top-20 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                                <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                            <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-pulse"></div>
                                            Сүүлийн бичлэг
                                        </CardTitle>
                                        <Link href="/worker-dashboard" className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-sm font-medium hover:underline">
                                            Бүгд →
                                        </Link>
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
                                                {problemApartments.filter(a => a.has_problem).length} бохир
                                            </Badge>
                                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-sm">
                                                {problemApartments.filter(a => a.has_warning && !a.has_problem).length} холболт
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
                                                <SelectItem value="problem">🔴 Асуудал</SelectItem>
                                                <SelectItem value="warning">🟡 Анхааруулга</SelectItem>
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
                                                                                <span className="text-xs text-red-600 dark:text-red-400 font-medium">🔴 Асуудал:</span>
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
                                                                                <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">🟡 Анхааруулга:</span>
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