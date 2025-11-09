'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, Home, Phone, BarChart3, TrendingUp } from "lucide-react";
import Link from "next/link";
import DashboardNavbar from "@/components/dashboard-navbar";

export default function AdminDashboardPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <DashboardNavbar />
            
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Админ удирдлагын самбар
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Ажилчид, барилга, байр болон утасны асуудлуудыг энэ төвлөрсөн самбараас удирдана уу
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Link href="/admin-hunnu/workers" className="group">
                        <Card className="h-full bg-white dark:bg-slate-900 border-2 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Ажилчид
                                </CardTitle>
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                                    Удирдах
                                </div>
                                <CardDescription className="text-gray-600 dark:text-gray-400">
                                    Ажилчдын мэдээллийг нэмэх, засах, удирдах
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/admin-hunnu/buildings" className="group">
                        <Card className="h-full bg-white dark:bg-slate-900 border-2 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Барилгууд
                                </CardTitle>
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                                    <Building className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                                    Удирдах
                                </div>
                                <CardDescription className="text-gray-600 dark:text-gray-400">
                                    Барилгын мэдээллийг нэмэх, засах, удирдах
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/admin-hunnu/apartments" className="group">
                        <Card className="h-full bg-white dark:bg-slate-900 border-2 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Байрууд
                                </CardTitle>
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                                    <Home className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                                    Удирдах
                                </div>
                                <CardDescription className="text-gray-600 dark:text-gray-400">
                                    Байрны мэдээллийг нэмэх, засах, удирдах
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/admin-hunnu/phone-issues" className="group">
                        <Card className="h-full bg-white dark:bg-slate-900 border-2 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Утасны асуудал
                                </CardTitle>
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                                    <Phone className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                                    Хянах
                                </div>
                                <CardDescription className="text-gray-600 dark:text-gray-400">
                                    Утасны асуудал болон засварын статусыг хянах
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/health-stats" className="group">
                        <Card className="h-full bg-white dark:bg-slate-900 border-2 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Эрүүл мэндийн статистик
                                </CardTitle>
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                                    <BarChart3 className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                                    Үзэх
                                </div>
                                <CardDescription className="text-gray-600 dark:text-gray-400">
                                    Барилгын эрүүл мэндийн байдлыг хянах
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/worker-requests" className="group">
                        <Card className="h-full bg-white dark:bg-slate-900 border-2 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Ажилчдын хүсэлт
                                </CardTitle>
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                                    <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                                    Хянах
                                </div>
                                <CardDescription className="text-gray-600 dark:text-gray-400">
                                    Ажилчдын хүсэлтүүдийг хянах, зөвшөөрөх
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    );
}