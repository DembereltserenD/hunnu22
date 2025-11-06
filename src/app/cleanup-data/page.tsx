'use client';

import { createClient } from '../../../supabase/client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CleanupDataPage() {
    const [status, setStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);

    async function cleanupData() {
        setLoading(true);
        setStatus('Starting cleanup...');

        try {
            const supabase = createClient();

            // Step 1: Delete all apartments
            setStatus('Deleting all apartments...');
            const { error: apartmentsError } = await supabase
                .from('apartments')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

            if (apartmentsError) {
                throw new Error(`Error deleting apartments: ${apartmentsError.message}`);
            }

            // Step 2: Get all buildings to identify duplicates
            setStatus('Analyzing buildings...');
            const { data: buildings } = await supabase
                .from('buildings')
                .select('*');

            if (!buildings) {
                throw new Error('Could not fetch buildings');
            }

            // Step 3: Find duplicate building names
            const buildingGroups = buildings.reduce((acc: any, building) => {
                if (!acc[building.name]) {
                    acc[building.name] = [];
                }
                acc[building.name].push(building);
                return acc;
            }, {});

            // Step 4: Delete duplicates (keep the first one of each name)
            let deletedCount = 0;
            for (const [name, buildingList] of Object.entries(buildingGroups) as [string, any[]][]) {
                if (buildingList.length > 1) {
                    setStatus(`Cleaning up duplicates for building "${name}"...`);

                    // Keep the first one, delete the rest
                    const toDelete = buildingList.slice(1);

                    for (const building of toDelete) {
                        const { error } = await supabase
                            .from('buildings')
                            .delete()
                            .eq('id', building.id);

                        if (error) {
                            console.error(`Error deleting building ${building.id}:`, error);
                        } else {
                            deletedCount++;
                        }
                    }
                }
            }

            setStatus(`✅ Cleanup complete! Deleted ${deletedCount} duplicate buildings and all apartments.`);

        } catch (error) {
            console.error('Cleanup error:', error);
            setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="text-red-600">⚠️ Data Cleanup Tool</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                        <h3 className="font-semibold text-yellow-800">This will:</h3>
                        <ul className="list-disc list-inside text-yellow-700 mt-2">
                            <li>Delete ALL apartments</li>
                            <li>Delete duplicate buildings (keep one of each name)</li>
                            <li>Clean up orphaned data</li>
                        </ul>
                        <p className="text-yellow-800 mt-2 font-medium">
                            ⚠️ This action cannot be undone!
                        </p>
                    </div>

                    <Button
                        onClick={cleanupData}
                        disabled={loading}
                        variant="destructive"
                        className="w-full"
                    >
                        {loading ? 'Cleaning up...' : 'Start Cleanup'}
                    </Button>

                    {status && (
                        <div className="bg-gray-50 border rounded p-4">
                            <p className="text-sm font-mono">{status}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}