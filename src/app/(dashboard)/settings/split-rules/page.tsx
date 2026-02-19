import dynamic from 'next/dynamic';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Scissors } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';

/** 懒加载：拆单规则配置组件 */
const SplitRulesConfig = dynamic(
    () => import('@/features/settings/components/split-rules-config').then(m => m.SplitRulesConfig),
    { loading: () => <Skeleton className="h-[300px] w-full rounded-lg" /> }
);

/**
 * 采购拆单规则设置页面
 * 配置订单分拆至采购单的规则
 */
export default function SplitRulesPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="采购拆单规则"
                subtitle="配置订单分拆至采购单的规则"
            />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Scissors className="h-5 w-5" />
                        拆单配置
                    </CardTitle>
                    <CardDescription>
                        定义如何将销售订单拆分为采购单
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SplitRulesConfig />
                </CardContent>
            </Card>
        </div>
    );
}
