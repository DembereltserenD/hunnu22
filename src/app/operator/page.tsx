'use client';

import DashboardNavbar from "@/components/dashboard-navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface BuildingOption {
  id: string;
  name: string;
}

interface ApartmentOption {
  id: string;
  unit_number: string;
  building_id: string;
}

export default function OperatorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [apartments, setApartments] = useState<ApartmentOption[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [selectedApartment, setSelectedApartment] = useState<string>("");
  const [buildingNameInput, setBuildingNameInput] = useState<string>("");
  const [unitNumberInput, setUnitNumberInput] = useState<string>("");
  const [visitDate, setVisitDate] = useState<string>("");
  const [visitTime, setVisitTime] = useState<string>("");
  const [visitNote, setVisitNote] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadOptions() {
      try {
        const supabase = createClient();
        const [buildingsRes, apartmentsRes] = await Promise.all([
          supabase.from("buildings").select("id,name").order("name"),
          supabase.from("apartments").select("id,unit_number,building_id").order("unit_number"),
        ]);

        setBuildings(buildingsRes.data || []);
        setApartments(apartmentsRes.data || []);

        if (buildingsRes.error || apartmentsRes.error) {
          toast({
            title: "Алдаа",
            description: "Барилга эсвэл айлын мэдээлэл уншихад алдаа гарлаа.",
            variant: "destructive",
          });
        } else if ((buildingsRes.data || []).length === 0) {
          toast({
            title: "Барилга олдсонгүй",
            description: "Supabase дээр барилгын өгөгдөл байхгүй байна.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading operator options:", error);
      } finally {
        setLoading(false);
      }
    }

    loadOptions();
  }, []);

  const availableApartments = useMemo(() => {
    if (!selectedBuilding) return [];
    return apartments.filter((apt) => apt.building_id === selectedBuilding);
  }, [apartments, selectedBuilding]);

  const handleSubmit = async () => {
    const hasBuilding = Boolean(buildingNameInput.trim() || selectedBuilding);
    const hasApartment = Boolean(unitNumberInput.trim() || selectedApartment);

    if (!hasBuilding || !hasApartment || !visitDate || !visitTime) {
      toast({
        title: "Дутуу мэдээлэл",
        description: "Бүх талбарыг бүрэн дүүргэнэ үү.",
        variant: "destructive",
      });
      return;
    }

    const scheduledAt = new Date(`${visitDate}T${visitTime}`);
    if (Number.isNaN(scheduledAt.getTime())) {
      toast({
        title: "Хугацаа буруу",
        description: "Өдөр ба цагаа дахин шалгаарай.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const apartment = apartments.find((apt) => apt.id === selectedApartment);
      const buildingNameFromSelect = buildings.find((b) => b.id === selectedBuilding)?.name || "";
      const buildingName = buildingNameInput.trim() || buildingNameFromSelect;
      const unitNumber = unitNumberInput.trim() || apartment?.unit_number || "";

      const newEntry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        building_id: selectedBuilding,
        apartment_id: selectedApartment,
        building_name: buildingName,
        unit_number: unitNumber,
        scheduled_at: scheduledAt.toISOString(),
        status: "not_visited",
        note: visitNote.trim(),
      };

      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem("visit_schedules_local");
        const existing = raw ? JSON.parse(raw) : [];
        const items = Array.isArray(existing) ? existing : [];
        const sameDate = (isoA: string, isoB: string) => {
          const a = new Date(isoA);
          const b = new Date(isoB);
          return a.getFullYear() === b.getFullYear()
            && a.getMonth() === b.getMonth()
            && a.getDate() === b.getDate();
        };
        const duplicate = items.find((item: any) =>
          (item.building_name || "").toString().trim() === buildingName &&
          (item.unit_number || "").toString().trim() === unitNumber &&
          item.scheduled_at &&
          sameDate(item.scheduled_at, newEntry.scheduled_at)
        );
        if (duplicate) {
          const ok = window.confirm("Энэ айлд энэ өдрөөр товлол давхцаж байна. Үргэлжлүүлэх үү?");
          if (!ok) {
            setSubmitting(false);
            return;
          }
        }
        const next = [newEntry, ...items];
        window.localStorage.setItem("visit_schedules_local", JSON.stringify(next));
      }

      toast({
        title: "Амжилттай",
        description: "Цаг товлолт амжилттай хадгалагдлаа.",
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Error submitting visit schedule:", error);
      toast({
        title: "Алдаа",
        description: "Тодорхойгүй алдаа гарлаа.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-orange-50 to-pink-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
      <DashboardNavbar />
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-500" />
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Оператор хуваарь
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ярих үед товлосон айл, цагийн мэдээллийг эндээс бүртгэнэ.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-wider text-gray-400">Гараар оруулах</div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Барилга (гараар бичих)
                    </label>
                    <Input
                      value={buildingNameInput}
                      onChange={(e) => setBuildingNameInput(e.target.value)}
                      placeholder="Жишээ: 211 эсвэл Хүннү 2222"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Айлын тоот (гараар бичих)
                    </label>
                    <Input
                      value={unitNumberInput}
                      onChange={(e) => setUnitNumberInput(e.target.value)}
                      placeholder="Жишээ: 1402"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-wider text-gray-400">Сонголтоор оруулах</div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Барилга
                    </label>
                    <Select
                      value={selectedBuilding}
                      onValueChange={(value) => {
                        setSelectedBuilding(value);
                        setSelectedApartment("");
                      }}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-700">
                        <SelectValue placeholder={loading ? "Уншиж байна..." : "Барилга сонгох"} />
                      </SelectTrigger>
                      <SelectContent>
                        {buildings.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Айлын тоот
                    </label>
                    <Select value={selectedApartment} onValueChange={setSelectedApartment} disabled={!selectedBuilding}>
                      <SelectTrigger className="bg-white dark:bg-gray-700">
                        <SelectValue placeholder={selectedBuilding ? "Тоот сонгох" : "Эхлээд барилга сонгоно уу"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableApartments.map((apt) => (
                          <SelectItem key={apt.id} value={apt.id}>
                            {apt.unit_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Өдөр
                  </label>
                  <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Цаг
                  </label>
                  <Input type="time" value={visitTime} onChange={(e) => setVisitTime(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Тэмдэглэл (сонголт)
                </label>
                <Input
                  value={visitNote}
                  onChange={(e) => setVisitNote(e.target.value)}
                  placeholder="Жишээ: 18:00-19:00 хооронд, түлхүүртэй хүн"
                />
              </div>

              <div className="pt-2">
                <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                  {submitting ? "Төлөвлөж байна..." : "Баталгаажуулах"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
