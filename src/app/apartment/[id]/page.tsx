'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, CheckCircle2, Plus, Eye, Clock, Phone } from "lucide-react";
import { RealtimeProvider, useRealtime } from "@/contexts/RealtimeContext";
import { useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import { calculateFloor } from "@/lib/floor-utils";

function ApartmentDetailContent() {
  const { visits, activeSessions, workers, apartments, buildings, phoneIssues, currentWorker, startSession, isLoading } = useRealtime();
  const router = useRouter();
  const params = useParams();
  const apartmentId = params.id as string;

  useEffect(() => {
    if (!isLoading && !currentWorker) {
      router.push('/worker-select');
    }
  }, [currentWorker, isLoading, router]);

  const apartment = apartments.find(a => a.id === apartmentId);
  const building = buildings.find(b => b.id === apartment?.building_id);

  // Get phone issues for this apartment
  const apartmentPhoneIssues = useMemo(() => {
    if (!apartment) return [];
    return (phoneIssues || []).filter(issue => issue.apartment_id === apartment.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [phoneIssues, apartment]);

  const apartmentVisits = useMemo(() => {
    if (!apartment) return [];
    return visits
      .filter(visit => visit.apartment_id === apartment.id)
      .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime())
      .slice(0, 10);
  }, [visits, apartment]);

  const activeSession = useMemo(() => {
    if (!apartment) return null;
    return activeSessions.find(session =>
      session.apartment_id === apartment.id && session.status === 'active'
    );
  }, [activeSessions, apartment]);

  const activeWorker = useMemo(() => {
    if (!activeSession) return null;
    return workers.find(w => w.id === activeSession.worker_id);
  }, [activeSession, workers]);

  const handleStartSession = async () => {
    if (apartment && currentWorker) {
      await startSession(apartment.id);
      router.push(`/visit/new?apartmentId=${apartment.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading apartment details...</p>
        </div>
      </div>
    );
  }

  if (!apartment || !building || !currentWorker) {
    return null;
  }

  const lastVisit = apartmentVisits[0];
  const isCurrentlyActive = !!activeSession;
  const isMySession = activeSession?.worker_id === currentWorker.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => router.push(`/building/${building.id}`)}
              className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors px-3 py-2 h-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2 text-gray-700" />
              <span className="text-gray-700 text-sm">Back to Building</span>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Unit {apartment.unit_number}</h1>
              <p className="text-gray-600">{building.name} - Floor {calculateFloor(apartment.unit_number)}</p>
            </div>
            {isCurrentlyActive && (
              <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                <Eye className="w-4 h-4" />
                <span>Being Serviced</span>
              </div>
            )}
          </div>

          {isCurrentlyActive && activeWorker && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-medium text-blue-900">
                      {isMySession ? 'You are' : `${activeWorker.name} is`} currently working on this unit
                    </p>
                    <p className="text-sm text-blue-700">
                      Started {activeSession!.started_at ? new Date(activeSession!.started_at).toLocaleTimeString() : 'Unknown time'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Current Status
                <Badge
                  variant={lastVisit?.status === 'completed' ? "default" : "destructive"}
                  className={lastVisit?.status === 'completed' ? "bg-green-100 text-green-800" : ""}
                >
                  {lastVisit ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {lastVisit.status === 'completed' ? 'Up to Date' : 'Needs Attention'}
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 mr-1" />
                      No Recent Visits
                    </>
                  )}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Visit:</span>
                  <span className="font-medium">
                    {lastVisit ? new Date(lastVisit.visit_date).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Worker:</span>
                  <span className="font-medium">
                    {lastVisit ? workers.find(w => w.id === lastVisit.worker_id)?.name || 'Unknown' : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Visits:</span>
                  <span className="font-medium">{apartmentVisits.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full mb-6 h-12 text-lg"
            onClick={handleStartSession}
            disabled={isCurrentlyActive && !isMySession}
          >
            <Plus className="w-5 h-5 mr-2" />
            {isCurrentlyActive && !isMySession
              ? 'Unit Currently Being Serviced by Another Worker'
              : isMySession
                ? 'Continue Visit'
                : 'Start New Visit'}
          </Button>

          {/* Phone Issues Section */}
          {apartmentPhoneIssues.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Phone Issues
                  </div>
                  <Badge variant={apartmentPhoneIssues.some(issue => issue.status === 'open') ? "destructive" : "default"}>
                    {apartmentPhoneIssues.filter(issue => issue.status === 'open').length} open
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {apartmentPhoneIssues.slice(0, 5).map((issue) => {
                    const issueWorker = workers.find(w => w.id === issue.worker_id);
                    return (
                      <div key={issue.id} className="border-l-4 border-orange-200 pl-4 pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4" />
                            <span className="font-medium">{issue.phone_number}</span>
                            <span className="text-gray-500">•</span>
                            <span className="capitalize">{issue.issue_type.replace('_', ' ')}</span>
                          </div>
                          <Badge
                            variant={
                              issue.status === 'resolved' ? "default" :
                                issue.status === 'in_progress' ? "secondary" : "destructive"
                            }
                            className={
                              issue.status === 'resolved' ? "bg-green-100 text-green-800" : ""
                            }
                          >
                            {issue.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        {issue.description && (
                          <p className="text-sm text-gray-700 mb-2">{issue.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Created: {new Date(issue.created_at).toLocaleDateString()}</span>
                          {issueWorker && (
                            <span>Assigned: {issueWorker.name}</span>
                          )}
                          {issue.resolved_at && (
                            <span>Resolved: {new Date(issue.resolved_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Visit History
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Live Updates
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {apartmentVisits.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No visits recorded yet</p>
              ) : (
                <div className="space-y-4">
                  {apartmentVisits.map((visit) => {
                    const worker = workers.find(w => w.id === visit.worker_id);
                    return (
                      <div key={visit.id} className="border-l-4 border-blue-200 pl-4 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {new Date(visit.visit_date).toLocaleDateString()}
                          </div>
                          <Badge
                            variant={visit.status === "completed" ? "default" : "destructive"}
                            className={visit.status === "completed" ? "bg-green-100 text-green-800" : ""}
                          >
                            {visit.status.replace('-', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <User className="w-4 h-4" />
                          {worker?.name || 'Unknown Worker'}
                        </div>
                        {visit.notes && (
                          <p className="text-sm text-gray-700">{visit.notes}</p>
                        )}
                        {visit.tasks_completed && Array.isArray(visit.tasks_completed) && visit.tasks_completed.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Tasks completed:</p>
                            <div className="flex flex-wrap gap-1">
                              {(visit.tasks_completed as string[]).map((task, index) => (
                                <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {task}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ApartmentDetailPage() {
  return (
    <RealtimeProvider>
      <ApartmentDetailContent />
    </RealtimeProvider>
  );
}
