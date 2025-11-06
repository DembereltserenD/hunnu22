'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, Flame } from "lucide-react";
import { createClient } from '../../../../supabase/client';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardNavbar from "@/components/dashboard-navbar";

// Helper function to get status badge properties
function getStatusBadgeProps(status: string) {
    switch (status) {
        case 'болсон':
            return { variant: 'default' as const, className: 'bg-green-100 text-green-800', label: 'Completed' };
        case 'хүлээж авсан':
            return { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800', label: 'In Progress' };
        case 'тусламж хэрэгтэй':
            return { variant: 'destructive' as const, className: 'bg-orange-100 text-orange-800', label: 'Needs Help' };
        case 'цэвэрлэх хэрэгтэй':
            return { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800', label: 'Needs Cleaning' };
        case 'open':
            return { variant: 'outline' as const, className: 'bg-red-100 text-red-800', label: 'Open' };
        default:
            return { variant: 'outline' as const, className: 'bg-gray-100 text-gray-800', label: status };
    }
}

export default function ApartmentDetailPage() {
    const [data, setData] = useState<{
        apartment: any;
        building: any;
        phoneIssues: any[];
    }>({
        apartment: null,
        building: null,
        phoneIssues: []
    });
    const [loading, setLoading] = useState(true);
    const params = useParams();
    const apartmentId = params.id as string;

    useEffect(() => {
        async function loadData() {
            try {
                const supabase = createClient();

                // Get apartment with building
                const { data: apartment } = await supabase
                    .from('apartments')
                    .select('*, building:buildings(*)')
                    .eq('id', apartmentId)
                    .single();

                // Get phone issues for this apartment (simplified query first)
                const { data: phoneIssues, error: phoneIssuesError } = await supabase
                    .from('phone_issues')
                    .select('*')
                    .eq('apartment_id', apartmentId)
                    .order('created_at', { ascending: false });

                if (phoneIssuesError) {
                    console.error('Error fetching phone issues:', phoneIssuesError);
                }

                // Get worker data separately if there are phone issues
                let enrichedPhoneIssues = phoneIssues || [];
                if (phoneIssues && phoneIssues.length > 0) {
                    const workerIds = phoneIssues.filter(issue => issue.worker_id).map(issue => issue.worker_id);
                    if (workerIds.length > 0) {
                        const { data: workers } = await supabase
                            .from('workers')
                            .select('id, name, email, phone')
                            .in('id', workerIds);

                        // Attach worker data to phone issues
                        enrichedPhoneIssues = phoneIssues.map(issue => ({
                            ...issue,
                            worker: workers?.find(worker => worker.id === issue.worker_id) || null
                        }));
                    }
                }

                console.log('Apartment data loaded:', {
                    apartmentId: apartmentId,
                    apartment: apartment,
                    building: apartment?.building,
                    phoneIssues: enrichedPhoneIssues,
                    phoneIssuesCount: enrichedPhoneIssues?.length || 0,
                    phoneIssuesError: phoneIssuesError,
                    apartmentFound: !!apartment,
                    apartmentUnitNumber: apartment?.unit_number
                });

                // Additional debugging: check if there are ANY phone issues in the database
                const { data: allPhoneIssues } = await supabase
                    .from('phone_issues')
                    .select('*')
                    .limit(5);

                console.log('All phone issues in database (sample):', {
                    total: allPhoneIssues?.length || 0,
                    sample: allPhoneIssues
                });

                setData({
                    apartment: apartment || null,
                    building: apartment?.building || null,
                    phoneIssues: enrichedPhoneIssues || []
                });
            } catch (error) {
                console.error('Error loading apartment data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [apartmentId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading apartment details...</p>
                </div>
            </div>
        );
    }

    if (!data.apartment) {
        return (
            <div className="min-h-screen bg-gray-50">
                <DashboardNavbar />
                <div className="p-4">
                    <div className="max-w-4xl mx-auto text-center py-12">
                        <h1 className="text-2xl font-bold text-gray-900">Apartment Not Found</h1>
                        <p className="text-gray-600 mt-2">The apartment you're looking for doesn't exist.</p>
                        <Link href="/dashboard">
                            <Button className="mt-4">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Separate different types of records
    const phoneCallIssues = data.phoneIssues.filter(issue =>
        ['domophone', 'light_bulb'].includes(issue.issue_type)
    );

    const maintenanceRecords = data.phoneIssues.filter(issue =>
        issue.issue_type === 'smoke_detector'
    );

    // Further separate maintenance records by type
    // Bulk records have specific pattern: "Cleared X smoke detectors in Building Y, Unit Z"
    const bulkMaintenanceRecords = maintenanceRecords.filter(record =>
        record.description &&
        record.description.includes('Cleared') &&
        record.description.includes('Building') &&
        record.description.includes('Unit') &&
        /Cleared \d+ smoke detectors? in Building \d+, Unit \d+/.test(record.description)
    );

    const manualMaintenanceRecords = maintenanceRecords.filter(record =>
        !bulkMaintenanceRecords.some(bulk => bulk.id === record.id)
    );

    // Calculate comprehensive maintenance statistics
    const totalSmokeDetectors = maintenanceRecords
        .reduce((total, record) => {
            // Extract quantity from description (e.g., "Cleared 2 smoke detectors")
            const quantityMatch = record.description?.match(/Cleared (\d+)/);
            return total + (quantityMatch ? parseInt(quantityMatch[1]) : 1);
        }, 0);

    const completedSmokeDetectors = maintenanceRecords
        .filter(r => r.status === 'болсон')
        .reduce((total, record) => {
            const quantityMatch = record.description?.match(/Cleared (\d+)/);
            return total + (quantityMatch ? parseInt(quantityMatch[1]) : 1);
        }, 0);

    const needsCleaningSmokeDetectors = maintenanceRecords
        .filter(r => r.status === 'цэвэрлэх хэрэгтэй')
        .reduce((total, record) => {
            const quantityMatch = record.description?.match(/Cleared (\d+)/);
            return total + (quantityMatch ? parseInt(quantityMatch[1]) : 1);
        }, 0);

    const lastActivityDate = maintenanceRecords
        .filter(r => r.resolved_at || r.created_at)
        .sort((a, b) => {
            const dateA = new Date(a.resolved_at || a.created_at).getTime();
            const dateB = new Date(b.resolved_at || b.created_at).getTime();
            return dateB - dateA;
        })[0];

    const workersInvolved = Array.from(new Set(
        maintenanceRecords
            .filter(r => r.worker)
            .map(r => r.worker.name)
    ));

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNavbar />
            <div className="p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <Link href={`/building/${data.building?.id}`}>
                            <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Building
                            </Button>
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Unit {data.apartment.unit_number}
                            </h1>
                            <p className="text-gray-600">
                                {data.building?.name} - Floor {data.apartment.floor}
                            </p>
                        </div>
                    </div>

                    {/* Enhanced Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <Flame className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="text-2xl font-bold">{totalSmokeDetectors}</p>
                                        <p className="text-xs text-gray-600">Total SD Records</p>
                                        {completedSmokeDetectors > 0 && (
                                            <p className="text-xs text-green-600">{completedSmokeDetectors} completed</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="text-2xl font-bold">{phoneCallIssues.length}</p>
                                        <p className="text-xs text-gray-600">Phone Issues</p>
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
                                            {data.phoneIssues.filter(issue =>
                                                issue.status === 'open' ||
                                                issue.status === 'тусламж хэрэгтэй' ||
                                                issue.status === 'цэвэрлэх хэрэгтэй'
                                            ).length}
                                        </p>
                                        <p className="text-xs text-gray-600">Open Issues</p>
                                        {needsCleaningSmokeDetectors > 0 && (
                                            <p className="text-xs text-yellow-600">{needsCleaningSmokeDetectors} need cleaning</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-5 w-5 bg-purple-600 rounded-full"></div>
                                    <div>
                                        <p className="text-2xl font-bold">{workersInvolved.length}</p>
                                        <p className="text-xs text-gray-600">Workers Involved</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Maintenance Summary */}
                    {maintenanceRecords.length > 0 && (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-green-600" />
                                    Maintenance Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-semibold text-gray-800">Total Smoke Detectors</h4>
                                        <p className="text-2xl font-bold text-gray-600">{totalSmokeDetectors}</p>
                                        <p className="text-sm text-gray-600">
                                            From {maintenanceRecords.length} maintenance record{maintenanceRecords.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>

                                    {completedSmokeDetectors > 0 && (
                                        <div className="p-4 bg-green-50 rounded-lg">
                                            <h4 className="font-semibold text-green-800">Completed</h4>
                                            <p className="text-2xl font-bold text-green-600">{completedSmokeDetectors}</p>
                                            <p className="text-sm text-green-600">
                                                {maintenanceRecords.filter(r => r.status === 'болсон').length} session{maintenanceRecords.filter(r => r.status === 'болсон').length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    )}

                                    {needsCleaningSmokeDetectors > 0 && (
                                        <div className="p-4 bg-yellow-50 rounded-lg">
                                            <h4 className="font-semibold text-yellow-800">Needs Cleaning</h4>
                                            <p className="text-2xl font-bold text-yellow-600">{needsCleaningSmokeDetectors}</p>
                                            <p className="text-sm text-yellow-600">
                                                {maintenanceRecords.filter(r => r.status === 'цэвэрлэх хэрэгтэй').length} session{maintenanceRecords.filter(r => r.status === 'цэвэрлэх хэрэгтэй').length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    )}

                                    {lastActivityDate && (
                                        <div className="p-4 bg-blue-50 rounded-lg">
                                            <h4 className="font-semibold text-blue-800">Last Activity</h4>
                                            <p className="text-lg font-bold text-blue-600">
                                                {new Date(lastActivityDate.resolved_at || lastActivityDate.created_at).toLocaleDateString()}
                                            </p>
                                            <p className="text-sm text-blue-600">
                                                {Math.floor((new Date().getTime() - new Date(lastActivityDate.resolved_at || lastActivityDate.created_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
                                            </p>
                                        </div>
                                    )}

                                    {workersInvolved.length > 0 && (
                                        <div className="p-4 bg-purple-50 rounded-lg">
                                            <h4 className="font-semibold text-purple-800">Workers</h4>
                                            <div className="space-y-1">
                                                {workersInvolved.slice(0, 3).map((worker, index) => (
                                                    <p key={index} className="text-sm text-purple-600">{worker}</p>
                                                ))}
                                                {workersInvolved.length > 3 && (
                                                    <p className="text-xs text-purple-500">+{workersInvolved.length - 3} more</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Phone Call Records (Manual) */}
                    {phoneCallIssues.length > 0 && (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Phone className="w-5 h-5 text-blue-600" />
                                    Phone Call Records
                                    <Badge variant="outline" className="ml-2">Manual</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {phoneCallIssues.map((issue: any) => (
                                        <div key={issue.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3 flex-1">
                                                    {issue.issue_type === 'domophone' && <Phone className="w-5 h-5 text-blue-500 mt-0.5" />}
                                                    {issue.issue_type === 'light_bulb' && <div className="w-5 h-5 bg-yellow-500 rounded-full mt-0.5" />}
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-blue-900 mb-1">
                                                            {issue.issue_type === 'domophone' ? 'Domophone Call' : 'Light Bulb Call'}
                                                        </h4>
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <span className="font-medium text-blue-800">Phone:</span>
                                                                <br />
                                                                <span className="text-blue-700">{issue.phone_number}</span>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-blue-800">Created:</span>
                                                                <br />
                                                                <span className="text-blue-700">{new Date(issue.created_at).toLocaleString()}</span>
                                                            </div>
                                                            {issue.worker && (
                                                                <div>
                                                                    <span className="font-medium text-blue-800">Worker:</span>
                                                                    <br />
                                                                    <span className="text-blue-700">{issue.worker.name}</span>
                                                                </div>
                                                            )}
                                                            {issue.description && (
                                                                <div>
                                                                    <span className="font-medium text-blue-800">Notes:</span>
                                                                    <br />
                                                                    <span className="text-blue-700">{issue.description}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {issue.worker_notes && (
                                                            <div className="mt-2 p-2 bg-orange-100 border border-orange-200 rounded">
                                                                <p className="text-xs font-medium text-orange-800">Worker Notes:</p>
                                                                <p className="text-sm text-orange-700">{issue.worker_notes}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {(() => {
                                                    const badgeProps = getStatusBadgeProps(issue.status);
                                                    return (
                                                        <Badge
                                                            variant={badgeProps.variant}
                                                            className={badgeProps.className}
                                                        >
                                                            {issue.issue_type === 'domophone' || issue.issue_type === 'light_bulb'
                                                                ? (issue.status === 'болсон' ? 'Called' : badgeProps.label)
                                                                : badgeProps.label
                                                            }
                                                        </Badge>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Bulk Maintenance Records (Physical Work) */}
                    {bulkMaintenanceRecords.length > 0 && (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-green-600" />
                                    Bulk Maintenance Records
                                    <Badge variant="secondary" className="ml-2">Bulk Import</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {bulkMaintenanceRecords.map((record: any) => {
                                        // Extract quantity from description
                                        const quantityMatch = record.description?.match(/Cleared (\d+)/);
                                        const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;

                                        return (
                                            <div key={record.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <Flame className="w-6 h-6 text-green-500 mt-0.5" />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h4 className="font-semibold text-green-900">
                                                                    Smoke Detector Cleaning (Bulk)
                                                                </h4>
                                                                <Badge variant="outline" className="bg-white">
                                                                    {quantity} unit{quantity > 1 ? 's' : ''} cleaned
                                                                </Badge>
                                                            </div>

                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                                                <div>
                                                                    <span className="font-medium text-green-800">Quantity:</span>
                                                                    <br />
                                                                    <span className="text-green-700 text-lg font-bold">{quantity} smoke detectors</span>
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium text-green-800">Phone:</span>
                                                                    <br />
                                                                    <span className="text-green-700">{record.phone_number}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium text-green-800">Import Date:</span>
                                                                    <br />
                                                                    <span className="text-green-700">{new Date(record.created_at).toLocaleString()}</span>
                                                                </div>
                                                                {record.resolved_at && (
                                                                    <div>
                                                                        <span className="font-medium text-green-800">Completed:</span>
                                                                        <br />
                                                                        <span className="text-green-700">{new Date(record.resolved_at).toLocaleString()}</span>
                                                                    </div>
                                                                )}
                                                                {record.worker && (
                                                                    <div>
                                                                        <span className="font-medium text-green-800">Worker:</span>
                                                                        <br />
                                                                        <span className="text-green-700">{record.worker.name}</span>
                                                                        {record.worker.phone && (
                                                                            <div className="text-xs text-green-600">
                                                                                {record.worker.phone}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <span className="font-medium text-green-800">Full Description:</span>
                                                                    <br />
                                                                    <span className="text-green-700 text-xs">{record.description}</span>
                                                                </div>
                                                            </div>

                                                            {record.worker_notes && (
                                                                <div className="mt-3 p-3 bg-orange-100 border border-orange-200 rounded">
                                                                    <p className="text-xs font-medium text-orange-800">Worker Notes:</p>
                                                                    <p className="text-sm text-orange-700">{record.worker_notes}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="text-right ml-4">
                                                        <Badge
                                                            variant={
                                                                record.status === 'болсон' ? 'default' :
                                                                    record.status === 'хүлээж авсан' ? 'secondary' :
                                                                        record.status === 'тусламж хэрэгтэй' ? 'destructive' : 'outline'
                                                            }
                                                            className={
                                                                record.status === 'болсон' ? 'bg-green-100 text-green-800' :
                                                                    record.status === 'хүлээж авсан' ? 'bg-blue-100 text-blue-800' :
                                                                        record.status === 'тусламж хэрэгтэй' ? 'bg-orange-100 text-orange-800' :
                                                                            'bg-red-100 text-red-800'
                                                            }
                                                        >
                                                            {record.status === 'болсон' && 'Completed'}
                                                            {record.status === 'хүлээж авсан' && 'In Progress'}
                                                            {record.status === 'тусламж хэрэгтэй' && 'Needs Help'}
                                                            {record.status === 'open' && 'Open'}
                                                        </Badge>

                                                        {record.status === 'болсон' && record.resolved_at && (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {Math.floor((Date.now() - new Date(record.resolved_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Manual Maintenance Records */}
                    {manualMaintenanceRecords.length > 0 && (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-orange-600" />
                                    Manual Maintenance Records
                                    <Badge variant="outline" className="ml-2">Manual Entry</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {manualMaintenanceRecords.map((record: any) => (
                                        <div key={record.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <Flame className="w-5 h-5 text-orange-500 mt-0.5" />
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-orange-900 mb-2">
                                                            Manual Smoke Detector Work
                                                        </h4>
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <span className="font-medium text-orange-800">Phone:</span>
                                                                <br />
                                                                <span className="text-orange-700">{record.phone_number}</span>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-orange-800">Created:</span>
                                                                <br />
                                                                <span className="text-orange-700">{new Date(record.created_at).toLocaleString()}</span>
                                                            </div>
                                                            {record.worker && (
                                                                <div>
                                                                    <span className="font-medium text-orange-800">Worker:</span>
                                                                    <br />
                                                                    <span className="text-orange-700">{record.worker.name}</span>
                                                                </div>
                                                            )}
                                                            {record.description && (
                                                                <div>
                                                                    <span className="font-medium text-orange-800">Description:</span>
                                                                    <br />
                                                                    <span className="text-orange-700">{record.description}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant={
                                                        record.status === 'болсон' ? 'default' :
                                                            record.status === 'хүлээж авсан' ? 'secondary' :
                                                                record.status === 'тусламж хэрэгтэй' ? 'destructive' : 'outline'
                                                    }
                                                >
                                                    {record.status === 'болсон' && 'Completed'}
                                                    {record.status === 'хүлээж авсан' && 'In Progress'}
                                                    {record.status === 'тусламж хэрэгтэй' && 'Needs Help'}
                                                    {record.status === 'open' && 'Open'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}



                    {phoneCallIssues.length === 0 && maintenanceRecords.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Phone className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No records found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    No phone issues or maintenance activities have been recorded for this apartment yet.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}