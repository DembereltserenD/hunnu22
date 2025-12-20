'use client';

import { ReactNode } from 'react';

interface BuildingLayoutProps {
    children: ReactNode;
}

export default function BuildingLayout({ children }: BuildingLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            {children}
        </div>
    );
}