'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import Bell from 'lucide-react/dist/esm/icons/bell';
import Search from 'lucide-react/dist/esm/icons/search';
import User from 'lucide-react/dist/esm/icons/user';

import { Button } from '@/shared/ui/button';

/**
 * 顶部导航栏组件
 * 显示当前页面标题、搜索、通知和用户菜单
 */
export function Header() {
    const pathname = usePathname();

    // 根据路径获取页面标题
    const getPageTitle = () => {
        if (pathname === '/') return '工作台';
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

                {/* 用户头像 */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 hover:opacity-90"
                >
                    <User className="h-4 w-4 text-white" />
                </Button>
            </div>
        </header>
    );
}
