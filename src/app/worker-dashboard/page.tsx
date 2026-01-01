'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone, CheckCircle2, Clock, AlertCircle, HelpCircle } from "lucide-react";
import { createClient } from '../../../supabase/client';
import { useToast } from "@/components/ui/use-toast";
import DashboardNavbar from "@/components/dashboard-navbar";

interface Worker {
    id: string;
    name: string;
    email?: string;
    phone?: string;
}

interface MaintenanceRecord {
    id: string;
    issue_type: 'domophone' | 'light_bulb';
    status: 'open' | 'хүлээж авсан' | 'болсон' | 'тусламж хэрэгтэй';
    phone_number: string;
    description?: string;
    worker_notes?: string;
    worker_id?: string;
    created_at: string;
    apartment: {
        unit_number: string | null;
        building: {
            name: string | null;
        } | null;
    } | null;
    worker?: {
        name: string;
    };
}

export default function WorkerDashboardPage() {
    const [records, setRecords] = useState<MaintenanceRecord[]>([]);
    const [currentWorker, setCurrentWorker] = useState<Worker | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
    const [workerNotes, setWorkerNotes] = useState('');
    const [showNotesDialog, setShowNotesDialog] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setMounted(true);

        // Load current user from Supabase auth
        const loadCurrentUser = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    // Try to find matching worker by email
                    const { data: workers } = await supabase
                        .from('workers')
                        .select('id, name, email, phone')
                        .eq('email', user.email)
                        .limit(1);

                    if (workers && workers.length > 0) {
                        setCurrentWorker(workers[0]);
                    } else {
                        // Auto-create worker record for this user
                        const workerName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown';
                        const { data: newWorker, error: createError } = await supabase
                            .from('workers')
                            .insert({
                                name: workerName,
                                email: user.email,
                            })
                            .select()
                            .single();

                        if (newWorker && !createError) {
                            setCurrentWorker(newWorker);
                        } else {
                            console.error('Error creating worker:', createError);
                            setCurrentWorker(null);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading current user:', error);
            }
        };

        loadCurrentUser();
        loadMaintenanceRecords();
    }, []);

    const loadMaintenanceRecords = async () => {
        try {
            const supabase = createClient();

            // Check if Supabase is properly configured
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                console.error('Supabase configuration missing');
                toast({
                    title: 'Тохиргооны алдаа',
                    description: 'Supabase тохиргоо дутуу байна',
                    variant: 'destructive'
                });
                setRecords([]);
                setLoading(false);
                return;
            }

            // Get phone issues first, excluding smoke detector issues
            const { data: issues, error } = await supabase
                .from('phone_issues')
                .select('*')
                .neq('issue_type', 'smoke_detector')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase query error:', error);
                toast({
                    title: 'Алдаа',
                    description: 'Мэдээлэл татахад алдаа гарлаа. Дахин оролдоно уу.',
                    variant: 'destructive'
                });
                setRecords([]);
                setLoading(false);
                return;
            }

            // Get apartments with buildings
            const { data: apartments } = await supabase
                .from('apartments')
                .select(`
                    id,
                    unit_number,
                    building:buildings(name)
                `);

            // Get workers
            const { data: workers } = await supabase
                .from('workers')
                .select('id, name');

            // Create lookup maps
            const apartmentMap = new Map(apartments?.map(apt => [apt.id, apt]) || []);
            const workerMap = new Map(workers?.map(w => [w.id, w]) || []);

            // Transform the data to match our interface
            const transformedRecords = (issues || []).map((issue: any) => {
                // Get apartment data from map
                const apartment = issue.apartment_id ? apartmentMap.get(issue.apartment_id) : null;
                let apartmentData = null;

                if (apartment) {
                    const building = Array.isArray(apartment.building) ? apartment.building[0] : apartment.building;
                    apartmentData = {
                        unit_number: apartment.unit_number || null,
                        building: building ? { name: building.name || null } : null
                    };
                }

                // Get worker data from map
                const worker = issue.worker_id ? workerMap.get(issue.worker_id) : null;
                const workerData = worker ? { name: worker.name } : undefined;

                return {
                    ...issue,
                    apartment: apartmentData,
                    worker: workerData
                };
            });

            setRecords(transformedRecords);
        } catch (error: any) {
            console.error('Error loading maintenance records:', error);
            toast({
                title: 'Алдаа',
                description: 'Мэдээлэл татахад алдаа гарлаа. Интернэт холболтоо шалгана уу.',
                variant: 'destructive'
            });
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    const updateRecordStatus = async (recordId: string, newStatus: 'open' | 'хүлээж авсан' | 'болсон' | 'тусламж хэрэгтэй', notes?: string) => {
        // Validate worker selection
        if (!currentWorker) {
            toast({
                title: 'Анхааруулга',
                description: 'Хэрэглэгчийн мэдээлэл ачааллаж байна. Түр хүлээнэ үү.',
                variant: 'destructive'
            });
            return;
        }

        setUpdatingStatus(recordId);
        try {
            const supabase = createClient();

            const updateData: any = {
                status: newStatus,
                worker_id: currentWorker.id,
                updated_at: new Date().toISOString()
            };

            // Set resolved_at when status changes to болсон (completed)
            if (newStatus === 'болсон') {
                updateData.resolved_at = new Date().toISOString();
            } else {
                updateData.resolved_at = null;
            }

            // Add worker notes if provided
            if (notes !== undefined) {
                updateData.worker_notes = notes;
            }

            const { error } = await supabase
                .from('phone_issues')
                .update(updateData)
                .eq('id', recordId);

            if (error) {
                throw error;
            }

            // Update local state with the Mongolian status for display
            setRecords(prev => prev.map(record =>
                record.id === recordId
                    ? {
                        ...record,
                        status: newStatus,
                        worker_notes: notes || record.worker_notes,
                        worker_id: currentWorker.id,
                        worker: { name: currentWorker.name }
                    }
                    : record
            ));

            toast({
                title: 'Амжилттай',
                description: `Статус ${getStatusLabel(newStatus)} болж өөрчлөгдлөө`,
            });

            // Reload records to get fresh data from database
            await loadMaintenanceRecords();
        } catch (error) {
            console.error('Error updating status:', error);
            toast({
                title: 'Алдаа',
                description: 'Статус өөрчлөхөд алдаа гарлаа',
                variant: 'destructive'
            });
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleStatusChange = (recordId: string, newStatus: 'open' | 'хүлээж авсан' | 'болсон' | 'тусламж хэрэгтэй') => {
        // Validate worker is selected before allowing any status change
        if (!currentWorker) {
            toast({
                title: 'Анхааруулга',
                description: 'Хэрэглэгчийн мэдээлэл ачааллаж байна. Түр хүлээнэ үү.',
                variant: 'destructive'
            });
            return;
        }

        if (newStatus === 'тусламж хэрэгтэй') {
            // Show dialog to get worker notes
            const record = records.find(r => r.id === recordId);
            if (record) {
                setSelectedRecord(record);
                setWorkerNotes(record.worker_notes || '');
                setShowNotesDialog(true);
            }
        } else {
            // Update status directly
            updateRecordStatus(recordId, newStatus);
        }
    };

    const handleNotesSubmit = () => {
        if (selectedRecord) {
            updateRecordStatus(selectedRecord.id, 'тусламж хэрэгтэй', workerNotes);
            setShowNotesDialog(false);
            setSelectedRecord(null);
            setWorkerNotes('');
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'болсон':
                return <CheckCircle2 className="h-4 w-4 text-green-600" />;
            case 'хүлээж авсан':
                return <Clock className="h-4 w-4 text-blue-600" />;
            case 'тусламж хэрэгтэй':
                return <HelpCircle className="h-4 w-4 text-orange-600" />;
            case 'open':
                return <AlertCircle className="h-4 w-4 text-red-600" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-600" />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'болсон':
                return 'Болсон';
            case 'хүлээж авсан':
                return 'Хүлээж авсан';
            case 'тусламж хэрэгтэй':
                return 'Тусламж хэрэгтэй';
            case 'open':
                return 'Нээлттэй';
            default:
                return status;
        }
    };

    const getIssueIcon = (issueType: string) => {
        switch (issueType) {
            case 'domophone':
                return <Phone className="h-5 w-5 text-blue-500" />;
            case 'light_bulb':
                return <div className="h-5 w-5 bg-yellow-500 rounded-full" />;
            default:
                return <Phone className="h-5 w-5 text-gray-500" />;
        }
    };

    const getIssueTypeLabel = (issueType: string) => {
        switch (issueType) {
            case 'domophone':
                return 'Domophone';
            case 'light_bulb':
                return 'Light Bulb';
            default:
                return issueType;
        }
    };

    const stats = {
        total: records.length,
        open: records.filter(r => r.status === 'open').length,
        received: records.filter(r => r.status === 'хүлээж авсан').length,
        completed: records.filter(r => r.status === 'болсон').length,
        needsHelp: records.filter(r => r.status === 'тусламж хэрэгтэй').length
    };

    if (!mounted || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <DashboardNavbar />
                <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Ачааллаж байна...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <DashboardNavbar />

            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">Ажилчны самбар</h1>
                    <p className="text-gray-600 dark:text-gray-400">Утасны дуудлагын бүртгэлийг удирдах</p>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-white dark:bg-slate-900 border-2">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Phone className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Нийт бүртгэл</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-slate-900 border-2">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.open}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Нээлттэй</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-slate-900 border-2">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.received}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Хүлээж авсан</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-slate-900 border-2">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Болсон</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {stats.needsHelp > 0 && (
                    <Card className="mb-6 border-2 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-orange-600" />
                                <div>
                                    <p className="text-lg font-semibold text-orange-800 dark:text-orange-200">{stats.needsHelp} тусламж хэрэгтэй</p>
                                    <p className="text-sm text-orange-600 dark:text-orange-300">Эдгээр ажлууд нэмэлт тусламж шаардаж байна</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Maintenance Records */}
                <Card className="bg-white dark:bg-slate-900 border-2">
                    <CardHeader>
                        <CardTitle className="text-gray-900 dark:text-white">Утасны дуудлагын бүртгэл</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {records.length > 0 ? (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {records.map((record) => (
                                    <div key={record.id} className="p-5 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                            {/* Left Section - Issue Details */}
                                            <div className="flex gap-4 flex-1">
                                                <div className="flex-shrink-0 mt-1">
                                                    {getIssueIcon(record.issue_type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {/* Header with Issue Type and Status */}
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                                                            {getIssueTypeLabel(record.issue_type)}
                                                        </h3>
                                                        <Badge
                                                            variant={
                                                                record.status === 'болсон' ? 'default' :
                                                                    record.status === 'хүлээж авсан' ? 'secondary' :
                                                                        record.status === 'тусламж хэрэгтэй' ? 'destructive' : 'outline'
                                                            }
                                                            className={`flex items-center gap-1 ${record.status === 'болсон' ? 'bg-green-100 text-green-800' :
                                                                record.status === 'хүлээж авсан' ? 'bg-blue-100 text-blue-800' :
                                                                    record.status === 'тусламж хэрэгтэй' ? 'bg-orange-100 text-orange-800' :
                                                                        'bg-red-100 text-red-800'
                                                                }`}
                                                        >
                                                            {getStatusIcon(record.status)}
                                                            {getStatusLabel(record.status)}
                                                        </Badge>
                                                    </div>

                                                    {/* Location and Phone */}
                                                    <div className="space-y-1 mb-3">
                                                        {(() => {
                                                            const buildingName = record.apartment?.building?.name;
                                                            const unitNumber = record.apartment?.unit_number;

                                                            // Filter out "Unknown" values
                                                            const hasValidBuilding = buildingName && buildingName !== 'Unknown Building' && buildingName.trim() !== '';
                                                            const hasValidUnit = unitNumber && unitNumber !== 'Unknown Unit' && unitNumber.trim() !== '';

                                                            if (hasValidBuilding || hasValidUnit) {
                                                                return (
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        {hasValidBuilding && (
                                                                            <>
                                                                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                                                                    {buildingName}-р байр
                                                                                </span>
                                                                                {hasValidUnit && <span className="text-gray-400">•</span>}
                                                                            </>
                                                                        )}
                                                                        {hasValidUnit && (
                                                                            <span className="text-gray-600 dark:text-gray-400">
                                                                                {unitNumber} тоот
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <span className="text-gray-500 dark:text-gray-400 italic">
                                                                        Байршил тодорхойгүй
                                                                    </span>
                                                                </div>
                                                            );
                                                        })()}
                                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                            <Phone className="h-3.5 w-3.5" />
                                                            {record.phone_number}
                                                        </div>
                                                    </div>

                                                    {/* Description */}
                                                    {record.description && (
                                                        <div className="mb-2 p-2 bg-gray-50 dark:bg-slate-800 rounded text-sm text-gray-700 dark:text-gray-300">
                                                            {record.description}
                                                        </div>
                                                    )}

                                                    {/* Worker Notes */}
                                                    {record.worker_notes && (
                                                        <div className="mb-2 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
                                                            <p className="text-xs font-medium text-orange-800 dark:text-orange-300 mb-1">
                                                                Тэмдэглэл:
                                                            </p>
                                                            <p className="text-sm text-orange-700 dark:text-orange-400">
                                                                {record.worker_notes}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Worker Assignment and Date */}
                                                    <div className="flex flex-wrap items-center gap-3 text-xs">
                                                        {record.worker ? (
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-medium ${record.worker_id === currentWorker?.id ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                                                    👤 {record.worker.name}
                                                                </span>
                                                                {record.worker_id === currentWorker?.id && (
                                                                    <Badge variant="outline" className="text-xs py-0 px-1.5 h-5 bg-green-50 text-green-700 border-green-300">
                                                                        Та
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                                                                🔓 Нээлттэй - хэн ч авч болно
                                                            </Badge>
                                                        )}
                                                        <span className="text-gray-400">•</span>
                                                        <span className="text-gray-500 dark:text-gray-400">
                                                            {(() => {
                                                                const date = new Date(record.created_at);
                                                                const month = date.getMonth() + 1;
                                                                const day = date.getDate();
                                                                const hours = date.getHours().toString().padStart(2, '0');
                                                                const minutes = date.getMinutes().toString().padStart(2, '0');
                                                                return `${month}-р сар ${day}, ${hours}:${minutes}`;
                                                            })()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Section - Status Selector */}
                                            <div className="flex items-center gap-2 lg:flex-shrink-0">
                                                <Select
                                                    value={record.status}
                                                    onValueChange={(value: 'open' | 'хүлээж авсан' | 'болсон' | 'тусламж хэрэгтэй') =>
                                                        handleStatusChange(record.id, value)
                                                    }
                                                    disabled={updatingStatus === record.id}
                                                >
                                                    <SelectTrigger className="w-full lg:w-44">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="open">Нээлттэй</SelectItem>
                                                        <SelectItem value="хүлээж авсан">Хүлээж авсан</SelectItem>
                                                        <SelectItem value="болсон">Болсон</SelectItem>
                                                        <SelectItem value="тусламж хэрэгтэй">Тусламж хэрэгтэй</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {updatingStatus === record.id && (
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <Phone className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Утасны дуудлагын бүртгэл байхгүй</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Утасны дуудлагын бүртгэл олдсонгүй.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Notes Dialog */}
                <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Тусламж хэрэгтэй - Дэлгэрэнгүй</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="worker-notes">Юу тусламж хэрэгтэй байгааг тайлбарлана уу:</Label>
                                <Textarea
                                    id="worker-notes"
                                    value={workerNotes}
                                    onChange={(e) => setWorkerNotes(e.target.value)}
                                    placeholder="Тусламж хэрэгтэй байгаа асуудлын талаар дэлгэрэнгүй бичнэ үү..."
                                    rows={4}
                                    className="mt-2"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
                                    Цуцлах
                                </Button>
                                <Button onClick={handleNotesSubmit} disabled={!workerNotes.trim()}>
                                    Хадгалах
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}