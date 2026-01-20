
import { Metadata } from 'next';
import { ChannelAnalytics } from '@/features/channels/components/channel-analytics';

export const metadata: Metadata = {
    title: '渠道效果分析 | L2C',
    description: '查看渠道转化率、ROI及各项核心指标',
};

export default function ChannelAnalyticsPage() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">渠道效果分析</h2>
                    <p className="text-muted-foreground">
                        监控各渠道的获客成本与产出效益，优化投放策略
                    </p>
                </div>
            </div>

            <ChannelAnalytics />
        </div>
    );
}
