'use client';

import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import UserProfile from "@/components/user-profile";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Menu, UserCircle, MessageSquare, Activity } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "../../supabase/client";

export default function DashboardNavbar() {
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    async function loadUserName() {
      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (user && !error) {
          // Get full name from user metadata, fallback to email username
          const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
          setUserName(fullName);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    }

    loadUserName();
  }, []);

  return (
    <nav className="w-full border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md py-3 md:py-2 transition-colors sticky top-0 z-50 border-gray-200/50 dark:border-gray-700/50 shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image
            src="/573289657_1631257461636918_3556630650382290902_n.jpg"
            alt="Digital Power Logo"
            width={40}
            height={40}
            className="rounded-lg shadow-sm"
          />
          <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent font-['Clash_Display']">Digital Power</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-3 items-center">
          {userName && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-orange-50 dark:from-purple-900/20 dark:to-orange-900/20 rounded-md border border-purple-200 dark:border-purple-700">
              <UserCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{userName}</span>
            </div>
          )}
          <ThemeSwitcher />
          <Link href="/health-stats">
            <Button variant="outline" size="sm" className="gap-2 border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20">
              <Activity className="h-4 w-4" />
              {"\u042d\u0440\u04af\u04af\u043b \u043c\u044d\u043d\u0434"}
            </Button>
          </Link>
          <Link href="/task">
            <Button variant="outline" size="sm" className="gap-2 border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20">
              <MessageSquare className="h-4 w-4" />
              Task
            </Button>
          </Link>
          <Link href="/worker-requests">
            <Button variant="outline" size="sm" className="gap-2 border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20">
              <MessageSquare className="h-4 w-4" />
              {"\u0425\u04af\u0441\u044d\u043b\u0442 \u0438\u043b\u0433\u044d\u044d\u0445"}
            </Button>
          </Link>
          <Link href="/operator">
            <Button variant="outline" size="sm" className="border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20">
              {"\u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440"}
            </Button>
          </Link>
          <UserProfile />
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden gap-2 items-center">
          <ThemeSwitcher />
          <UserProfile />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Ð¦ÑÑ Ð½ÑÑÑ…</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle>Ð¦ÑÑ</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-3 mt-8">
                {userName && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-orange-50 dark:from-purple-900/20 dark:to-orange-900/20 rounded-md mb-2 border border-purple-200 dark:border-purple-700">
                    <UserCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{userName}</span>
                  </div>
                )}
                <Link href="/health-stats" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full justify-start text-base h-12 gap-2 border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                    <Activity className="h-5 w-5" />
                    {"\u042d\u0440\u04af\u04af\u043b \u043c\u044d\u043d\u0434"}
                  </Button>
                </Link>
                <Link href="/task" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full justify-start text-base h-12 gap-2 border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                    <MessageSquare className="h-5 w-5" />
                    Task
                  </Button>
                </Link>
                <Link href="/worker-requests" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full justify-start text-base h-12 gap-2 border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                    <MessageSquare className="h-5 w-5" />
                    {"\u0425\u04af\u0441\u044d\u043b\u0442 \u0438\u043b\u0433\u044d\u044d\u0445"}
                  </Button>
                </Link>
                <Link href="/operator" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full justify-start text-base h-12 border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                    {"\u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440"}
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
