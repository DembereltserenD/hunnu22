'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserCircle, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from '../../../supabase/client';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function WorkerSelectionPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadWorkers() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('workers').select('*').order('name');
        setWorkers(data || []);
      } catch (error) {
        console.error('Error loading workers:', error);
      } finally {
        setLoading(false);
      }
    }

    loadWorkers();
  }, []);

  const handleWorkerSelect = async (worker: any) => {
    setSelectedId(worker.id);
    localStorage.setItem('selectedWorker', JSON.stringify(worker));
    
    // Add a small delay for visual feedback
    setTimeout(() => {
      router.push('/dashboard');
    }, 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 text-lg">Ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="w-full max-w-4xl mb-8 sm:mb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-600 blur-xl opacity-20 rounded-full"></div>
            <Image
              src="/573289657_1631257461636918_3556630650382290902_n.jpg"
              alt="Digital Power Logo"
              width={64}
              height={64}
              className="rounded-xl shadow-lg relative z-10 ring-2 ring-white dark:ring-slate-800"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Digital Power
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg lg:text-xl font-medium">
          Үргэлжлүүлэхийн тулд өөрийн профайлаа сонгоно уу
        </p>
        <div className="mt-2 h-1 w-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto"></div>
      </div>

      {/* Workers Grid */}
      <div className="w-full max-w-4xl">
        {workers.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur">
            <CardContent className="py-16 text-center">
              <UserCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Ажилчин олдсонгүй. Администратортай холбогдоно уу.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {workers.map((worker, index) => (
              <Card
                key={worker.id}
                className={`group relative overflow-hidden border-2 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-105 hover:-translate-y-1 bg-white dark:bg-slate-900 ${
                  selectedId === worker.id
                    ? 'border-blue-600 shadow-xl shadow-blue-600/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-400'
                }`}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.5s ease-out forwards',
                  opacity: 0
                }}
                onClick={() => handleWorkerSelect(worker)}
              >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Selection Indicator */}
                {selectedId === worker.id && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></div>
                  </div>
                )}

                <CardContent className="p-6 relative z-10">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-5 rounded-full ring-4 ring-white dark:ring-slate-900 group-hover:ring-blue-100 dark:group-hover:ring-blue-900/50 transition-all">
                        <UserCircle className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>

                    {/* Worker Name */}
                    <div className="space-y-2 w-full">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {worker.name}
                      </h3>
                      
                      {/* Action Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full group-hover:bg-blue-600 group-hover:text-white transition-all duration-300"
                        disabled={selectedId === worker.id}
                      >
                        {selectedId === worker.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Ачааллаж байна...
                          </>
                        ) : (
                          <>
                            Сонгох
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-500">
          Засвар үйлчилгээний хяналтын систем
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}