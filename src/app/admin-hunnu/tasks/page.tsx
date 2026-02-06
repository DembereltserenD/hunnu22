"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TaskStatus = "pending" | "allowed" | "denied";

type TaskRequest = {
  id: string;
  building: string;
  unit: string | null;
  loops: { loop: number | null; addresses: number[] }[];
  status: TaskStatus;
  assignedWorkerId?: string | null;
  assignedWorkerName?: string | null;
  assignedWorkerEmail?: string | null;
  requestedByName?: string | null;
  requestedByEmail?: string | null;
  createdAt: string;
};

const TASK_STORAGE_KEY = "task_requests_local";

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<TaskRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const loadTasks = () => {
      try {
        const raw = window.localStorage.getItem(TASK_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        setTasks(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error("Failed to load task requests:", error);
        setTasks([]);
      }
    };

    loadTasks();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === TASK_STORAGE_KEY) {
        loadTasks();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks((prev) => {
      const next = prev.map((task) =>
        task.id === id ? { ...task, status } : task
      );
      if (typeof window !== "undefined") {
        window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (statusFilter !== "all") {
      result = result.filter((task) => task.status === statusFilter);
    }

    if (fromDate) {
      const fromTs = new Date(`${fromDate}T00:00:00`).getTime();
      if (!Number.isNaN(fromTs)) {
        result = result.filter((task) => new Date(task.createdAt).getTime() >= fromTs);
      }
    }

    if (toDate) {
      const toTs = new Date(`${toDate}T23:59:59`).getTime();
      if (!Number.isNaN(toTs)) {
        result = result.filter((task) => new Date(task.createdAt).getTime() <= toTs);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((task) => {
        const building = task.building?.toLowerCase() || "";
        const unit = task.unit?.toLowerCase() || "";
        const loopText = task.loops
          .map((loop) => `loop ${loop.loop} ${loop.addresses.join(" ")}`)
          .join(" ")
          .toLowerCase();
        const requester = `${task.requestedByName || ""} ${task.requestedByEmail || ""}`.toLowerCase();
        const worker = `${task.assignedWorkerName || ""} ${task.assignedWorkerEmail || ""}`.toLowerCase();
        return (
          building.includes(q) ||
          unit.includes(q) ||
          loopText.includes(q) ||
          requester.includes(q) ||
          worker.includes(q)
        );
      });
    }

    return result;
  }, [tasks, statusFilter, fromDate, toDate, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tasks</h1>
        <p className="text-muted-foreground">
          Task хүсэлтүүдийг батлах эсвэл цуцлах
        </p>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Төлөв</label>
            <select
              className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | TaskStatus)}
            >
              <option value="all">Бүгд</option>
              <option value="pending">Pending</option>
              <option value="allowed">Allowed</option>
              <option value="denied">Denied</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Огноо (эхлэх)</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-white/80 dark:bg-gray-900/60"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Огноо (дуусах)</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-white/80 dark:bg-gray-900/60"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Хайлт</label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Байр, тоот, loop, address..."
              className="bg-white/80 dark:bg-gray-900/60"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Ирсэн task-ууд</CardTitle>
            <Badge variant="secondary">
              {filteredTasks.filter((t) => t.status === "pending").length} Pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Task хүсэлт алга байна.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                  <TableHead>Байр</TableHead>
                    <TableHead>Илгээсэн</TableHead>
                    <TableHead>{'\u0410\u0436\u0438\u043b\u0447\u0438\u043d'}</TableHead>
                    <TableHead>Тоот</TableHead>
                    <TableHead>Loop / Address</TableHead>
                    <TableHead>Огноо</TableHead>
                    <TableHead className="text-right">Үйлдэл</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        {task.building}
                      </TableCell>
                                            <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {task.requestedByName || task.requestedByEmail || "\u0422\u043e\u0434\u043e\u0440\u0445\u043e\u0439\u0433\u04af\u0439"}
                          </div>
                          {task.requestedByEmail && task.requestedByEmail !== task.requestedByName ? (
                            <div className="text-xs text-muted-foreground">
                              {task.requestedByEmail}
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {task.assignedWorkerName || task.assignedWorkerEmail || "\u0422\u043e\u0434\u043e\u0440\u0445\u043e\u0439\u0433\u04af\u0439"}
                          </div>
                          {task.assignedWorkerEmail && task.assignedWorkerEmail !== task.assignedWorkerName ? (
                            <div className="text-xs text-muted-foreground">
                              {task.assignedWorkerEmail}
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{task.unit || "—"}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {task.loops.map((loop, idx) => (
                            <div key={`${task.id}-loop-${idx}`} className="text-xs">
                              <span className="font-semibold">
                                Loop {loop.loop}:
                              </span>{" "}
                              {loop.addresses.join(", ")}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(task.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {task.status === "pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              className="h-8 bg-emerald-600 text-white hover:bg-emerald-700"
                              onClick={() => updateTaskStatus(task.id, "allowed")}
                            >
                              ALLOW
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8"
                              onClick={() => updateTaskStatus(task.id, "denied")}
                            >
                              DENY
                            </Button>
                          </div>
                        ) : (
                          <Badge
                            variant={task.status === "allowed" ? "default" : "destructive"}
                          >
                            {task.status === "allowed" ? "ALLOWED" : "DENIED"}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}





