"use client";

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";

import { EntityTable, type ColumnDef } from "@/components/admin/entity-table";
import { EntityFilters, type FilterConfig } from "@/components/admin/entity-filters";
import { DeleteConfirmDialog } from "@/components/admin/confirm-dialog";
import { getWorkers, submitWorkerDelete } from "./actions";
import type { Worker } from "@/types/admin";
import { useEntityFilters } from "@/hooks/use-entity-filters";
import { useOptimisticUpdates } from "@/hooks/use-optimistic-updates";
import { useLoadingStates } from "@/hooks/use-loading-states";
import { handleAsyncOperation } from "@/lib/error-handling";
import { showSuccessToast, showErrorForOperation } from "@/lib/toast-helpers";
import { t } from "framer-motion/dist/types.d-B50aGbjN";
import { t } from "framer-motion/dist/types.d-B50aGbjN";

const workerColumns: ColumnDef<Worker>[] = [
    {
        key: "name",
        header: "Name",
        searchable: true,
    },
    {
        key: "email",
        header: "Email",
        searchable: true,
        render: (value) => value || "—",
    },
    {
        key: "phone",
        header: "Phone",
        render: (value) => value || "—",
    },
    {
        key: "created_at",
        header: "Created",
        render: (value) => new Date(value).toLocaleDateString(),
    },
];

const workerFilters: FilterConfig[] = [
    {
        key: "has_email",
        label: "Email Status",
        type: "select",
        options: [
            { key: "with_email", label: "Has Email", value: "true" },
            { key: "without_email", label: "No Email", value: "false" }
        ],
        placeholder: "All Workers"
    },
    {
        key: "has_phone",
        label: "Phone Status",
        type: "select",
        options: [
            { key: "with_phone", label: "Has Phone", value: "true" },
            { key: "without_phone", label: "No Phone", value: "false" }
        ],
        placeholder: "All Workers"
    }
];

function WorkersPageContent() {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        worker: Worker | null;
    }>({
        isOpen: false,
        worker: null,
    });

    // Use optimistic updates for better UX
    const [workersState, workersActions] = useOptimisticUpdates<Worker>([]);

    // Use loading states for different operations
    const [loadingStates, loadingActions] = useLoadingStates({
        fetch: true,
        delete: false,
    });

    // Use entity filters hook for managing search and filters
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

    const loadWorkers = async (page = 1) => {
        const result = await handleAsyncOperation(
            async () => {
                const apiFilters = getApiFilters();
                return await getWorkers({
                    page,
                    limit: 10,
                    ...apiFilters,
                });
            },
            {
                errorMessage: "Failed to load workers",
                showToasts: true,
                onSuccess: (result) => {
                    workersActions.setData(result.data);
                    setTotalPages(result.totalPages);
                    setCurrentPage(result.page);
                },
            }
        );

        // Always stop loading, regardless of success or failure
        loadingActions.stopLoading('fetch');
    };

    useEffect(() => {
        loadingActions.startLoading('fetch');
        loadWorkers(1);
    }, [searchQuery, filters]);

    const handlePageChange = (page: number) => {
        loadWorkers(page);
    };

    const handleAdd = () => {
        router.push("/admin-hunnu/workers/new");
    };

    const handleEdit = (worker: Worker) => {
        router.push(`/admin-hunnu/workers/${worker.id}/edit`);
    };

    const handleDelete = (worker: Worker) => {
        setDeleteDialog({
            isOpen: true,
            worker,
        });
    };

    const handleConfirmDelete = async () => {
        if (!deleteDialog.worker) return;

        loadingActions.startLoading('delete');

        try {
            await workersActions.delete(
                deleteDialog.worker.id,
                async () => {
                    const result = await submitWorkerDelete(deleteDialog.worker!.id);
                    if (!result.success) {
                        throw new Error(result.error || 'Failed to delete worker');
                    }
                }
            );
            showSuccessToast.deleted('Worker', deleteDialog.worker.name);
        } catch (error) {
            showErrorForOperation('delete', 'Worker', error);
        }

        loadingActions.stopLoading('delete');
        setDeleteDialog({ isOpen: false, worker: null });
    };

    const handleCancelDelete = () => {
        setDeleteDialog({ isOpen: false, worker: null });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Workers</h1>
                <p className="text-muted-foreground">
                    Manage worker information and contact details
                </p>
            </div>

            <EntityFilters
                searchPlaceholder="Search workers by name, email, or phone..."
                searchValue={searchQuery}
                onSearchChange={updateSearchQuery}
                filters={workerFilters}
                filterValues={filters}
                onFilterChange={updateFilter}
                onClearFilters={clearFilters}
            />

            <EntityTable
                data={workersState.data}
                columns={workerColumns}
                title=""
                loading={loadingStates.fetch}
                searchPlaceholder="Search workers by name, email, or phone..."
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAdd={handleAdd}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                emptyMessage="No workers found"
                hideTitle={true}
            />

            <DeleteConfirmDialog
                isOpen={deleteDialog.isOpen}
                onOpenChange={(open) => !open && handleCancelDelete()}
                entityName={deleteDialog.worker?.name || ""}
                entityType="Worker"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                loading={loadingStates.delete}
            />
        </div>
    );
} expor
t default function WorkersPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WorkersPageContent />
        </Suspense>
    );
}