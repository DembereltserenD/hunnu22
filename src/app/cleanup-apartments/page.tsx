'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cleanUnitNumber } from '@/lib/floor-utils';
import { createClient } from '../../../supabase/client';

interface ApartmentIssue {
    id: string;
    current_unit_number: string;
    cleaned_unit_number: string;
    building_id: string;
}

export default function CleanupApartmentsPage() {
    const [issues, setIssues] = useState<ApartmentIssue[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [isFixing, setIsFixing] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    const checkForIssues = async () => {
        setIsChecking(true);
        try {
            const supabase = createClient();

            // Get all apartments
            const { data: apartments, error } = await supabase
                .from('apartments')
                .select('id, unit_number, building_id');

            if (error) {
                throw error;
            }

            // Find apartments that need cleaning
            const problematicApartments: ApartmentIssue[] = [];

            apartments?.forEach(apt => {
                const cleaned = cleanUnitNumber(apt.unit_number);
                if (cleaned !== apt.unit_number) {
                    problematicApartments.push({
                        id: apt.id,
                        current_unit_number: apt.unit_number,
                        cleaned_unit_number: cleaned,
                        building_id: apt.building_id
                    });
                }
            });

            setIssues(problematicApartments);
            setHasChecked(true);
        } catch (error) {
            console.error('Error checking apartments:', error);
            alert('Error checking apartments: ' + (error as Error).message);
        } finally {
            setIsChecking(false);
        }
    };

    const fixIssues = async () => {
        if (issues.length === 0) return;

        setIsFixing(true);
        try {
            const supabase = createClient();
            let fixed = 0;
            let skipped = 0;

            for (const issue of issues) {
                // Check if cleaned unit already exists in the same building
                const { data: existing } = await supabase
                    .from('apartments')
                    .select('id')
                    .eq('building_id', issue.building_id)
                    .eq('unit_number', issue.cleaned_unit_number)
                    .neq('id', issue.id)
                    .single();

                if (existing) {
                    console.log(`Skipping ${issue.current_unit_number} → ${issue.cleaned_unit_number}: cleaned unit already exists`);
                    skipped++;
                    continue;
                }

                // Update the apartment
                const { error: updateError } = await supabase
                    .from('apartments')
                    .update({ unit_number: issue.cleaned_unit_number })
                    .eq('id', issue.id);

                if (updateError) {
                    console.error(`Failed to update apartment ${issue.id}:`, updateError);
                    skipped++;
                } else {
                    console.log(`Updated: "${issue.current_unit_number}" → "${issue.cleaned_unit_number}"`);
                    fixed++;
                }
            }

            alert(`Fixed ${fixed} apartments, skipped ${skipped} apartments`);

            // Re-check for issues
            await checkForIssues();
        } catch (error) {
            console.error('Error fixing apartments:', error);
            alert('Error fixing apartments: ' + (error as Error).message);
        } finally {
            setIsFixing(false);
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Apartment Unit Number Cleanup</h1>
                <p className="text-muted-foreground mt-2">
                    This tool helps identify and fix apartment unit numbers that contain suffixes like "SD", "D", or "LB".
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Check for Issues</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        onClick={checkForIssues}
                        disabled={isChecking}
                        className="w-full"
                    >
                        {isChecking ? 'Checking...' : 'Check for Problematic Unit Numbers'}
                    </Button>

                    {hasChecked && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge variant={issues.length > 0 ? "destructive" : "default"}>
                                    {issues.length} issues found
                                </Badge>
                            </div>

                            {issues.length > 0 && (
                                <>
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        <h3 className="font-semibold">Issues Found:</h3>
                                        {issues.map((issue) => (
                                            <div key={issue.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <span className="font-mono text-red-600">"{issue.current_unit_number}"</span>
                                                    <span className="mx-2">→</span>
                                                    <span className="font-mono text-green-600">"{issue.cleaned_unit_number}"</span>
                                                </div>
                                                <Badge variant="outline">ID: {issue.id.slice(0, 8)}...</Badge>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        onClick={fixIssues}
                                        disabled={isFixing}
                                        variant="destructive"
                                        className="w-full"
                                    >
                                        {isFixing ? 'Fixing...' : `Fix ${issues.length} Issue${issues.length !== 1 ? 's' : ''}`}
                                    </Button>

                                    <div className="text-sm text-muted-foreground p-3 bg-yellow-50 border border-yellow-200 rounded">
                                        <strong>Warning:</strong> This will permanently update the apartment unit numbers in the database.
                                        Make sure you have a backup before proceeding.
                                    </div>
                                </>
                            )}

                            {issues.length === 0 && (
                                <div className="text-center p-6 bg-green-50 border border-green-200 rounded">
                                    <p className="text-green-700 font-semibold">✅ No issues found!</p>
                                    <p className="text-green-600 text-sm">All apartment unit numbers are clean.</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>How it works</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        <p><strong>What this tool does:</strong></p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>Scans all apartments for unit numbers containing suffixes like "SD", "D", "LB"</li>
                            <li>Shows what the cleaned unit numbers would look like</li>
                            <li>Allows you to fix them by removing the suffixes</li>
                            <li>Prevents conflicts by checking if the cleaned unit number already exists</li>
                        </ul>
                        <p className="mt-4"><strong>Examples:</strong></p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>"101-1SD" → "101"</li>
                            <li>"205-2 SD" → "205"</li>
                            <li>"301-1D" → "301"</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}