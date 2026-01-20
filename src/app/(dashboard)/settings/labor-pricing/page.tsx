import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { LaborPricingConfig } from '@/features/settings/components/labor-pricing-config';

/**
 * 劳务定价设置页面
 * 配置测量师、安装师傅等工费标准
 */
export default function LaborPricingPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="劳务定价"
                subtitle="配置测量师、安装师傅等工费标准"
            />

            <LaborPricingConfig />
        </div>
    );
}
