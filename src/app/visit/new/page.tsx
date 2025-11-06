'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Wifi, WifiOff, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from '../../../../supabase/client';
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import { cleanUnitNumber } from "@/lib/floor-utils";

function VisitFormContent() {
  const [data, setData] = useState<{
    workers: any[];
    apartments: any[];
    buildings: any[];
  }>({
    workers: [],
    apartments: [],
    buildings: []
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();

        const [workersRes, apartmentsRes, buildingsRes] = await Promise.all([
          supabase.from('workers').select('*'),
          supabase.from('apartments').select('*'),
          supabase.from('buildings').select('*')
        ]);

        setData({
          workers: workersRes.data || [],
          apartments: apartmentsRes.data || [],
          buildings: buildingsRes.data || []
        });
      } catch (error) {
        console.error('Error loading visit form data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);
  const apartmentId = searchParams.get('apartmentId');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true); // TODO: Implement online/offline detection
  const [formData, setFormData] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    status: '',
    notes: '',
    tasksCompleted: [] as string[]
  });

  // Redirect to worker selection if no worker is selected
  // This would typically come from a worker context or session

  const apartment = data.apartments.find(a => a.id === apartmentId);
  const building = data.buildings.find(b => b.id === apartment?.building_id);

  const handleTaskToggle = (task: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      tasksCompleted: checked
        ? [...prev.tasksCompleted, task]
        : prev.tasksCompleted.filter(t => t !== task)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apartment || !formData.status) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement visit logging
      const supabase = createClient();
      const { error } = await supabase.from('visits').insert({
        apartment_id: apartment.id,
        worker_id: 'temp-worker-id', // TODO: Get from worker context
        visit_date: new Date(formData.visitDate).toISOString(),
        status: formData.status,
        notes: formData.notes || null,
        tasks_completed: formData.tasksCompleted
      });

      if (error) throw error;

      const message = isOnline
        ? 'Visit logged successfully!'
        : 'Visit saved offline. Will sync when connection is restored.';
      alert(message);
      router.push(`/apartment/${apartment.id}`);
    } catch (error) {
      console.error('Error logging visit:', error);
      alert('Error logging visit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!apartment || !building) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Apartment not found</p>
        </div>
      </div>
    );
  }

  const hasPendingData = false; // TODO: Implement pending data tracking

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      <div className="p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push(`/apartment/${apartment.id}`)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Log Visit</h1>
                <p className="text-sm text-gray-600">Unit {cleanUnitNumber(apartment.unit_number)} - {building.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-xs text-gray-500">
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          {hasPendingData && (
            <Card className="mb-4 border-orange-200 bg-orange-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2 text-sm text-orange-800">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Pending sync</p>
                    <p className="text-xs">
                      0 visits and 0 sessions waiting to sync
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-4 border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>
                  {isOnline
                    ? 'Real-time sync enabled - changes will be visible to all workers instantly'
                    : 'Offline mode - data will be saved locally and synced when connection returns'}
                </span>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Visit Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Visit Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.visitDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, visitDate: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="worker">Maintenance Worker</Label>
                  <Select value="" disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Select worker" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.workers.map(worker => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {worker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Visit Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="repair-needed">Repair Needed</SelectItem>
                      <SelectItem value="replacement-needed">Replacement Needed</SelectItem>
                      <SelectItem value="no-access">No Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Tasks Completed</Label>
                  <div className="space-y-2">
                    {[
                      'Smoke detector cleaned',
                      'Functionality tested',
                      'Battery replaced',
                      'Visual inspection completed'
                    ].map((task) => (
                      <div key={task} className="flex items-center space-x-2">
                        <Checkbox
                          id={task}
                          checked={formData.tasksCompleted.includes(task)}
                          onCheckedChange={(checked) => handleTaskToggle(task, checked as boolean)}
                        />
                        <Label htmlFor={task} className="text-sm">{task}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional notes about the visit..."
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full mt-6"
                  disabled={isSubmitting || !formData.status}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      {isOnline ? <Save className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      {isOnline ? "Save Visit" : "Save Offline (Will Sync Later)"}
                    </>
                  )}
                </Button>

                {!isOnline && (
                  <p className="text-xs text-center text-gray-500 mt-2">
                    Visit will be saved locally and synced when connection is restored.<br />
                    Other workers will see updates when you come back online.
                  </p>
                )}
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function VisitFormPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    }>
      <VisitFormContent />
    </Suspense>
  );
}