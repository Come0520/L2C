import { Suspense } from 'react';
import { getChannels, getChannelCategories } from '@/features/settings/actions';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { ChannelListWrapper } from './channel-list-wrapper';
import { ChannelFormWrapper } from './channel-form-wrapper';

export const dynamic = 'force-dynamic';

export default async function ChannelsPage() {
    const [channelsRes, categoriesRes] = await Promise.all([
        getChannels(),
        getChannelCategories()
    ]);

    const channels = channelsRes.success ? (channelsRes.data || []) : [];
    const categories = categoriesRes.success ? (categoriesRes.data || []) : [];

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="渠道配置"
                subtitle="管理线索来源渠道及其分类"
            >
                <ChannelFormWrapper categories={categories} />
            </DashboardPageHeader>

            <Suspense fallback={<div>加载中...</div>}>
                <ChannelListWrapper
                    initialData={channels}
                    categories={categories}
                />
            </Suspense>
        </div>
    );
}
