'use client';

import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Menu, UserCircle, MessageSquarePlus, Activity } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function DashboardNavbar() {
  const [open, setOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);

  useEffect(() => {
    const worker = localStorage.getItem('selectedWorker');
    if (worker) {
      setSelectedWorker(JSON.parse(worker));
    }
  }, []);

  return (
    <nav className="w-full border-b bg-[rgba(245,244,247,1)] dark:bg-background/95 backdrop-blur supports-[backdrop-filter]:dark:bg-background/60 py-3 md:py-2 transition-colors sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image
            src="/573289657_1631257461636918_3556630650382290902_n.jpg"
            alt="Digital Power Logo"
            width={40}
            height={40}
            className="rounded-md"
          />
          <span className="text-lg md:text-xl font-bold text-primary">Digital Power</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-3 items-center">
          {selectedWorker && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{selectedWorker.name}</span>
            </div>
          )}
          <ThemeSwitcher />
          <Link href="/health-stats">
            <Button variant="outline" size="sm" className="gap-2">
              <Activity className="h-4 w-4" />
              Эрүүл мэнд
            </Button>
          </Link>
          <Link href="/worker-requests">
            <Button variant="outline" size="sm" className="gap-2">
              <MessageSquarePlus className="h-4 w-4" />
              Хүсэлт илгээх
            </Button>
          </Link>
          <Link href="/worker-dashboard">
            <Button variant="outline" size="sm">
              Ажлын самбар
            </Button>
          </Link>
          <Link href="/worker-select">
            <Button variant="outline" size="sm">
              Ажилчин солих
            </Button>
          </Link>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden gap-2 items-center">
          <ThemeSwitcher />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Цэс нээх</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle>Цэс</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-3 mt-8">
                {selectedWorker && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-md mb-2">
                    <UserCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{selectedWorker.name}</span>
                  </div>
                )}
                <Link href="/health-stats" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full justify-start text-base h-12 gap-2">
                    <Activity className="h-5 w-5" />
                    Эрүүл мэнд
                  </Button>
                </Link>
                <Link href="/worker-requests" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full justify-start text-base h-12 gap-2">
                    <MessageSquarePlus className="h-5 w-5" />
                    Хүсэлт илгээх
                  </Button>
                </Link>
                <Link href="/worker-dashboard" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full justify-start text-base h-12">
                    Ажлын самбар
                  </Button>
                </Link>
                <Link href="/worker-select" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full justify-start text-base h-12">
                    Ажилчин солих
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}