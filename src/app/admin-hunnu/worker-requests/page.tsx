"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from "react";
import { EntityTable, type ColumnDef } from "@/components/admin/entity-table";
import { EntityFilters, type FilterConfig } from "@/components/admin/entity-filters";
import { useEntityFilters } from "@/hooks/use-entity-filters";
import { useOptimisticUpdates } from "@/hooks/use-optimistic-updates";
import { useLoadingStates } from "@/hooks/use-loading-states";
import { handleAsyncOperation } from "@/lib/error-handling";
import { showSuccessToast, showErrorForOperation } from "@/lib/toast-helpers";
import { getWorkerRequests, updateRequestStatus } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, Package } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface WorkerRequest {
    id: string;
    worker_id: string;
    worker_name: string;
    request_type: 'equipment' | 'supplies' | 'other';
    title: string;
    description: string;
    status: 'pending' | 'approved' | 'completed' | 'rejected';
    created_at: string;
    updated_at: string;
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'pending':
            return (
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Хүлээгдэж байна
                </Badge>
            );
        case 'approved':
            return (
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Зөвшөөрөгдсөн
                </Badge>
            );
        case 'completed':
            return (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Биелсэн
                </Badge>
            );
        case 'rejected':
            return (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    <XCircle className="h-3 w-3 mr-1" />
                    Татгалзсан
                </Badge>
            );
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

const getRequestTypeLabel = (type: string) => {
    switch (type) {
        case 'equipment':
            return 'Тоног төхөөрөмж';
        case 'supplies':
            return 'Хэрэгсэл материал';
        case 'other':
            return 'Бусад';
        default:
            return type;
    }
};

const requestColumns: ColumnDef<WorkerRequest>[] = [
    {
        key: "worker_name",
        header: "Ажилчин",
        searchable: true,
    },
    {
        key: "title",
        header: "Гарчиг",
        searchable: true,
    },
    {
        key: "request_type",
        header: "Төрөл",
        render: (value) => getRequestTypeLabel(value as string),
    },
    {
        key: "status",
        header: "Төлөв",
        render: (value) => getStatusBadge(value as string),
    },
    {
        key: "created_at",
        header: "Огноо",
        render: (value) => new Date(value).toLocaleDateString('mn-MN'),
    },
];

const requestFilters: FilterConfig[] = [
    {
        key: "status",
        label: "Төлөв",
        type: "select",
        options: [
            { key: "pending", label: "Хүлээгдэж байна", value: "pending" },
            { key: "approved", label: "Зөвшөөрөгдсөн", value: "approved" },
            { key: "completed", label: "Биелсэн", value: "completed" },
            { key: "rejected", label: "Татгалзсан", value: "rejected" }
        ],
        placeholder: "Бүх төлөв"
    },
    {
        key: "request_type",
        label: "Төрөл",
        type: "select",
        options: [
            { key: "equipment", label: "Тоног төхөөрөмж", value: "equipment" },
            { key: "supplies", label: "Хэрэгсэл материал", value: "supplies" },
            { key: "other", label: "Бусад", value: "other" }
        ],
        placeholder: "Бүх төрөл"
    }
];

function WorkerRequestsPageContent() {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [detailDialog, setDetailDialog] = useState<{
        isOpen: boolean;
        request: WorkerRequest | null;
    }>({
        isOpen: false,
        request: null,
    });
    const [newStatus, setNewStatus] = useState<string>("");

    const [requestsState, requestsActions] = useOptimisticUpdates<WorkerRequest>([]);
    const [loadingStates, loadingActions] = useLoadingStates({
        fetch: true,
        update: false,
    });

    const {
        filters,
        searchQuery,
        updateFilter,
        updateSearchQuery,
        clearFilters,
        getApiFilters
    } = useEntityFilters({
        persistInUrl: true
    });

    const loadRequests = async (page = 1) => {
        await handleAsyncOperation(
            async () => {
                const apiFilters = getApiFilters();
                return await getWorkerRequests({
                    page,
                    limit: 10,
                    ...apiFilters,
                });
            },
            {
                errorMessage: "Failed to load worker requests",
                showToasts: true,
                onSuccess: (result) => {
                    requestsActions.setData(result.data);
                    setTotalPages(result.totalPages);
                    setCurrentPage(result.page);
                },
            }
        );

        loadingActions.stopLoading('fetch');
    };

    useEffect(() => {
        loadingActions.startLoading('fetch');
        loadRequests(1);
    }, [searchQuery, filters]);

    const handlePageChange = (page: number) => {
        loadRequests(page);
    };

    const handleEdit = (request: WorkerRequest) => {
        setDetailDialog({
            isOpen: true,
            request,
        });
        setNewStatus(request.status);
    };

    const handleUpdateStatus = async () => {
        if (!detailDialog.request || !newStatus) return;

        loadingActions.startLoading('update');

        try {
            const updatedRequest = { ...detailDialog.request, status: newStatus as any };
            await requestsActions.update(
                detailDialog.request.id,
                updatedRequest,
                async () => {
                    const result = await updateRequestStatus(detailDialog.request!.id, newStatus);
                    if (!result.success) {
                        throw new Error(result.error || 'Failed to update status');
                    }
                    return updatedRequest;
                }
            );
            showSuccessToast.updated('Request status');
            setDetailDialog({ isOpen: false, request: null });
        } catch (error) {
            showErrorForOperation('update', 'Request status', error);
        }

        loadingActions.stopLoading('update');
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Ажилчдын хүсэлтүүд</h1>
                <p className="text-muted-foreground">
                    Ажилчдын илгээсэн хүсэлтүүдийг харах, удирдах
                </p>
            </div>

            <EntityFilters
                searchPlaceholder="Хүсэлт хайх..."
                searchValue={searchQuery}
                onSearchChange={updateSearchQuery}
                filters={requestFilters}
                filterValues={filters}
                onFilterChange={updateFilter}
                onClearFilters={clearFilters}
            />

            <EntityTable
                data={requestsState.data}
                columns={requestColumns}
                title=""
                loading={loadingStates.fetch}
                searchPlaceholder="Хүсэлт хайх..."
                onEdit={handleEdit}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                emptyMessage="Хүсэлт олдсонгүй"
                hideTitle={true}
                hideAddButton={true}
            />

            <Dialog open={detailDialog.isOpen} onOpenChange={(open) => !open && setDetailDialog({ isOpen: false, request: null })}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Хүсэлтийн дэлгэрэнгүй
                        </DialogTitle>
                        <DialogDescription>
                            Хүсэлтийн мэдээлэл болон төлөв өөрчлөх
                        </DialogDescription>
                    </DialogHeader>

                    {detailDialog.request && (
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Ажилчин</Label>
                                <p className="text-lg font-semibold">{detailDialog.request.worker_name}</p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium text-gray-500">Гарчиг</Label>
                                <p className="text-lg">{detailDialog.request.title}</p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium text-gray-500">Төрөл</Label>
                                <p>{getRequestTypeLabel(detailDialog.request.request_type)}</p>
                            </div>

                            <div>
                                <Label className="text-sm font-medium text-gray-500">Тайлбар</Label>
                                <p className="text-sm bg-gray-50 dark:bg-slate-800 p-3 rounded-md whitespace-pre-wrap">
                                    {detailDialog.request.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">Үүсгэсэн огноо</Label>
                                    <p>{new Date(detailDialog.request.created_at).toLocaleString('mn-MN')}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">Одоогийн төлөв</Label>
                                    <div className="mt-1">{getStatusBadge(detailDialog.request.status)}</div>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="status">Төлөв өөрчлөх</Label>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger className="mt-2">
                                        <SelectValue placeholder="Төлөв сонгох" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Хүлээгдэж байна</SelectItem>
                                        <SelectItem value="approved">Зөвшөөрөгдсөн</SelectItem>
                                        <SelectItem value="completed">Биелсэн</SelectItem>
                                        <SelectItem value="rejected">Татгалзсан</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDetailDialog({ isOpen: false, request: null })}
                        >
                            Хаах
                        </Button>
                        <Button
                            onClick={handleUpdateStatus}
                            disabled={loadingStates.update || newStatus === detailDialog.request?.status}
                        >
                            {loadingStates.update ? "Хадгалж байна..." : "Төлөв өөрчлөх"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function WorkerRequestsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WorkerRequestsPageContent />
        </Suspense>
    );
}
