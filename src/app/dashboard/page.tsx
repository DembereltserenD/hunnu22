'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, Clock, AlertTriangle, Users, Eye } from "lucide-react";
import { RealtimeProvider, useRealtime } from "@/contexts/RealtimeContext";
import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";

function DashboardContent() {
  const { buildings, apartments, visits, activeSessions, workers, currentWorker, isLoading } = useRealtime();
  const router = useRouter();

  useEffect(() => {
    console.log('Dashboard - useEffect triggered:', { isLoading, currentWorker });
    // Redirect to worker selection if no worker is selected
    if (!isLoading && !currentWorker) {
      console.log('Dashboard - Redirecting to worker-select (no worker)');
      router.push('/worker-select');
    }
  }, [currentWorker, isLoading, router]);

  const buildingStats = useMemo(() => {
    return buildings.map(building => {
      const buildingApartments = apartments.filter(apt => apt.building_id === building.id);
      const buildingVisits = visits.filter(visit =>
        buildingApartments.some(apt => apt.id === visit.apartment_id)
      );

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentVisits = buildingVisits.filter(visit =>
        new Date(visit.visit_date) > thirtyDaysAgo
      );

      const needsRepair = buildingVisits.filter(visit =>
        visit.status === 'repair-needed' || visit.status === 'replacement-needed'
      ).length;

      const activeBuildingSessions = activeSessions.filter(session =>
        buildingApartments.some(apt => apt.id === session.apartment_id)
      );

      return {
        ...building,
        total: buildingApartments.length,
        visited: recentVisits.length,
        needsRepair,
        activeSessions: activeBuildingSessions
      };
    });
  }, [buildings, apartments, visits, activeSessions]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentWorker) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Maintenance Dashboard</h1>
            <p className="text-gray-600">Welcome, {currentWorker.name}</p>

            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">Live Updates Active</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600">{activeSessions.length} Active Sessions</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildingStats.map((building) => {
              const completionRate = building.total > 0 ? Math.round((building.visited / building.total) * 100) : 0;

              return (
                <Card
                  key={building.id}
                  className="hover:shadow-md transition-shadow cursor-pointer relative"
                  onClick={() => router.push(`/building/${building.id}`)}
                >
                  {building.activeSessions.length > 0 && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      <Eye className="w-3 h-3" />
                      {building.activeSessions.length} active
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        {building.name}
                      </CardTitle>
                      <Badge variant={completionRate === 100 ? "default" : "secondary"}>
                        {completionRate}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Recent Visits
                        </span>
                        <span className="font-medium">{building.visited}/{building.total}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          Remaining
                        </span>
                        <span className="font-medium">{building.total - building.visited}</span>
                      </div>

                      {building.needsRepair > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            Needs Repair
                          </span>
                          <span className="font-medium text-red-600">{building.needsRepair}</span>
                        </div>
                      )}

                      {building.activeSessions.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-500 mb-2">Currently Working:</p>
                          <div className="space-y-1">
                            {building.activeSessions.map(session => {
                              const worker = workers.find(w => w.id === session.worker_id);
                              const apartment = apartments.find(a => a.id === session.apartment_id);
                              return (
                                <div key={session.id} className="text-xs bg-blue-50 p-2 rounded">
                                  <span className="font-medium">{worker?.name}</span>
                                  <span className="text-gray-600"> - Unit {apartment?.unit_number}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RealtimeProvider>
      <DashboardContent />
    </RealtimeProvider>
  );
}