"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Phone, AlertTriangle, CheckCircle, Clock, Flame, Lightbulb, PhoneCall, Calendar } from 'lucide-react';
import DatePickerWithRange from '@/components/ui/date-picker-with-range';
import { DateRange } from 'react-day-picker';
import { getPhoneIssuesSummary } from './actions';

export default function PhoneIssuesPage() {
    const [phoneIssuesSummary, setPhoneIssuesSummary] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const data = await getPhoneIssuesSummary(dateRange);
                setPhoneIssuesSummary(data);
            } catch (error) {
                console.error('Error fetching phone issues:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [dateRange]);

    const getIssueTypeIcon = (type: string) => {
        switch (type) {
            case 'smoke_detector':
                return <Flame className="h-4 w-4" />;
            case 'domophone':
                return <PhoneCall className="h-4 w-4" />;
            case 'light_bulb':
                return <Lightbulb className="h-4 w-4" />;
            default:
                return <AlertTriangle className="h-4 w-4" />;
        }
    };

    const getStatusBadge = (openIssues: number, receivedIssues: number, completedIssues: number, needsHelpIssues: number) => {
        if (openIssues > 0) {
            return <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {openIssues} Нээлттэй
            </Badge>;
        }
        if (needsHelpIssues > 0) {
            return <Badge variant="destructive" className="flex items-center gap-1 bg-orange-100 text-orange-800">
                <AlertTriangle className="h-3 w-3" />
                {needsHelpIssues} Тусламж хэрэгтэй
            </Badge>;
        }
        if (receivedIssues > 0) {
            return <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-800">
                <Clock className="h-3 w-3" />
                {receivedIssues} Хүлээж авсан
            </Badge>;
        }
        return <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Бүгд болсон
        </Badge>;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Утасны асуудал</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Утасны асуудлыг удирдах</p>
                </div>
                <Link href="/admin-hunnu/phone-issues/new">
                    <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                        <Plus className="mr-2 h-4 w-4" />
                        Шинэ асуудал нэмэх
                    </Button>
                </Link>
            </div>

            {/* Date Range Filter */}
            <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <CardTitle className="text-lg">Огноогоор шүүх</CardTitle>
                    </div>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                        Тодорхой хугацааны асуудлыг харах
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <DatePickerWithRange
                            date={dateRange}
                            onDateChange={setDateRange}
                            className="w-full sm:w-auto"
                        />
                        {dateRange?.from && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDateRange(undefined)}
                                className="border-gray-300 dark:border-slate-600"
                            >
                                Цэвэрлэх
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Phone Issues List */}
            {loading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="animate-pulse bg-white dark:bg-slate-900">
                            <CardHeader>
                                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
                                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
                                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : phoneIssuesSummary.length === 0 ? (
                <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Phone className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Утасны дуудлага олдсонгүй
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                            {dateRange?.from ? 'Сонгосон хугацаанд утасны дуудлага олдсонгүй' : 'Эхний утасны дуудлагын бичлэг үүсгэнэ үү'}
                        </p>
                        <Button asChild>
                            <Link href="/admin-hunnu/phone-issues/new">
                                <Plus className="h-4 w-4 mr-2" />
                                Утасны дуудлага нэмэх
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {phoneIssuesSummary.map((summary) => (
                        <Card key={summary.phone_number} className="hover:shadow-md transition-shadow bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        <CardTitle className="text-lg text-gray-900 dark:text-white">{summary.phone_number}</CardTitle>
                                    </div>
                                    {getStatusBadge(summary.open_issues, summary.received_issues, summary.completed_issues, summary.needs_help_issues)}
                                </div>
                                <CardDescription className="text-gray-600 dark:text-gray-400">
                                    {summary.total_issues} нийт асуудал •
                                    Сүүлд шинэчилсэн: {new Date(summary.latest_issue?.updated_at || '').toLocaleDateString('mn-MN')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                    {/* Issue Status Summary */}
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Төлөвийн хураангуй</h4>
                                        <div className="space-y-1 text-sm">
                                            {summary.open_issues > 0 && (
                                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    {summary.open_issues} Нээлттэй
                                                </div>
                                            )}
                                            {summary.needs_help_issues > 0 && (
                                                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    {summary.needs_help_issues} Тусламж хэрэгтэй
                                                </div>
                                            )}
                                            {summary.received_issues > 0 && (
                                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                                    <Clock className="h-3 w-3" />
                                                    {summary.received_issues} Хүлээж авсан
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                                <CheckCircle className="h-3 w-3" />
                                                {summary.completed_issues} Болсон
                                            </div>
                                        </div>
                                    </div>

                                    {/* Issue Type Summary */}
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Асуудлын төрөл</h4>
                                        <div className="space-y-1 text-sm">
                                            {summary.domophone_issues > 0 && (
                                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                    <PhoneCall className="h-3 w-3 text-blue-500" />
                                                    {summary.domophone_issues} Домофон
                                                </div>
                                            )}
                                            {summary.light_bulb_issues > 0 && (
                                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                    <Lightbulb className="h-3 w-3 text-yellow-500" />
                                                    {summary.light_bulb_issues} Гэрэл
                                                </div>
                                            )}
                                            {summary.domophone_issues === 0 && summary.light_bulb_issues === 0 && (
                                                <div className="text-gray-500 dark:text-gray-400 text-sm">Дуудлагын бичлэг байхгүй</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Workers Summary */}
                                    {summary.resolved_by_workers.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Шийдсэн ажилчид</h4>
                                            <div className="space-y-1 text-sm">
                                                {summary.resolved_by_workers.map((worker: any) => (
                                                    <div key={worker.worker_name} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                                        {worker.worker_name}: {worker.count}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Latest Issue Info */}
                                {summary.latest_issue && (
                                    <div className="border-t border-gray-200 dark:border-slate-700 pt-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                {getIssueTypeIcon(summary.latest_issue.issue_type)}
                                                <span className="capitalize">{summary.latest_issue.issue_type.replace('_', ' ')}</span>
                                                {summary.latest_issue.apartment && (
                                                    <>
                                                        • Байр {summary.latest_issue.apartment.unit_number}
                                                        {summary.latest_issue.apartment.building && (
                                                            <> • {summary.latest_issue.apartment.building.name}</>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                            <Button variant="outline" size="sm" asChild className="border-gray-300 dark:border-slate-600">
                                                <Link href={`/admin-hunnu/phone-issues?phone=${encodeURIComponent(summary.phone_number)}`}>
                                                    Дэлгэрэнгүй
                                                </Link>
                                            </Button>
                                        </div>
                                        {summary.latest_issue.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                                {summary.latest_issue.description}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}