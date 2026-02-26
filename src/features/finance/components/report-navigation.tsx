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
    <div className="bg-muted/40 mb-6 flex w-fit flex-wrap items-center gap-2 rounded-lg border p-1">
      {links.map((link) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;

        return (
          <Button
            key={link.href}
            asChild
            variant={isActive ? 'default' : 'ghost'}
            className={cn('flex items-center gap-2 px-4 py-2', isActive && 'shadow-sm')}
          >
            <Link href={link.href}>
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
