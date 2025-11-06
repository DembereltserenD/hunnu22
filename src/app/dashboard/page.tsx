'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, Phone, Flame } from "lucide-react";
import Link from "next/link";
import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from '../../../supabase/client';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
    const [data, setData] = useState<{
        buildings: any[];
        apartments: any[];
        phoneIssues: any[];
    }>({
        buildings: [],
        apartments: [],
        phoneIssues: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const supabase = createClient();

                const [buildingsRes, apartmentsRes, phoneIssuesRes] = await Promise.all([
                    supabase.from('buildings').select('*'),
                    supabase.from('apartments').select('*'),
                    supabase.from('phone_issues').select('*')
                ]);

                // Check for duplicate building names and apartment counts
                const buildingStats = buildingsRes.data?.map(building => {
                    const apartmentCount = apartmentsRes.data?.filter(apt => apt.building_id === building.id).length || 0;
                    return { id: building.id, name: building.name, apartmentCount };
                });

                console.log('Dashboard Data Loaded:', {
                    buildings: buildingsRes.data?.length || 0,
                    apartments: apartmentsRes.data?.length || 0,
                    phoneIssues: phoneIssuesRes.data?.length || 0,
                    buildingStats,
                    duplicateBuilding222: buildingStats?.filter(b => b.name === '222')
                });

                setData({
                    buildings: buildingsRes.data || [],
                    apartments: apartmentsRes.data || [],
                    phoneIssues: phoneIssuesRes.data || []
                });
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNavbar />
            <div className="p-4">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Smoke Detector Dashboard</h1>
                        <p className="text-gray-600">Track smoke detector maintenance across all buildings</p>
                    </div>

                    {/* Smoke Detector Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <Flame className="h-5 w-5 text-yellow-600" />
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {data.phoneIssues.filter((issue: any) =>
                                                issue.issue_type === 'smoke_detector' &&
                                                (issue.status === 'цэвэрлэх хэрэгтэй' || issue.status === 'open')
                                            ).length}
                                        </p>
                                        <p className="text-xs text-gray-600">айлын SD цэвэрлэх хэрэгтэй</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {data.phoneIssues.filter((issue: any) => issue.issue_type === 'smoke_detector' && issue.status === 'болсон').length}
                                        </p>
                                        <p className="text-xs text-gray-600">айлын SD цэвэрлэгдсэн</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-5 w-5 text-orange-600" />
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {data.phoneIssues.filter((issue: any) =>
                                                issue.issue_type === 'smoke_detector' &&
                                                issue.status === 'тусламж хэрэгтэй'
                                            ).length}
                                        </p>
                                        <p className="text-xs text-gray-600">айлын SD тусламж хэрэгтэй</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content with Sidebar Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Main Content - Buildings Grid */}
                        <div className="lg:col-span-3">
                            <div className="grid md:grid-cols-2 gap-6">
                                {data.buildings.map((building: any) => {
                                    const buildingApartments = data.apartments.filter((apt: any) => apt.building_id === building.id);
                                    const buildingSmokeDetectorIssues = data.phoneIssues.filter((issue: any) =>
                                        issue.issue_type === 'smoke_detector' &&
                                        buildingApartments.some((apt: any) => apt.id === issue.apartment_id)
                                    );

                                    const needsCleaning = buildingSmokeDetectorIssues.filter((issue: any) =>
                                        issue.status === 'цэвэрлэх хэрэгтэй' || issue.status === 'open'
                                    ).length;

                                    const cleaned = buildingSmokeDetectorIssues.filter((issue: any) =>
                                        issue.status === 'болсон'
                                    ).length;

                                    const commFault = buildingSmokeDetectorIssues.filter((issue: any) =>
                                        issue.status === 'тусламж хэрэгтэй'
                                    ).length;

                                    return (
                                        <Link key={building.id} href={`/building/${building.id}`}>
                                            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="flex items-center gap-2">
                                                            <Building2 className="w-5 h-5 text-blue-600" />
                                                            {building.name}
                                                        </CardTitle>
                                                        <Badge variant="secondary">
                                                            {buildingApartments.length} units
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-3">
                                                        {needsCleaning > 0 && (
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="flex items-center gap-2">
                                                                    <Flame className="w-4 h-4 text-yellow-500" />
                                                                    SD цэвэрлэх хэрэгтэй
                                                                </span>
                                                                <span className="font-medium text-yellow-600">{needsCleaning}</span>
                                                            </div>
                                                        )}

                                                        {cleaned > 0 && (
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="flex items-center gap-2">
                                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                                    SD цэвэрлэгдсэн
                                                                </span>
                                                                <span className="font-medium text-green-600">{cleaned}</span>
                                                            </div>
                                                        )}

                                                        {commFault > 0 && (
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="flex items-center gap-2">
                                                                    <Phone className="w-4 h-4 text-orange-500" />
                                                                    SD тусламж хэрэгтэй
                                                                </span>
                                                                <span className="font-medium text-orange-600">{commFault}</span>
                                                            </div>
                                                        )}

                                                        {needsCleaning === 0 && cleaned === 0 && commFault === 0 && (
                                                            <div className="text-sm text-gray-500">
                                                                SD асуудал байхгүй
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    );
                                })}
                            </div>

                            {data.buildings.length === 0 && (
                                <div className="text-center py-12">
                                    <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No buildings found</h3>
                                    <p className="mt-1 text-sm text-gray-500">Get started by creating a building in the admin panel.</p>
                                </div>
                            )}
                        </div>

                        {/* Sidebar - Recent Maintenance Records */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-4">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">Recent Records</CardTitle>
                                        <Link href="/worker-dashboard" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                            View All →
                                        </Link>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {data.phoneIssues.filter((issue: any) => issue.issue_type !== 'smoke_detector').length > 0 ? (
                                        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                                            {data.phoneIssues
                                                .filter((issue: any) => issue.issue_type !== 'smoke_detector') // Hide smoke detector records
                                                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                                .slice(0, 8) // Show only recent 8 records for sidebar
                                                .map((issue: any) => {
                                                    const apartment = data.apartments.find((apt: any) => apt.id === issue.apartment_id);
                                                    const building = apartment ? data.buildings.find((b: any) => b.id === apartment.building_id) : null;

                                                    return (
                                                        <div key={issue.id} className="p-3 hover:bg-gray-50">
                                                            <div className="flex items-start gap-2">
                                                                <div className="flex-shrink-0 mt-0.5">
                                                                    {issue.issue_type === 'smoke_detector' && <Flame className="h-4 w-4 text-orange-500" />}
                                                                    {issue.issue_type === 'domophone' && <Phone className="h-4 w-4 text-blue-500" />}
                                                                    {issue.issue_type === 'light_bulb' && <div className="h-4 w-4 bg-yellow-500 rounded-full" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                                        {issue.issue_type === 'smoke_detector' && 'Smoke Detector'}
                                                                        {issue.issue_type === 'domophone' && 'Domophone'}
                                                                        {issue.issue_type === 'light_bulb' && 'Light Bulb'}
                                                                    </p>
                                                                    <p className="text-xs text-gray-600 truncate">
                                                                        {building?.name} - Unit {apartment?.unit_number}
                                                                    </p>
                                                                    <div className="flex items-center justify-between mt-1">
                                                                        <Badge
                                                                            variant={
                                                                                issue.status === 'болсон' ? 'default' :
                                                                                    issue.status === 'хүлээж авсан' ? 'secondary' :
                                                                                        issue.status === 'тусламж хэрэгтэй' ? 'destructive' : 'outline'
                                                                            }
                                                                            className={
                                                                                issue.status === 'болсон' ? 'bg-green-100 text-green-800' :
                                                                                    issue.status === 'хүлээж авсан' ? 'bg-blue-100 text-blue-800' :
                                                                                        issue.status === 'тусламж хэрэгтэй' ? 'bg-orange-100 text-orange-800' :
                                                                                            'bg-red-100 text-red-800'
                                                                            }
                                                                        >
                                                                            {issue.status === 'болсон' && 'Болсон'}
                                                                            {issue.status === 'хүлээж авсан' && 'Хүлээж авсан'}
                                                                            {issue.status === 'тусламж хэрэгтэй' && 'Тусламж хэрэгтэй'}
                                                                            {issue.status === 'open' && 'Нээлттэй'}
                                                                        </Badge>
                                                                        <span className="text-xs text-gray-400">
                                                                            {new Date(issue.created_at).toLocaleDateString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center">
                                            <Phone className="mx-auto h-8 w-8 text-gray-400" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No recent calls</h3>
                                            <p className="mt-1 text-xs text-gray-500">Domophone and light bulb calls will appear here.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}