"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, Home, Phone, MessageSquare, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "../../../supabase/client";

interface Stats {
    workers: { total: number; active: number };
    apartments: { total: number; needsCleaning: number };
    phoneIssues: { total: number; pending: number };
    workerRequests: { total: number; pending: number };
}

export default function AdminPage() {
    const [stats, setStats] = useState<Stats>({
        workers: { total: 0, active: 0 },
        apartments: { total: 0, needsCleaning: 0 },
        phoneIssues: { total: 0, pending: 0 },
        workerRequests: { total: 0, pending: 0 },
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            const supabase = createClient();

            try {
                // Fetch workers stats
                const { count: totalWorkers } = await supabase
                    .from("workers")
                    .select("*", { count: "exact", head: true });

                const { count: activeWorkers } = await supabase
                    .from("workers")
                    .select("*", { count: "exact", head: true })
                    .eq("is_active", true);

                // Fetch apartments stats
                const { count: totalApartments } = await supabase
                    .from("apartments")
                    .select("*", { count: "exact", head: true });

                const { count: needsCleaningApartments } = await supabase
                    .from("apartments")
                    .select("*", { count: "exact", head: true })
                    .eq("status", "needs_cleaning");

                // Fetch phone issues stats
                const { count: totalPhoneIssues } = await supabase
                    .from("phone_issues")
                    .select("*", { count: "exact", head: true });

                const { count: pendingPhoneIssues } = await supabase
                    .from("phone_issues")
                    .select("*", { count: "exact", head: true })
                    .eq("status", "pending");

                // Fetch worker requests stats
                const { count: totalWorkerRequests } = await supabase
                    .from("worker_requests")
                    .select("*", { count: "exact", head: true });

                const { count: pendingWorkerRequests } = await supabase
                    .from("worker_requests")
                    .select("*", { count: "exact", head: true })
                    .eq("status", "pending");

                setStats({
                    workers: { total: totalWorkers || 0, active: activeWorkers || 0 },
                    apartments: { total: totalApartments || 0, needsCleaning: needsCleaningApartments || 0 },
                    phoneIssues: { total: totalPhoneIssues || 0, pending: pendingPhoneIssues || 0 },
                    workerRequests: { total: totalWorkerRequests || 0, pending: pendingWorkerRequests || 0 },
                });
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    return (
        <div className="space-y-6 bg-gray-50 dark:bg-slate-950 min-h-screen p-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-lg p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-white/20 p-3 rounded-lg">
                        <TrendingUp className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Админ самбар</h1>
                        <p className="text-blue-100 mt-1">Системийн удирдлагын хэсэг</p>
                    </div>
                </div>
            </div>

            {/* Statistics Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-gray-600 dark:text-gray-400">Нийт ажилчид</CardDescription>
                        <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                            {loading ? "..." : stats.workers.total}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-gray-600 dark:text-gray-400">
                                {loading ? "..." : stats.workers.active} идэвхтэй
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-gray-600 dark:text-gray-400">Нийт байр</CardDescription>
                        <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                            {loading ? "..." : stats.apartments.total}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <span className="text-gray-600 dark:text-gray-400">
                                {loading ? "..." : stats.apartments.needsCleaning} цэвэрлэх шаардлагатай
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-gray-600 dark:text-gray-400">Утасны асуудал</CardDescription>
                        <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                            {loading ? "..." : stats.phoneIssues.total}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <span className="text-gray-600 dark:text-gray-400">
                                {loading ? "..." : stats.phoneIssues.pending} хүлээгдэж байна
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-gray-600 dark:text-gray-400">Ажилчдын хүсэлт</CardDescription>
                        <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                            {loading ? "..." : stats.workerRequests.total}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-purple-600" />
                            <span className="text-gray-600 dark:text-gray-400">
                                {loading ? "..." : stats.workerRequests.pending} хүлээгдэж байна
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Navigation Cards */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Удирдлагын хэсгүүд</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Link href="/admin-hunnu/workers">
                        <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 h-full">
                            <CardHeader>
                                <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <CardTitle className="text-gray-900 dark:text-white">Ажилчид</CardTitle>
                                <CardDescription className="text-gray-600 dark:text-gray-400">
                                    Ажилчдын мэдээлэл удирдах
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/admin-hunnu/apartments">
                        <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 h-full">
                            <CardHeader>
                                <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                                    <Home className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <CardTitle className="text-gray-900 dark:text-white">Байрууд</CardTitle>
                                <CardDescription className="text-gray-600 dark:text-gray-400">
                                    Байрны мэдээлэл удирдах
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/admin-hunnu/phone-issues">
                        <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 h-full">
                            <CardHeader>
                                <div className="bg-orange-100 dark:bg-orange-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                                    <Phone className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <CardTitle className="text-gray-900 dark:text-white">Утасны асуудал</CardTitle>
                                <CardDescription className="text-gray-600 dark:text-gray-400">
                                    Утасны асуудлыг удирдах
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link href="/admin-hunnu/worker-requests">
                        <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 h-full">
                            <CardHeader>
                                <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                                    <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <CardTitle className="text-gray-900 dark:text-white">Ажилчдын хүсэлт</CardTitle>
                                <CardDescription className="text-gray-600 dark:text-gray-400">
                                    Хүсэлтүүдийг харах, удирдах
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    );
}