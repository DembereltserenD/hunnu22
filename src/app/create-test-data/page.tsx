'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from '../../../supabase/client';

export default function CreateTestDataPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string>('');

    const createTestData = async () => {
        setLoading(true);
        try {
            const supabase = createClient();

            // Get the first apartment
            const { data: apartments } = await supabase
                .from('apartments')
                .select('*')
                .limit(1);

            if (!apartments || apartments.length === 0) {
                setResult('No apartments found. Please create apartments first.');
                return;
            }

            const apartment = apartments[0];

            // Create test maintenance records
            const testRecords = [
                {
                    apartment_id: apartment.id,
                    phone_number: '99999999',
                    issue_type: 'smoke_detector',
                    status: 'болсон',
                    description: 'Cleared 2 smoke detectors in Building 222, Unit 101',
                    resolved_at: new Date().toISOString(),
                    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
                },
                {
                    apartment_id: apartment.id,
                    phone_number: '88888888',
                    issue_type: 'smoke_detector',
                    status: 'болсон',
                    description: 'Cleared 1 smoke detector in Building 222, Unit 101',
                    resolved_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
                    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    apartment_id: apartment.id,
                    phone_number: '77777777',
                    issue_type: 'domophone',
                    status: 'хүлээж авсан',
                    description: 'Called about domophone issue',
                    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
                },
                {
                    apartment_id: apartment.id,
                    phone_number: '66666666',
                    issue_type: 'smoke_detector',
                    status: 'тусламж хэрэгтэй',
                    description: 'Smoke detector maintenance needed',
                    worker_notes: 'Need special tools for high ceiling smoke detector',
                    created_at: new Date().toISOString()
                }
            ];

            const { data, error } = await supabase
                .from('phone_issues')
                .insert(testRecords);

            if (error) {
                setResult(`Error: ${error.message}`);
            } else {
                setResult(`Successfully created ${testRecords.length} test maintenance records for apartment ${apartment.unit_number}!`);
            }

        } catch (error) {
            setResult(`Error: ${(error as Error).message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Create Test Maintenance Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-600">
                        This will create sample maintenance records to test the apartment detail page.
                    </p>

                    <Button
                        onClick={createTestData}
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? 'Creating...' : 'Create Test Data'}
                    </Button>

                    {result && (
                        <div className={`p-3 rounded ${result.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                            {result}
                        </div>
                    )}

                    <div className="text-sm text-gray-500">
                        <p><strong>This will create:</strong></p>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                            <li>2 completed smoke detector cleanings</li>
                            <li>1 domophone call in progress</li>
                            <li>1 smoke detector needing help</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}