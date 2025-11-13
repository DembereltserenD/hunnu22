"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    Users,
    Building,
    Home,
    Phone,
    Menu,
    Zap
} from "lucide-react";

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
    {
        label: "Ажилчид",
        href: "/admin-hunnu/workers",
        icon: Users,
    },
    {
        label: "Барилгууд",
        href: "/admin-hunnu/buildings",
        icon: Building,
    },
    {
        label: "Байрууд",
        href: "/admin-hunnu/apartments",
        icon: Home,
    },
    {
        label: "Утасны асуудал",
        href: "/admin-hunnu/phone-issues",
        icon: Phone,
    },
];

const uniqueNavItems = navItems.filter((item, index, self) =>
    index === self.findIndex(t => t.href === item.href)
);

interface AdminLayoutProps {
    children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const NavContent = () => {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700">
                {/* Logo and Brand */}
                <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                    <Link href="/admin-hunnu" className="flex items-center gap-3 group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 dark:bg-blue-500 group-hover:bg-blue-700 dark:group-hover:bg-blue-600 transition-colors">
                            <Zap className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Digital Power</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Админ самбар</p>
                        </div>
                    </Link>
                </div>
                <nav className="flex-1 p-4 space-y-2 sidebar-nav">
                    {uniqueNavItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                        return (
                            <Link
                                key={`nav-${item.label.toLowerCase().replace(' ', '-')}-${index}`}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-blue-600 dark:bg-blue-500 text-white shadow-sm"
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 shadow-sm">
                <NavContent />
            </div>

            {/* Mobile Sidebar */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden fixed top-4 left-4 z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64 bg-white dark:bg-slate-900">
                    <NavContent />
                </SheetContent>
            </Sheet>

            {/* Main Content - No Navbar */}
            <div className="flex-1 md:ml-64 bg-gray-50 dark:bg-slate-950">
                <main className="p-6 min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
}