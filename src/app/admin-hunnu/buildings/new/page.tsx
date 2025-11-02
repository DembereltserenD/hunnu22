"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { EntityForm, createBuildingFormFields } from "@/components/admin/entity-form";
import { buildingSchema } from "@/lib/admin-validation";
import { submitBuildingForm } from "../actions";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewBuildingPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (data: any) => {
        try {
            setLoading(true);

            // Create FormData for server action
            const formData = new FormData();
            formData.append("name", data.name);
            formData.append("address", data.address);
            formData.append("total_units", data.total_units.toString());

            const result = await submitBuildingForm(null, formData);

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Building created successfully",
                });
                router.push("/admin-hunnu/buildings");
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to create building",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error creating building:", error);
            toast({
                title: "Error",
                description: "Failed to create building",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.push("/admin-hunnu/buildings");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/admin-hunnu/buildings")}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Buildings
                </Button>
            </div>

            <EntityForm
                title="Create New Building"
                fields={createBuildingFormFields()}
                schema={buildingSchema}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                submitLabel="Create Building"
            />
        </div>
    );
}