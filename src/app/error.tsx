'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-orange-50 to-pink-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 transition-colors duration-300 p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent font-['Clash_Display']">
            Алдаа гарлаа
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {error.message || 'Санамсаргүй алдаа гарлаа'}
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset} className="bg-gradient-to-r from-purple-500 to-orange-400 hover:brightness-110 text-white border-0">
            Дахин оролдох
          </Button>
          <Button onClick={() => window.location.href = '/dashboard'} variant="outline" className="border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20">
            Нүүр хуудас
          </Button>
        </div>
      </div>
    </div>
  );
}
