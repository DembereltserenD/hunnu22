'use client'

import { UserCircle, LogOut, User, Settings } from 'lucide-react'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { createClient } from '../../supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface UserData {
    id: string;
    email?: string;
    user_metadata?: {
        full_name?: string;
        avatar_url?: string;
    };
}

export default function UserProfile() {
    const supabase = createClient()
    const router = useRouter()
    const [user, setUser] = useState<UserData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadUser() {
            try {
                const { data: { user }, error } = await supabase.auth.getUser()
                if (user && !error) {
                    setUser(user)
                }
            } catch (error) {
                console.error('Error loading user:', error)
            } finally {
                setLoading(false)
            }
        }

        loadUser()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/sign-in')
        router.refresh()
    }

    const getInitials = (name?: string, email?: string) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        }
        if (email) {
            return email[0].toUpperCase()
        }
        return 'U'
    }

    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
    const avatarUrl = user?.user_metadata?.avatar_url

    if (loading) {
        return (
            <Button variant="ghost" size="icon" disabled>
                <UserCircle className="h-6 w-6 animate-pulse" />
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={avatarUrl} alt={displayName} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                            {getInitials(user?.user_metadata?.full_name, user?.email)}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-2">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={avatarUrl} alt={displayName} />
                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-orange-400 text-white font-semibold text-lg">
                                    {getInitials(user?.user_metadata?.full_name, user?.email)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col space-y-1 flex-1 min-w-0">
                                <p className="text-sm font-semibold leading-none truncate text-gray-900 dark:text-gray-100">{displayName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20">
                        <User className="mr-2 h-4 w-4" />
                        <span>Хувийн мэдээлэл</span>
                    </DropdownMenuItem>
                </Link>
                <Link href="/settings">
                    <DropdownMenuItem className="cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Тохиргоо</span>
                    </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Гарах</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}