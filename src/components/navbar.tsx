'use client';

import Link from "next/link";
import { Button } from "./ui/button";

export default function Navbar() {
  return (
    <nav className="w-full border-b border-gray-200 bg-white py-2">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/worker-select" prefetch className="text-xl font-bold text-blue-600">
          MaintenanceTracker
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/worker-select">
            <Button>Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}