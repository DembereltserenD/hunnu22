'use client';


import SyncHistoryViewer from "@/components/sync-history-viewer";
import DashboardNavbar from "@/components/dashboard-navbar";

export default function SyncHistoryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      <SyncHistoryViewer />
    </div>
  );
}
