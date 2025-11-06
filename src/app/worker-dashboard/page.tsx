'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone, CheckCircle2, Clock, AlertCircle, HelpCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from '../../../supabase/client';
import { useToast } from "@/components/ui/use-toast";

interface MaintenanceRecord {
    id: string;
    issue_type: 'domophone' | 'light_bulb';
    status: 'open' | 'хүлээж авсан' | 'болсон' | 'тусламж хэрэгтэй';
    phone_number: string;
    description?: string;
    worker_notes?: string;
    created_at: string;
    apartment: {
        unit_number: string;
        building: {
            name: string;
        };
    };
}

export default function WorkerDashboardPage() {
    const [records, setRecords] = useState<MaintenanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
    const [workerNotes, setWorkerNotes] = useState('');
    const [showNotesDialog, setShowNotesDialog] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadMaintenanceRecords();
    }, []);

    const loadMaintenanceRecords = async () => {
        try {
            const supabase = createClient();

            // Get phone issues with apartment and building data, excluding smoke detector issues
            const { data: issues, error } = await supabase
                .from('phone_issues')
                .select(`
          id,
          issue_type,
          status,
          phone_number,
          description,
          worker_notes,
          created_at,
          apartment:apartments(
            unit_number,
            building:buildings(name)
          )
        `)
                .neq('issue_type', 'smoke_detector') // Filter out smoke detector issues
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase error:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load maintenance records. Please check your connection.',
                    variant: 'destructive'
                });
                setRecords([]);
                return;
            }

            // Transform the data to match our interface
            const transformedRecords = (issues || []).map((issue: any) => ({
                ...issue,
                apartment: Array.isArray(issue.apartment) && issue.apartment.length > 0
                    ? {
                        unit_number: issue.apartment[0].unit_number,
                        building: Array.isArray(issue.apartment[0].building) && issue.apartment[0].building.length > 0
                            ? { name: issue.apartment[0].building[0].name }
                            : { name: 'Unknown Building' }
                    }
                    : {
                        unit_number: 'Unknown Unit',
                        building: { name: 'Unknown Building' }
                    }
            }));

            setRecords(transformedRecords);
        } catch (error: any) {
            console.error('Error loading maintenance records:', {
                message: error?.message || 'Unknown error',
                details: error?.toString() || '',
                hint: error?.hint || '',
                code: error?.code || ''
            });
            toast({
                title: 'Error',
                description: 'Failed to load maintenance records. Please refresh the page.',
                variant: 'destructive'
            });
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    const updateRecordStatus = async (recordId: string, newStatus: 'open' | 'хүлээж авсан' | 'болсон' | 'тусламж хэрэгтэй', notes?: string) => {
        setUpdatingStatus(recordId);
        try {
            const supabase = createClient();

            const updateData: any = {
                status: newStatus,
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
                    ? { ...record, status: newStatus, worker_notes: notes || record.worker_notes }
                    : record
            ));

            toast({
                title: 'Амжилттай',
                description: `Статус ${getStatusLabel(newStatus)} болж өөрчлөгдлөө`,
            });
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading maintenance records...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/dashboard">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Буцах
                            </Link>
                        </Button>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Ажилчны самбар</h1>
                    <p className="text-gray-600">Утасны дуудлагын бүртгэлийг удирдах</p>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Phone className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                    <p className="text-xs text-gray-600">Нийт бүртгэл</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.open}</p>
                                    <p className="text-xs text-gray-600">Нээлттэй</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.received}</p>
                                    <p className="text-xs text-gray-600">Хүлээж авсан</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.completed}</p>
                                    <p className="text-xs text-gray-600">Болсон</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {stats.needsHelp > 0 && (
                    <Card className="mb-6 border-orange-200 bg-orange-50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-orange-600" />
                                <div>
                                    <p className="text-lg font-semibold text-orange-800">{stats.needsHelp} тусламж хэрэгтэй</p>
                                    <p className="text-sm text-orange-600">Эдгээр ажлууд нэмэлт тусламж шаардаж байна</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Maintenance Records */}
                <Card>
                    <CardHeader>
                        <CardTitle>Утасны дуудлагын бүртгэл</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {records.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                                {records.map((record) => (
                                    <div key={record.id} className="p-4 hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0">
                                                    {getIssueIcon(record.issue_type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-medium text-gray-900">
                                                            {getIssueTypeLabel(record.issue_type)}
                                                        </p>
                                                        <div className="flex items-center gap-1">
                                                            {getStatusIcon(record.status)}
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
                                                                {getStatusLabel(record.status)}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        {record.apartment?.building?.name} - Unit {record.apartment?.unit_number} • {record.phone_number}
                                                    </p>
                                                    {record.description && (
                                                        <p className="text-xs text-gray-500 mt-1">{record.description}</p>
                                                    )}
                                                    {record.worker_notes && (
                                                        <p className="text-xs text-orange-600 mt-1 font-medium">
                                                            Тэмдэглэл: {record.worker_notes}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Үүссэн: {new Date(record.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Select
                                                    value={record.status}
                                                    onValueChange={(value: 'open' | 'хүлээж авсан' | 'болсон' | 'тусламж хэрэгтэй') =>
                                                        handleStatusChange(record.id, value)
                                                    }
                                                    disabled={updatingStatus === record.id}
                                                >
                                                    <SelectTrigger className="w-40">
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
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <Phone className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Утасны дуудлагын бүртгэл байхгүй</h3>
                                <p className="mt-1 text-sm text-gray-500">Утасны дуудлагын бүртгэл олдсонгүй.</p>
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