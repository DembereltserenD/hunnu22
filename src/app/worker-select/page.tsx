'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle } from "lucide-react";
import { createClient } from '../../../supabase/client';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function WorkerSelectionPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadWorkers() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('workers').select('*').order('name');
        setWorkers(data || []);
      } catch (error) {
        console.error('Error loading workers:', error);
      } finally {
        setLoading(false);
      }
    }

    loadWorkers();
  }, []);

  const handleWorkerSelect = async (worker: any) => {
    console.log('Worker selected:', worker);
    // Save worker to localStorage for the session
    localStorage.setItem('selectedWorker', JSON.stringify(worker));
    // Navigate to main dashboard
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600">MaintenanceTracker</CardTitle>
          <p className="text-gray-600">Select your name to continue</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {workers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No workers found. Please contact your administrator.</p>
          ) : (
            <>
              {workers.map((worker) => (
                <Button
                  key={worker.id}
                  variant="outline"
                  className="w-full justify-start h-12 text-left hover:bg-blue-50"
                  onClick={() => handleWorkerSelect(worker)}
                >
                  <UserCircle className="w-5 h-5 mr-3" />
                  {worker.name}
                </Button>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}