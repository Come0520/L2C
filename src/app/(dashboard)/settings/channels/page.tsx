
import { Suspense } from 'react';
import { getChannels, getChannelCategories } from '@/features/settings/actions';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { ChannelListWrapper } from './channel-list-wrapper';
import { ChannelFormWrapper } from './channel-form-wrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { AttributionSettingsForm } from '@/features/channels/components/attribution-settings-form';

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
                subtitle="管理线索来源渠道、分类及归因规则"
            />

            <Tabs defaultValue="list" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="list">渠道列表</TabsTrigger>
                    <TabsTrigger value="attribution">归因规则</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-4">
                    <div className="flex justify-end">
                        <ChannelFormWrapper categories={categories} />
                    </div>
                    <Suspense fallback={<div>加载中...</div>}>
                        <ChannelListWrapper
                            initialData={channels}
                            categories={categories}
                        />
                    </Suspense>
                </TabsContent>

                <TabsContent value="attribution" className="max-w-2xl">
                    <AttributionSettingsForm />
                </TabsContent>
            </Tabs>
        </div>
    );
}
