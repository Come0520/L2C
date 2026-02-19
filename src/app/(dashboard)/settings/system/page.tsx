import dynamic from 'next/dynamic';
import { Skeleton } from '@/shared/ui/skeleton';

/** 懒加载：系统设置面板（含 8 类配置） */
const SystemSettingsPanel = dynamic(
    () => import('@/features/settings/components/system-settings-panel').then(m => m.SystemSettingsPanel),
    { loading: () => <Skeleton className="h-[500px] w-full rounded-lg" /> }
);

export const metadata = {
    title: '系统设置',
};

/**
 * 系统参数设置页面
 * 包含：线索、渠道、收款、测量、订单、审批、通知、报表 8 类设置
 */
export default function SystemParamsPage() {
    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex-1 min-h-0 glass-liquid-ultra rounded-2xl border border-white/20 p-8 overflow-auto">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight mb-2">系统参数设置</h2>
                        <p className="text-muted-foreground">配置业务规则和系统行为</p>
                    </div>
                    <SystemSettingsPanel />
                </div>
            </div>
        </div>
    );
}
