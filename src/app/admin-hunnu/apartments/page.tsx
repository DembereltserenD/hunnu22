"use client";

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";

import { EntityTable, type ColumnDef } from "@/components/admin/entity-table";
import { EntityFilters, type FilterConfig } from "@/components/admin/entity-filters";
import { DeleteConfirmDialog } from "@/components/admin/confirm-dialog";
import { getApartments, submitApartmentDelete, getBuildingsForSelect } from "./actions";
import type { Apartment } from "@/types/admin";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Building2, MapPin, Table, Grid3X3, Loader2, Home, Upload } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useEntityFilters } from "@/hooks/use-entity-filters";

const apartmentColumns: ColumnDef<Apartment>[] = [
    {
        key: "unit_number",
        header: "Unit Number",
        searchable: true,
        render: (value) => (
            <Badge variant="outline" className="font-mono">
                {value}
            </Badge>
        ),
    },
    {
        key: "building",
        header: "Building",
        searchable: true,
        render: (value: any) => value?.name || "—",
    },
    {
        key: "floor",
        header: "Floor",
        render: (value) => (
            <Badge variant="secondary" className="font-mono">
                Floor {value}
            </Badge>
        ),
    },
    {
        key: "building",
        header: "Address",
        render: (value: any) => value?.address || "—",
    },
    {
        key: "created_at",
        header: "Created",
        render: (value) => new Date(value).toLocaleDateString(),
    },
];

// Create apartment filters - will be populated with building options dynamically
const createApartmentFilters = (buildings: BuildingOption[]): FilterConfig[] => [
    {
        key: "building_id",
        label: "Building",
        type: "select",
        options: buildings.map(building => ({
            key: building.id,
            label: building.name,
            value: building.id
        })),
        placeholder: "All Buildings"
    },
    {
        key: "floor",
        label: "Floor",
        type: "number",
        placeholder: "Floor number"
    }
];

interface BuildingOption {
    id: string;
    name: string;
    address: string;
}

interface GroupedApartment extends Apartment {
    building: {
        id: string;
        name: string;
        address: string;
        total_units: number;
        created_at: string;
        updated_at: string;
    };
}

interface FloorGroup {
    floor: number;
    apartments: GroupedApartment[];
}

interface BuildingGroup {
    building: {
        id: string;
        name: string;
        address: string;
    };
    floors: FloorGroup[];
    totalApartments: number;
}

function ApartmentsPageContent() {
    const router = useRouter();
    const { toast } = useToast();
    const [apartments, setApartments] = useState<Apartment[]>([]);
    const [buildings, setBuildings] = useState<BuildingOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [viewMode, setViewMode] = useState<"table" | "grouped">("grouped");
    const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        apartment: Apartment | null;
        loading: boolean;
    }>({
        isOpen: false,
        apartment: null,
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

    const loadApartments = async (page = 1) => {
        try {
            setLoading(true);
            const apiFilters = getApiFilters();
            const result = await getApartments({
                page,
                limit: viewMode === "table" ? 10 : 1000, // Load all for grouped view
                ...apiFilters,
            });
            setApartments(result.data);
            setTotalPages(result.totalPages);
            setCurrentPage(result.page);
        } catch (error) {
            console.error("Error loading apartments:", error);
            toast({
                title: "Error",
                description: "Failed to load apartments",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const loadBuildings = async () => {
        try {
            const buildingOptions = await getBuildingsForSelect();
            setBuildings(buildingOptions);
        } catch (error) {
            console.error("Error loading buildings:", error);
            toast({
                title: "Error",
                description: "Failed to load buildings",
                variant: "destructive",
            });
        }
    };

    useEffect(() => {
        loadBuildings();
    }, []);

    useEffect(() => {
        loadApartments(1);
    }, [searchQuery, filters, viewMode]);

    const handlePageChange = (page: number) => {
        loadApartments(page);
    };

    const handleAdd = () => {
        router.push("/admin-hunnu/apartments/new");
    };

    const handleEdit = (apartment: Apartment) => {
        router.push(`/admin-hunnu/apartments/${apartment.id}/edit`);
    };

    const handleDelete = (apartment: Apartment) => {
        setDeleteDialog({
            isOpen: true,
            apartment,
            loading: false,
        });
    };

    const handleConfirmDelete = async () => {
        if (!deleteDialog.apartment) return;

        try {
            setDeleteDialog(prev => ({ ...prev, loading: true }));

            const result = await submitApartmentDelete(deleteDialog.apartment.id);

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Apartment deleted successfully",
                });
                setDeleteDialog({ isOpen: false, apartment: null, loading: false });
                // Reload apartments list
                loadApartments(currentPage);
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to delete apartment",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error deleting apartment:", error);
            toast({
                title: "Error",
                description: "Failed to delete apartment",
                variant: "destructive",
            });
        } finally {
            setDeleteDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const handleCancelDelete = () => {
        setDeleteDialog({ isOpen: false, apartment: null, loading: false });
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

    const groupApartmentsByBuilding = (): BuildingGroup[] => {
        // Add safety check for apartments array
        if (!apartments || !Array.isArray(apartments)) {
            return [];
        }

        const grouped = apartments.reduce((acc, apartment) => {
            // Add safety checks for apartment data
            if (!apartment) return acc;

            const building = (apartment as GroupedApartment).building;
            if (!building || !building.id) return acc;

            const buildingId = building.id;
            if (!acc[buildingId]) {
                acc[buildingId] = {
                    building,
                    floors: {},
                    totalApartments: 0
                };
            }

            const floor = apartment.floor;
            // Add safety check for floor number
            if (typeof floor !== 'number' || isNaN(floor)) return acc;

            if (!acc[buildingId].floors[floor]) {
                acc[buildingId].floors[floor] = [];
            }

            acc[buildingId].floors[floor].push(apartment as GroupedApartment);
            acc[buildingId].totalApartments++;

            return acc;
        }, {} as Record<string, { building: any; floors: Record<number, GroupedApartment[]>; totalApartments: number }>);

        return Object.values(grouped).map(group => ({
            building: group.building,
            totalApartments: group.totalApartments,
            floors: Object.keys(group.floors)
                .map(Number)
                .sort((a, b) => a - b)
                .map(floor => ({
                    floor,
                    apartments: (group.floors[floor] || []).sort((a, b) => (a.unit_number || '').localeCompare(b.unit_number || ''))
                }))
        })).sort((a, b) => (a.building?.name || '').localeCompare(b.building?.name || ''));
    };

    const renderBuildingGroup = (buildingGroup: BuildingGroup) => {
        const isExpanded = expandedBuildings.has(buildingGroup.building.id);

        return (
            <Card key={buildingGroup.building.id} className="w-full">
                <Collapsible>
                    <CollapsibleTrigger
                        onClick={() => toggleBuildingExpansion(buildingGroup.building.id)}
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
                                        <CardTitle className="text-lg">{buildingGroup.building.name}</CardTitle>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <MapPin className="h-3 w-3" />
                                            {buildingGroup.building.address}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="secondary" className="font-mono">
                                        {buildingGroup.totalApartments} apartment{buildingGroup.totalApartments !== 1 ? 's' : ''}
                                    </Badge>
                                    <Badge variant="outline" className="font-mono">
                                        {buildingGroup.floors.length} floor{buildingGroup.floors.length !== 1 ? 's' : ''}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="pt-0">
                            <div className="space-y-4">
                                {buildingGroup.floors.map((floorGroup) => (
                                    <div key={floorGroup.floor} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="font-mono">
                                                Floor {floorGroup.floor}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {floorGroup.apartments.length} unit{floorGroup.apartments.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-4">
                                            {floorGroup.apartments.map((apartment) => (
                                                <div
                                                    key={apartment.id}
                                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Home className="h-4 w-4 text-muted-foreground" />
                                                        <Badge variant="outline" className="font-mono">
                                                            {apartment.unit_number}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit(apartment);
                                                            }}
                                                            className="h-8 px-2 text-xs"
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(apartment);
                                                            }}
                                                            className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>
        );
    };

    const buildingGroups = groupApartmentsByBuilding();
    const apartmentFilters = createApartmentFilters(buildings);

    return (
        <div className="space-y-6">
            {/* Header with view toggle */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Apartments</h1>
                    <p className="text-muted-foreground">
                        Manage apartments organized by building and floor
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
                        variant={viewMode === "grouped" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("grouped")}
                        className="flex items-center gap-2"
                    >
                        <Grid3X3 className="h-4 w-4" />
                        Grouped
                    </Button>
                    <Button onClick={handleAdd}>
                        Add Apartment
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push("/admin-hunnu/apartments/bulk")}
                        className="flex items-center gap-2"
                    >
                        <Upload className="h-4 w-4" />
                        Bulk Import
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <EntityFilters
                searchPlaceholder="Search apartments by unit number or building..."
                searchValue={searchQuery}
                onSearchChange={updateSearchQuery}
                filters={apartmentFilters}
                filterValues={filters}
                onFilterChange={updateFilter}
                onClearFilters={clearFilters}
            />

            {viewMode === "table" ? (
                <EntityTable
                    data={apartments}
                    columns={apartmentColumns}
                    title=""
                    loading={loading}
                    searchPlaceholder="Search apartments by unit number or building..."
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAdd={handleAdd}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    emptyMessage="No apartments found"
                    hideTitle={true}
                    hideAddButton={true}

                />
            ) : (
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="ml-2">Loading apartments...</span>
                        </div>
                    ) : buildingGroups.length > 0 ? (
                        <div className="space-y-4">
                            {buildingGroups.map(renderBuildingGroup)}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <p className="text-muted-foreground">No apartments found</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            <DeleteConfirmDialog
                isOpen={deleteDialog.isOpen}
                onOpenChange={(open) => !open && handleCancelDelete()}
                entityName={deleteDialog.apartment?.unit_number || ""}
                entityType="Apartment"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                loading={deleteDialog.loading}
            />
        </div>
    );
}

export default function ApartmentsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ApartmentsPageContent />
        </Suspense>
    );
}