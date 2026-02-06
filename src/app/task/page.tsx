'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import DashboardNavbar from '@/components/dashboard-navbar';
import { ClipboardList } from 'lucide-react';
import { createClient } from '../../../supabase/client';

type LoopGroup = {
  id: string;
  loop: number | null;
  addresses: number[];
  addressInput: string;
  error?: string;
};

const LOOP_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const TASK_STORAGE_KEY = 'task_requests_local';

type TaskRequest = {
  id: string;
  building: string;
  unit: string | null;
  loops: { loop: number | null; addresses: number[] }[];
  assignedWorkerId?: string | null;
  assignedWorkerName?: string | null;
  assignedWorkerEmail?: string | null;
  requestedByName?: string | null;
  requestedByEmail?: string | null;
  status: 'pending' | 'allowed' | 'denied';
  createdAt: string;
};

export default function TaskPage() {
  const nextId = useRef(2);
  const [building, setBuilding] = useState('');
  const [unit, setUnit] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [workers, setWorkers] = useState<{ id: string; name: string; email?: string | null }[]>([]);
  const [workersLoading, setWorkersLoading] = useState(true);
  const [workersError, setWorkersError] = useState<string | null>(null);
  const [requestedByName, setRequestedByName] = useState<string | null>(null);
  const [requestedByEmail, setRequestedByEmail] = useState<string | null>(null);
  const [groups, setGroups] = useState<LoopGroup[]>([
    { id: 'loop-1', loop: null, addresses: [], addressInput: '' },
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const usedLoops = useMemo(() => {
    return new Set(groups.map(g => g.loop).filter((v): v is number => v !== null));
  }, [groups]);

  const addGroup = () => {
    const id = `loop-${nextId.current++}`;
    setGroups(prev => [...prev, { id, loop: null, addresses: [], addressInput: '' }]);
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return;
        const name = user.user_metadata?.full_name || user.user_metadata?.name || null;
        setRequestedByName(name);
        setRequestedByEmail(user.email || null);
      } catch (error) {
        console.error('Failed to load user for task request:', error);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    let active = true;
    const loadWorkers = async () => {
      try {
        setWorkersLoading(true);
        setWorkersError(null);
        const supabase = createClient();
        const { data, error } = await supabase
          .from('workers')
          .select('id, name, email')
          .order('name', { ascending: true });

        if (!active) return;
        if (error) {
          setWorkersError('Ажилчдын жагсаалт ачааллахад алдаа гарлаа.');
          setWorkers([]);
          return;
        }
        setWorkers(Array.isArray(data) ? data : []);
      } catch (error) {
        if (active) {
          setWorkersError('Ажилчдын жагсаалт ачааллахад алдаа гарлаа.');
          setWorkers([]);
        }
      } finally {
        if (active) {
          setWorkersLoading(false);
        }
      }
    };

    loadWorkers();
    return () => {
      active = false;
    };
  }, []);

  const removeGroup = (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
  };

  const updateGroup = (id: string, updater: (group: LoopGroup) => LoopGroup) => {
    setGroups(prev => prev.map(g => (g.id === id ? updater(g) : g)));
  };

  const handleAddAddress = (id: string) => {
    setGroups((prev) => {
      const targetIndex = prev.findIndex(g => g.id === id);
      if (targetIndex === -1) return prev;

      const group = prev[targetIndex];
      let error: string | undefined;

      if (!group.loop) {
        error = '\u042d\u0445\u043b\u044d\u044d\u0434 Loop \u0441\u043e\u043d\u0433\u043e\u043d\u043e \u0443\u0443.';
      } else {
        const raw = group.addressInput.trim();
        const value = Number(raw);
        if (!raw || Number.isNaN(value) || !Number.isInteger(value)) {
          error = '\u0425\u0430\u044f\u0433 \u0437\u04e9\u0432\u0445\u04e9\u043d \u0431\u04af\u0445\u044d\u043b \u0442\u043e\u043e \u0431\u0430\u0439\u0445 \u0451\u0441\u0442\u043e\u0439.';
        } else if (value < 1 || value > 250) {
          error = '\u0425\u0430\u044f\u0433 1\u2013250 \u0445\u043e\u043e\u0440\u043e\u043d\u0434 \u0431\u0430\u0439\u043d\u0430.';
        } else if (group.addresses.includes(value)) {
          error = '\u042d\u043d\u044d Loop \u0434\u043e\u0442\u0440\u043e\u043e \u0434\u0430\u0432\u0442\u0430\u0433\u0434\u0441\u0430\u043d \u0445\u0430\u044f\u0433 \u0431\u0430\u0439\u0436 \u0431\u043e\u043b\u043e\u0445\u0433\u04af\u0439.';
        } else {
          const duplicateInSameLoop = prev.some(g =>
            g.id !== group.id && g.loop === group.loop && g.addresses.includes(value)
          );
          if (duplicateInSameLoop) {
            error = '\u042d\u043d\u044d Loop \u0434\u043e\u0442\u0440\u043e\u043e \u0434\u0430\u0432\u0442\u0430\u0433\u0434\u0441\u0430\u043d \u0445\u0430\u044f\u0433 \u0431\u0430\u0439\u0436 \u0431\u043e\u043b\u043e\u0445\u0433\u04af\u0439.';
          } else {
            const nextGroup = {
              ...group,
              addresses: [...group.addresses, value],
              addressInput: '',
              error: undefined,
            };
            return prev.map(g => (g.id === group.id ? nextGroup : g));
          }
        }
      }

      return prev.map(g => (g.id === group.id ? { ...g, error } : g));
    });
  };

  const resolveRequester = async () => {
    if (requestedByName || requestedByEmail) {
      return { name: requestedByName, email: requestedByEmail };
    }

    try {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return { name: null, email: null };
      const name = user.user_metadata?.full_name || user.user_metadata?.name || null;
      const email = user.email || null;
      if (name && !requestedByName) setRequestedByName(name);
      if (email && !requestedByEmail) setRequestedByEmail(email);
      return { name, email };
    } catch (error) {
      return { name: null, email: null };
    }
  };

  const handleSubmit = async () => {
    setFormError(null);
    setFormSuccess(null);

    const errors: string[] = [];
    if (!building.trim()) {
      errors.push('\u0411\u0430\u0439\u0440 \u0437\u0430\u0430\u0432\u0430\u043b \u043d\u04e9\u0445\u043d\u04e9.');
    }

    groups.forEach((group, idx) => {
      if (!group.loop) {
        errors.push(`Loop #${idx + 1} \u0437\u0430\u0430\u0432\u0430\u043b \u0441\u043e\u043d\u0433\u043e\u0433\u0434\u043e\u043d\u043e.`);
      }
      if (group.addresses.length === 0) {
        errors.push(`Loop #${idx + 1} \u0434\u044d\u044d\u0440 \u0445\u0430\u044f\u0433 \u043d\u044d\u043c\u043d\u044d \u04af\u04af.`);
      }
      if (group.error) {
        errors.push(`Loop #${idx + 1}: ${group.error}`);
      }
    });

    if (errors.length > 0) {
      setFormError(errors[0]);
      return;
    }

    const requester = await resolveRequester();
    const payload: TaskRequest = {
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      building: building.trim(),
      unit: unit.trim() || null,
      loops: groups.map(g => ({
        loop: g.loop,
        addresses: g.addresses,
      })),
      assignedWorkerId: selectedWorkerId || null,
      assignedWorkerName: workers.find(worker => worker.id === selectedWorkerId)?.name || null,
      assignedWorkerEmail: workers.find(worker => worker.id === selectedWorkerId)?.email || null,
      requestedByName: requester.name || undefined,
      requestedByEmail: requester.email || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(TASK_STORAGE_KEY);
        const existing = raw ? JSON.parse(raw) : [];
        const next = Array.isArray(existing) ? [payload, ...existing] : [payload];
        window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(next));
      }
      setFormSuccess('\u0422\u0430\u0441\u043a \u0430\u043c\u0436\u0438\u043b\u0442\u0442\u0430\u0439 \u04af\u04af\u0441\u043b\u044d\u044d.');
    } catch (error) {
      console.error('Failed to store task request:', error);
      setFormError('\u0422\u0430\u0441\u043a \u04af\u04af\u0441\u0433\u044d\u0445\u044d\u0434 \u0430\u043b\u0434\u0430\u0430 \u0433\u0430\u0440\u043b\u0430\u0430.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-orange-50 to-pink-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
      <DashboardNavbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-orange-500 rounded-lg shadow-lg">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-normal bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent font-['Clash_Display']">
              Task
            </h1>
          </div>
          <p className="text-gray-700 dark:text-gray-300 ml-14 font-medium">
            {'\u0422\u0430\u0441\u043a \u04af\u04af\u0441\u0433\u044d\u0445'}
          </p>
        </div>

        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
          <div className="h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {'\u0422\u0430\u0441\u043a \u04af\u04af\u0441\u0433\u044d\u0445'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="building">{'\u0411\u0430\u0439\u0440'} *</Label>
                <Input
                  id="building"
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder={'\u0411\u0430\u0439\u0440\u044b\u043d \u043d\u044d\u0440'}
                  className="bg-white/80 dark:bg-gray-900/60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">{'\u0422\u043e\u043e\u0442 (\u0437\u0430\u0430\u0432\u0430\u043b \u0431\u0438\u0448)'}</Label>
                <Input
                  id="unit"
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder={'\u0422\u043e\u043e\u0442'}
                  className="bg-white/80 dark:bg-gray-900/60"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="worker">{'\u0410\u0436\u0438\u043b\u0447\u0438\u043d'}</Label>
                <select
                  id="worker"
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-200 bg-white/80 px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  disabled={workersLoading}
                >
                  <option value="">
                    {workersLoading ? '\u0410\u0447\u0430\u0430\u043b\u043b\u0430\u0436 \u0431\u0430\u0439\u043d\u0430...' : '\u0421\u043e\u043d\u0433\u043e\u0445'}
                  </option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name}
                    </option>
                  ))}
                </select>
                {workersError && (
                  <div className="text-xs text-red-600">{workersError}</div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {'\u0422\u04e9\u0445\u04e9\u04e9\u0440\u04e9\u043c\u0436\u04af\u04af\u0434'}
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addGroup}
                  className="border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-200 dark:hover:bg-purple-900/20"
                >
                  {'Add loop'}
                </Button>
              </div>

              <div className="space-y-4">
                {groups.map((group, idx) => (
                  <Card
                    key={group.id}
                    className="border border-gray-200/70 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/60 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {`Loop #${idx + 1}`}
                        </div>
                        {groups.length > 1 && (
                          <Button type="button" variant="ghost" onClick={() => removeGroup(group.id)}>
                            {'\u0423\u0441\u0442\u0433\u0430\u0445'}
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>{'Loop (1-8)'} *</Label>
                          <select
                            className="w-full h-10 rounded-md border border-slate-200 bg-white/80 px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                            value={group.loop ?? ''}
                            onChange={(e) => {
                              const next = e.target.value ? Number(e.target.value) : null;
                              updateGroup(group.id, (g) => ({
                                ...g,
                                loop: next,
                                error: undefined,
                              }));
                            }}
                          >
                            <option value="">{'\u0421\u043e\u043d\u0433\u043e\u0445'}</option>
                            {LOOP_OPTIONS.map((opt) => {
                              const usedByOther = usedLoops.has(opt) && group.loop !== opt;
                              return (
                                <option key={opt} value={opt} disabled={usedByOther}>
                                  {opt}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>{'Address (1-250)'} *</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min={1}
                              max={250}
                              value={group.addressInput}
                              onChange={(e) => updateGroup(group.id, g => ({ ...g, addressInput: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddAddress(group.id);
                                }
                              }}
                              placeholder="52"
                              className="bg-white/80 dark:bg-gray-900/60"
                            />
                            <Button type="button" onClick={() => handleAddAddress(group.id)}>
                              {'Add'}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {group.error && (
                        <div className="text-sm text-red-600">{group.error}</div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {group.addresses.length === 0 ? (
                          <span className="text-xs text-slate-500">{'\u0425\u0430\u044f\u0433 \u043d\u044d\u043c\u044d\u044d\u0440\u044d\u0439'}</span>
                        ) : (
                          group.addresses.map((addr) => (
                            <Badge key={addr} variant="secondary" className="gap-2 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                              {addr}
                              <button
                                type="button"
                                className="text-xs text-slate-500 hover:text-slate-900"
                                onClick={() =>
                                  updateGroup(group.id, g => ({
                                    ...g,
                                    addresses: g.addresses.filter(a => a !== addr),
                                  }))
                                }
                              >
                                {'\u00d7'}
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {formError && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                {formSuccess}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="button" onClick={() => void handleSubmit()} className="bg-gray-900 text-white hover:bg-gray-800">
                {'\u0422\u0430\u0441\u043a \u04af\u04af\u0441\u0433\u044d\u0445'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
