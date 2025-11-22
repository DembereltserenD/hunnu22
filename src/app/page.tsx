'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/sign-in');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-orange-50 to-pink-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-purple-600 dark:border-purple-400 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 font-medium">Чиглүүлж байна...</p>
      </div>
    </div>
  );
}