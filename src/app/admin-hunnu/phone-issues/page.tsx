import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Phone, AlertTriangle, CheckCircle, Clock, Flame, Lightbulb, PhoneCall } from 'lucide-react';
import { getPhoneIssuesSummary } from './actions';

function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                    <CardHeader>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

async function PhoneIssuesList() {
    const phoneIssuesSummary = await getPhoneIssuesSummary();

    if (phoneIssuesSummary.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Phone className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No phone issues found</h3>
                    <p className="text-gray-500 text-center mb-4">
                        Get started by creating your first phone issue record.
                    </p>
                    <div className="flex gap-2">
                        <Button asChild>
                            <Link href="/admin-hunnu/phone-issues/new">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Phone Issue
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/admin-hunnu/phone-issues/bulk">
                                <Phone className="h-4 w-4 mr-2" />
                                Bulk Import
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

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

    const getStatusBadge = (openIssues: number, inProgressIssues: number, resolvedIssues: number) => {
        if (openIssues > 0) {
            return <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {openIssues} Open
            </Badge>;
        }
        if (inProgressIssues > 0) {
            return <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {inProgressIssues} In Progress
            </Badge>;
        }
        return <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            All Resolved
        </Badge>;
    };

    return (
        <div className="space-y-4">
            {phoneIssuesSummary.map((summary) => (
                <Card key={summary.phone_number} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Phone className="h-5 w-5 text-blue-600" />
                                <CardTitle className="text-lg">{summary.phone_number}</CardTitle>
                            </div>
                            {getStatusBadge(summary.open_issues, summary.in_progress_issues, summary.resolved_issues)}
                        </div>
                        <CardDescription>
                            {summary.total_issues} total issue{summary.total_issues !== 1 ? 's' : ''} •
                            Last updated: {new Date(summary.latest_issue?.updated_at || '').toLocaleDateString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            {/* Issue Status Summary */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm text-gray-700">Status Summary</h4>
                                <div className="space-y-1 text-sm">
                                    {summary.open_issues > 0 && (
                                        <div className="flex items-center gap-2 text-red-600">
                                            <AlertTriangle className="h-3 w-3" />
                                            {summary.open_issues} Open
                                        </div>
                                    )}
                                    {summary.in_progress_issues > 0 && (
                                        <div className="flex items-center gap-2 text-yellow-600">
                                            <Clock className="h-3 w-3" />
                                            {summary.in_progress_issues} In Progress
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-green-600">
                                        <CheckCircle className="h-3 w-3" />
                                        {summary.resolved_issues} Resolved
                                    </div>
                                </div>
                            </div>

                            {/* Issue Type Summary */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm text-gray-700">Issue Types</h4>
                                <div className="space-y-1 text-sm">
                                    {summary.smoke_detector_issues > 0 && (
                                        <div className="flex items-center gap-2">
                                            <Flame className="h-3 w-3 text-red-500" />
                                            {summary.smoke_detector_issues} Smoke Detector
                                            {summary.smoke_detector_resolved > 0 && (
                                                <span className="text-green-600">({summary.smoke_detector_resolved} resolved)</span>
                                            )}
                                        </div>
                                    )}
                                    {summary.domophone_issues > 0 && (
                                        <div className="flex items-center gap-2">
                                            <PhoneCall className="h-3 w-3 text-blue-500" />
                                            {summary.domophone_issues} Domophone
                                        </div>
                                    )}
                                    {summary.light_bulb_issues > 0 && (
                                        <div className="flex items-center gap-2">
                                            <Lightbulb className="h-3 w-3 text-yellow-500" />
                                            {summary.light_bulb_issues} Light Bulb
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Workers Summary */}
                            {summary.resolved_by_workers.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm text-gray-700">Resolved by Workers</h4>
                                    <div className="space-y-1 text-sm">
                                        {summary.resolved_by_workers.map((worker) => (
                                            <div key={worker.worker_name} className="flex items-center gap-2">
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
                            <div className="border-t pt-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        {getIssueTypeIcon(summary.latest_issue.issue_type)}
                                        <span className="capitalize">{summary.latest_issue.issue_type.replace('_', ' ')}</span>
                                        {summary.latest_issue.apartment && (
                                            <>
                                                • Unit {summary.latest_issue.apartment.unit_number}
                                                {summary.latest_issue.apartment.building && (
                                                    <> • {summary.latest_issue.apartment.building.name}</>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/admin-hunnu/phone-issues?phone=${encodeURIComponent(summary.phone_number)}`}>
                                            View Details
                                        </Link>
                                    </Button>
                                </div>
                                {summary.latest_issue.description && (
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                        {summary.latest_issue.description}
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function PhoneIssuesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Phone Issues</h1>
                    <p className="text-muted-foreground">
                        Track and manage phone number issues including smoke detectors, domophones, and light bulbs
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button asChild>
                        <Link href="/admin-hunnu/phone-issues/new">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Phone Issue
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/admin-hunnu/phone-issues/bulk">
                            <Phone className="h-4 w-4 mr-2" />
                            Bulk Import
                        </Link>
                    </Button>
                </div>
            </div>

            <Suspense fallback={<LoadingSkeleton />}>
                <PhoneIssuesList />
            </Suspense>
        </div>
    );
}