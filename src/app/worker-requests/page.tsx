'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquarePlus, Send, ArrowLeft, CheckCircle2, Clock, Package } from "lucide-react";
import Link from "next/link";
import { createClient } from '../../../supabase/client';
import { useToast } from "@/components/ui/use-toast";
import DashboardNavbar from "@/components/dashboard-navbar";

interface WorkerRequest {
  id: string;
  worker_id: string;
  worker_name: string;
  request_type: 'equipment' | 'supplies' | 'other';
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
}

export default function WorkerRequestsPage() {
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [requestType, setRequestType] = useState<'equipment' | 'supplies' | 'other'>('equipment');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<WorkerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const worker = localStorage.getItem('selectedWorker');
    if (worker) {
      setSelectedWorker(JSON.parse(worker));
    }
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const supabase = createClient();
      const worker = localStorage.getItem('selectedWorker');
      
      if (!worker) {
        setLoading(false);
        return;
      }

      const workerData = JSON.parse(worker);
      
      const { data, error } = await supabase
        .from('worker_requests')
        .select('*')
        .eq('worker_id', workerData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading requests:', error);
      } else {
        setRequests(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWorker) {
      toast({
        title: 'Алдаа',
        description: 'Ажилчин сонгогдоогүй байна',
        variant: 'destructive'
      });
      return;
    }

    if (!title.trim() || !description.trim()) {
      toast({
        title: 'Алдаа',
        description: 'Гарчиг болон тайлбар оруулна уу',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('worker_requests')
        .insert({
          worker_id: selectedWorker.id,
          worker_name: selectedWorker.name,
          request_type: requestType,
          title: title.trim(),
          description: description.trim(),
          status: 'pending'
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Амжилттай',
        description: 'Таны хүсэлт амжилттай илгээгдлээ',
      });

      // Reset form
      setTitle('');
      setDescription('');
      setRequestType('equipment');

      // Reload requests
      loadRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: 'Алдаа',
        description: 'Хүсэлт илгээхэд алдаа гарлаа',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Хүлээгдэж байна</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle2 className="h-3 w-3 mr-1" />Зөвшөөрөгдсөн</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Биелсэн</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Татгалзсан</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'equipment':
        return 'Тоног төхөөрөмж';
      case 'supplies':
        return 'Хэрэгсэл материал';
      case 'other':
        return 'Бусад';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <DashboardNavbar />
      
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl">
        <div className="mb-6">
          <Button variant="outline" size="sm" asChild className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Буцах
            </Link>
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Хүсэлт илгээх
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Захиралд хэрэгцээтэй зүйлсээ хүсэлт болгон илгээнэ үү
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Form */}
          <Card className="bg-white dark:bg-slate-900 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquarePlus className="h-5 w-5 text-blue-600" />
                Шинэ хүсэлт үүсгэх
              </CardTitle>
              <CardDescription>
                Та хэрэгцээтэй зүйлээ дэлгэрэнгүй бичнэ үү
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="request-type">Хүсэлтийн төрөл</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button
                      type="button"
                      variant={requestType === 'equipment' ? 'default' : 'outline'}
                      onClick={() => setRequestType('equipment')}
                      className="w-full"
                    >
                      Тоног төхөөрөмж
                    </Button>
                    <Button
                      type="button"
                      variant={requestType === 'supplies' ? 'default' : 'outline'}
                      onClick={() => setRequestType('supplies')}
                      className="w-full"
                    >
                      Хэрэгсэл
                    </Button>
                    <Button
                      type="button"
                      variant={requestType === 'other' ? 'default' : 'outline'}
                      onClick={() => setRequestType('other')}
                      className="w-full"
                    >
                      Бусад
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Гарчиг</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Жишээ: Шинэ өрөм хэрэгтэй"
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Дэлгэрэнгүй тайлбар</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Юу хэрэгтэй байгаа, яагаад хэрэгтэй байгааг дэлгэрэнгүй бичнэ үү..."
                    rows={6}
                    className="mt-2"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || !selectedWorker}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Илгээж байна...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Хүсэлт илгээх
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Previous Requests */}
          <Card className="bg-white dark:bg-slate-900 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Миний хүсэлтүүд
              </CardTitle>
              <CardDescription>
                Таны илгээсэн хүсэлтүүдийн түүх
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Ачааллаж байна...</p>
                </div>
              ) : requests.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {request.title}
                        </h3>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {request.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded">
                          {getRequestTypeLabel(request.request_type)}
                        </span>
                        <span>
                          {new Date(request.created_at).toLocaleDateString('mn-MN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    Хүсэлт байхгүй
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Та анхны хүсэлтээ илгээнэ үү
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
