'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugPhoneIssuesPage() {
    const [data, setData] = useState<{
        phoneIssues: any[];
        apartments: any[];
        error: string | null;
    }>({
        phoneIssues: [],
        apartments: [],
        error: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const supabase = createClient();

                // Test basic queries
                const [phoneIssuesRes, apartmentsRes] = await Promise.all([
                    supabase.from('phone_issues').select('*').limit(10),
                    supabase.from('apartments').select('*').limit(10)
                ]);

                console.log('Debug data:', {
                    phoneIssues: phoneIssuesRes,
                    apartments: apartmentsRes
                });

                setData({
                    phoneIssues: phoneIssuesRes.data || [],
                    apartments: apartmentsRes.data || [],
                    error: phoneIssuesRes.error?.message || apartmentsRes.error?.message || null
                });
            } catch (error) {
                console.error('Debug error:', error);
                setData(prev => ({ ...prev, error: (error as Error).message }));
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    if (loading) {
        return <div className="p-4">Loading debug data...</div>;
    }

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold">Debug Phone Issues</h1>

            {data.error && (
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-800">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-red-700">{data.error}</p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Phone Issues ({data.phoneIssues.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="text-xs overflow-auto max-h-96">
                        {JSON.stringify(data.phoneIssues, null, 2)}
                    </pre>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Check Specific Apartment</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <p className="text-sm">Let's check if there are records for specific apartments:</p>
                        {data.apartments.map((apt: any) => {
                            const records = data.phoneIssues.filter((issue: any) => issue.apartment_id === apt.id);
                            return (
                                <div key={apt.id} className="p-2 border rounded">
                                    <p className="font-medium">Unit {apt.unit_number} (ID: {apt.id})</p>
                                    <p className="text-sm text-gray-600">{records.length} records found</p>
                                    {records.length > 0 && (
                                        <pre className="text-xs bg-gray-50 p-2 mt-1 rounded">
                                            {JSON.stringify(records, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Apartments ({data.apartments.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="text-xs overflow-auto">
                        {JSON.stringify(data.apartments, null, 2)}
                    </pre>
                </CardContent>
            </Card>
        </div>
    );
}