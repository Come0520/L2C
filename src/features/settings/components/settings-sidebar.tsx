'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/utils';
import Building2 from 'lucide-react/dist/esm/icons/building';
import Settings2 from 'lucide-react/dist/esm/icons/settings2';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import UserCog from 'lucide-react/dist/esm/icons/user-cog';
import User from 'lucide-react/dist/esm/icons/user';
import Shield from 'lucide-react/dist/esm/icons/shield';

const settingsNav = [
    {
        title: 'General',
        items: [
            { href: '/settings/general', title: 'Basic Info', icon: Building2 },
            { href: '/settings/workflow', title: 'Workflow', icon: Settings2 },
        ],
    },
    {
        title: 'Team',
        items: [
            { href: '/settings/users', title: 'Users', icon: User },
            { href: '/settings/roles', title: 'Roles', icon: Shield },
        ],
    },
    {
        title: 'Finance',
        items: [
             { href: '/settings/finance', title: 'Finance Settings', icon: Wallet },
        ],
    },
];

export function SettingsSidebar() {
    const pathname = usePathname();
    return (
        <nav className="w-64 shrink-0 border-r border-border bg-card/50 p-6 space-y-8">
            {settingsNav.map((group, index) => (
                <div key={index}>
                    <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.title}
                    </h4>
                    <div className="space-y-1">
                        {group.items.map((item) => {
                             const isActive = pathname === item.href;
                             return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                                        isActive ? 'bg-accent text-accent-foreground' : 'transparent'
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.title}</span>
                                </Link>
                             );
                        })}
                    </div>
                </div>
            ))}
        </nav>
    );
}

export { settingsNav };
