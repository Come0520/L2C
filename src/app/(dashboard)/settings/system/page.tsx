import { SystemSettingsPanel } from '@/features/settings/components/system-settings-panel';

export const metadata = {
    title: '系统设置',
};

/**
 * 系统参数设置页面
 * 包含：线索、渠道、收款、测量、订单、审批、通知、报表 8 类设置
 */
export default function SystemParamsPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">系统参数设置</h1>
                <p className="text-muted-foreground text-sm">配置业务规则和系统行为</p>
            </div>
            <SystemSettingsPanel />
        </div>
    );
}
