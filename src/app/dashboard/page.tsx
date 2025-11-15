'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, Phone, Flame, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from '../../../supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        async function checkAuthAndLoadData() {
            try {
                const supabase = createClient();
                
                // Check authentication
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                
                if (authError || !user) {
                    router.push('/sign-in');
                    return;
                }
                
                setUser(user);

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
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <DashboardNavbar />
                <div className="p-4 flex items-center justify-center min-h-[80vh]">
                    <div className="text-center">
                        <div className="relative w-16 h-16 mx-auto mb-4">
                            <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-blue-600 dark:border-blue-400 border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 font-medium">Уншиж байна...</p>
                    </div>
                </div>
            </div>
        );
    }

    const needsCleaningTotal = data.phoneIssues.filter((issue: any) =>
        issue.issue_type === 'smoke_detector' &&
        (issue.status === 'цэвэрлэх хэрэгтэй' || issue.status === 'open')
    ).length;

    const cleanedTotal = data.phoneIssues.filter((issue: any) =>
        issue.issue_type === 'smoke_detector' && issue.status === 'болсон'
    ).length;

    const needsHelpTotal = data.phoneIssues.filter((issue: any) =>
        issue.issue_type === 'smoke_detector' &&
        issue.status === 'тусламж хэрэгтэй'
    ).length;

    const totalSmokeDetectorIssues = needsCleaningTotal + cleanedTotal + needsHelpTotal;
    const completionRate = totalSmokeDetectorIssues > 0
        ? Math.round((cleanedTotal / totalSmokeDetectorIssues) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <DashboardNavbar />
            <div className="p-4 md:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8 animate-fade-in">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-lg">
                                <Flame className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Утаа мэдрэгчийн самбар
                            </h1>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 ml-14">Бүх барилгын утаа мэдрэгчийн засвар үйлчилгээг хянах</p>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 hover:scale-105">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Цэвэрлэх хэрэгтэй</p>
                                        <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{needsCleaningTotal}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">айлын SD</p>
                                    </div>
                                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                                        <Flame className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 hover:scale-105">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Цэвэрлэгдсэн</p>
                                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">{cleanedTotal}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">айлын SD</p>
                                    </div>
                                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 hover:scale-105">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Тусламж хэрэгтэй</p>
                                        <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{needsHelpTotal}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">айлын SD</p>
                                    </div>
                                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                                        <AlertCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:scale-105">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Гүйцэтгэл</p>
                                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{completionRate}%</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">дууссан</p>
                                    </div>
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                        <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content with Sidebar Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Main Content - Buildings Grid */}
                        <div className="lg:col-span-3">
                            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                                {data.buildings.map((building: any, index: any) => {
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

                                    const hasIssues = needsCleaning > 0 || commFault > 0;

                                    return (
                                        <Link key={building.id} href={`/building/${building.id}`}>
                                            <Card className={`border-0 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer group overflow-hidden animate-slide-up bg-white dark:bg-slate-900 ${hasIssues ? 'ring-2 ring-yellow-400 dark:ring-yellow-600' : ''}`}
                                                style={{ animationDelay: `${index * 50}ms` }}>
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                <CardHeader className="pb-3 relative">
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="flex items-center gap-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
                                                                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                            </div>
                                                            <span className="text-lg font-bold">{building.name}</span>
                                                        </CardTitle>
                                                        <Badge variant="secondary" className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-semibold">
                                                            {buildingApartments.length} байр
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="relative">
                                                    {needsCleaning === 0 && cleaned === 0 && commFault === 0 ? (
                                                        <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                                                            <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-green-500" />
                                                            SD асуудал байхгүй
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {needsCleaning > 0 && (
                                                                <div className="flex flex-col items-center p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900/30">
                                                                    <Flame className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mb-1" />
                                                                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400 text-center leading-tight">Цэвэрлэх</span>
                                                                    <span className="font-bold text-yellow-600 dark:text-yellow-400 text-lg mt-1">{needsCleaning}</span>
                                                                </div>
                                                            )}

                                                            {cleaned > 0 && (
                                                                <div className="flex flex-col items-center p-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900/30">
                                                                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mb-1" />
                                                                    <span className="text-xs font-medium text-green-700 dark:text-green-400 text-center leading-tight">Цэвэрлэгдсэн</span>
                                                                    <span className="font-bold text-green-600 dark:text-green-400 text-lg mt-1">{cleaned}</span>
                                                                </div>
                                                            )}

                                                            {commFault > 0 && (
                                                                <div className="flex flex-col items-center p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900/30">
                                                                    <Phone className="w-4 h-4 text-orange-600 dark:text-orange-400 mb-1" />
                                                                    <span className="text-xs font-medium text-orange-700 dark:text-orange-400 text-center leading-tight">Тусламж</span>
                                                                    <span className="font-bold text-orange-600 dark:text-orange-400 text-lg mt-1">{commFault}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    );
                                })}
                            </div>

                            {data.buildings.length === 0 && (
                                <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
                                    <CardContent className="text-center py-16">
                                        <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                                            <Building2 className="h-10 w-10 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Барилга олдсонгүй</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Админ самбараас барилга үүсгэнэ үү.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar - Recent Maintenance Records */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-20 border-0 shadow-lg bg-white dark:bg-slate-900">
                                <CardHeader className="pb-3 border-b border-gray-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                            Сүүлийн бичлэг
                                        </CardTitle>
                                        <Link href="/worker-dashboard" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium hover:underline">
                                            Бүгд →
                                        </Link>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {data.phoneIssues.filter((issue: any) => issue.issue_type !== 'smoke_detector').length > 0 ? (
                                        <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
                                            {data.phoneIssues
                                                .filter((issue: any) => issue.issue_type !== 'smoke_detector')
                                                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                                .slice(0, 10)
                                                .map((issue: any) => {
                                                    const apartment = data.apartments.find((apt: any) => apt.id === issue.apartment_id);
                                                    const building = apartment ? data.buildings.find((b: any) => b.id === apartment.building_id) : null;

                                                    return (
                                                        <div key={issue.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                            <div className="flex items-start gap-3">
                                                                <div className="flex-shrink-0 mt-0.5">
                                                                    {issue.issue_type === 'domophone' && (
                                                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                                            <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                                        </div>
                                                                    )}
                                                                    {issue.issue_type === 'light_bulb' && (
                                                                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                                                            <div className="h-4 w-4 bg-yellow-500 rounded-full" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
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
                                                                                issue.status === 'болсон' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                                    issue.status === 'хүлээж авсан' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                                        issue.status === 'тусламж хэрэгтэй' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                                                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
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
                                            <div className="p-3 bg-gray-100 dark:bg-slate-800 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                                                <Phone className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Дуудлага байхгүй</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Домофон болон гэрлийн дуудлага энд харагдана.</p>
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