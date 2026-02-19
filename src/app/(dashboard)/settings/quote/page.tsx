import Link from 'next/link';
import dynamic from 'next/dynamic';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { ChevronRight, LayoutGrid, Settings2 } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';

/** 懒加载：系统参数配置组件 */
const SystemParamsConfig = dynamic(
    () => import('@/features/settings/components/system-params-config').then(m => m.SystemParamsConfig),
    { loading: () => <Skeleton className="h-[280px] w-full rounded-lg" /> }
);

/** 懒加载：窗帘计算参数配置组件 */
const CurtainCalcConfig = dynamic(
    () => import('@/features/settings/components/curtain-calc-config').then(m => m.CurtainCalcConfig),
    { loading: () => <Skeleton className="h-[200px] w-full rounded-lg" /> }
);

/**
 * 报价设置页面
 * [Settings-02] 系统参数配置
 */
export default function QuoteSettingsPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="系统参数配置"
                subtitle="配置报价有效期、提醒规则和服务排期参数"
            />
            <SystemParamsConfig />

            {/* 窗帘计算参数配置 */}
            <CurtainCalcConfig />

            {/* 子模块导航 */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">更多配置</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 快速报价字段配置 */}
                    <Link href="/settings/quote/quick-fields">
                        <Card className="group hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between py-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                        <Settings2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">快速报价字段配置</CardTitle>
                                        <CardDescription className="text-xs">
                                            配置快速报价模式下显示的字段
                                        </CardDescription>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </CardHeader>
                        </Card>
                    </Link>

                    {/* 空间类型配置 */}
                    <Link href="/settings/quote/room-types">
                        <Card className="group hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between py-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        <LayoutGrid className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">空间类型配置</CardTitle>
                                        <CardDescription className="text-xs">
                                            自定义报价单中可选择的空间类型
                                        </CardDescription>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </CardHeader>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    );
}
