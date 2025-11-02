'use client';

// Force dynamic rendering for all admin pages
export const dynamic = 'force-dynamic';

import { AdminLayout } from "@/components/admin-layout";
import { useEffect } from "react";
import "./admin.css";

export default function AdminHunnuLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Debug and isolate admin pages from offline functionality
    useEffect(() => {
        console.log('Admin Layout: Initializing admin pages');
        console.log('Admin Layout: Navigator online status:', navigator.onLine);

        // Override offline detection for admin pages
        const handleOnline = () => {
            console.log('Admin: Online event detected');
        };
        const handleOffline = (event: Event) => {
            console.log('Admin: Offline event detected but ignored for admin pages');
            // Prevent offline behavior in admin pages
            event.preventDefault();
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check if service worker is interfering
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                console.log('Admin: Service worker registrations found:', registrations.length);
            });
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <div className="admin-pages">
            <AdminLayout>{children}</AdminLayout>
        </div>
    );
}