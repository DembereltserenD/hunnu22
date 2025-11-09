'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, AlertTriangle, CheckCircle2, Activity, TrendingUp, TrendingDown } from "lucide-react";
import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from '../../../supabase/client';

interface BuildingHealth {
  id: string;
  name: string;
  totalApartments: number;
  issueCount: number;
  healthScore: number;
  status: 'healthy' | 'warning' | 'danger';
}

export default function HealthStatsPage() {
  const [buildings, setBuildings] = useState<BuildingHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalIssues, setTotalIssues] = useState(0);

  useEffect(() => {
    loadHealthData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadHealthData = async () => {
    try {
      const supabase = createClient();

      const [buildingsRes, apartmentsRes, phoneIssuesRes] = await Promise.all([
        supabase.from('buildings').select('*'),
        supabase.from('apartments').select('*'),
        supabase.from('phone_issues').select('*')
      ]);

      const buildingsData = buildingsRes.data || [];
      const apartmentsData = apartmentsRes.data || [];
      const issuesData = phoneIssuesRes.data || [];

      // Calculate health for each building
      const healthData: BuildingHealth[] = buildingsData.map(building => {
        const buildingApartments = apartmentsData.filter(apt => apt.building_id === building.id);
        const buildingIssues = issuesData.filter(issue => {
          const apartment = apartmentsData.find(apt => apt.id === issue.apartment_id);
          return apartment && apartment.building_id === building.id && 
                 (issue.status === 'open' || issue.status === 'цэвэрлэх хэрэгтэй' || issue.status === 'тусламж хэрэгтэй');
        });

        const issueCount = buildingIssues.length;
        let status: 'healthy' | 'warning' | 'danger' = 'healthy';
        
        if (issueCount >= 100) {
          status = 'danger';
        } else if (issueCount >= 50) {
          status = 'warning';
        }

        return {
          id: building.id,
          name: building.name,
          totalApartments: buildingApartments.length,
          issueCount,
          healthScore: Math.max(0, 100 - (issueCount / buildingApartments.length) * 100),
          status
        };
      });

      setBuildings(healthData);
      setTotalIssues(issuesData.filter(i => i.status === 'open' || i.status === 'цэвэрлэх хэрэгтэй' || i.status === 'тусламж хэрэгтэй').length);
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'danger':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-8 w-8" />;
      case 'warning':
        return <AlertTriangle className="h-8 w-8" />;
      case 'danger':
        return <AlertTriangle className="h-8 w-8" />;
      default:
        return <Activity className="h-8 w-8" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Эрүүл мэнд сайн';
      case 'warning':
        return 'Анхааруулга';
      case 'danger':
        return 'Аюултай';
      default:
        return 'Тодорхойгүй';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <DashboardNavbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Ачааллаж байна...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <DashboardNavbar />
      
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Эрүүл мэндийн статистик
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Хүннү 22 барилгын эрүүл мэндийн байдлын хяналт
          </p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white dark:bg-slate-900 border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Нийт барилга</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{buildings.length}</p>
                </div>
                <Building2 className="h-10 w-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Нийт асуудал</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalIssues}</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Эрүүл барилга</p>
                  <p className="text-3xl font-bold text-green-600">
                    {buildings.filter(b => b.status === 'healthy').length}
                  </p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Аюултай барилга</p>
                  <p className="text-3xl font-bold text-red-600">
                    {buildings.filter(b => b.status === 'danger').length}
                  </p>
                </div>
                <AlertTriangle className="h-10 w-10 text-red-600 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Buildings Health Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buildings.map((building) => (
            <Card
              key={building.id}
              className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl ${getStatusColor(building.status)} ${
                building.status === 'danger' ? 'animate-pulse-slow' : ''
              } ${building.status === 'warning' ? 'animate-pulse-slower' : ''}`}
            >
              {/* Status Indicator Bar */}
              <div className={`absolute top-0 left-0 right-0 h-2 ${
                building.status === 'healthy' ? 'bg-green-500' :
                building.status === 'warning' ? 'bg-yellow-500 animate-pulse' :
                'bg-red-500 animate-pulse'
              }`}></div>

              <CardHeader className="pb-3 pt-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Building2 className="h-6 w-6" />
                    {building.name}
                  </CardTitle>
                  <div className={`p-2 rounded-full ${
                    building.status === 'healthy' ? 'bg-green-100' :
                    building.status === 'warning' ? 'bg-yellow-100' :
                    'bg-red-100'
                  }`}>
                    {getStatusIcon(building.status)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <Badge className={`text-sm px-3 py-1 ${
                    building.status === 'healthy' ? 'bg-green-500 hover:bg-green-600' :
                    building.status === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' :
                    'bg-red-500 hover:bg-red-600'
                  }`}>
                    {getStatusText(building.status)}
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {building.totalApartments} айл
                  </span>
                </div>

                {/* Issue Count */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Асуудлын тоо:</span>
                    <span className={`text-2xl font-bold ${
                      building.status === 'healthy' ? 'text-green-600' :
                      building.status === 'warning' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {building.issueCount}
                    </span>
                  </div>

                  {/* Health Score Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Эрүүл мэндийн оноо</span>
                      <span className="font-medium">{Math.round(building.healthScore)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          building.status === 'healthy' ? 'bg-green-500' :
                          building.status === 'warning' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${building.healthScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Status Description */}
                <div className={`p-3 rounded-lg text-sm ${
                  building.status === 'healthy' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' :
                  building.status === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200' :
                  'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                }`}>
                  {building.status === 'healthy' && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>20-с бага асуудал - Эрүүл байна</span>
                    </div>
                  )}
                  {building.status === 'warning' && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 animate-pulse" />
                      <span>50-100 асуудал - Анхаарал хэрэгтэй</span>
                    </div>
                  )}
                  {building.status === 'danger' && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 animate-pulse" />
                      <span>100+ асуудал - Аюултай байдал!</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {buildings.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Барилга олдсонгүй
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Барилгын мэдээлэл нэмэх хэрэгтэй байна
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        @keyframes pulse-slower {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.9;
          }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-pulse-slower {
          animation: pulse-slower 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
