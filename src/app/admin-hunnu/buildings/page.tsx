"use client";

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";

import { EntityTable, type ColumnDef } from "@/components/admin/entity-table";
import { EntityFilters, type FilterConfig } from "@/components/admin/entity-filters";
import { DeleteConfirmDialog } from "@/components/admin/confirm-dialog";
import { getBuildings, submitBuildingDelete } from "./actions";
import type { Building } from "@/types/admin";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Building2, MapPin, Table, Grid3X3, Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useEntityFilters } from "@/hooks/use-entity-filters";

const buildingColumns: ColumnDef<Building>[] = [
    {
        key: "name",
        header: "Building Name",
        searchable: true,
    },
    {
        key: "address",
        header: "Address",
        searchable: true,
    },
    {
        key: "total_units",
        header: "Total Units",
        render: (value) => (
            <Badge variant="secondary" className="font-mono">
                {value}
            </Badge>
        ),
    },
    {
        key: "apartments",
        header: "Current Units",
        render: (value, row) => {
            const apartmentCount = Array.isArray(value) ? value.length : 0;
            const isComplete = apartmentCount === row.total_units;
            return (
                <Badge variant={isComplete ? "default" : "outline"} className="font-mono">
                    {apartmentCount} / {row.total_units}
                </Badge>
            );
        },
    },
    {
        key: "created_at",
        header: "Created",
        render: (value) => new Date(value).toLocaleDateString(),
    },
];

const buildingFilters: FilterConfig[] = [
    {
        key: "completion_status",
        label: "Completion Status",
        type: "select",
        options: [
            { key: "complete", label: "Fully Occupied", value: "complete" },
            { key: "incomplete", label: "Has Vacancies", value: "incomplete" }
        ],
        placeholder: "All Buildings"
    },
    {
        key: "min_units",
        label: "Min Units",
        type: "number",
        placeholder: "Minimum units"
    },
    {
        key: "max_units",
        label: "Max Units",
        type: "number",
        placeholder: "Maximum units"
    }
];

function BuildingsPageContent() {
    const router = useRouter();
    const { toast } = useToast();
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [viewMode, setViewMode] = useState<"table" | "cards">("table");
    const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        building: Building | null;
        loading: boolean;
    }>({
        isOpen: false,
        building: null,
        loading: false,
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

    const loadBuildings = async (page = 1) => {
        try {
            setLoading(true);
            const apiFilters = getApiFilters();
            const result = await getBuildings({
                page,
                limit: 10,
                ...apiFilters,
            });
            setBuildings(result.data);
            setTotalPages(result.totalPages);
            setCurrentPage(result.page);
        } catch (error) {
            console.error("Error loading buildings:", error);
            toast({
                title: "Error",
                description: "Failed to load buildings",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBuildings(1);
    }, [searchQuery, filters]);

    const handlePageChange = (page: number) => {
        loadBuildings(page);
    };

    const handleAdd = () => {
        router.push("/admin-hunnu/buildings/new");
    };

    const handleEdit = (building: Building) => {
        router.push(`/admin-hunnu/buildings/${building.id}/edit`);
    };

    const handleDelete = (building: Building) => {
        setDeleteDialog({
            isOpen: true,
            building,
            loading: false,
        });
    };

    const handleConfirmDelete = async () => {
        if (!deleteDialog.building) return;

        try {
            setDeleteDialog(prev => ({ ...prev, loading: true }));

            const result = await submitBuildingDelete(deleteDialog.building.id);

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Building deleted successfully",
                });
                setDeleteDialog({ isOpen: false, building: null, loading: false });
                // Reload buildings list
                loadBuildings(currentPage);
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to delete building",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error deleting building:", error);
            toast({
                title: "Error",
                description: "Failed to delete building",
                variant: "destructive",
            });
        } finally {
            setDeleteDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const handleCancelDelete = () => {
        setDeleteDialog({ isOpen: false, building: null, loading: false });
    };

    const toggleBuildingExpansion = (buildingId: string) => {
        const newExpanded = new Set(expandedBuildings);
        if (newExpanded.has(buildingId)) {
            newExpanded.delete(buildingId);
        } else {
            newExpanded.add(buildingId);
        }
        setExpandedBuildings(newExpanded);
    };

    const groupApartmentsByFloor = (apartments: any[] = []) => {
        const grouped = apartments.reduce((acc, apartment) => {
            if (!apartment) return acc;

            const floor = apartment.floor;
            // Add safety check for floor number
            if (typeof floor !== 'number' || isNaN(floor)) return acc;

            if (!acc[floor]) {
                acc[floor] = [];
            }
            acc[floor].push(apartment);
            return acc;
        }, {} as Record<number, any[]>);

        return Object.keys(grouped)
            .map(Number)
            .sort((a: number, b: number) => a - b)
            .map(floor => ({
                floor,
                apartments: (grouped[floor] || []).sort((a: any, b: any) => (a.unit_number || '').localeCompare(b.unit_number || ''))
            }));
    };

    const renderBuildingCard = (building: Building) => {
        const isExpanded = expandedBuildings.has(building.id);
        const floorGroups = groupApartmentsByFloor(building.apartments);
        const apartmentCount = building.apartments?.length || 0;
        const isComplete = apartmentCount === building.total_units;

        return (
            <Card key={building.id} className="w-full">
                <Collapsible>
                    <CollapsibleTrigger
                        onClick={() => toggleBuildingExpansion(building.id)}
                        className="w-full"
                    >
                        <CardHeader className="hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <Building2 className="h-5 w-5 text-primary" />
                                    <div className="text-left">
                                        <CardTitle className="text-lg">{building.name}</CardTitle>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <MapPin className="h-3 w-3" />
                                            {building.address}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant={isComplete ? "default" : "outline"} className="font-mono">
                                        {apartmentCount} / {building.total_units}
                                    </Badge>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(building);
                                            }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(building);
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="pt-0">
                            {floorGroups.length > 0 ? (
                                <div className="space-y-4">
                                    <h4 className="font-medium text-sm text-muted-foreground">
                                        Apartments by Floor
                                    </h4>
                                    {floorGroups.map(({ floor, apartments }) => (
                                        <div key={floor} className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="font-mono">
                                                    Floor {floor}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {apartments.length} unit{apartments.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 ml-4">
                                                {apartments.map((apartment: any) => (
                                                    <Badge
                                                        key={apartment.id}
                                                        variant="outline"
                                                        className="font-mono text-xs"
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
                    </CollapsibleContent>
                </Collapsible>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header with view toggle */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Buildings</h1>
                    <p className="text-muted-foreground">
                        Manage buildings and view their apartments organized by floor
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={viewMode === "table" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("table")}
                        className="flex items-center gap-2"
                    >
                        <Table className="h-4 w-4" />
                        Table
                    </Button>
                    <Button
                        variant={viewMode === "cards" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("cards")}
                        className="flex items-center gap-2"
                    >
                        <Grid3X3 className="h-4 w-4" />
                        Cards
                    </Button>
                    <Button onClick={handleAdd}>
                        Add Building
                    </Button>
                </div>
            </div>

            {/* Filters */}
            {viewMode === "table" && (
                <EntityFilters
                    searchPlaceholder="Search buildings by name or address..."
                    searchValue={searchQuery}
                    onSearchChange={updateSearchQuery}
                    filters={buildingFilters}
                    filterValues={filters}
                    onFilterChange={updateFilter}
                    onClearFilters={clearFilters}
                />
            )}

            {viewMode === "table" ? (
                <EntityTable
                    data={buildings}
                    columns={buildingColumns}
                    title=""
                    loading={loading}
                    searchPlaceholder="Search buildings by name or address..."
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAdd={handleAdd}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    emptyMessage="No buildings found"
                    hideTitle={true}
                    hideAddButton={true}
                />
            ) : (
                <div className="space-y-4">
                    {/* Filters for card view */}
                    <EntityFilters
                        searchPlaceholder="Search buildings by name or address..."
                        searchValue={searchQuery}
                        onSearchChange={updateSearchQuery}
                        filters={buildingFilters}
                        filterValues={filters}
                        onFilterChange={updateFilter}
                        onClearFilters={clearFilters}
                    />

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="ml-2">Loading buildings...</span>
                        </div>
                    ) : buildings.length > 0 ? (
                        <div className="space-y-4">
                            {buildings.map(renderBuildingCard)}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <p className="text-muted-foreground">No buildings found</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Pagination for card view */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage <= 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <DeleteConfirmDialog
                isOpen={deleteDialog.isOpen}
                onOpenChange={(open) => !open && handleCancelDelete()}
                entityName={deleteDialog.building?.name || ""}
                entityType="Building"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                loading={deleteDialog.loading}
                warningMessage={
                    deleteDialog.building?.apartments && deleteDialog.building.apartments.length > 0
                        ? `This building has ${deleteDialog.building.apartments.length} apartment(s). You must remove all apartments before deleting the building.`
                        : undefined
                }
            />
        </div>
    );
}

export default function BuildingsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BuildingsPageContent />
        </Suspense>
    );
}