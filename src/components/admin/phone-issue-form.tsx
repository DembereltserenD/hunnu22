'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Search, X } from 'lucide-react';
import { createPhoneIssue, updatePhoneIssue } from '@/app/admin-hunnu/phone-issues/actions';
import { PhoneIssue, PhoneIssueFormData } from '@/types/admin';
import { cleanUnitNumber } from '@/lib/floor-utils';

interface ApartmentForSelect {
    id: string;
    unit_number: string;
    floor: number;
    building_id: string;
    building: any; // Supabase returns this as array, we'll handle it in the component
}

interface WorkerForSelect {
    id: string;
    name: string;
    email?: string;
    phone?: string;
}

interface BuildingForSelect {
    id: string;
    name: string;
    address?: string;
}

interface PhoneIssueFormProps {
    phoneIssue?: PhoneIssue;
    apartments: ApartmentForSelect[];
    workers: WorkerForSelect[];
    buildings?: BuildingForSelect[];
}

export function PhoneIssueForm({ phoneIssue, apartments, workers, buildings }: PhoneIssueFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
    const [buildingSearchTerm, setBuildingSearchTerm] = useState('');
    const [apartmentSearchTerm, setApartmentSearchTerm] = useState('');

    const [formData, setFormData] = useState<PhoneIssueFormData>({
        apartment_id: phoneIssue?.apartment_id || '',
        phone_number: phoneIssue?.phone_number || '',
        issue_type: phoneIssue?.issue_type || 'domophone',
        status: phoneIssue?.status || 'open', // Default to 'open' for new issues
        worker_id: phoneIssue?.worker_id || '',
        description: phoneIssue?.description || ''
    });

    // Group apartments by building and create building options
    const { buildingsData, apartmentsByBuilding } = useMemo(() => {
        const apartmentMap = new Map();

        // Use separate buildings prop if available, otherwise extract from apartments
        let buildingsToUse: BuildingForSelect[] = [];

        if (buildings && buildings.length > 0) {
            // Use the separate buildings data
            buildingsToUse = buildings.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            // Fallback to extracting from apartments
            const buildingMap = new Map();
            apartments.forEach((apartment) => {
                const building = Array.isArray(apartment.building) ? apartment.building[0] : apartment.building;
                if (building) {
                    buildingMap.set(building.id, building);
                }
            });
            buildingsToUse = Array.from(buildingMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        }

        // Group apartments by building
        apartments.forEach((apartment) => {
            const buildingId = apartment.building_id;
            if (buildingId) {
                if (!apartmentMap.has(buildingId)) {
                    apartmentMap.set(buildingId, []);
                }
                apartmentMap.get(buildingId).push(apartment);
            }
        });

        // Sort apartments within each building by unit number with improved logic
        apartmentMap.forEach((apts: ApartmentForSelect[]) => {
            apts.sort((a: ApartmentForSelect, b: ApartmentForSelect) => {
                // Clean unit numbers first to handle cases like "101", "101-1SD", etc.
                const aClean = cleanUnitNumber(a.unit_number);
                const bClean = cleanUnitNumber(b.unit_number);

                // Extract numeric part from cleaned unit numbers
                const aNum = parseInt(aClean);
                const bNum = parseInt(bClean);

                // First sort by numeric part
                if (!isNaN(aNum) && !isNaN(bNum) && aNum !== bNum) {
                    return aNum - bNum;
                }

                // If numeric parts are equal or non-numeric, sort by cleaned unit number alphabetically
                return aClean.localeCompare(bClean, undefined, {
                    numeric: true,
                    sensitivity: 'base'
                });
            });
        });

        return {
            buildingsData: buildingsToUse,
            apartmentsByBuilding: apartmentMap
        };
    }, [apartments, buildings]);

    // Set initial building selection if editing existing phone issue
    useState(() => {
        if (phoneIssue?.apartment_id) {
            const apartment = apartments.find(apt => apt.id === phoneIssue.apartment_id);
            if (apartment) {
                const building = Array.isArray(apartment.building) ? apartment.building[0] : apartment.building;
                if (building) {
                    setSelectedBuildingId(building.id);
                }
            }
        }
    });

    // Filter buildings based on search term
    const filteredBuildings = useMemo(() => {
        if (!buildingSearchTerm.trim()) return buildingsData;
        const searchTerm = buildingSearchTerm.toLowerCase().trim();
        return buildingsData.filter(building => {
            const nameMatch = building.name?.toLowerCase().includes(searchTerm);
            const addressMatch = building.address?.toLowerCase().includes(searchTerm);
            return nameMatch || addressMatch;
        });
    }, [buildingsData, buildingSearchTerm]);

    // Get apartments for the selected building and filter by search term
    const availableApartments = useMemo(() => {
        if (!selectedBuildingId) return [];
        const apartments = apartmentsByBuilding.get(selectedBuildingId) || [];
        if (!apartmentSearchTerm.trim()) return apartments;
        const searchTerm = apartmentSearchTerm.toLowerCase().trim();
        return apartments.filter((apartment: ApartmentForSelect) => {
            const unitMatch = apartment.unit_number?.toLowerCase().includes(searchTerm);
            const floorMatch = apartment.floor?.toString().includes(searchTerm);
            return unitMatch || floorMatch;
        });
    }, [selectedBuildingId, apartmentsByBuilding, apartmentSearchTerm]);

    // Handle building selection
    const handleBuildingChange = (buildingId: string) => {
        setSelectedBuildingId(buildingId);
        // Clear apartment selection and search when building changes
        setFormData({ ...formData, apartment_id: '' });
        setApartmentSearchTerm('');
    };

    // Clear search terms when needed
    const clearBuildingSearch = () => {
        setBuildingSearchTerm('');
    };

    const clearApartmentSearch = () => {
        setApartmentSearchTerm('');
    };

    // Keyboard shortcuts for search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Escape key clears search
            if (e.key === 'Escape') {
                if (document.activeElement?.getAttribute('placeholder')?.includes('Search buildings')) {
                    clearBuildingSearch();
                } else if (document.activeElement?.getAttribute('placeholder')?.includes('Search apartments')) {
                    clearApartmentSearch();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (phoneIssue) {
                await updatePhoneIssue(phoneIssue.id, formData);
                toast({
                    title: 'Success',
                    description: 'Phone issue updated successfully'
                });
            } else {
                // Ensure new issues start with 'open' status
                const newIssueData = { ...formData, status: 'open' as const };
                await createPhoneIssue(newIssueData);
                toast({
                    title: 'Success',
                    description: 'Phone call record created successfully'
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Something went wrong',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push('/admin-hunnu/phone-issues');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="text-sm text-gray-700">
                    <strong>Apartment Selection:</strong> First select a building, then choose the specific apartment. Use the search boxes to quickly find buildings or apartments.
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="building_id">Building *</Label>
                    <div className="space-y-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search buildings..."
                                value={buildingSearchTerm}
                                onChange={(e) => setBuildingSearchTerm(e.target.value)}
                                className="pl-10 pr-10"
                            />
                            {buildingSearchTerm && (
                                <button
                                    type="button"
                                    onClick={clearBuildingSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <Select
                            value={selectedBuildingId}
                            onValueChange={handleBuildingChange}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select building" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                {buildingSearchTerm && (
                                    <div className="px-2 py-1 text-xs text-gray-500 border-b">
                                        {filteredBuildings.length} building{filteredBuildings.length !== 1 ? 's' : ''} found
                                    </div>
                                )}
                                {filteredBuildings.length === 0 ? (
                                    <div className="px-2 py-1 text-sm text-gray-500">
                                        {buildingSearchTerm ? 'No buildings match your search' : 'No buildings available'}
                                    </div>
                                ) : (
                                    filteredBuildings.map((building) => (
                                        <SelectItem key={building.id} value={building.id}>
                                            {building.name}
                                            {building.address && (
                                                <span className="text-gray-500 text-sm"> - {building.address}</span>
                                            )}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    {selectedBuildingId && (
                        <div className="text-sm text-gray-600">
                            Selected building: {buildingsData.find(b => b.id === selectedBuildingId)?.name}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="apartment_id">Apartment *</Label>
                    <div className="space-y-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search apartments..."
                                value={apartmentSearchTerm}
                                onChange={(e) => setApartmentSearchTerm(e.target.value)}
                                className="pl-10 pr-10"
                                disabled={!selectedBuildingId}
                            />
                            {apartmentSearchTerm && (
                                <button
                                    type="button"
                                    onClick={clearApartmentSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    disabled={!selectedBuildingId}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <Select
                            value={formData.apartment_id}
                            onValueChange={(value) => setFormData({ ...formData, apartment_id: value })}
                            required
                            disabled={!selectedBuildingId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={selectedBuildingId ? "Select apartment" : "Select building first"} />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                {!selectedBuildingId ? (
                                    <div className="px-2 py-1 text-sm text-gray-500">Select a building first</div>
                                ) : (
                                    <>
                                        {apartmentSearchTerm && (
                                            <div className="px-2 py-1 text-xs text-gray-500 border-b">
                                                {availableApartments.length} apartment{availableApartments.length !== 1 ? 's' : ''} found
                                            </div>
                                        )}
                                        {availableApartments.length === 0 ? (
                                            <div className="px-2 py-1 text-sm text-gray-500">
                                                {apartmentSearchTerm ? 'No apartments match your search' : 'No apartments available'}
                                            </div>
                                        ) : (
                                            availableApartments.map((apartment: ApartmentForSelect) => (
                                                <SelectItem key={apartment.id} value={apartment.id}>
                                                    Unit {cleanUnitNumber(apartment.unit_number)} - Floor {apartment.floor}
                                                </SelectItem>
                                            ))
                                        )}
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    {formData.apartment_id && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="text-sm font-medium text-blue-900">Selected Apartment</div>
                            <div className="text-sm text-blue-700">
                                Unit {cleanUnitNumber(availableApartments.find((a: ApartmentForSelect) => a.id === formData.apartment_id)?.unit_number || '')} - Floor {availableApartments.find((a: ApartmentForSelect) => a.id === formData.apartment_id)?.floor}
                            </div>
                            <div className="text-xs text-blue-600">
                                Building: {buildingsData.find(b => b.id === selectedBuildingId)?.name}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number *</Label>
                    <Input
                        id="phone_number"
                        type="tel"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        placeholder="+1234567890"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="issue_type">Issue Type *</Label>
                    <Select
                        value={formData.issue_type}
                        onValueChange={(value: 'domophone' | 'light_bulb') =>
                            setFormData({ ...formData, issue_type: value })
                        }
                        required
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="domophone">Domophone</SelectItem>
                            <SelectItem value="light_bulb">Light Bulb</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Only show status field when editing existing phone issues */}
                {phoneIssue && (
                    <div className="space-y-2">
                        <Label htmlFor="status">Status *</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value: 'open' | 'хүлээж авсан' | 'болсон' | 'тусламж хэрэгтэй') =>
                                setFormData({ ...formData, status: value })
                            }
                            required
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Нээлттэй</SelectItem>
                                <SelectItem value="хүлээж авсан">Хүлээж авсан</SelectItem>
                                <SelectItem value="болсон">Болсон</SelectItem>
                                <SelectItem value="тусламж хэрэгтэй">Тусламж хэрэгтэй</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="worker_id">Assigned Worker</Label>
                    <Select
                        value={formData.worker_id || "none"}
                        onValueChange={(value) => setFormData({ ...formData, worker_id: value === "none" ? "" : value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select worker (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No worker assigned</SelectItem>
                            {workers.map((worker) => (
                                <SelectItem key={worker.id} value={worker.id}>
                                    {worker.name}
                                    {worker.email && ` (${worker.email})`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the issue in detail..."
                    rows={4}
                />
            </div>

            <div className="flex items-center gap-4">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : phoneIssue ? 'Update Phone Call Record' : 'Create Phone Call Record'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}