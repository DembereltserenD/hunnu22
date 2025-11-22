'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../supabase/client';
import DashboardNavbar from '@/components/dashboard-navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

export default function ProfilePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fullName, setFullName] = useState('');

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
                setFullName(user.user_metadata?.full_name || '');
            } catch (error) {
                console.error('Error loading user:', error);
            } finally {
                setLoading(false);
            }
        }

        loadUser();
    }, [router]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });

            if (error) throw error;

            toast({
                title: 'Амжилттай',
                description: 'Таны мэдээлэл шинэчлэгдлээ',
            });

            // Refresh user data
            const { data: { user: updatedUser } } = await supabase.auth.getUser();
            if (updatedUser) setUser(updatedUser);
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

    const getInitials = (name?: string, email?: string) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        if (email) {
            return email[0].toUpperCase();
        }
        return 'U';
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

                    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                        <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent font-['Clash_Display']">
                                Хувийн мэдээлэл
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex flex-col items-center mb-8">
                                <Avatar className="h-24 w-24 mb-4">
                                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name} />
                                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-orange-400 text-white font-bold text-2xl">
                                        {getInitials(user?.user_metadata?.full_name, user?.email)}
                                    </AvatarFallback>
                                </Avatar>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Бүтэн нэр
                                        </Label>
                                        <Input
                                            id="fullName"
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Таны нэр"
                                            className="w-full h-11 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 dark:text-gray-100"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            Имэйл хаяг
                                        </Label>
                                        <Input
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="w-full h-11 bg-gray-100 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Имэйл хаягийг өөрчлөх боломжгүй</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Бүртгүүлсэн огноо
                                        </Label>
                                        <Input
                                            type="text"
                                            value={new Date(user?.created_at).toLocaleDateString('mn-MN', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                            disabled
                                            className="w-full h-11 bg-gray-100 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full h-11 font-semibold bg-gradient-to-r from-purple-500 to-orange-400 hover:brightness-110 text-white border-0"
                                >
                                    {saving ? 'Хадгалж байна...' : 'Хадгалах'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
