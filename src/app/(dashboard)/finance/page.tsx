import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import {
    Receipt,
    CreditCard,
    FileText,
    ArrowLeftRight,
    FileCheck2,
    TrendingUp,
    Banknote,
    Building2
} from 'lucide-react';

/**
 * 财务中心着陆页
 * 展示所有财务子模块入口
 */
export default function FinancePage() {
    return (
        <div className="space-y-6">
            {/* 页头 */}
            <div>
                <h1 className="text-2xl font-bold">财务中心</h1>
                <p className="text-sm text-muted-foreground">应收应付、资金调拨、对账管理</p>
            </div>

            {/* 模块卡片 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* 应收管理 */}
                <ModuleCard
                    href="/finance/ar"
                    icon={TrendingUp}
                    title="应收账款 (AR)"
                    description="客户应收对账单管理"
                    color="text-green-600"
                    bgColor="bg-green-100 dark:bg-green-900/20"
                />

                {/* 应付管理 */}
                <ModuleCard
                    href="/finance/ap"
                    icon={Building2}
                    title="应付账款 (AP)"
                    description="供应商/劳务应付管理"
                    color="text-blue-600"
                    bgColor="bg-blue-100 dark:bg-blue-900/20"
                />

                {/* 收款管理 */}
                <ModuleCard
                    href="/finance/receipts"
                    icon={Receipt}
                    title="收款管理"
                    description="收款单录入与核销"
                    color="text-emerald-600"
                    bgColor="bg-emerald-100 dark:bg-emerald-900/20"
                />

                {/* 付款管理 */}
                <ModuleCard
                    href="/finance/payments"
                    icon={CreditCard}
                    title="付款管理"
                    description="付款单审批与执行"
                    color="text-purple-600"
                    bgColor="bg-purple-100 dark:bg-purple-900/20"
                />

                {/* 资金调拨 */}
                <ModuleCard
                    href="/finance/transfers"
                    icon={ArrowLeftRight}
                    title="资金调拨"
                    description="内部账户资金调拨"
                    color="text-orange-600"
                    bgColor="bg-orange-100 dark:bg-orange-900/20"
                />

                {/* 账户管理 */}
                <ModuleCard
                    href="/finance/accounts"
                    icon={Banknote}
                    title="账户管理"
                    description="银行/现金账户余额"
                    color="text-cyan-600"
                    bgColor="bg-cyan-100 dark:bg-cyan-900/20"
                />

                {/* 对账确认 */}
                <ModuleCard
                    href="/finance/confirmations"
                    icon={FileCheck2}
                    title="对账确认"
                    description="月结客户/供应商对账"
                    color="text-indigo-600"
                    bgColor="bg-indigo-100 dark:bg-indigo-900/20"
                />

                {/* 贷项通知单 */}
                <ModuleCard
                    href="/finance/credit-notes"
                    icon={FileText}
                    title="贷项通知单"
                    description="客户退款/折让"
                    color="text-red-600"
                    bgColor="bg-red-100 dark:bg-red-900/20"
                />

                {/* 借项通知单 */}
                <ModuleCard
                    href="/finance/debit-notes"
                    icon={FileText}
                    title="借项通知单"
                    description="供应商扣款/退货"
                    color="text-amber-600"
                    bgColor="bg-amber-100 dark:bg-amber-900/20"
                />
            </div>
        </div>
    );
}

// 模块卡片组件
function ModuleCard({
    href,
    icon: Icon,
    title,
    description,
    color,
    bgColor,
}: {
    href: string;
    icon: React.ElementType;
    title: string;
    description: string;
    color: string;
    bgColor: string;
}) {
    return (
        <Link href={href}>
            <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer h-full">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${bgColor}`}>
                            <Icon className={`h-5 w-5 ${color}`} />
                        </div>
                        <CardTitle className="text-base">{title}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <CardDescription>{description}</CardDescription>
                </CardContent>
            </Card>
        </Link>
    );
}
