import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, Home, Phone, MessageSquare } from "lucide-react";

export default function AdminPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Админ самбар</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Системийн удирдлагын хэсэг</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/admin-hunnu/workers">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                        <CardHeader>
                            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
                            <CardTitle className="text-gray-900 dark:text-white">Ажилчид</CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400">Ажилчдын мэдээлэл удирдах</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/admin-hunnu/apartments">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                        <CardHeader>
                            <Home className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
                            <CardTitle className="text-gray-900 dark:text-white">Байрууд</CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400">Байрны мэдээлэл удирдах</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/admin-hunnu/phone-issues">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                        <CardHeader>
                            <Phone className="h-8 w-8 text-orange-600 dark:text-orange-400 mb-2" />
                            <CardTitle className="text-gray-900 dark:text-white">Утасны асуудал</CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400">Утасны асуудлыг удирдах</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/admin-hunnu/worker-requests">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                        <CardHeader>
                            <MessageSquare className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
                            <CardTitle className="text-gray-900 dark:text-white">Ажилчдын хүсэлт</CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400">Хүсэлтүүдийг харах, удирдах</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            </div>
        </div>
    );
}