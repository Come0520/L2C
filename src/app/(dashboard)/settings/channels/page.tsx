import { Suspense } from 'react';
import { getChannels, getChannelCategories } from '@/features/settings/actions';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { ChannelFormWrapper } from './channel-form-wrapper';
import { ChannelListWrapper } from './channel-list-wrapper';
import { marketChannels, marketChannelCategories } from '@/shared/api/schema';

export const dynamic = 'force-dynamic';

export default async function ChannelsPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const [channelsRes, categoriesRes] = await Promise.all([
        getChannels(),
        getChannelCategories()
    ]);

    // 确保数据类型正确，避免undefined
    const channels = Array.isArray(channelsRes.data) ? channelsRes.data : [];
    const categories = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="渠道配置"
                subtitle="管理线索来源渠道及其分类"
            >
                <ChannelFormWrapper categories={categories} />
            </DashboardPageHeader>

            <Suspense fallback={<div>加载�?..</div>}>
                <ChannelListWrapper 
                    initialData={channels as Array<typeof marketChannels.$inferSelect & { categoryName?: string }>} 
                    categories={categories as Array<typeof marketChannelCategories.$inferSelect>} 
                />
            </Suspense>
        </div>
    );
}
