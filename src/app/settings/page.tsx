'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../supabase/client';
import DashboardNavbar from '@/components/dashboard-navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, ArrowLeft, Shield, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

export default function SettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        async function loadUser() {
            try {
                const supabase = createClient();
                const { data: { user }, error } = await supabase.auth.getUser();

                if (error || !user) {
                    router.push('/sign-in');
                    return;
                }

                setUser(user);
            } catch (error) {
                console.error('Error loading user:', error);
            } finally {
                setLoading(false);
            }
        }

        loadUser();
    }, [router]);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast({
                title: 'Алдаа',
                description: 'Нууц үг таарахгүй байна',
                variant: 'destructive',
            });
            return;
        }

        if (newPassword.length < 6) {
            toast({
                title: 'Алдаа',
                description: 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой',
                variant: 'destructive',
            });
            return;
        }

        setSaving(true);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            toast({
                title: 'Амжилттай',
                description: 'Нууц үг амжилттай солигдлоо',
            });

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast({
                title: 'Алдаа гарлаа',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-100 via-orange-50 to-pink-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
                <DashboardNavbar />
                <div className="p-4 flex items-center justify-center min-h-[80vh]">
                    <div className="text-center">
                        <div className="relative w-16 h-16 mx-auto mb-4">
                            <div className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-800"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-purple-600 dark:border-purple-400 border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 font-medium">Уншиж байна...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-orange-50 to-pink-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 transition-colors duration-300">
            <DashboardNavbar />
            <div className="p-4 md:p-6 lg:p-8">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-6">
                        <Link href="/dashboard">
                            <Button variant="ghost" className="gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                                <ArrowLeft className="h-4 w-4" />
                                Буцах
                            </Button>
                        </Link>
                    </div>

                    <div className="space-y-6">
                        {/* Security Settings */}
                        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                            Аюулгүй байдал
                                        </CardTitle>
                                        <CardDescription className="text-gray-600 dark:text-gray-400">
                                            Нууц үг болон аюулгүй байдлын тохиргоо
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleChangePassword} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                <Lock className="h-4 w-4" />
                                                Шинэ нууц үг
                                            </Label>
                                            <Input
                                                id="newPassword"
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Шинэ нууц үгээ оруулна уу"
                                                required
                                                minLength={6}
                                                className="w-full h-11 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 dark:text-gray-100"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                <Lock className="h-4 w-4" />
                                                Нууц үг баталгаажуулах
                                            </Label>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Нууц үгээ дахин оруулна уу"
                                                required
                                                minLength={6}
                                                className="w-full h-11 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 dark:text-gray-100"
                                            />
                                        </div>

                                        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                                Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой. Аюулгүй байдлын үүднээс том үсэг, жижиг үсэг, тоо ашиглахыг зөвлөж байна.
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full h-11 font-semibold bg-gradient-to-r from-purple-500 to-orange-400 hover:brightness-110 text-white border-0"
                                    >
                                        {saving ? 'Хадгалж байна...' : 'Нууц үг солих'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Account Information */}
                        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                                <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    Бүртгэлийн мэдээлэл
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Имэйл хаяг</span>
                                        <span className="text-sm text-gray-900 dark:text-gray-100">{user?.email}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Бүртгүүлсэн огноо</span>
                                        <span className="text-sm text-gray-900 dark:text-gray-100">
                                            {new Date(user?.created_at).toLocaleDateString('mn-MN', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-3">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Сүүлд нэвтэрсэн</span>
                                        <span className="text-sm text-gray-900 dark:text-gray-100">
                                            {new Date(user?.last_sign_in_at).toLocaleDateString('mn-MN', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
