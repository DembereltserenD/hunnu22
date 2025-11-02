"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

import { EntityForm, createBuildingFormFields } from "@/components/admin/entity-form";
import { buildingSchema } from "@/lib/admin-validation";
import { getBuilding, submitBuildingForm } from "../../actions";
import type { Building } from "@/types/admin";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function EditBuildingPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const buildingId = params.id as string;

    const [building, setBuilding] = useState<Building | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const loadBuilding = async () => {
            try {
                setLoading(true);
                const buildingData = await getBuilding(buildingId);
                setBuilding(buildingData);
            } catch (error) {
                console.error("Error loading building:", error);
                toast({
                    title: "Error",
                    description: "Failed to load building",
                    variant: "destructive",
                });
                router.push("/admin-hunnu/buildings");
            } finally {
                setLoading(false);
            }
        };

        if (buildingId) {
            loadBuilding();
        }
    }, [buildingId, router]);

    const handleSubmit = async (data: any) => {
        try {
            setSubmitting(true);

            // Create FormData for server action
            const formData = new FormData();
            formData.append("id", buildingId);
            formData.append("name", data.name);
            formData.append("address", data.address);
            formData.append("total_units", data.total_units.toString());

            const result = await submitBuildingForm(null, formData);

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Building updated successfully",
                });
                router.push("/admin-hunnu/buildings");
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to update building",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error updating building:", error);
            toast({
                title: "Error",
                description: "Failed to update building",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push("/admin-hunnu/buildings");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading building...</span>
            </div>
        );
    }

    if (!building) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">Building not found</p>
                <Button
                    onClick={() => router.push("/admin-hunnu/buildings")}
                    className="mt-4"
                >
                    Back to Buildings
                </Button>
            </div>
        );
    }

    // Group apartments by floor for display
    const apartmentsByFloor = building.apartments?.reduce((acc, apartment) => {
        const floor = apartment.floor;
        if (!acc[floor]) {
            acc[floor] = [];
        }
        acc[floor].push(apartment);
        return acc;
    }, {} as Record<number, typeof building.apartments>) || {};

    const floors = Object.keys(apartmentsByFloor)
        .map(Number)
        .sort((a, b) => a - b);

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EntityForm
                    title={`Edit Building: ${building.name}`}
                    fields={createBuildingFormFields()}
                    schema={buildingSchema}
                    defaultValues={{
                        name: building.name,
                        address: building.address,
                        total_units: building.total_units,
                    }}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={submitting}
                    submitLabel="Update Building"
                />

                {/* Apartments Display */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Apartments</span>
                            <Badge variant="secondary" className="font-mono">
                                {building.apartments?.length || 0} / {building.total_units}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {floors.length > 0 ? (
                            <div className="space-y-4">
                                {floors.map((floor) => (
                                    <div key={floor} className="space-y-2">
                                        <h4 className="font-medium text-sm text-muted-foreground">
                                            Floor {floor}
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {apartmentsByFloor[floor]?.map((apartment) => (
                                                <Badge
                                                    key={apartment.id}
                                                    variant="outline"
                                                    className="font-mono"
                                                >
                                                    {apartment.unit_number}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                No apartments added yet
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>

    );
}