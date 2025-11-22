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
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(120deg, #d6a4ff 0%, #ffecd2 55%, #ffb07c 100%)' }}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg font-medium">Ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8" style={{ background: 'linear-gradient(120deg, #d6a4ff 0%, #ffecd2 55%, #ffb07c 100%)' }}>
      {/* Header Section */}
      <div className="w-full max-w-4xl mb-8 sm:mb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-white/30 blur-xl rounded-full"></div>
            <Image
              src="/573289657_1631257461636918_3556630650382290902_n.jpg"
              alt="Digital Power Logo"
              width={80}
              height={80}
              className="rounded-2xl shadow-2xl relative z-10 ring-4 ring-white/50"
            />
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal mb-4 text-gray-900 font-['Clash_Display']">
          Digital Power
        </h1>
        <p className="text-gray-800 text-lg sm:text-xl font-medium max-w-2xl mx-auto">
          Hunnu 2222 - Утаа мэдрэгчийн засвар үйлчилгээний систем
        </p>
        <div className="mt-6 inline-block px-4 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-gray-800 text-sm font-semibold uppercase tracking-wider">
          Ажилтан сонгох
        </div>
      </div>

      {/* Workers Grid */}
      <div className="w-full max-w-4xl">
        {workers.length === 0 ? (
          <Card className="border-0 bg-white/40 backdrop-blur-md shadow-xl">
            <CardContent className="py-16 text-center">
              <UserCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-800 text-lg font-medium">
                Ажилчин олдсонгүй. Администратортай холбогдоно уу.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {workers.map((worker, index) => (
              <Card
                key={worker.id}
                className={`group relative overflow-hidden border-0 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-105 hover:-translate-y-1 bg-white/60 backdrop-blur-md ${
                  selectedId === worker.id
                    ? 'ring-4 ring-purple-400 shadow-xl'
                    : 'hover:bg-white/80'
                }`}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.5s ease-out forwards',
                  opacity: 0
                }}
                onClick={() => handleWorkerSelect(worker)}
              >
                {/* Selection Indicator */}
                {selectedId === worker.id && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="h-3 w-3 bg-purple-500 rounded-full animate-pulse"></div>
                  </div>
                )}

                <CardContent className="p-6 relative z-10">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="relative bg-gradient-to-br from-purple-100 to-orange-100 p-4 rounded-full ring-4 ring-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <UserCircle className="h-12 w-12 text-purple-600" />
                      </div>
                    </div>

                    {/* Worker Name */}
                    <div className="space-y-2 w-full">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                        {worker.name}
                      </h3>
                      
                      {/* Action Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full bg-white/50 hover:bg-purple-500 hover:text-white transition-all duration-300 font-semibold"
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
        <p className="text-sm text-gray-700 font-medium">
          © 2024 Digital Power LLC. Бүх эрх хуулиар хамгаалагдсан.
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