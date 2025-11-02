"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

import { EntityForm, createWorkerFormFields } from "@/components/admin/entity-form";
import { workerSchema } from "@/lib/admin-validation";
import { getWorker, submitWorkerForm } from "../../actions";
import type { Worker } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { handleAsyncOperation } from "@/lib/error-handling";
import { showSuccessToast, showErrorForOperation } from "@/lib/toast-helpers";

export default function EditWorkerPage() {
    const router = useRouter();
    const params = useParams();
    const workerId = params.id as string;

    const [worker, setWorker] = useState<Worker | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const loadWorker = async () => {
            const result = await handleAsyncOperation(
                async () => await getWorker(workerId),
                {
                    errorMessage: "Failed to load worker",
                    onSuccess: (workerData) => {
                        setWorker(workerData);
                    },
                    onError: (error) => {
                        showErrorForOperation('fetch', 'Worker', error);
                        router.push("/admin-hunnu/workers");
                    },
                }
            );

            setLoading(false);
        };

        if (workerId) {
            loadWorker();
        }
    }, [workerId, router]);

    const handleSubmit = async (data: any) => {
        setSubmitting(true);

        const result = await handleAsyncOperation(
            async () => {
                // Create FormData for server action
                const formData = new FormData();
                formData.append("id", workerId);
                formData.append("name", data.name);
                if (data.email) formData.append("email", data.email);
                if (data.phone) formData.append("phone", data.phone);

                const result = await submitWorkerForm(null, formData);

                if (!result.success) {
                    throw new Error(result.error || "Failed to update worker");
                }

                return result;
            },
            {
                showToasts: false, // We'll handle toasts manually
                onSuccess: () => {
                    showSuccessToast.updated('Worker', worker?.name);
                    router.push("/admin-hunnu/workers");
                },
                onError: (error) => {
                    showErrorForOperation('update', 'Worker', error);
                },
            }
        );

        setSubmitting(false);
    };

    const handleCancel = () => {
        router.push("/admin-hunnu/workers");
    };

    if (loading) {
        return (
            <LoadingSpinner size="lg" text="Loading worker..." />
        );
    }

    if (!worker) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">Worker not found</p>
                <Button
                    onClick={() => router.push("/admin-hunnu/workers")}
                    className="mt-4"
                >
                    Back to Workers
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/admin-hunnu/workers")}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Workers
                </Button>
            </div>

            <EntityForm
                title={`Edit Worker: ${worker.name}`}
                fields={createWorkerFormFields()}
                schema={workerSchema}
                defaultValues={{
                    name: worker.name,
                    email: worker.email || "",
                    phone: worker.phone || "",
                }}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={submitting}
                submitLabel="Update Worker"
                loadingText="Updating worker..."
                showLoadingOverlay={true}
            />
        </div>
    );
}