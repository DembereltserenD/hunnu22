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
    issueType: 'domophone' | 'light_bulb' | 'smoke_detector';
    phoneNumber: string;
    apartmentId?: string;
    loopAddresses?: string[]; // For smoke detectors
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
                title: 'Алдаа',
                description: 'Өгөгдөл оруулна уу',
                variant: 'destructive'
            });
            return;
        }

        const lines = textInput.trim().split(/[,\n]/).map(line => line.trim()).filter(line => line);
        const parsed: ParsedIssue[] = [];

        lines.forEach(line => {
            // Parse formats like: 222-106-2SD 99354845 L1-112,L1-132 or 222-901-3SD (phone number optional)
            // Loop addresses can be 2 or 3 digits (e.g., L1-01, L1-112)
            // Updated regex to capture loop addresses at the end
            let match = line.match(/(\d+)\s*[-\s]\s*(\d+)\s*[-\s]\s*(\d+)(SD|D|LB)\s*(\d+)?\s*((?:L\d+-\d{2,3}(?:,\s*)?)+)?/i);

            // Fallback: try simpler pattern
            if (!match) {
                match = line.match(/(\d+)[-\s](\d+)[-\s](\d+)(SD|D|LB)\s*(\d+)?\s*((?:L\d+-\d{2,3}(?:,\s*)?)+)?/i);
            }

            // Another fallback: try with optional spaces around separators
            if (!match) {
                match = line.match(/(\d+)\s*-\s*(\d+)\s*-\s*(\d+)(SD|D|LB)(?:\s+(\d+))?(?:\s+((?:L\d+-\d{2,3}(?:,\s*)?)+))?/i);
            }

            console.log('Parsing line:', JSON.stringify(line), 'Match result:', match);

            if (!match) {
                parsed.push({
                    buildingNumber: '',
                    unitNumber: '',
                    quantity: 0,
                    issueType: 'domophone', // Placeholder for error case
                    phoneNumber: '',
                    error: `Уншиж чадсангүй: "${line}". Зөв формат: 222-101-1D эсвэл 222-101-2SD 99354845 L1-112,L1-132. D (Домофон), LB (Чийдэн), SD (Утаа мэдрэгч) ашиглана уу.`
                });
                return;
            }

            const [, buildingNum, unitNum, quantity, typeCode, phoneNum, loopAddressStr] = match;

            // Parse loop addresses if present
            const loopAddresses = loopAddressStr
                ? loopAddressStr.split(',').map(addr => addr.trim()).filter(addr => addr)
                : [];

            // Map type codes to issue types
            let issueType: 'domophone' | 'light_bulb' | 'smoke_detector';
            switch (typeCode.toUpperCase()) {
                case 'SD':
                    issueType = 'smoke_detector';
                    // Validate loop addresses for smoke detectors
                    if (loopAddresses.length === 0) {
                        parsed.push({
                            buildingNumber: buildingNum,
                            unitNumber: unitNum,
                            quantity: parseInt(quantity),
                            issueType: 'smoke_detector',
                            phoneNumber: phoneNum || '',
                            error: `Утаа мэдрэгчийн бичлэгт Loop хаяг шаардлагатай. Формат: 222-106-2SD 99090909 L1-112,L1-132`
                        });
                        return;
                    }
                    if (loopAddresses.length !== parseInt(quantity)) {
                        parsed.push({
                            buildingNumber: buildingNum,
                            unitNumber: unitNum,
                            quantity: parseInt(quantity),
                            issueType: 'smoke_detector',
                            phoneNumber: phoneNum || '',
                            loopAddresses,
                            error: `Тоо таарахгүй байна: ${quantity} утаа мэдрэгч боловч ${loopAddresses.length} Loop хаяг өгсөн байна`
                        });
                        return;
                    }
                    break;
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
                        error: `Үл мэдэгдэх төрөл: ${typeCode}. D (Домофон), LB (Чийдэн), эсвэл SD (Утаа мэдрэгч) ашиглана уу`
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
                        error: `Барилга олдсонгүй: ${buildingNum}. Боломжтой барилгууд: ${Array.from(buildingMap.values()).map(b => b.name).join(', ')}`
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
                    apartmentId: apartment.id,
                    loopAddresses: loopAddresses.length > 0 ? loopAddresses : undefined
                });
            }
        });

        setParsedIssues(parsed);
    };

    const handleSubmit = async () => {
        const validIssues = parsedIssues.filter(issue => !issue.error && issue.apartmentId);

        if (validIssues.length === 0) {
            toast({
                title: 'Алдаа',
                description: 'Үүсгэх зөв бичлэг байхгүй байна',
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
                                const apartmentData: any = {
                                    building_id: building.id,
                                    unit_number: cleanedUnitNumber,
                                    floor: parseInt(cleanedUnitNumber) < 100 ? 1 : Math.floor(parseInt(cleanedUnitNumber) / 100) // Estimate floor from unit number
                                };

                                // Add smoke detector data if present
                                if (issue.issueType === 'smoke_detector' && issue.loopAddresses) {
                                    apartmentData.smoke_detector_count = issue.quantity;
                                    apartmentData.smoke_detector_addresses = issue.loopAddresses;
                                    // Extract loops from addresses (e.g., "L1-01" -> "L1")
                                    const loopSet = new Set(issue.loopAddresses.map(addr => addr.split('-')[0]));
                                    apartmentData.smoke_detector_loops = Array.from(loopSet);
                                }

                                const newApartment = await createApartmentWithoutRedirect(apartmentData);

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

                    // For smoke detectors, update apartment with loop addresses if not already set
                    if (issue.issueType === 'smoke_detector' && issue.loopAddresses) {
                        const supabase = createClient();

                        // Check if apartment already has smoke detector data
                        const { data: existingApt } = await supabase
                            .from('apartments')
                            .select('smoke_detector_count, smoke_detector_addresses, smoke_detector_loops')
                            .eq('id', apartmentId)
                            .single();

                        // Update apartment if it doesn't have smoke detector data or needs updating
                        if (existingApt && (!existingApt.smoke_detector_count || existingApt.smoke_detector_count === 0)) {
                            const loopSet = new Set(issue.loopAddresses.map(addr => addr.split('-')[0]));
                            const loops = Array.from(loopSet);

                            await supabase
                                .from('apartments')
                                .update({
                                    smoke_detector_count: issue.quantity,
                                    smoke_detector_addresses: issue.loopAddresses,
                                    smoke_detector_loops: loops
                                })
                                .eq('id', apartmentId);
                        }
                    }

                    // Create single phone issue record with quantity in description
                    const description = issue.issueType === 'smoke_detector' && issue.loopAddresses
                        ? `Cleared ${issue.quantity} smoke detector${issue.quantity > 1 ? 's' : ''} (${issue.loopAddresses.join(', ')}) in Building ${issue.buildingNumber}, Unit ${issue.unitNumber}`
                        : `Cleared ${issue.quantity} ${issue.issueType.replace('_', ' ')}${issue.quantity > 1 ? 's' : ''} in Building ${issue.buildingNumber}, Unit ${issue.unitNumber}`;

                    await createPhoneIssueWithoutRedirect({
                        apartment_id: apartmentId,
                        phone_number: issue.phoneNumber || 'N/A', // Use 'N/A' if no phone number provided
                        issue_type: issue.issueType,
                        status: bulkStatus, // Use selected bulk status
                        worker_id: workerId || undefined,
                        description
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

            let description = `${successCount} засвар үйлчилгээний бичлэг амжилттай үүсгэлээ`;

            if (apartmentCount > 0) {
                description += `, ${apartmentCount} байр`;
            }
            if (errorCount > 0) {
                description += `. ${errorCount} амжилтгүй`;
            }

            toast({
                title: 'Импорт дууслаа',
                description: errorCount > 0 ? `${description}\n\nАлдаанууд:\n${errors.join('\n')}` : description,
                variant: errorCount > 0 ? 'destructive' : 'default'
            });

            if (successCount > 0) {
                router.push('/admin-hunnu/apartments');
            }
        } catch (error) {
            toast({
                title: 'Алдаа',
                description: 'Импорт хийхэд алдаа гарлаа',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getIssueTypeLabel = (type: string, status: string) => {
        const statusLabels = {
            'болсон': 'Дууссан',
            'тусламж хэрэгтэй': 'Холбоо барих асуудалтай',
            'хүлээж авсан': 'Хүлээгдэж байгаа',
            'open': 'Нээлттэй'
        };

        const statusLabel = statusLabels[status as keyof typeof statusLabels] || status;

        switch (type) {
            case 'domophone': return `Домофон (${statusLabel})`;
            case 'light_bulb': return `Чийдэн (${statusLabel})`;
            case 'smoke_detector': return `Утаа мэдрэгч (${statusLabel})`;
            default: return `${type} (${statusLabel})`;
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Өгөгдөл оруулах</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="worker_id">Ажилтан сонгох</Label>
                            <Select
                                value={workerId || "none"}
                                onValueChange={(value) => setWorkerId(value === "none" ? "" : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Ажилтан сонгох (заавал биш)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Ажилтан оноохгүй</SelectItem>
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
                            <Label htmlFor="bulk_status">Төлөв *</Label>
                            <Select
                                value={bulkStatus}
                                onValueChange={(value) => setBulkStatus(value as 'open' | 'хүлээж авсан' | 'болсон' | 'тусламж хэрэгтэй')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Бүх бичлэгийн төлөв сонгох" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="болсон">✅ Дууссан</SelectItem>
                                    <SelectItem value="тусламж хэрэгтэй">⚠️ Холбоо барих асуудалтай</SelectItem>
                                    <SelectItem value="хүлээж авсан">🔵 Хүлээгдэж байгаа</SelectItem>
                                    <SelectItem value="open">🔴 Нээлттэй</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Энэ төлөв бүх импорт хийгдсэн бичлэгт хэрэглэгдэнэ
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="text_input">Өгөгдөл *</Label>
                        <Textarea
                            id="text_input"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="222-106-2SD 99090909 L1-112,L1-132, 223-102-1D, 225-205-2LB 99876543"
                            rows={6}
                            className="font-mono"
                        />
                        <p className="text-sm text-muted-foreground">
                            Формат: БарилгаДугаар-БайрДугаар-ТооТөрөл [Утас] [LoopХаяг]
                            <br />
                            <strong>Дэмжигдсэн төрлүүд:</strong>
                            <br />
                            • D (Домофон) = Домофоны асуудлаар залгасан
                            <br />
                            • LB (Чийдэн) = Чийдэнгийн асуудлаар залгасан
                            <br />
                            • SD (Утаа мэдрэгч) = Утаа мэдрэгчийн засвар Loop хаягтай
                            <br />
                            <strong>Жишээнүүд:</strong>
                            <br />
                            • 222-901-1D 99090909 (домофоны дуудлага)
                            <br />
                            • 223-102-2LB 88888888 (чийдэнгийн дуудлага)
                            <br />
                            • 222-106-2SD 99354845 L1-112,L1-132 (утаа мэдрэгч 3 оронтой хаягтай)
                            <br />
                            • 222-106-2SD 99354845 L1-01,L1-02 (утаа мэдрэгч 2 оронтой хаягтай)
                            <br />
                            <strong>Анхаар:</strong> Утаа мэдрэгчийн бичлэгт Loop хаяг шаардлагатай (жишээ: L1-01, L1-112, L2-03). Loop хаяг 2 эсвэл 3 оронтой байж болно. Тоо нь Loop хаягийн тоотой таарч байх ёстой.
                            <br />
                            Бүх бичлэг сонгосон төлөвтэй үүснэ. Хэрэв байр байхгүй бол эхлээд үүсгэнэ.
                        </p>
                    </div>

                    <Button onClick={parseText} type="button">
                        Өгөгдөл уншуулах
                    </Button>
                </CardContent>
            </Card>

            {parsedIssues.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Уншсан ({parsedIssues.length})</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setParsedIssues([])}
                                className="text-red-500 hover:text-red-700"
                            >
                                Бүгдийг арилгах
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {parsedIssues.map((issue, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <Badge variant={issue.error ? "destructive" : "default"}>
                                            {issue.error ? "Алдаа" : "Зөв"}
                                        </Badge>
                                        <span className="font-mono">
                                            Барилга {issue.buildingNumber} - Байр {issue.unitNumber}{issue.phoneNumber ? ` - ${issue.phoneNumber}` : ' - Утасгүй'}
                                        </span>
                                        <Badge variant="outline">
                                            {issue.quantity}x {getIssueTypeLabel(issue.issueType, bulkStatus)}
                                        </Badge>
                                        {issue.loopAddresses && issue.loopAddresses.length > 0 && (
                                            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                                📍 {issue.loopAddresses.join(', ')}
                                            </Badge>
                                        )}
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
                                            {bulkStatus === 'болсон' ? '✅ Дууссан' :
                                                bulkStatus === 'тусламж хэрэгтэй' ? '⚠️ Холбоо барих асуудалтай' :
                                                    bulkStatus === 'хүлээж авсан' ? '🔵 Хүлээгдэж байгаа' :
                                                        bulkStatus === 'open' ? '🔴 Нээлттэй' : bulkStatus}
                                        </Badge>
                                        {issue.apartmentId?.startsWith('CREATE_') ? (
                                            <Badge variant="secondary">
                                                Байр үүсгэнэ
                                            </Badge>
                                        ) : (
                                            <Badge variant="default">
                                                Байр байгаа
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
                                    Зөв: {parsedIssues.filter(i => !i.error).length} |
                                    Алдаа: {parsedIssues.filter(i => i.error).length}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push('/admin-hunnu/apartments')}
                                    >
                                        Цуцлах
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || parsedIssues.filter(i => !i.error).length === 0}
                                    >
                                        {isSubmitting ? 'Үүсгэж байна...' : `${parsedIssues.filter(i => !i.error).length} бичлэг үүсгэх (${bulkStatus === 'болсон' ? 'Дууссан' : bulkStatus === 'тусламж хэрэгтэй' ? 'Холбоо барих асуудалтай' : bulkStatus === 'хүлээж авсан' ? 'Хүлээгдэж байгаа' : bulkStatus === 'open' ? 'Нээлттэй' : bulkStatus})`}
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