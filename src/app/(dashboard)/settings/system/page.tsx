export const dynamic = 'force-dynamic';
import nextDynamic from 'next/dynamic';
import { Skeleton } from '@/shared/ui/skeleton';

/** 懒加载：系统设置面板（含 8 类配置） */
const SystemSettingsPanel = nextDynamic(
  () =>
    import('@/features/settings/components/system-settings-panel').then(
      (m) => m.SystemSettingsPanel
    ),
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
    <div className="flex h-full flex-col p-4">
      <div className="glass-liquid-ultra min-h-0 flex-1 overflow-auto rounded-2xl border border-white/20 p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight">系统参数设置</h2>
            <p className="text-muted-foreground">配置业务规则和系统行为</p>
          </div>
          <SystemSettingsPanel />
        </div>
      </div>
    </div>
  );
}

