import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardNavbar() {
  return (
    <nav className="w-full border-b border-gray-200 bg-white py-2">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="text-xl font-bold text-blue-600">
          MaintenanceTracker
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/worker-dashboard">
            <Button variant="outline" size="sm">
              Worker Dashboard
            </Button>
          </Link>
          <Link href="/worker-select">
            <Button variant="outline" size="sm">
              Switch Worker
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}