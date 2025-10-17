'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, AlertTriangle, Clock, Eye } from "lucide-react";
import { RealtimeProvider, useRealtime } from "@/contexts/RealtimeContext";
import { useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";

function BuildingDetailContent() {
  const { buildings, apartments, visits, activeSessions, workers, currentWorker, isLoading } = useRealtime();
  const router = useRouter();
  const params = useParams();
  const buildingId = params.id as string;

  useEffect(() => {
    if (!isLoading && !currentWorker) {
      router.push('/worker-select');
    }
  }, [currentWorker, isLoading, router]);

  const building = buildings.find(b => b.id === buildingId);
  const buildingApartments = apartments.filter(apt => apt.building_id === buildingId);

  const apartmentStats = useMemo(() => {
    return buildingApartments.map(apartment => {
      const apartmentVisits = visits.filter(v => v.apartment_id === apartment.id);
      const lastVisit = apartmentVisits.sort((a, b) =>
        new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
      )[0];

      const activeSession = activeSessions.find(s =>
        s.apartment_id === apartment.id && s.status === 'active'
      );

      const needsAttention = lastVisit?.status === 'repair-needed' ||
        lastVisit?.status === 'replacement-needed';

      return {
        ...apartment,
        lastVisit,
        activeSession,
        needsAttention,
        visitCount: apartmentVisits.length
      };
    }).sort((a, b) => parseInt(a.unit_number) - parseInt(b.unit_number));
  }, [buildingApartments, visits, activeSessions]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading building details...</p>
        </div>
      </div>
    );
  }

  if (!currentWorker || !building) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors px-3 py-2 h-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2 text-gray-700" />
              <span className="text-gray-700 text-sm">Back to Dashboard</span>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{building.name}</h1>
              <p className="text-gray-600">{building.address}</p>
            </div>
          </div>

          <div className="grid gap-4">
            {apartmentStats.map((apartment) => {
              const activeWorker = apartment.activeSession
                ? workers.find(w => w.id === apartment.activeSession!.worker_id)
                : null;

              return (
                <Card
                  key={apartment.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/apartment/${apartment.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">Unit {apartment.unit_number}</h3>
                          {apartment.activeSession && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              <Eye className="w-3 h-3 mr-1" />
                              {activeWorker?.name}
                            </Badge>
                          )}
                          {apartment.needsAttention && (
                            <Badge variant="destructive">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Needs Attention
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Floor {apartment.floor}</span>
                          {apartment.lastVisit ? (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" />
                                Last visit: {new Date(apartment.lastVisit.visit_date).toLocaleDateString()}
                              </span>
                            </>
                          ) : (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                No visits yet
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
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

export default function BuildingDetailPage() {
  return (
    <RealtimeProvider>
      <BuildingDetailContent />
    </RealtimeProvider>
  );
}
