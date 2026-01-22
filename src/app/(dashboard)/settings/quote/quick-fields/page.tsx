import { QuickQuoteFieldConfig } from '@/features/settings/components/quick-quote-field-config';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';

/**
 * 快速报价字段配置页面
 * 配置入口：系统设置 > 报价设置 > 快速报价字段配置
 */
export default function QuickQuoteFieldsPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="快速报价字段配置"
                subtitle="配置快速报价模式下显示的字段，未勾选的字段仅在高级模式显示"
            />
            <QuickQuoteFieldConfig />
        </div>
    );
}
