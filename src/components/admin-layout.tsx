"use client";

import { useState, useEffect } from "react";
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
    Menu
} from "lucide-react";

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
    {
        label: "Workers",
        href: "/admin-hunnu/workers",
        icon: Users,
    },
    {
        label: "Buildings",
        href: "/admin-hunnu/buildings",
        icon: Building,
    },
    {
        label: "Apartments",
        href: "/admin-hunnu/apartments",
        icon: Home,
    },
    {
        label: "Phone Issues",
        href: "/admin-hunnu/phone-issues",
        icon: Phone,
    },
];

// Remove any potential duplicates (just in case)
const uniqueNavItems = navItems.filter((item, index, self) =>
    index === self.findIndex(t => t.href === item.href)
);

interface AdminLayoutProps {
    children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Force light mode for admin pages
    useEffect(() => {
        // Remove dark class from html and body
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');

        // Add light class
        document.documentElement.classList.add('light');
        document.body.classList.add('light');

        // Set color scheme
        document.documentElement.style.colorScheme = 'light';
        document.body.style.colorScheme = 'light';

        return () => {
            // Cleanup on unmount - restore original state if needed
            document.documentElement.style.colorScheme = '';
            document.body.style.colorScheme = '';
        };
    }, []);

    const NavContent = () => {
        return (
            <div className="flex flex-col h-full bg-white">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Admin Dashboard</h2>
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
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
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
        <div className="flex h-screen bg-gray-50 light" style={{ colorScheme: 'light' }}>
            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200 shadow-sm">
                <NavContent />
            </div>

            {/* Mobile Sidebar */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden fixed top-4 left-4 z-50 bg-white border border-gray-200 text-gray-900 hover:bg-gray-100"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64 bg-white">
                    <NavContent />
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <div className="flex-1 md:ml-64 bg-gray-50">
                <main className="p-6 min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
}