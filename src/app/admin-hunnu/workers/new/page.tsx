"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { EntityForm, createWorkerFormFields } from "@/components/admin/entity-form";
import { workerSchema } from "@/lib/admin-validation";
import { submitWorkerForm } from "../actions";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { handleAsyncOperation } from "@/lib/error-handling";
import { showSuccessToast, showErrorForOperation } from "@/lib/toast-helpers";

export default function NewWorkerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (data: any) => {
        setLoading(true);

        const result = await handleAsyncOperation(
            async () => {
                // Create FormData for server action
                const formData = new FormData();
                formData.append("name", data.name);
                if (data.email) formData.append("email", data.email);
                if (data.phone) formData.append("phone", data.phone);

                const result = await submitWorkerForm(null, formData);

                if (!result.success) {
                    throw new Error(result.error || "Failed to create worker");
                }

                return result;
            },
            {
                showToasts: false, // We'll handle toasts manually
                onSuccess: () => {
                    showSuccessToast.created('Worker');
                    router.push("/admin-hunnu/workers");
                },
                onError: (error) => {
                    showErrorForOperation('create', 'Worker', error);
                },
            }
        );

        setLoading(false);
    };

    const handleCancel = () => {
        router.push("/admin-hunnu/workers");
    };

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
                title="Create New Worker"
                fields={createWorkerFormFields()}
                schema={workerSchema}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                submitLabel="Create Worker"
                loadingText="Creating worker..."
                showLoadingOverlay={true}
            />
        </div>
    );
}