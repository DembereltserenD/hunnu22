'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, AlertTriangle, Clock, Eye, Phone, Wrench, Home, Users } from "lucide-react";
import { RealtimeProvider, useRealtime } from "@/contexts/RealtimeContext";
import { useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import { groupApartmentsByFloor, calculateFloor } from "@/lib/floor-utils";

function BuildingDetailContent() {
  const { buildings, apartments, visits, activeSessions, workers, phoneIssues, currentWorker, isLoading } = useRealtime();
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

  // Calculate building statistics
  const buildingStats = useMemo(() => {
    const totalApartments = buildingApartments.length;
    const buildingPhoneIssues = phoneIssues.filter(issue =>
      buildingApartments.some(apt => apt.id === issue.apartment_id)
    );

    const openIssues = buildingPhoneIssues.filter(issue => issue.status === 'open').length;
    const inProgressIssues = buildingPhoneIssues.filter(issue => issue.status === 'in_progress').length;
    const resolvedIssues = buildingPhoneIssues.filter(issue => issue.status === 'resolved').length;

    const activeSessionsCount = buildingApartments.filter(apt =>
      activeSessions.some(session => session.apartment_id === apt.id && session.status === 'active')
    ).length;

    const apartmentsNeedingAttention = buildingApartments.filter(apt => {
      const apartmentVisits = visits.filter(v => v.apartment_id === apt.id);
      const lastVisit = apartmentVisits.sort((a, b) =>
        new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
      )[0];
      return lastVisit?.status === 'repair-needed' || lastVisit?.status === 'replacement-needed';
    }).length;

    return {
      totalApartments,
      totalIssues: buildingPhoneIssues.length,
      openIssues,
      inProgressIssues,
      resolvedIssues,
      activeSessions: activeSessionsCount,
      apartmentsNeedingAttention
    };
  }, [buildingApartments, phoneIssues, visits, activeSessions]);

  const apartmentStats = useMemo(() => {
    return buildingApartments.map(apartment => {
      const apartmentVisits = visits.filter(v => v.apartment_id === apartment.id);
      const lastVisit = apartmentVisits.sort((a, b) =>
        new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
      )[0];

      const activeSession = activeSessions.find(s =>
        s.apartment_id === apartment.id && s.status === 'active'
      );

      const apartmentPhoneIssues = phoneIssues.filter(issue => issue.apartment_id === apartment.id);
      const openPhoneIssues = apartmentPhoneIssues.filter(issue => issue.status === 'open');

      const needsAttention = lastVisit?.status === 'repair-needed' ||
        lastVisit?.status === 'replacement-needed' ||
        openPhoneIssues.length > 0;

      // Fix floor calculation
      const correctedFloor = calculateFloor(apartment.unit_number);

      return {
        ...apartment,
        floor: correctedFloor, // Override with calculated floor
        lastVisit,
        activeSession,
        needsAttention,
        visitCount: apartmentVisits.length,
        phoneIssues: apartmentPhoneIssues,
        openPhoneIssues: openPhoneIssues.length
      };
    }).sort((a, b) => {
      // Sort by floor first, then by unit number
      if (a.floor !== b.floor) {
        return a.floor - b.floor;
      }
      return a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true });
    });
  }, [buildingApartments, visits, activeSessions, phoneIssues]);

  // Group apartments by floor for better organization
  const floorGroups = useMemo(() => {
    return groupApartmentsByFloor(apartmentStats);
  }, [apartmentStats]);

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

          {/* Building Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{buildingStats.totalApartments}</p>
                    <p className="text-xs text-gray-600">Total Units</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{buildingStats.openIssues}</p>
                    <p className="text-xs text-gray-600">Open Issues</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{buildingStats.activeSessions}</p>
                    <p className="text-xs text-gray-600">Active Workers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold">{buildingStats.apartmentsNeedingAttention}</p>
                    <p className="text-xs text-gray-600">Need Attention</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Apartments grouped by floor */}
          <div className="space-y-6">
            {floorGroups.map((floorGroup) => (
              <Card key={floorGroup.floor}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Floor {floorGroup.floor}</span>
                    <Badge variant="outline" className="font-mono">
                      {floorGroup.apartments.length} unit{floorGroup.apartments.length !== 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {floorGroup.apartments.map((apartment) => {
                      const activeWorker = apartment.activeSession
                        ? workers.find(w => w.id === apartment.activeSession!.worker_id)
                        : null;

                      return (
                        <Card
                          key={apartment.id}
                          className="hover:shadow-md transition-shadow cursor-pointer border-l-4"
                          style={{
                            borderLeftColor: apartment.needsAttention
                              ? '#ef4444'
                              : apartment.activeSession
                                ? '#3b82f6'
                                : '#e5e7eb'
                          }}
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

                                  {apartment.openPhoneIssues > 0 && (
                                    <Badge variant="destructive">
                                      <Phone className="w-3 h-3 mr-1" />
                                      {apartment.openPhoneIssues} issue{apartment.openPhoneIssues !== 1 ? 's' : ''}
                                    </Badge>
                                  )}

                                  {apartment.needsAttention && !apartment.openPhoneIssues && (
                                    <Badge variant="destructive">
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      Needs Attention
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  {apartment.lastVisit ? (
                                    <span className="flex items-center gap-1">
                                      <CheckCircle2 className="w-4 h-4" />
                                      Last visit: {new Date(apartment.lastVisit.visit_date).toLocaleDateString()}
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      No visits yet
                                    </span>
                                  )}

                                  {apartment.phoneIssues.length > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <Phone className="w-4 h-4" />
                                        {apartment.phoneIssues.length} total issue{apartment.phoneIssues.length !== 1 ? 's' : ''}
                                      </span>
                                    </>
                                  )}

                                  <span>•</span>
                                  <span>{apartment.visitCount} visit{apartment.visitCount !== 1 ? 's' : ''}</span>
                                </div>

                                {/* Show recent phone issues */}
                                {apartment.openPhoneIssues > 0 && (
                                  <div className="mt-2 text-xs text-gray-500">
                                    Recent issues: {apartment.phoneIssues
                                      .filter(issue => issue.status === 'open')
                                      .slice(0, 2)
                                      .map(issue => issue.issue_type.replace('_', ' '))
                                      .join(', ')}
                                  </div>
                                )}
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
                </CardContent>
              </Card>
            ))}
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
