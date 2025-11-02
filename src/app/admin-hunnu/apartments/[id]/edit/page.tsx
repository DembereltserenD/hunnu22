"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

import { EntityForm, createApartmentFormFields } from "@/components/admin/entity-form";
import { apartmentSchema } from "@/lib/admin-validation";
import { getApartment, submitApartmentForm, getBuildingsForSelect } from "../../actions";
import type { Apartment } from "@/types/admin";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { SelectOption } from "@/components/admin/entity-form";

export default function EditApartmentPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const apartmentId = params.id as string;

    const [apartment, setApartment] = useState<Apartment | null>(null);
    const [buildings, setBuildings] = useState<SelectOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                // Load apartment and buildings in parallel
                const [apartmentData, buildingOptions] = await Promise.all([
                    getApartment(apartmentId),
                    getBuildingsForSelect()
                ]);

                setApartment(apartmentData);

                const selectOptions = buildingOptions.map(building => ({
                    value: building.id,
                    label: `${building.name} - ${building.address}`
                }));
                setBuildings(selectOptions);
            } catch (error) {
                console.error("Error loading data:", error);
                toast({
                    title: "Error",
                    description: "Failed to load apartment data",
                    variant: "destructive",
                });
                router.push("/admin-hunnu/apartments");
            } finally {
                setLoading(false);
            }
        };

        if (apartmentId) {
            loadData();
        }
    }, [apartmentId, router, toast]);

    const handleSubmit = async (data: any) => {
        try {
            setSubmitting(true);

            // Create FormData for server action
            const formData = new FormData();
            formData.append("id", apartmentId);
            formData.append("building_id", data.building_id);
            formData.append("unit_number", data.unit_number);

            const result = await submitApartmentForm(null, formData);

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Apartment updated successfully",
                });
                router.push("/admin-hunnu/apartments");
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to update apartment",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error updating apartment:", error);
            toast({
                title: "Error",
                description: "Failed to update apartment",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push("/admin-hunnu/apartments");
    };

    if (loading) {
        return (
            
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading apartment...</span>
                </div>
            
        );
    }

    if (!apartment) {
        return (
            
                <div className="text-center py-8">
                    <p className="text-muted-foreground">Apartment not found</p>
                    <Button
                        onClick={() => router.push("/admin-hunnu/apartments")}
                        className="mt-4"
                    >
                        Back to Apartments
                    </Button>
                </div>
            
        );
    }

    if (buildings.length === 0) {
        return (
            
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/admin-hunnu/apartments")}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Apartments
                        </Button>
                    </div>

                    <div className="text-center py-8">
                        <h2 className="text-2xl font-bold mb-4">No Buildings Available</h2>
                        <p className="text-muted-foreground mb-6">
                            You need to have at least one building to edit apartments.
                        </p>
                        <Button onClick={() => router.push("/admin-hunnu/buildings/new")}>
                            Create Building
                        </Button>
                    </div>
                </div>
            
        );
    }

    return (
        
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/admin-hunnu/apartments")}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Apartments
                    </Button>
                </div>

                <EntityForm
                    title={`Edit Apartment: ${apartment.unit_number}`}
                    fields={createApartmentFormFields(buildings)}
                    schema={apartmentSchema}
                    defaultValues={{
                        building_id: apartment.building_id,
                        unit_number: apartment.unit_number,
                    }}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={submitting}
                    submitLabel="Update Apartment"
                />

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-2">Current Apartment Details</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Current Floor:</strong> {apartment.floor}</p>
                        <p><strong>Current Building:</strong> {(apartment as any).building?.name || 'Unknown'}</p>
                        <p className="mt-2">
                            <strong>Note:</strong> The floor number will be automatically recalculated
                            from the unit number when you save changes.
                        </p>
                    </div>
                </div>
            </div>
        
    );
}