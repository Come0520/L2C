import { Card, CardHeader, CardTitle, CardContent } from '../../shared/ui/card';
import { DollarSign, Users, Activity, CreditCard, ClipboardList, Truck, Wrench } from 'lucide-react';
import { getDashboardStats } from '@/features/dashboard/actions';
import Link from 'next/link';
import { cn } from '@/shared/lib/utils';

const iconMap = {
    'dollar': DollarSign,
    'users': Users,
    'activity': Activity,
    'credit-card': CreditCard,
    'clipboard': ClipboardList,
    'truck': Truck,
    'wrench': Wrench,
};

const colorMap = {
    'emerald': 'text-emerald-400',
    'blue': 'text-blue-400',
    'amber': 'text-amber-400',
    'rose': 'text-rose-400',
    'purple': 'text-purple-400',
    'cyan': 'text-cyan-400',
};

export default async function DashboardPage() {
    const stats = await getDashboardStats();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-white/90">
                    Dashboard
                    <span className="ml-2 text-sm font-normal text-white/50">({stats.role})</span>
                </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.cards.map((card, index) => {
                    const Icon = iconMap[card.icon] || Activity;
                    const colorClass = colorMap[card.color] || 'text-white';

                    return (
                        <Link key={index} href={card.link || '#'}>
                            <Card className="glass-liquid border-white/20 backdrop-blur-md bg-white/5 dark:bg-black/20 hover:bg-white/10 transition-colors cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-white/70">{card.title}</CardTitle>
                                    <Icon className={cn("h-4 w-4", colorClass)} />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-white">{card.value}</div>
                                    {card.subValue && (
                                        <p className="text-xs text-white/50">{card.subValue}</p>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

