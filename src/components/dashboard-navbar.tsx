'use client';

import { Button } from "@/components/ui/button";
import { RealtimeProvider, useRealtime } from "@/contexts/RealtimeContext";
import { useRouter } from "next/navigation";
import { History } from "lucide-react";
import Link from "next/link";

function DashboardNavbarContent() {
  const { currentWorker, setCurrentWorker } = useRealtime();
  const router = useRouter();

  const handleLogout = () => {
    setCurrentWorker(null);
    router.push('/worker-select');
  };

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-2">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="text-xl font-bold text-blue-600">
          MaintenanceTracker
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/sync-history">
            <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50">
              <History className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-gray-700">Sync History</span>
            </Button>
          </Link>
          {currentWorker && (
            <>
              <span className="text-sm text-gray-600">
                {currentWorker.name}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Switch Worker
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function DashboardNavbar() {
  return (
    <RealtimeProvider>
      <DashboardNavbarContent />
    </RealtimeProvider>
  );
}