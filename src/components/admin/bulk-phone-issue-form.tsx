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
    issueType: 'smoke_detector' | 'domophone' | 'light_bulb';
    phoneNumber: string;
    apartmentId?: string;
    error?: string;
}

interface BulkPhoneIssueFormProps {
    apartments: ApartmentForSelect[];
    workers: WorkerForSelect[];
}

export function BulkPhoneIssueForm({ apartments, workers }: BulkPhoneIssueFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [workerId, setWorkerId] = useState('');
    const [parsedIssues, setParsedIssues] = useState<ParsedIssue[]>([]);

    // Create building lookup map
    const buildingMap = new Map<string, { id: string; name: string }>();
    apartments.forEach(apt => {
        const building = Array.isArray(apt.building) ? apt.building[0] : apt.building;
        if (building) {
            buildingMap.set(building.name, { id: building.id, name: building.name });
        }
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
            // Parse formats like: 222-1006-3SD 99354845
            const match = line.match(/(\d+)[-\s]+(\d+)[-\s]+(\d+)(SD|D|LB)\s+(\d+)/i);

            if (!match) {
                parsed.push({
                    buildingNumber: '',
                    unitNumber: '',
                    quantity: 0,
                    issueType: 'smoke_detector',
                    phoneNumber: '',
                    error: `Could not parse: "${line}". Expected format: 222-1006-3SD 99354845`
                });
                return;
            }

            const [, buildingNum, unitNum, quantity, typeCode, phoneNum] = match;

            // Map type codes to issue types
            let issueType: 'smoke_detector' | 'domophone' | 'light_bulb';
            switch (typeCode.toUpperCase()) {
                case 'SD':
                    issueType = 'smoke_detector';
                    break;
                case 'D':
                    issueType = 'domophone';
                    break;
                case 'LB':
                    issueType = 'light_bulb';
                    break;
                default:
                    issueType = 'smoke_detector';
            }

            // Find apartment by building number and unit number
            let apartment = apartments.find(apt => {
                const building = Array.isArray(apt.building) ? apt.building[0] : apt.building;
                return building && building.name === buildingNum && apt.unit_number === unitNum;
            });

            // If apartment doesn't exist, we'll create it during import
            if (!apartment) {
                // Find the building to get building_id
                const building = Array.from(buildingMap.values()).find(b => b.name === buildingNum);
                if (!building) {
                    parsed.push({
                        buildingNumber: buildingNum,
                        unitNumber: unitNum,
                        quantity: parseInt(quantity),
                        issueType,
                        phoneNumber: phoneNum,
                        error: `Building not found: ${buildingNum}`
                    });
                    return;
                }

                // Mark for apartment creation
                apartment = {
                    id: `CREATE_${buildingNum}_${unitNum}`, // Temporary ID
                    unit_number: unitNum,
                    floor: Math.ceil(parseInt(unitNum) / 100), // Estimate floor from unit number
                    building_id: building.id,
                    building: building
                } as any;
            }

            // Create multiple entries for the quantity
            if (apartment) {
                for (let i = 0; i < parseInt(quantity); i++) {
                    parsed.push({
                        buildingNumber: buildingNum,
                        unitNumber: unitNum,
                        quantity: 1,
                        issueType,
                        phoneNumber: phoneNum,
                        apartmentId: apartment.id
                    });
                }
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
                            // Create new apartment
                            const building = Array.from(buildingMap.values()).find(b => b.name === issue.buildingNumber);
                            if (!building) {
                                throw new Error(`Building ${issue.buildingNumber} not found`);
                            }

                            const newApartment = await createApartmentWithoutRedirect({
                                building_id: building.id,
                                unit_number: issue.unitNumber,
                                floor: Math.ceil(parseInt(issue.unitNumber) / 100) // Estimate floor
                            });

                            apartmentId = newApartment.id;
                            createdApartments.set(cacheKey, apartmentId);
                        }
                    }

                    // Create phone issue record (one record per cleared item)
                    await createPhoneIssueWithoutRedirect({
                        apartment_id: apartmentId,
                        phone_number: issue.phoneNumber,
                        issue_type: issue.issueType,
                        status: 'resolved', // Since they were already cleared
                        worker_id: workerId || undefined,
                        description: `Cleared 1 ${issue.issueType.replace('_', ' ')} in Building ${issue.buildingNumber}, Unit ${issue.unitNumber}`
                    });
                    successCount++;
                } catch (error) {
                    console.error('Error creating issue:', error);
                    errorCount++;
                }
            }

            toast({
                title: 'Import Complete',
                description: `Successfully created ${successCount} issues${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
            });

            if (successCount > 0) {
                router.push('/admin-hunnu/phone-issues');
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

    const getIssueTypeLabel = (type: string) => {
        switch (type) {
            case 'smoke_detector': return 'Smoke Detector';
            case 'domophone': return 'Domophone';
            case 'light_bulb': return 'Light Bulb';
            default: return type;
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Input Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

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
                        <Label htmlFor="text_input">Text Data *</Label>
                        <Textarea
                            id="text_input"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="222-1006-3SD 99354845, 223-1002-1D 99123456, 225-1205-2LB 99876543"
                            rows={6}
                            className="font-mono"
                        />
                        <p className="text-sm text-muted-foreground">
                            Format: BuildingNumber-UnitNumber-QuantityType PhoneNumber
                            <br />
                            Types: SD (Smoke Detector), D (Domophone), LB (Light Bulb)
                            <br />
                            Example: 222-1006-3SD 99354845 means Building 222, Unit 1006, 3 Smoke Detectors, Phone: 99354845
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
                                            Building {issue.buildingNumber} - Unit {issue.unitNumber} - {issue.phoneNumber}
                                        </span>
                                        <Badge variant="outline">
                                            {getIssueTypeLabel(issue.issueType)}
                                        </Badge>
                                        {issue.apartmentId?.startsWith('CREATE_') && (
                                            <Badge variant="secondary">
                                                Will create apartment
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
                                        onClick={() => router.push('/admin-hunnu/phone-issues')}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || parsedIssues.filter(i => !i.error).length === 0}
                                    >
                                        {isSubmitting ? 'Creating...' : `Create ${parsedIssues.filter(i => !i.error).length} Issues`}
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