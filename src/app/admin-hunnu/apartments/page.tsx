"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronDown,
  ChevronRight,
  Building2,
  Search,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Phone,
  Flame,
  Loader2,
  Home,
  Clock,
  User,
  FileText
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// Types
interface DeviceInfo {
  address: string;
  status: 'ok' | 'problem' | 'warning';
}

interface ApartmentFromXlsm {
  id: string;
  unit_number: string;
  floor: number;
  smoke_detector_count: number;
  smoke_detector_addresses: string[];
  smoke_detectors: DeviceInfo[];
  smoke_detector_loops: string[];
  common_area_devices: DeviceInfo[];
  bell: DeviceInfo | null;
  mcp: DeviceInfo | null;
  relay: DeviceInfo | null;
  has_problem: boolean;
  has_warning: boolean;
  problem_count: number;
  warning_count: number;
  building: {
    id: string;
    name: string;
    address: string;
    total_units: number;
  };
}

interface PhoneIssue {
  id: string;
  phone_number: string;
  issue_type: 'smoke_detector' | 'domophone' | 'light_bulb';
  status: string;
  description: string | null;
  worker_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  worker: { id: string; name: string } | null;
}

interface BuildingOption {
  id: string;
  name: string;
}

interface Stats {
  total: number;
  withProblems: number;
  withWarnings: number;
  ok: number;
}

// Status badge component
function StatusBadge({ status }: { status: 'ok' | 'problem' | 'warning' }) {
  if (status === 'problem') {
    return <span className="w-2 h-2 rounded-full bg-red-500 inline-block" title="Бохирдсон" />;
  }
  if (status === 'warning') {
    return <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" title="Холболтын алдаа" />;
  }
  return <span className="w-2 h-2 rounded-full bg-green-500 inline-block" title="OK" />;
}

// Device list component
function DeviceList({ devices, label }: { devices: DeviceInfo[]; label: string }) {
  if (devices.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-muted-foreground w-8 font-medium">{label}:</span>
      <div className="flex flex-wrap gap-1">
        {devices.map((device, i) => (
          <span
            key={i}
            className={cn(
              "px-1.5 py-0.5 rounded text-xs font-mono",
              device.status === 'problem' && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
              device.status === 'warning' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
              device.status === 'ok' && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            )}
          >
            {device.address}
          </span>
        ))}
      </div>
    </div>
  );
}

// Phone issue item component
function PhoneIssueItem({ issue }: { issue: PhoneIssue }) {
  const statusColors: Record<string, string> = {
    'open': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'хүлээж авсан': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'болсон': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'тусламж хэрэгтэй': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    'цэвэрлэх хэрэгтэй': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  };

  const issueTypeIcons: Record<string, React.ReactNode> = {
    'smoke_detector': <Flame className="h-3 w-3" />,
    'domophone': <Phone className="h-3 w-3" />,
    'light_bulb': <span className="text-xs">💡</span>,
  };

  const issueTypeLabels: Record<string, string> = {
    'smoke_detector': 'SD',
    'domophone': 'Домофон',
    'light_bulb': 'Гэрэл',
  };

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {issueTypeIcons[issue.issue_type]}
          <span className="text-sm font-medium">{issueTypeLabels[issue.issue_type]}</span>
          <Badge className={cn("text-xs", statusColors[issue.status] || 'bg-gray-100')}>
            {issue.status}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Phone className="h-3 w-3" />
          {issue.phone_number}
        </span>
      </div>

      {issue.description && (
        <p className="text-xs text-muted-foreground">{issue.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          {new Date(issue.created_at).toLocaleDateString('mn-MN')}
          {issue.resolved_at && (
            <span className="text-green-600">
              → {new Date(issue.resolved_at).toLocaleDateString('mn-MN')}
            </span>
          )}
        </div>
        {issue.worker && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {issue.worker.name}
          </div>
        )}
      </div>

      {issue.worker_notes && (
        <p className="text-xs text-orange-600 dark:text-orange-400 italic">
          📝 {issue.worker_notes}
        </p>
      )}
    </div>
  );
}

// Apartment card component
function ApartmentCard({
  apartment,
  phoneIssues,
  isExpanded,
  onToggle
}: {
  apartment: ApartmentFromXlsm;
  phoneIssues: PhoneIssue[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasIssues = phoneIssues.length > 0;
  const pendingIssues = phoneIssues.filter(i => !i.resolved_at);

  // Use the smoke detectors as provided by the API (should now be properly filtered)
  const actualSmokeDetectors = apartment.smoke_detectors || [];

  // Recalculate status based only on smoke detectors
  const hasActualProblems = actualSmokeDetectors.some(sd => sd.status === 'problem');
  const hasActualWarnings = actualSmokeDetectors.some(sd => sd.status === 'warning');

  return (
    <Card className={cn(
      "transition-all hover:shadow-sm border-l-4",
      hasActualProblems && "border-l-red-500 border-red-300 dark:border-red-800 bg-red-50/20 dark:bg-red-900/5",
      hasActualWarnings && !hasActualProblems && "border-l-yellow-500 border-yellow-300 dark:border-yellow-800 bg-yellow-50/20 dark:bg-yellow-900/5",
      !hasActualProblems && !hasActualWarnings && "border-l-green-500 hover:border-green-300 dark:hover:border-green-800 bg-green-50/10 dark:bg-green-900/5"
    )}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="py-2 px-4 hover:bg-muted/20 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}

                {/* Status indicator - based only on smoke detectors */}
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center",
                  hasActualProblems && "bg-red-100 dark:bg-red-900/30",
                  hasActualWarnings && !hasActualProblems && "bg-yellow-100 dark:bg-yellow-900/30",
                  !hasActualProblems && !hasActualWarnings && "bg-green-100 dark:bg-green-900/30"
                )}>
                  {hasActualProblems ? (
                    <AlertCircle className="h-3 w-3 text-red-600" />
                  ) : hasActualWarnings ? (
                    <AlertTriangle className="h-3 w-3 text-yellow-600" />
                  ) : (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  )}
                </div>

                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold text-base">{apartment.unit_number}</span>
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                      {apartment.floor}F
                    </Badge>
                  </div>
                  {/* Remove building name from individual cards */}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Smoke detector summary - only show actual smoke detectors */}
                <div className="flex items-center gap-1.5 bg-muted/40 rounded-md px-2 py-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  <span className="text-sm font-mono font-medium">{actualSmokeDetectors.length}</span>
                  <div className="flex gap-0.5">
                    {actualSmokeDetectors.slice(0, 3).map((sd, i) => (
                      <StatusBadge key={i} status={sd.status} />
                    ))}
                  </div>
                </div>

                {/* Phone issues indicator */}
                {hasIssues && (
                  <Badge variant={pendingIssues.length > 0 ? "destructive" : "secondary"} className="text-xs px-1.5 py-0.5">
                    <Phone className="h-3 w-3 mr-1" />
                    {pendingIssues.length > 0 ? pendingIssues.length : phoneIssues.length}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-3 space-y-2">
            {/* Devices section - simplified and improved */}
            <div className="space-y-1.5 p-2 bg-muted/15 rounded-md border-l-2 border-orange-200">
              <h4 className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                <Flame className="h-3 w-3" />
                Утаа мэдрэгч ({actualSmokeDetectors.length})
              </h4>

              <DeviceList devices={actualSmokeDetectors} label="SD" />

              {/* Don't show common area devices and bell in the expanded view */}
            </div>

            {/* Phone issues section */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3 w-3" />
                Утасны асуудлууд ({phoneIssues.length})
              </h4>

              {phoneIssues.length === 0 ? (
                <p className="text-xs text-muted-foreground italic pl-4">Бүртгэгдсэн асуудал байхгүй</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {phoneIssues.map(issue => (
                    <PhoneIssueItem key={issue.id} issue={issue} />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function ApartmentsPageContent() {
  const { toast } = useToast();
  const [apartments, setApartments] = useState<ApartmentFromXlsm[]>([]);
  const [phoneIssuesByUnit, setPhoneIssuesByUnit] = useState<Record<string, PhoneIssue[]>>({});
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, withProblems: 0, withWarnings: 0, ok: 0 });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Expanded apartments
  const [expandedApartments, setExpandedApartments] = useState<Set<string>>(new Set());

  const loadApartments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('limit', '1000');
      if (searchQuery) params.set('search', searchQuery);
      if (selectedBuilding) params.set('building_id', selectedBuilding);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await fetch(`/api/apartments-xlsm?${params.toString()}`);
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setApartments(result.data || []);
      setStats(result.stats || { total: 0, withProblems: 0, withWarnings: 0, ok: 0 });
    } catch (error) {
      console.error("Error loading apartments:", error);
      toast({
        title: "Алдаа",
        description: "Орон сууцны мэдээлэл ачаалахад алдаа гарлаа",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBuildings = async () => {
    try {
      const response = await fetch('/api/apartments-xlsm', { method: 'POST' });
      const result = await response.json();
      setBuildings(result.buildings || []);
    } catch (error) {
      console.error("Error loading buildings:", error);
    }
  };

  const loadPhoneIssues = async (buildingName: string) => {
    try {
      const response = await fetch(`/api/apartments-xlsm/phone-issues?building=${encodeURIComponent(buildingName)}`);
      const result = await response.json();

      if (result.issuesByUnit) {
        setPhoneIssuesByUnit(prev => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(result.issuesByUnit).map(([unit, issues]) => [
              `${buildingName}-${unit}`,
              issues as PhoneIssue[]
            ])
          )
        }));
      }
    } catch (error) {
      console.error("Error loading phone issues:", error);
    }
  };

  useEffect(() => {
    loadBuildings();
  }, []);

  useEffect(() => {
    loadApartments();
  }, [searchQuery, selectedBuilding, statusFilter]);

  // Load phone issues when building is selected or apartments change
  useEffect(() => {
    if (selectedBuilding) {
      loadPhoneIssues(selectedBuilding);
    } else {
      // Load for all buildings shown
      const uniqueBuildings = Array.from(new Set(apartments.map(a => a.building.name)));
      uniqueBuildings.forEach(buildingName => {
        loadPhoneIssues(buildingName);
      });
    }
  }, [apartments, selectedBuilding]);

  const toggleApartment = (id: string) => {
    const newExpanded = new Set(expandedApartments);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedApartments(newExpanded);
  };

  const getPhoneIssuesForApartment = (apartment: ApartmentFromXlsm): PhoneIssue[] => {
    return phoneIssuesByUnit[`${apartment.building.name}-${apartment.unit_number}`] || [];
  };

  // Group apartments by building, then by loop
  const groupedApartments = apartments.reduce((acc, apt) => {
    const buildingName = apt.building.name;
    const loopName = apt.smoke_detector_loops?.[0] || 'Unknown Loop';

    if (!acc[buildingName]) {
      acc[buildingName] = {};
    }
    if (!acc[buildingName][loopName]) {
      acc[buildingName][loopName] = [];
    }
    acc[buildingName][loopName].push(apt);
    return acc;
  }, {} as Record<string, Record<string, ApartmentFromXlsm[]>>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8 text-green-600" />
          Орон сууц (XLSM)
        </h1>
        <p className="text-muted-foreground">
          Жишиг.xlsm файлаас уншсан - утасны асуудал, төхөөрөмжийн төлөв
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className={cn("cursor-pointer transition-all hover:shadow-md", statusFilter === 'all' && "ring-2 ring-primary")}
          onClick={() => setStatusFilter('all')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Нийт орон сууц</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn("cursor-pointer transition-all hover:shadow-md", statusFilter === 'problem' && "ring-2 ring-red-500")}
          onClick={() => setStatusFilter('problem')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.withProblems}</p>
                <p className="text-xs text-muted-foreground">Бохирдсон</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn("cursor-pointer transition-all hover:shadow-md", statusFilter === 'warning' && "ring-2 ring-yellow-500")}
          onClick={() => setStatusFilter('warning')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.withWarnings}</p>
                <p className="text-xs text-muted-foreground">Холболтын алдаа</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn("cursor-pointer transition-all hover:shadow-md", statusFilter === 'ok' && "ring-2 ring-green-500")}
          onClick={() => setStatusFilter('ok')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.ok}</p>
                <p className="text-xs text-muted-foreground">Хэвийн</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Хайх (айл, барилга, хаяг)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedBuilding || "all"} onValueChange={(val) => setSelectedBuilding(val === "all" ? "" : val)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Бүх барилга" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх барилга</SelectItem>
            {buildings.map(building => (
              <SelectItem key={building.id} value={building.id}>
                {building.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Apartments list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Уншиж байна...</span>
        </div>
      ) : apartments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Орон сууц олдсонгүй</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedApartments).map(([buildingName, loopGroups]) => (
            <div key={buildingName} className="space-y-6">
              {/* Building header */}
              <div className="flex items-center gap-3 sticky top-0 bg-background/95 backdrop-blur-sm py-3 z-20 border-b-2 border-primary/20">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-xl font-bold">{buildingName}</h1>
                <Badge variant="secondary" className="font-medium">
                  {Object.values(loopGroups).flat().length} айл
                </Badge>
              </div>

              {/* Loop sections within building */}
              {Object.entries(loopGroups).map(([loopName, loopApartments]) => {
                // Use smoke detectors as provided by the API (should now be properly filtered)
                const apartmentsWithProblems = loopApartments.filter(apt => {
                  const actualSDs = apt.smoke_detectors || [];
                  return actualSDs.some(sd => sd.status === 'problem');
                });

                const apartmentsWithWarnings = loopApartments.filter(apt => {
                  const actualSDs = apt.smoke_detectors || [];
                  return actualSDs.some(sd => sd.status === 'warning') &&
                    !actualSDs.some(sd => sd.status === 'problem');
                });

                return (
                  <div key={`${buildingName}-${loopName}`} className="space-y-3">
                    {/* Loop header */}
                    <div className="flex items-center gap-3 sticky top-16 bg-background/90 backdrop-blur-sm py-2 z-10 border-l-4 border-blue-500 pl-4">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{loopName}</span>
                      </div>
                      <Badge variant="outline" className="font-medium">{loopApartments.length} айл</Badge>
                      {apartmentsWithProblems.length > 0 && (
                        <Badge variant="destructive" className="font-medium">
                          {apartmentsWithProblems.length} бохирдсон
                        </Badge>
                      )}
                      {apartmentsWithWarnings.length > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium">
                          {apartmentsWithWarnings.length} холболтын алдаа
                        </Badge>
                      )}
                    </div>

                    {/* Apartments in this loop */}
                    <div className="grid gap-2 ml-6">
                      {loopApartments.map(apartment => (
                        <ApartmentCard
                          key={apartment.id}
                          apartment={apartment}
                          phoneIssues={getPhoneIssuesForApartment(apartment)}
                          isExpanded={expandedApartments.has(apartment.id)}
                          onToggle={() => toggleApartment(apartment.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ApartmentsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ApartmentsPageContent />
    </Suspense>
  );
}
