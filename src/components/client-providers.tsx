'use client';

import { ReactNode } from 'react';
import { RealtimeProvider } from '@/contexts/RealtimeContext';

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <RealtimeProvider>
      {children}
    </RealtimeProvider>
  );
}
