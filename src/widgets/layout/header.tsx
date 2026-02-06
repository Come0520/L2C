'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Session } from 'next-auth';
import { Bell, Search, User } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { UserMenu } from './user-menu';

/**
 * 顶部导航栏组件
 * 显示当前页面标题、搜索、通知和用户菜单
 */
interface HeaderProps {
    session?: Session | null;
}

export function Header({ session }: HeaderProps) {
    const pathname = usePathname();
    console.log('Header Render Pathname:', pathname);

    // 根据路径获取页面标题
    const getPageTitle = () => {
        if (pathname === '/') return '工作台';
        if (pathname.startsWith('/customers')) {
            console.log('Matched customers path, returning 客户管理');
            return '客户管理';
        }
        if (pathname.startsWith('/leads')) return '线索管理';
        if (pathname.startsWith('/quotes')) return '报价管理';
        if (pathname.startsWith('/orders')) return '订单管理';
        if (pathname.startsWith('/service/measurement')) return '测量服务';
        if (pathname.startsWith('/service/installation')) return '安装服务';
        if (pathname.startsWith('/supply-chain')) return '供应链';
        if (pathname.startsWith('/finance')) return '财务中心';
        if (pathname.startsWith('/after-sales')) return '售后服务';
        if (pathname.startsWith('/analytics')) return '数据分析';
        if (pathname.startsWith('/settings')) return '系统设置';
        if (pathname.startsWith('/channels')) return '渠道管理';
        if (pathname.startsWith('/workflow/approvals')) return '审批中心';
        if (pathname.startsWith('/notifications')) return '通知中心';
        if (pathname.startsWith('/admin')) return '平台管理';
        // Debug change to verify update
        return '工作台';
    };

    return (
        <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-white/10 dark:border-white/5 glass-liquid">
            {/* 左侧：页面标题 */}
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-foreground">
                    {getPageTitle()}
                </h1>
            </div>

            {/* 右侧：搜索、通知、用户 */}
            <div className="flex items-center gap-3">
                {/* 搜索按钮 */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-white/10"
                >
                    <Search className="h-4 w-4 text-muted-foreground" />
                </Button>

                {/* 通知按钮 */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-white/10 relative"
                >
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    {/* 通知红点 */}
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                </Button>

                {/* 用户菜单 */}
                {session ? (
                    <UserMenu session={session} />
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full bg-linear-to-br from-primary-500 to-primary-600 hover:opacity-90"
                    >
                        <User className="h-4 w-4 text-white" />
                    </Button>
                )}
            </div>
        </header>
    );
}
