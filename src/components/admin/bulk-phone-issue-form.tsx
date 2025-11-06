'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createPhoneIssueWithoutRedirect } from '@/app/admin-hunnu/phone-issues/actions';
import { createApartmentWithoutRedirect } from '@/app/admin-hunnu/apartments/actions';
import { cleanUnitNumber } from '@/lib/floor-utils';
import { createClient } from '../../../supabase/client';

interface ApartmentForSelect {
    id: string;
    unit_number: string;
    floor: number;
    building_id: string;
    building: any;
}

interface WorkerForSelect {
    id: string;
    name: string;
    email?: string;
    phone?: string;
}

interface ParsedIssue {
    buildingNumber: string;
    unitNumber: string;
    quantity: number;
    issueType: 'domophone' | 'light_bulb';
    phoneNumber: string;
    apartmentId?: string;
    error?: string;
}

interface BulkPhoneIssueFormProps {
    apartments: ApartmentForSelect[];
    workers: WorkerForSelect[];
    buildings: any[];
}

export function BulkPhoneIssueForm({ apartments, workers, buildings }: BulkPhoneIssueFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [workerId, setWorkerId] = useState('');
    const [bulkStatus, setBulkStatus] = useState<'open' | 'хүлээж авсан' | 'болсон' | 'тусламж хэрэгтэй'>('болсон'); // Default to completed
    const [parsedIssues, setParsedIssues] = useState<ParsedIssue[]>([]);

    // Create building lookup map from all buildings (not just those with apartments)
    const buildingMap = new Map<string, { id: string; name: string }>();
    buildings.forEach(building => {
        buildingMap.set(building.name, { id: building.id, name: building.name });
    });

    const removeIssue = (index: number) => {
        const updatedIssues = parsedIssues.filter((_, i) => i !== index);
        setParsedIssues(updatedIssues);
    };

    const parseText = () => {
        if (!textInput.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter text data',
                variant: 'destructive'
            });
            return;
        }

        const lines = textInput.trim().split(/[,\n]/).map(line => line.trim()).filter(line => line);
        const parsed: ParsedIssue[] = [];

        lines.forEach(line => {
            // Parse formats like: 222-106-2SD 99354845 or 222-901-3SD (phone number optional)
            // Updated regex to properly separate building-unit-quantity+type
            let match = line.match(/(\d+)\s*[-\s]\s*(\d+)\s*[-\s]\s*(\d+)(SD|D|LB)\s*(\d+)?/i);

            // Fallback: try simpler pattern
            if (!match) {
                match = line.match(/(\d+)[-\s](\d+)[-\s](\d+)(SD|D|LB)\s*(\d+)?/i);
            }

            // Another fallback: try with optional spaces around separators
            if (!match) {
                match = line.match(/(\d+)\s*-\s*(\d+)\s*-\s*(\d+)(SD|D|LB)(?:\s+(\d+))?/i);
            }

            console.log('Parsing line:', JSON.stringify(line), 'Match result:', match);

            if (!match) {
                parsed.push({
                    buildingNumber: '',
                    unitNumber: '',
                    quantity: 0,
                    issueType: 'domophone', // Placeholder for error case
                    phoneNumber: '',
                    error: `Could not parse: "${line}". Expected format: 222-101-1D or 222-101-2LB 99354845. Use D (Domophone) or LB (Light Bulb).`
                });
                return;
            }

            const [, buildingNum, unitNum, quantity, typeCode, phoneNum] = match;

            // Map type codes to issue types
            let issueType: 'domophone' | 'light_bulb';
            switch (typeCode.toUpperCase()) {
                case 'SD':
                    // Skip smoke detector entries - they're not supported in phone calls
                    parsed.push({
                        buildingNumber: buildingNum,
                        unitNumber: unitNum,
                        quantity: parseInt(quantity),
                        issueType: 'domophone', // Placeholder, will be marked as error
                        phoneNumber: phoneNum || '',
                        error: `Smoke detector entries (SD) are not supported in phone call records. Use: D (Domophone) or LB (Light Bulb)`
                    });
                    return;
                case 'D':
                    issueType = 'domophone';
                    break;
                case 'LB':
                    issueType = 'light_bulb';
                    break;
                default:
                    parsed.push({
                        buildingNumber: buildingNum,
                        unitNumber: unitNum,
                        quantity: parseInt(quantity),
                        issueType: 'domophone', // Placeholder, will be marked as error
                        phoneNumber: phoneNum || '',
                        error: `Unknown type code: ${typeCode}. Use: D (Domophone) or LB (Light Bulb)`
                    });
                    return;
            }

            // Find apartment by building number and unit number
            let apartment = apartments.find(apt => {
                const building = Array.isArray(apt.building) ? apt.building[0] : apt.building;
                if (!building) return false;

                // Try multiple building name formats
                const buildingMatches = building.name === buildingNum ||
                    building.name === `Building ${buildingNum}` ||
                    building.name.includes(buildingNum);

                // Clean unit numbers for comparison (remove any suffixes)
                const aptCleanUnit = cleanUnitNumber(apt.unit_number);
                const searchCleanUnit = cleanUnitNumber(unitNum);

                // Try multiple unit number formats (with/without leading zeros, etc.)
                const unitMatches = aptCleanUnit === searchCleanUnit ||
                    aptCleanUnit === searchCleanUnit.padStart(3, '0') ||
                    aptCleanUnit.replace(/^0+/, '') === searchCleanUnit.replace(/^0+/, '');

                return buildingMatches && unitMatches;
            });

            // If apartment doesn't exist, we'll create it during import
            if (!apartment) {
                // Find the building to get building_id - try exact match first, then "Building X" format
                let building = Array.from(buildingMap.values()).find(b => b.name === buildingNum);
                if (!building) {
                    building = Array.from(buildingMap.values()).find(b => b.name === `Building ${buildingNum}`);
                }

                if (!building) {
                    parsed.push({
                        buildingNumber: buildingNum,
                        unitNumber: unitNum,
                        quantity: parseInt(quantity),
                        issueType,
                        phoneNumber: phoneNum,
                        error: `Building not found: ${buildingNum}. Available buildings: ${Array.from(buildingMap.values()).map(b => b.name).join(', ')}`
                    });
                    return;
                }

                // Mark for apartment creation (only if building exists)
                apartment = {
                    id: `CREATE_${buildingNum}_${unitNum}`, // Temporary ID
                    unit_number: unitNum,
                    floor: parseInt(unitNum) < 100 ? 1 : Math.floor(parseInt(unitNum) / 100), // Estimate floor from unit number
                    building_id: building.id,
                    building: building
                } as any;
            }

            // Create single entry with the full quantity
            if (apartment) {
                parsed.push({
                    buildingNumber: buildingNum,
                    unitNumber: unitNum,
                    quantity: parseInt(quantity),
                    issueType,
                    phoneNumber: phoneNum || '', // Handle undefined phone number
                    apartmentId: apartment.id
                });
            }
        });

        setParsedIssues(parsed);
    };

    const handleSubmit = async () => {
        const validIssues = parsedIssues.filter(issue => !issue.error && issue.apartmentId);

        if (validIssues.length === 0) {
            toast({
                title: 'Error',
                description: 'No valid issues to create',
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);

        try {
            let successCount = 0;
            let errorCount = 0;
            const errors: string[] = [];
            const createdApartments = new Map<string, string>(); // Map temp ID to real ID


            for (const issue of validIssues) {
                try {
                    let apartmentId = issue.apartmentId!;

                    // If apartment needs to be created
                    if (apartmentId.startsWith('CREATE_')) {
                        const cacheKey = `${issue.buildingNumber}_${issue.unitNumber}`;

                        if (createdApartments.has(cacheKey)) {
                            // Use already created apartment
                            apartmentId = createdApartments.get(cacheKey)!;
                        } else {
                            // Find building (must exist)
                            let building = Array.from(buildingMap.values()).find(b => b.name === issue.buildingNumber);
                            if (!building) {
                                building = Array.from(buildingMap.values()).find(b => b.name === `Building ${issue.buildingNumber}`);
                            }

                            if (!building) {
                                throw new Error(`Building ${issue.buildingNumber} not found`);
                            }

                            // Use cleaned unit number (no suffixes) when creating apartments
                            const cleanedUnitNumber = cleanUnitNumber(issue.unitNumber);

                            try {
                                const newApartment = await createApartmentWithoutRedirect({
                                    building_id: building.id,
                                    unit_number: cleanedUnitNumber,
                                    floor: parseInt(cleanedUnitNumber) < 100 ? 1 : Math.floor(parseInt(cleanedUnitNumber) / 100) // Estimate floor from unit number
                                });

                                apartmentId = newApartment.id;
                                createdApartments.set(cacheKey, apartmentId);
                            } catch (apartmentError) {
                                // If apartment already exists, try to find it
                                if (apartmentError instanceof Error && apartmentError.message.includes('Unit number already exists')) {
                                    // Query the database to find the existing apartment
                                    const supabase = createClient();

                                    const { data: existingApartment } = await supabase
                                        .from('apartments')
                                        .select('id')
                                        .eq('building_id', building.id)
                                        .eq('unit_number', cleanedUnitNumber)
                                        .single();

                                    if (existingApartment) {
                                        apartmentId = existingApartment.id;
                                        createdApartments.set(cacheKey, apartmentId);
                                    } else {
                                        throw apartmentError; // Re-throw if we can't find the apartment
                                    }
                                } else {
                                    throw apartmentError; // Re-throw other errors
                                }
                            }
                        }
                    }

                    // Create single phone issue record with quantity in description
                    await createPhoneIssueWithoutRedirect({
                        apartment_id: apartmentId,
                        phone_number: issue.phoneNumber || 'N/A', // Use 'N/A' if no phone number provided
                        issue_type: issue.issueType,
                        status: bulkStatus, // Use selected bulk status
                        worker_id: workerId || undefined,
                        description: `Cleared ${issue.quantity} ${issue.issueType.replace('_', ' ')}${issue.quantity > 1 ? 's' : ''} in Building ${issue.buildingNumber}, Unit ${issue.unitNumber}`
                    });
                    successCount++;
                } catch (error) {
                    console.error('Error creating issue:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    errors.push(`Building ${issue.buildingNumber}-${issue.unitNumber}: ${errorMessage}`);
                    errorCount++;
                }
            }


            const apartmentCount = createdApartments.size;

            let description = `Successfully created ${successCount} maintenance records`;

            if (apartmentCount > 0) {
                description += `, ${apartmentCount} apartment${apartmentCount > 1 ? 's' : ''}`;
            }
            if (errorCount > 0) {
                description += `. ${errorCount} failed`;
            }

            toast({
                title: 'Import Complete',
                description: errorCount > 0 ? `${description}\n\nErrors:\n${errors.join('\n')}` : description,
                variant: errorCount > 0 ? 'destructive' : 'default'
            });

            if (successCount > 0) {
                router.push('/admin-hunnu/apartments');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to import issues',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getIssueTypeLabel = (type: string, status: string) => {
        const statusLabels = {
            'болсон': 'Completed',
            'тусламж хэрэгтэй': 'Communication Fault',
            'хүлээж авсан': 'In Progress',
            'open': 'Open'
        };

        const statusLabel = statusLabels[status as keyof typeof statusLabels] || status;

        switch (type) {
            case 'domophone': return `Domophone Call (${statusLabel})`;
            case 'light_bulb': return `Light Bulb Call (${statusLabel})`;
            default: return `${type} (${statusLabel})`;
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Input Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="worker_id">Assigned Worker</Label>
                            <Select
                                value={workerId || "none"}
                                onValueChange={(value) => setWorkerId(value === "none" ? "" : value)}
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

                        <div className="space-y-2">
                            <Label htmlFor="bulk_status">Bulk Status *</Label>
                            <Select
                                value={bulkStatus}
                                onValueChange={(value) => setBulkStatus(value as 'open' | 'хүлээж авсан' | 'болсон' | 'тусламж хэрэгтэй')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status for all records" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="болсон">✅ Completed</SelectItem>
                                    <SelectItem value="тусламж хэрэгтэй">⚠️ Communication Fault</SelectItem>
                                    <SelectItem value="хүлээж авсан">🔵 In Progress</SelectItem>
                                    <SelectItem value="open">🔴 Open</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                This status will be applied to all imported records
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="text_input">Text Data *</Label>
                        <Textarea
                            id="text_input"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="222-106-2SD 99090909, 223-102-1D, 225-205-2LB 99876543"
                            rows={6}
                            className="font-mono"
                        />
                        <p className="text-sm text-muted-foreground">
                            Format: BuildingNumber-UnitNumber-QuantityType [PhoneNumber]
                            <br />
                            <strong>Supported Types:</strong>
                            <br />
                            • D (Domophone) = Phone call to resident about domophone issue
                            <br />
                            • LB (Light Bulb) = Phone call to resident about light bulb issue
                            <br />
                            Examples: 222-901-1D 99090909 (called about domophone), 223-102-2LB 88888888 (called about light bulbs)
                            <br />
                            <strong>Note:</strong> This form creates phone call records only. Smoke detector maintenance is handled separately.
                            <br />
                            All records will have the selected bulk status. If apartment doesn't exist, it will be created first.
                        </p>
                    </div>

                    <Button onClick={parseText} type="button">
                        Parse Text
                    </Button>
                </CardContent>
            </Card>

            {parsedIssues.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Parsed Issues ({parsedIssues.length})</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setParsedIssues([])}
                                className="text-red-500 hover:text-red-700"
                            >
                                Clear All
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {parsedIssues.map((issue, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Badge variant={issue.error ? "destructive" : "default"}>
                                            {issue.error ? "Error" : "Valid"}
                                        </Badge>
                                        <span className="font-mono">
                                            Building {issue.buildingNumber} - Unit {issue.unitNumber}{issue.phoneNumber ? ` - ${issue.phoneNumber}` : ' - No phone'}
                                        </span>
                                        <Badge variant="outline">
                                            {issue.quantity}x {getIssueTypeLabel(issue.issueType, bulkStatus)}
                                        </Badge>
                                        <Badge
                                            variant="secondary"
                                            className={
                                                bulkStatus === 'болсон' ? 'bg-green-100 text-green-800' :
                                                    bulkStatus === 'тусламж хэрэгтэй' ? 'bg-orange-100 text-orange-800' :
                                                        bulkStatus === 'хүлээж авсан' ? 'bg-blue-100 text-blue-800' :
                                                            bulkStatus === 'open' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'
                                            }
                                        >
                                            {bulkStatus === 'болсон' ? '✅ Completed' :
                                                bulkStatus === 'тусламж хэрэгтэй' ? '⚠️ Comm. Fault' :
                                                    bulkStatus === 'хүлээж авсан' ? '🔵 In Progress' :
                                                        bulkStatus === 'open' ? '🔴 Open' : bulkStatus}
                                        </Badge>
                                        {issue.apartmentId?.startsWith('CREATE_') ? (
                                            <Badge variant="secondary">
                                                Will create apartment
                                            </Badge>
                                        ) : (
                                            <Badge variant="default">
                                                Existing apartment
                                            </Badge>
                                        )}

                                    </div>
                                    <div className="flex items-center gap-2">
                                        {issue.error && (
                                            <span className="text-sm text-red-600">{issue.error}</span>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeIssue(index)}
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            ×
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Valid: {parsedIssues.filter(i => !i.error).length} |
                                    Errors: {parsedIssues.filter(i => i.error).length}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push('/admin-hunnu/apartments')}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || parsedIssues.filter(i => !i.error).length === 0}
                                    >
                                        {isSubmitting ? 'Creating...' : `Create ${parsedIssues.filter(i => !i.error).length} Record${parsedIssues.filter(i => !i.error).length !== 1 ? 's' : ''} (${bulkStatus === 'болсон' ? 'Completed' : bulkStatus === 'тусламж хэрэгтэй' ? 'Comm. Fault' : bulkStatus === 'хүлээж авсан' ? 'In Progress' : bulkStatus === 'open' ? 'Open' : bulkStatus})`}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}