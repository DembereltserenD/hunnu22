'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '../../supabase/client';
import { Database } from '@/types/supabase';
import { indexedDBService, PendingVisit, PendingSession, SyncHistoryEntry } from '@/lib/indexedDB';

type Tables = Database['public']['Tables'];
type Visit = Tables['visits']['Row'];
type ActiveSession = Tables['active_sessions']['Row'];
type Worker = Tables['workers']['Row'];
type Building = Tables['buildings']['Row'];
type Apartment = Tables['apartments']['Row'];

interface RealtimeContextType {
  visits: Visit[];
  activeSessions: ActiveSession[];
  workers: Worker[];
  buildings: Building[];
  apartments: Apartment[];
  currentWorker: Worker | null;
  setCurrentWorker: (worker: Worker | null) => void;
  startSession: (apartmentId: string) => Promise<void>;
  endSession: (apartmentId: string) => Promise<void>;
  logVisit: (visitData: Omit<Visit, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  isLoading: boolean;
  isOnline: boolean;
  pendingCount: { visits: number; sessions: number };
  syncPendingData: () => Promise<void>;
  syncHistory: SyncHistoryEntry[];
  syncStats: { totalSyncs: number; successfulSyncs: number; failedSyncs: number; conflicts: number };
  refreshSyncHistory: () => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [currentWorker, setCurrentWorker] = useState<Worker | null>(null);

  // Load current worker from localStorage on mount
  useEffect(() => {
    const savedWorker = localStorage.getItem('currentWorker');
    if (savedWorker) {
      try {
        const worker = JSON.parse(savedWorker);
        console.log('Loaded worker from localStorage:', worker);
        setCurrentWorker(worker);
      } catch (error) {
        console.error('Error parsing saved worker:', error);
        localStorage.removeItem('currentWorker');
      }
    }
  }, []);

  // Save current worker to localStorage when it changes
  useEffect(() => {
    if (currentWorker) {
      console.log('Saving worker to localStorage:', currentWorker);
      localStorage.setItem('currentWorker', JSON.stringify(currentWorker));
    } else {
      localStorage.removeItem('currentWorker');
    }
  }, [currentWorker]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState({ visits: 0, sessions: 0 });
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);
  const [syncStats, setSyncStats] = useState({ totalSyncs: 0, successfulSyncs: 0, failedSyncs: 0, conflicts: 0 });

  const supabase = createClient();

  // Initialize IndexedDB
  useEffect(() => {
    indexedDBService.init().catch(console.error);
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for service worker sync requests
  useEffect(() => {
    const handleSyncRequest = () => {
      if (isOnline) {
        syncPendingData();
      }
    };

    window.addEventListener('sw-sync-request', handleSyncRequest);
    return () => window.removeEventListener('sw-sync-request', handleSyncRequest);
  }, [isOnline]);

  // Update pending count
  const updatePendingCount = async () => {
    try {
      const count = await indexedDBService.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Error updating pending count:', error);
    }
  };

  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load initial data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log('RealtimeContext - Starting to load data...');

        const [workersRes, buildingsRes, apartmentsRes, visitsRes, sessionsRes] = await Promise.all([
          supabase.from('workers').select('*'),
          supabase.from('buildings').select('*'),
          supabase.from('apartments').select('*'),
          supabase.from('visits').select('*').order('visit_date', { ascending: false }),
          supabase.from('active_sessions').select('*').eq('status', 'active')
        ]);

        console.log('RealtimeContext - Data loaded:', {
          workers: workersRes.data?.length || 0,
          buildings: buildingsRes.data?.length || 0,
          apartments: apartmentsRes.data?.length || 0,
          visits: visitsRes.data?.length || 0,
          sessions: sessionsRes.data?.length || 0
        });

        console.log('RealtimeContext - Workers response:', workersRes);

        if (workersRes.data) setWorkers(workersRes.data);
        if (buildingsRes.data) setBuildings(buildingsRes.data);
        if (apartmentsRes.data) setApartments(apartmentsRes.data);
        if (visitsRes.data) setVisits(visitsRes.data);
        if (sessionsRes.data) setActiveSessions(sessionsRes.data);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
        console.log('RealtimeContext - Loading complete');
      }
    };

    loadData();
  }, []);

  // Load sync history
  const refreshSyncHistory = async () => {
    try {
      const [history, stats] = await Promise.all([
        indexedDBService.getSyncHistory(50),
        indexedDBService.getSyncStats()
      ]);
      setSyncHistory(history);
      setSyncStats(stats);
    } catch (error) {
      console.error('Error loading sync history:', error);
    }
  };

  useEffect(() => {
    refreshSyncHistory();
    const interval = setInterval(refreshSyncHistory, 10000);
    return () => clearInterval(interval);
  }, []);

  // Sync pending data to Supabase
  const syncPendingData = async () => {
    if (!isOnline) return;

    try {
      // Sync pending sessions
      const pendingSessions = await indexedDBService.getPendingSessions();
      for (const session of pendingSessions) {
        try {
          if (session.action === 'start') {
            await supabase
              .from('active_sessions')
              .upsert({
                worker_id: session.worker_id,
                apartment_id: session.apartment_id,
                status: 'active',
                last_activity: new Date().toISOString()
              });
          } else if (session.action === 'end') {
            await supabase
              .from('active_sessions')
              .update({ status: 'completed' })
              .eq('worker_id', session.worker_id)
              .eq('apartment_id', session.apartment_id);
          }
          await indexedDBService.markSessionAsSynced(session.id);

          // Log success
          await indexedDBService.addSyncHistoryEntry({
            type: 'session',
            action: 'sync_success',
            itemId: session.id,
            details: {
              apartment_id: session.apartment_id,
              worker_id: session.worker_id
            }
          });
        } catch (error) {
          console.error('Error syncing session:', error);

          // Log failure
          await indexedDBService.addSyncHistoryEntry({
            type: 'session',
            action: 'sync_failed',
            itemId: session.id,
            details: {
              apartment_id: session.apartment_id,
              worker_id: session.worker_id,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          });
        }
      }

      // Sync pending visits
      const pendingVisits = await indexedDBService.getPendingVisits();
      for (const visit of pendingVisits) {
        try {
          const { error } = await supabase.from('visits').insert({
            apartment_id: visit.apartment_id,
            worker_id: visit.worker_id,
            visit_date: visit.visit_date,
            status: visit.status,
            notes: visit.notes,
            tasks_completed: visit.tasks_completed
          });

          if (error) {
            throw error;
          }

          await indexedDBService.markVisitAsSynced(visit.id);

          // Log success
          await indexedDBService.addSyncHistoryEntry({
            type: 'visit',
            action: 'sync_success',
            itemId: visit.id,
            details: {
              apartment_id: visit.apartment_id,
              worker_id: visit.worker_id
            }
          });
        } catch (error) {
          console.error('Error syncing visit:', error);

          // Log failure
          await indexedDBService.addSyncHistoryEntry({
            type: 'visit',
            action: 'sync_failed',
            itemId: visit.id,
            details: {
              apartment_id: visit.apartment_id,
              worker_id: visit.worker_id,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          });
        }
      }

      // Clean up synced data
      await indexedDBService.deleteSyncedVisits();
      await indexedDBService.deleteSyncedSessions();

      await updatePendingCount();
      await refreshSyncHistory();
    } catch (error) {
      console.error('Error syncing pending data:', error);
    }
  };

  // Subscribe to realtime changes
  useEffect(() => {
    if (!isOnline) return;

    // Subscribe to visits changes
    const visitsChannel = supabase
      .channel('visits-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'visits' },
        async (payload) => {
          console.log('Visits change:', payload);
          const { data } = await supabase.from('visits').select('*').order('visit_date', { ascending: false });
          if (data) setVisits(data);
        }
      )
      .subscribe();

    // Subscribe to active sessions changes
    const sessionsChannel = supabase
      .channel('sessions-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'active_sessions' },
        async (payload) => {
          console.log('Sessions change:', payload);
          const { data } = await supabase.from('active_sessions').select('*').eq('status', 'active');
          if (data) setActiveSessions(data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(visitsChannel);
      supabase.removeChannel(sessionsChannel);
    };
  }, [isOnline]);

  // Start a session
  const startSession = async (apartmentId: string) => {
    if (!currentWorker) return;

    try {
      if (isOnline) {
        const { error } = await supabase
          .from('active_sessions')
          .upsert({
            worker_id: currentWorker.id,
            apartment_id: apartmentId,
            status: 'active',
            last_activity: new Date().toISOString()
          }, {
            onConflict: 'worker_id,apartment_id'
          });

        if (error) throw error;

        // Refresh active sessions
        const { data } = await supabase.from('active_sessions').select('*').eq('status', 'active');
        if (data) setActiveSessions(data);
      } else {
        await indexedDBService.addPendingSession({
          worker_id: currentWorker.id,
          apartment_id: apartmentId,
          action: 'start'
        });
        await updatePendingCount();
      }
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  };

  // End a session
  const endSession = async (apartmentId: string) => {
    if (!currentWorker) return;

    try {
      if (isOnline) {
        const { error } = await supabase
          .from('active_sessions')
          .update({ status: 'completed' })
          .eq('worker_id', currentWorker.id)
          .eq('apartment_id', apartmentId);

        if (error) throw error;

        // Refresh active sessions
        const { data } = await supabase.from('active_sessions').select('*').eq('status', 'active');
        if (data) setActiveSessions(data);
      } else {
        await indexedDBService.addPendingSession({
          worker_id: currentWorker.id,
          apartment_id: apartmentId,
          action: 'end'
        });
        await updatePendingCount();
      }
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  };

  // Log a visit
  const logVisit = async (visitData: Omit<Visit, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (isOnline) {
        const { error } = await supabase.from('visits').insert(visitData);

        if (error) throw error;

        // Refresh visits
        const { data } = await supabase.from('visits').select('*').order('visit_date', { ascending: false });
        if (data) setVisits(data);

        // Log success
        await indexedDBService.addSyncHistoryEntry({
          type: 'visit',
          action: 'sync_success',
          itemId: `direct_${Date.now()}`,
          details: {
            apartment_id: visitData.apartment_id || undefined,
            worker_id: visitData.worker_id || undefined
          }
        });
      } else {
        // Transform visitData to match PendingVisit interface
        const pendingVisitData: Omit<PendingVisit, 'id' | 'timestamp' | 'synced'> = {
          apartment_id: visitData.apartment_id || '',
          worker_id: visitData.worker_id || '',
          visit_date: visitData.visit_date,
          status: visitData.status,
          notes: visitData.notes,
          tasks_completed: Array.isArray(visitData.tasks_completed) ? visitData.tasks_completed.map(task => String(task)) : []
        };
        await indexedDBService.addPendingVisit(pendingVisitData);
        await updatePendingCount();
      }
    } catch (error) {
      console.error('Error logging visit:', error);

      // Log failure
      await indexedDBService.addSyncHistoryEntry({
        type: 'visit',
        action: 'sync_failed',
        itemId: `direct_${Date.now()}`,
        details: {
          apartment_id: visitData.apartment_id || undefined,
          worker_id: visitData.worker_id || undefined,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      throw error;
    }
  };

  const value: RealtimeContextType = {
    visits,
    activeSessions,
    workers,
    buildings,
    apartments,
    currentWorker,
    setCurrentWorker,
    startSession,
    endSession,
    logVisit,
    isLoading,
    isOnline,
    pendingCount,
    syncPendingData,
    syncHistory,
    syncStats,
    refreshSyncHistory
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}