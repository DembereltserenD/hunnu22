'use client';

import { createClient } from '../../../supabase/client';
import { useEffect, useState } from 'react';

export default function DebugDataPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const supabase = createClient();

                const [buildingsRes, apartmentsRes] = await Promise.all([
                    supabase.from('buildings').select('*'),
                    supabase.from('apartments').select('*')
                ]);

                const buildings = buildingsRes.data || [];
                const apartments = apartmentsRes.data || [];

                // Find building 222
                const building222 = buildings.find(b => b.name === '222');

                // Find apartments for building 222
                const apartments222 = building222 ? apartments.filter(apt => apt.building_id === building222.id) : [];

                setData({
                    buildings,
                    apartments,
                    building222,
                    apartments222,
                    totalBuildings: buildings.length,
                    totalApartments: apartments.length
                });

                console.log('Debug Data:', {
                    buildings: buildings.map(b => ({ id: b.id, name: b.name })),
                    apartments: apartments.map(apt => ({ id: apt.id, unit: apt.unit_number, building_id: apt.building_id })),
                    building222,
                    apartments222
                });
            } catch (error) {
                console.error('Error loading debug data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    if (loading) {
        return <div className="p-8">Loading debug data...</div>;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Debug Data</h1>

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold mb-3">Summary</h2>
                    <div className="bg-gray-100 p-4 rounded">
                        <p>Total Buildings: {data?.totalBuildings}</p>
                        <p>Total Apartments: {data?.totalApartments}</p>
                        <p>Building 222 Found: {data?.building222 ? 'Yes' : 'No'}</p>
                        <p>Building 222 ID: {data?.building222?.id}</p>
                        <p>Apartments in Building 222: {data?.apartments222?.length || 0}</p>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-3">All Buildings</h2>
                    <div className="bg-gray-100 p-4 rounded">
                        <pre className="text-sm overflow-auto">
                            {JSON.stringify(data?.buildings?.map(b => ({ id: b.id, name: b.name })), null, 2)}
                        </pre>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-3">All Apartments</h2>
                    <div className="bg-gray-100 p-4 rounded">
                        <pre className="text-sm overflow-auto">
                            {JSON.stringify(data?.apartments?.map(apt => ({
                                id: apt.id,
                                unit: apt.unit_number,
                                building_id: apt.building_id,
                                floor: apt.floor
                            })), null, 2)}
                        </pre>
                    </div>
                </div>

                {data?.building222 && (
                    <div>
                        <h2 className="text-xl font-semibold mb-3">Building 222 Details</h2>
                        <div className="bg-gray-100 p-4 rounded">
                            <pre className="text-sm overflow-auto">
                                {JSON.stringify(data.building222, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                {data?.apartments222 && (
                    <div>
                        <h2 className="text-xl font-semibold mb-3">Apartments in Building 222</h2>
                        <div className="bg-gray-100 p-4 rounded">
                            <pre className="text-sm overflow-auto">
                                {JSON.stringify(data.apartments222, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}