'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { LineChart, DollarSign, Wallet } from 'lucide-react';

export function ReportNavigation() {
    const pathname = usePathname();

    const links = [
        { href: '/finance/reports/balance-sheet', label: '资产负债表', icon: Wallet },
        { href: '/finance/reports/income-statement', label: '利润表', icon: LineChart },
        { href: '/finance/reports/cash-flow', label: '现金流量表', icon: DollarSign },
    ];

    return (
        <div className="flex flex-wrap items-center gap-2 mb-6 p-1 bg-muted/40 border rounded-lg w-fit">
            {links.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;

                return (
                    <Button
                        key={link.href}
                        asChild
                        variant={isActive ? 'default' : 'ghost'}
                        className={cn(
                            "px-4 py-2 flex items-center gap-2",
                            isActive && "shadow-sm"
                        )}
                    >
                        <Link href={link.href}>
                            <Icon className="w-4 h-4" />
                            {link.label}
                        </Link>
                    </Button>
                );
            })}
        </div>
    );
}
