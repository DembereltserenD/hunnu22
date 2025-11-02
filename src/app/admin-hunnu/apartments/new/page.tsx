"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { EntityForm, createApartmentFormFields } from "@/components/admin/entity-form";
import { apartmentSchema } from "@/lib/admin-validation";
import { submitApartmentForm, getBuildingsForSelect } from "../actions";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { SelectOption } from "@/components/admin/entity-form";

export default function NewApartmentPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [buildingsLoading, setBuildingsLoading] = useState(true);
    const [buildings, setBuildings] = useState<SelectOption[]>([]);

    useEffect(() => {
        const loadBuildings = async () => {
            try {
                setBuildingsLoading(true);
                const buildingOptions = await getBuildingsForSelect();
                const selectOptions = buildingOptions.map(building => ({
                    value: building.id,
                    label: `${building.name} - ${building.address}`
                }));
                setBuildings(selectOptions);
            } catch (error) {
                console.error("Error loading buildings:", error);
                toast({
                    title: "Error",
                    description: "Failed to load buildings",
                    variant: "destructive",
                });
            } finally {
                setBuildingsLoading(false);
            }
        };

        loadBuildings();
    }, [toast]);

    const handleSubmit = async (data: any) => {
        try {
            setLoading(true);

            // Create FormData for server action
            const formData = new FormData();
            formData.append("building_id", data.building_id);
            formData.append("unit_number", data.unit_number);

            const result = await submitApartmentForm(null, formData);

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Apartment created successfully",
                });
                router.push("/admin-hunnu/apartments");
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to create apartment",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error creating apartment:", error);
            toast({
                title: "Error",
                description: "Failed to create apartment",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.push("/admin-hunnu/apartments");
    };

    if (buildingsLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading buildings...</span>
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
                            You need to create at least one building before adding apartments.
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
                    title="Create New Apartment"
                    fields={createApartmentFormFields(buildings)}
                    schema={apartmentSchema}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={loading}
                    submitLabel="Create Apartment"
                />

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-2">Note about Floor Assignment</h3>
                    <p className="text-sm text-muted-foreground">
                        The floor number will be automatically calculated from the unit number via a database trigger.
                        For example, unit "101" will be assigned to floor 1, unit "205" to floor 2, etc.
                    </p>
                </div>
            </div>
        
    );
}