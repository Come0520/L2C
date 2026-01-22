'use client';

import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { LogOut, Settings, Building2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';

/**
 * 用户菜单组件
 * 显示用户头像和下拉菜单，包含个人信息、设置和退出登录
 */
interface UserMenuProps {
    session: Session;
}

export function UserMenu({ session }: UserMenuProps) {
    const user = session.user;
    const initials = user?.name?.slice(0, 2) || user?.email?.slice(0, 2) || 'U';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full bg-linear-to-br from-primary-500 to-primary-600 hover:opacity-90"
                >
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
                        <AvatarFallback className="bg-transparent text-white text-sm">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user?.name || '未设置姓名'}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>当前租户</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/profile/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>个人设置</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="text-destructive focus:text-destructive"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
