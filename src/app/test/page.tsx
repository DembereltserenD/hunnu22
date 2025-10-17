'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../supabase/client';

export default function TestPage() {
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const testSupabase = async () => {
            try {
                console.log('Testing Supabase connection...');
                const supabase = createClient();

                const { data, error } = await supabase.from('workers').select('*');

                console.log('Supabase response:', { data, error });

                if (error) {
                    setError(error.message);
                } else {
                    setWorkers(data || []);
                }
            } catch (err) {
                console.error('Test error:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        testSupabase();
    }, []);

    if (loading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Supabase Test</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    Error: {error}
                </div>
            )}

            <div className="mb-4">
                <h2 className="text-lg font-semibold">Workers ({workers.length}):</h2>
                <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(workers, null, 2)}
                </pre>
            </div>

            <div className="space-y-2">
                <h2 className="text-lg font-semibold">Environment Variables:</h2>
                <p>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}</p>
                <p>SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</p>
            </div>
        </div>
    );
}