import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-orange-50 to-pink-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 transition-colors duration-300 p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full">
            <AlertCircle className="h-16 w-16 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent font-['Clash_Display']">
            Хуудас олдсонгүй
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Таны хайж буй хуудас олдсонгүй эсвэл зөөгдсөн байна.
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Button asChild className="bg-gradient-to-r from-purple-500 to-orange-400 hover:brightness-110 text-white border-0">
            <Link href="/dashboard">Нүүр хуудас</Link>
          </Button>
          <Button asChild variant="outline" className="border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20">
            <Link href="/dashboard">Самбар</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
