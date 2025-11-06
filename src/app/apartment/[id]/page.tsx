'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, Flame, Calendar, User, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { createClient } from '../../../../supabase/client';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardNavbar from "@/components/dashboard-navbar";

// Helper function to get status badge properties
function getStatusBadgeProps(status: string) {
    switch (status) {
        case 'болсон':
            return { variant: 'default' as const, className: 'bg-green-500 text-white', label: 'Completed' };
        case 'хүлээж авсан':
            return { variant: 'secondary' as const, className: 'bg-blue-500 text-white', label: 'In Progress' };
        case 'тусламж хэрэгтэй':
            return { variant: 'destructive' as const, className: 'bg-orange-500 text-white', label: 'Needs Help' };
        case 'цэвэрлэх хэрэгтэй':
            return { variant: 'secondary' as const, className: 'bg-yellow-500 text-white', label: 'Needs Cleaning' };
        case 'open':
            return { variant: 'outline' as const, className: 'bg-red-500 text-white', label: 'Open' };
        default:
            return { variant: 'outline' as const, className: 'bg-gray-500 text-white', label: status };
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
                const { data: apartment, error: apartmentError } = await supabase
                    .from('apartments')
                    .select('*, building:buildings(*)')
                    .eq('id', apartmentId)
                    .single();

                if (apartmentError) {
                    console.error('Error fetching apartment:', apartmentError);
                }

                // Get phone issues for this apartment
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

                setData({
                    apartment: apartment || null,
                    building: apartment?.building || null,
                    phoneIssues: enrichedPhoneIssues || []
                });
            } catch (error: any) {
                console.error('Error loading apartment data:', {
                    message: error?.message || 'Unknown error',
                    name: error?.name || 'Error'
                });
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [apartmentId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <DashboardNavbar />
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading apartment details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!data.apartment) {
        return (
            <div className="min-h-screen bg-background">
                <DashboardNavbar />
                <div className="container mx-auto px-4 py-12">
                    <div className="max-w-2xl mx-auto text-center">
                        <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                        <h1 className="text-2xl font-bold mb-2">Apartment Not Found</h1>
                        <p className="text-muted-foreground mb-6">The apartment you're looking for doesn't exist.</p>
                        <Link href="/dashboard">
                            <Button>
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

    const completedRecords = data.phoneIssues.filter(r => r.status === 'болсон');
    const openRecords = data.phoneIssues.filter(r => 
        r.status === 'open' || r.status === 'тусламж хэрэгтэй' || r.status === 'цэвэрлэх хэрэгтэй'
    );

    return (
        <div className="min-h-screen bg-background">
            <DashboardNavbar />
            <div className="container mx-auto px-4 py-6 max-w-7xl">
                {/* Header */}
                <div className="mb-6">
                    <Link href={`/building/${data.building?.id}`}>
                        <Button variant="ghost" size="sm" className="mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to {data.building?.name}
                        </Button>
                    </Link>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Unit {data.apartment.unit_number}</h1>
                            <p className="text-muted-foreground">
                                {data.building?.name} • Floor {data.apartment.floor}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                                    <p className="text-3xl font-bold mt-1">{data.phoneIssues.length}</p>
                                </div>
                                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                                    <Flame className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                                    <p className="text-3xl font-bold mt-1 text-green-600">{completedRecords.length}</p>
                                </div>
                                <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Open Issues</p>
                                    <p className="text-3xl font-bold mt-1 text-orange-600">{openRecords.length}</p>
                                </div>
                                <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Phone Issues</p>
                                    <p className="text-3xl font-bold mt-1 text-blue-600">{phoneCallIssues.length}</p>
                                </div>
                                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                    <Phone className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* All Records */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Activity History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.phoneIssues.length === 0 ? (
                            <div className="text-center py-12">
                                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">No Activity Yet</h3>
                                <p className="text-muted-foreground">
                                    No maintenance or phone issues have been recorded for this apartment.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {data.phoneIssues.map((issue: any) => {
                                    const badgeProps = getStatusBadgeProps(issue.status);
                                    const isPhoneIssue = ['domophone', 'light_bulb'].includes(issue.issue_type);
                                    const isSmokeDetector = issue.issue_type === 'smoke_detector';
                                    
                                    return (
                                        <div 
                                            key={issue.id} 
                                            className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                                <div className="flex gap-4 flex-1">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                        isPhoneIssue ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-green-100 dark:bg-green-900/20'
                                                    }`}>
                                                        {isPhoneIssue ? (
                                                            <Phone className="h-5 w-5 text-blue-600" />
                                                        ) : (
                                                            <Flame className="h-5 w-5 text-green-600" />
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h4 className="font-semibold">
                                                                {isPhoneIssue 
                                                                    ? (issue.issue_type === 'domophone' ? 'Domophone Issue' : 'Light Bulb Issue')
                                                                    : 'Smoke Detector Maintenance'
                                                                }
                                                            </h4>
                                                            <Badge variant={badgeProps.variant} className={badgeProps.className}>
                                                                {badgeProps.label}
                                                            </Badge>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Phone className="h-4 w-4" />
                                                                <span>{issue.phone_number}</span>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Calendar className="h-4 w-4" />
                                                                <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                            
                                                            {issue.worker && (
                                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                                    <User className="h-4 w-4" />
                                                                    <span>{issue.worker.name}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {issue.description && (
                                                            <p className="mt-3 text-sm text-muted-foreground">
                                                                {issue.description}
                                                            </p>
                                                        )}
                                                        
                                                        {issue.worker_notes && (
                                                            <div className="mt-3 p-3 bg-muted rounded-md">
                                                                <p className="text-xs font-medium mb-1">Worker Notes:</p>
                                                                <p className="text-sm">{issue.worker_notes}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}