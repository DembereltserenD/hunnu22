'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { SyncHistoryEntry } from "@/lib/indexedDB";

export default function SyncHistoryViewer() {
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);
  const [syncStats, setSyncStats] = useState({ totalSyncs: 0, successfulSyncs: 0, failedSyncs: 0, conflicts: 0 });

  const refreshSyncHistory = () => {
    // Placeholder - in a real app you'd load from IndexedDB
    console.log('Refresh sync history');
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'sync_success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'sync_failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'conflict':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'sync_success':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Success</Badge>;
      case 'sync_failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      case 'conflict':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Conflict</Badge>;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Sync History</h1>
          <Button variant="outline" size="sm" onClick={refreshSyncHistory}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{syncStats.totalSyncs}</div>
                <div className="text-sm text-gray-600 mt-1">Total Syncs</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{syncStats.successfulSyncs}</div>
                <div className="text-sm text-gray-600 mt-1">Successful</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{syncStats.failedSyncs}</div>
                <div className="text-sm text-gray-600 mt-1">Failed</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{syncStats.conflicts}</div>
                <div className="text-sm text-gray-600 mt-1">Conflicts</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Sync Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              {syncHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No sync history yet</p>
                  <p className="text-sm mt-2">Sync operations will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {syncHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">{getActionIcon(entry.action)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getActionBadge(entry.action)}
                              <Badge variant="outline" className="text-xs">
                                {entry.type}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>Item ID: <span className="font-mono text-xs">{entry.itemId}</span></div>
                              {entry.details.apartment_id && (
                                <div>Apartment: {entry.details.apartment_id}</div>
                              )}
                              {entry.details.worker_id && (
                                <div>Worker: {entry.details.worker_id}</div>
                              )}
                              {entry.details.error && (
                                <div className="text-red-600 mt-2 p-2 bg-red-50 rounded text-xs">
                                  Error: {entry.details.error}
                                </div>
                              )}
                              {entry.details.conflictReason && (
                                <div className="text-orange-600 mt-2 p-2 bg-orange-50 rounded text-xs">
                                  Conflict: {entry.details.conflictReason}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap ml-4">
                          {formatTimestamp(entry.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
