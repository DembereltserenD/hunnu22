const DB_NAME = 'MaintenanceTrackerDB';
const DB_VERSION = 2;
const VISITS_STORE = 'pendingVisits';
const SESSIONS_STORE = 'pendingSessions';
const SYNC_HISTORY_STORE = 'syncHistory';

export interface PendingVisit {
  id: string;
  apartment_id: string;
  worker_id: string;
  visit_date: string;
  status: string;
  notes: string | null;
  tasks_completed: string[];
  timestamp: number;
  synced: boolean;
}

export interface PendingSession {
  id: string;
  worker_id: string;
  apartment_id: string;
  action: 'start' | 'end';
  timestamp: number;
  synced: boolean;
}

export interface SyncHistoryEntry {
  id: string;
  timestamp: number;
  type: 'visit' | 'session';
  action: 'sync_success' | 'sync_failed' | 'conflict';
  itemId: string;
  details: {
    apartment_id?: string;
    worker_id?: string;
    error?: string;
    conflictReason?: string;
    retryCount?: number;
  };
}

class IndexedDBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(VISITS_STORE)) {
          const visitsStore = db.createObjectStore(VISITS_STORE, { keyPath: 'id' });
          visitsStore.createIndex('synced', 'synced', { unique: false });
          visitsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          const sessionsStore = db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
          sessionsStore.createIndex('synced', 'synced', { unique: false });
          sessionsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(SYNC_HISTORY_STORE)) {
          const syncHistoryStore = db.createObjectStore(SYNC_HISTORY_STORE, { keyPath: 'id' });
          syncHistoryStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncHistoryStore.createIndex('type', 'type', { unique: false });
          syncHistoryStore.createIndex('action', 'action', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  async addPendingVisit(visit: Omit<PendingVisit, 'id' | 'timestamp' | 'synced'>): Promise<string> {
    const db = await this.ensureDB();
    const id = `visit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const pendingVisit: PendingVisit = {
      ...visit,
      id,
      timestamp: Date.now(),
      synced: false
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([VISITS_STORE], 'readwrite');
      const store = transaction.objectStore(VISITS_STORE);
      const request = store.add(pendingVisit);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async addPendingSession(session: Omit<PendingSession, 'id' | 'timestamp' | 'synced'>): Promise<string> {
    const db = await this.ensureDB();
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const pendingSession: PendingSession = {
      ...session,
      id,
      timestamp: Date.now(),
      synced: false
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SESSIONS_STORE], 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.add(pendingSession);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingVisits(): Promise<PendingVisit[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([VISITS_STORE], 'readonly');
      const store = transaction.objectStore(VISITS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const allVisits = request.result;
        const pendingVisits = allVisits.filter(visit => !visit.synced);
        resolve(pendingVisits);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSessions(): Promise<PendingSession[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const allSessions = request.result;
        const pendingSessions = allSessions.filter(session => !session.synced);
        resolve(pendingSessions);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async markVisitAsSynced(id: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([VISITS_STORE], 'readwrite');
      const store = transaction.objectStore(VISITS_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        const visit = request.result;
        if (visit) {
          visit.synced = true;
          const updateRequest = store.put(visit);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async markSessionAsSynced(id: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SESSIONS_STORE], 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        const session = request.result;
        if (session) {
          session.synced = true;
          const updateRequest = store.put(session);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSyncedVisits(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([VISITS_STORE], 'readwrite');
      const store = transaction.objectStore(VISITS_STORE);
      const index = store.index('synced');
      const request = index.openCursor(IDBKeyRange.only(true));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSyncedSessions(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SESSIONS_STORE], 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const index = store.index('synced');
      const request = index.openCursor(IDBKeyRange.only(true));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async addSyncHistoryEntry(entry: Omit<SyncHistoryEntry, 'id' | 'timestamp'>): Promise<string> {
    const db = await this.ensureDB();
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const historyEntry: SyncHistoryEntry = {
      ...entry,
      id,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_HISTORY_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_HISTORY_STORE);
      const request = store.add(historyEntry);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncHistory(limit: number = 100): Promise<SyncHistoryEntry[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_HISTORY_STORE], 'readonly');
      const store = transaction.objectStore(SYNC_HISTORY_STORE);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');
      const results: SyncHistoryEntry[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncHistoryByType(type: 'visit' | 'session', limit: number = 50): Promise<SyncHistoryEntry[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_HISTORY_STORE], 'readonly');
      const store = transaction.objectStore(SYNC_HISTORY_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const allEntries = request.result;
        const filtered = allEntries
          .filter(entry => entry.type === type)
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit);
        resolve(filtered);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncStats(): Promise<{
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    conflicts: number;
  }> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_HISTORY_STORE], 'readonly');
      const store = transaction.objectStore(SYNC_HISTORY_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const allEntries = request.result;
        const stats = {
          totalSyncs: allEntries.length,
          successfulSyncs: allEntries.filter(e => e.action === 'sync_success').length,
          failedSyncs: allEntries.filter(e => e.action === 'sync_failed').length,
          conflicts: allEntries.filter(e => e.action === 'conflict').length
        };
        resolve(stats);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearOldSyncHistory(daysToKeep: number = 30): Promise<void> {
    const db = await this.ensureDB();
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_HISTORY_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_HISTORY_STORE);
      const index = store.index('timestamp');
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value.timestamp < cutoffTime) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingCount(): Promise<{ visits: number; sessions: number }> {
    const [visits, sessions] = await Promise.all([
      this.getPendingVisits(),
      this.getPendingSessions()
    ]);
    return {
      visits: visits.length,
      sessions: sessions.length
    };
  }
}

export const indexedDBService = new IndexedDBService();