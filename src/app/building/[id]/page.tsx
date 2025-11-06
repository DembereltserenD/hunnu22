'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Phone, Flame, Home } from "lucide-react";
import { createClient } from '../../../../supabase/client';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardNavbar from "@/components/dashboard-navbar";

export default function BuildingDetailPage() {
  const [data, setData] = useState<{
    building: any;
    apartments: any[];
    phoneIssues: any[];
  }>({
    building: null,
    apartments: [],
    phoneIssues: []
  });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const params = useParams();
  const buildingId = params.id as string;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();

        // Get building
        const { data: building, error: buildingError } = await supabase
          .from('buildings')
          .select('*')
          .eq('id', buildingId)
          .single();

        if (buildingError) {
          console.error('Error fetching building:', buildingError);
        }

        // Get apartments for this building
        const { data: apartments, error: apartmentsError } = await supabase
          .from('apartments')
          .select('*')
          .eq('building_id', buildingId)
          .order('unit_number');

        if (apartmentsError) {
          console.error('Error fetching apartments:', apartmentsError);
        }

        // Get phone issues for apartments in this building with worker data
        const apartmentIds = apartments?.map(apt => apt.id) || [];
        let phoneIssues: any[] = [];
        if (apartmentIds.length > 0) {
          const { data: issues, error: issuesError } = await supabase
            .from('phone_issues')
            .select('*')
            .in('apartment_id', apartmentIds)
            .order('created_at', { ascending: false });

          if (issuesError) {
            console.error('Error fetching phone issues:', issuesError);
          }

          // Get worker data separately
          if (issues && issues.length > 0) {
            const workerIds = issues.filter(issue => issue.worker_id).map(issue => issue.worker_id);
            if (workerIds.length > 0) {
              const { data: workers } = await supabase
                .from('workers')
                .select('id, name, email, phone')
                .in('id', workerIds);

              // Attach worker data to phone issues
              phoneIssues = issues.map(issue => ({
                ...issue,
                worker: workers?.find(worker => worker.id === issue.worker_id) || null
              }));
            } else {
              phoneIssues = issues || [];
            }
          }
        }

        setData({
          building: building || null,
          apartments: apartments || [],
          phoneIssues: phoneIssues || []
        });
      } catch (error: any) {
        console.error('Error loading building data:', {
          message: error?.message || 'Unknown error',
          name: error?.name || 'Error'
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [buildingId]);

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading building details...</p>
        </div>
      </div>
    );
  }

  if (!data.building) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar />
        <div className="p-4">
          <div className="max-w-4xl mx-auto text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900">Building Not Found</h1>
            <p className="text-gray-600 mt-2">The building you're looking for doesn't exist.</p>
            <Link href="/dashboard">
              <Button className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Group apartments by floor
  const floorGroups = data.apartments.reduce((acc: any, apartment: any) => {
    const floor = apartment.floor || 1;
    if (!acc[floor]) {
      acc[floor] = [];
    }
    acc[floor].push(apartment);
    return acc;
  }, {});

  const sortedFloors = Object.keys(floorGroups)
    .map(Number)
    .sort((a, b) => a - b)
    .map(floor => ({
      floor,
      apartments: floorGroups[floor].sort((a: any, b: any) => a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true }))
    }));

  // Calculate comprehensive maintenance statistics
  const maintenanceStats = {
    totalSmokeDetectorsCleaned: data.phoneIssues
      .filter(issue => issue.issue_type === 'smoke_detector' && issue.status === 'болсон')
      .reduce((total, issue) => {
        // Extract quantity from description (e.g., "Cleared 3 smoke detectors")
        const quantityMatch = issue.description?.match(/Cleared (\d+)/);
        return total + (quantityMatch ? parseInt(quantityMatch[1]) : 1);
      }, 0),

    completedMaintenanceRecords: data.phoneIssues.filter(issue => issue.status === 'болсон').length,

    openIssues: data.phoneIssues.filter(issue =>
      issue.status === 'open' || issue.status === 'тусламж хэрэгтэй' || issue.status === 'цэвэрлэх хэрэгтэй'
    ).length,

    workersInvolved: Array.from(new Set(
      data.phoneIssues
        .filter(issue => issue.worker && issue.status === 'болсон')
        .map(issue => issue.worker.name)
    )),

    lastMaintenanceDate: data.phoneIssues
      .filter(issue => issue.status === 'болсон' && issue.resolved_at)
      .sort((a, b) => new Date(b.resolved_at).getTime() - new Date(a.resolved_at).getTime())[0]?.resolved_at,

    phoneCallIssues: data.phoneIssues.filter(issue =>
      ['domophone', 'light_bulb'].includes(issue.issue_type)
    ).length,

    maintenanceRecords: data.phoneIssues.filter(issue =>
      issue.issue_type === 'smoke_detector'
    )
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard">
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{data.building.name}</h1>
              <p className="text-gray-600">{data.building.address}</p>
            </div>
          </div>

          {/* Enhanced Building Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{data.apartments.length}</p>
                    <p className="text-xs text-gray-600">Total Units</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{maintenanceStats.totalSmokeDetectorsCleaned}</p>
                    <p className="text-xs text-gray-600">SD Units Cleaned</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{maintenanceStats.completedMaintenanceRecords}</p>
                    <p className="text-xs text-gray-600">Completed Records</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{maintenanceStats.openIssues}</p>
                    <p className="text-xs text-gray-600">Open Issues</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Maintenance Summary */}
          {data.phoneIssues.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-green-600" />
                  Building Maintenance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800">Total SD Cleaned</h4>
                    <p className="text-2xl font-bold text-green-600">{maintenanceStats.totalSmokeDetectorsCleaned}</p>
                    <p className="text-sm text-green-600">
                      From {maintenanceStats.completedMaintenanceRecords} sessions
                    </p>
                  </div>

                  {maintenanceStats.lastMaintenanceDate && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800">Last Maintenance</h4>
                      <p className="text-lg font-bold text-blue-600">
                        {new Date(maintenanceStats.lastMaintenanceDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-blue-600">
                        {Math.floor((new Date().getTime() - new Date(maintenanceStats.lastMaintenanceDate).getTime()) / (1000 * 60 * 60 * 24))} days ago
                      </p>
                    </div>
                  )}

                  {maintenanceStats.workersInvolved.length > 0 && (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-800">Workers</h4>
                      <p className="text-2xl font-bold text-purple-600">{maintenanceStats.workersInvolved.length}</p>
                      <div className="text-sm text-purple-600">
                        {maintenanceStats.workersInvolved.slice(0, 2).map((worker, index) => (
                          <p key={index}>{worker}</p>
                        ))}
                        {maintenanceStats.workersInvolved.length > 2 && (
                          <p>+{maintenanceStats.workersInvolved.length - 2} more</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800">Phone Issues</h4>
                    <p className="text-2xl font-bold text-gray-600">{maintenanceStats.phoneCallIssues}</p>
                    <p className="text-sm text-gray-600">
                      Domophone & Light Bulb calls
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Maintenance Activity */}
          {maintenanceStats.maintenanceRecords.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-600" />
                  Recent Maintenance Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {maintenanceStats.maintenanceRecords.slice(0, 5).map((record: any) => {
                    const apartment = data.apartments.find(apt => apt.id === record.apartment_id);
                    const quantityMatch = record.description?.match(/Cleared (\d+)/);
                    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;

                    return (
                      <div key={record.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <Flame className="w-5 h-5 text-green-500" />
                          <div>
                            <p className="font-medium text-sm">
                              Unit {apartment?.unit_number} - {quantity} Smoke Detector{quantity > 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-gray-600">
                              {record.worker?.name || 'Unknown Worker'} • {record.phone_number}
                            </p>
                            {record.description && (
                              <p className="text-xs text-gray-500 mt-1">{record.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              record.status === 'болсон' ? 'default' :
                                record.status === 'хүлээж авсан' ? 'secondary' :
                                  record.status === 'тусламж хэрэгтэй' ? 'destructive' :
                                    record.status === 'цэвэрлэх хэрэгтэй' ? 'secondary' : 'outline'
                            }
                            className={
                              record.status === 'болсон' ? 'bg-green-100 text-green-800' :
                                record.status === 'хүлээж авсан' ? 'bg-blue-100 text-blue-800' :
                                  record.status === 'тусламж хэрэгтэй' ? 'bg-orange-100 text-orange-800' :
                                    record.status === 'цэвэрлэх хэрэгтэй' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                            }
                          >
                            {record.status === 'болсон' && 'Completed'}
                            {record.status === 'хүлээж авсан' && 'In Progress'}
                            {record.status === 'тусламж хэрэгтэй' && 'Needs Help'}
                            {record.status === 'цэвэрлэх хэрэгтэй' && 'Needs Cleaning'}
                            {record.status === 'open' && 'Open'}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(record.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {maintenanceStats.maintenanceRecords.length > 5 && (
                    <div className="text-center pt-2">
                      <p className="text-sm text-gray-500">
                        +{maintenanceStats.maintenanceRecords.length - 5} more maintenance records
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Apartments by Floor */}
          {sortedFloors.length > 0 ? (
            <div className="space-y-6">
              {sortedFloors.map((floorGroup) => (
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
                      {floorGroup.apartments.map((apartment: any) => {
                        const apartmentPhoneIssues = data.phoneIssues.filter(issue => issue.apartment_id === apartment.id);
                        const openIssues = apartmentPhoneIssues.filter(issue => issue.status === 'open').length;
                        const resolvedIssues = apartmentPhoneIssues.filter(issue => issue.status === 'болсон').length;
                        const needsCleaningIssues = apartmentPhoneIssues.filter(issue => issue.status === 'цэвэрлэх хэрэгтэй').length;

                        // Calculate detailed apartment statistics
                        const apartmentMaintenanceRecords = apartmentPhoneIssues.filter(issue => issue.issue_type === 'smoke_detector');
                        const apartmentSmokeDetectorsCleaned = apartmentMaintenanceRecords
                          .filter(issue => issue.status === 'болсон')
                          .reduce((total, issue) => {
                            const quantityMatch = issue.description?.match(/Cleared (\d+)/);
                            return total + (quantityMatch ? parseInt(quantityMatch[1]) : 1);
                          }, 0);

                        return (
                          <Link key={apartment.id} href={`/apartment/${apartment.id}`}>
                            <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h3 className="text-lg font-semibold">Unit {apartment.unit_number}</h3>

                                      {apartmentSmokeDetectorsCleaned > 0 && (
                                        <Badge className="bg-green-100 text-green-800">
                                          <Flame className="w-3 h-3 mr-1" />
                                          {apartmentSmokeDetectorsCleaned} SD cleaned
                                        </Badge>
                                      )}

                                      {resolvedIssues > 0 && (
                                        <Badge className="bg-blue-100 text-blue-800">
                                          <CheckCircle2 className="w-3 h-3 mr-1" />
                                          {resolvedIssues} completed
                                        </Badge>
                                      )}

                                      {needsCleaningIssues > 0 && (
                                        <Badge className="bg-yellow-100 text-yellow-800">
                                          <Flame className="w-3 h-3 mr-1" />
                                          {needsCleaningIssues} needs cleaning
                                        </Badge>
                                      )}

                                      {openIssues > 0 && (
                                        <Badge variant="destructive">
                                          <Phone className="w-3 h-3 mr-1" />
                                          {openIssues} open
                                        </Badge>
                                      )}
                                    </div>

                                    <div className="text-sm text-gray-600 space-y-1">
                                      {apartmentPhoneIssues.length > 0 ? (
                                        <>
                                          <div>{apartmentPhoneIssues.length} total maintenance record{apartmentPhoneIssues.length !== 1 ? 's' : ''}</div>
                                          {apartmentMaintenanceRecords.length > 0 && (
                                            <div className="text-xs text-green-600">
                                              {apartmentMaintenanceRecords.length} cleaning session{apartmentMaintenanceRecords.length !== 1 ? 's' : ''}
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <span>No maintenance records</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Home className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No apartments found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This building doesn't have any apartments yet. Create some through the admin panel or bulk import.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}