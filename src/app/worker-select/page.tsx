'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle } from "lucide-react";
import { RealtimeProvider, useRealtime } from "@/contexts/RealtimeContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function WorkerSelectionContent() {
  const { workers, setCurrentWorker, currentWorker, isLoading } = useRealtime();
  const router = useRouter();

  // Debug logging
  useEffect(() => {
    console.log('WorkerSelectionContent - isLoading:', isLoading);
    console.log('WorkerSelectionContent - workers:', workers);
    console.log('WorkerSelectionContent - currentWorker:', currentWorker);
  }, [isLoading, workers, currentWorker]);

  useEffect(() => {
    // If worker is already selected, redirect to dashboard
    if (currentWorker) {
      console.log('Redirecting to dashboard with worker:', currentWorker);
      router.push('/dashboard');
    }
  }, [currentWorker, router]);

  const handleWorkerSelect = async (worker: any) => {
    console.log('Worker selected:', worker);

    try {
      // Set the current worker
      setCurrentWorker(worker);
      console.log('Worker set in context');

      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Force navigation
      console.log('Attempting navigation to dashboard...');
      router.push('/dashboard');
      console.log('Navigation initiated');
    } catch (error) {
      console.error('Error during worker selection:', error);
    }
  };

  if (isLoading) {
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

              {/* Debug info */}
              <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                <p>Debug: Workers loaded: {workers.length}</p>
                <p>Current worker: {currentWorker?.name || 'None'}</p>
                <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
              </div>

              {/* Manual navigation button for testing */}
              {currentWorker && (
                <Button
                  className="w-full mt-2"
                  onClick={() => {
                    console.log('Manual navigation attempt');
                    router.push('/dashboard');
                  }}
                >
                  Go to Dashboard (Manual)
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function WorkerSelectionPage() {
  return (
    <RealtimeProvider>
      <WorkerSelectionContent />
    </RealtimeProvider>
  );
}
