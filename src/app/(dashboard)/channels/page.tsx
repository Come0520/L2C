import { Suspense } from 'react';
import { auth } from '@/shared/lib/auth';
import { getChannelTree } from '@/features/channels/actions/queries';
import { getActiveChannelCategories } from '@/features/channels/actions/categories';
import { ChannelTree } from '@/features/channels/components/channel-tree';
import { Skeleton } from '@/shared/ui/skeleton';

export const dynamic = 'force-dynamic';

/**
 * 渠道管理主页面
 * 展示树形结构的渠道列表
 */
export default async function ChannelsPage() {
    const session = await auth();
    const tenantId = session?.user?.tenantId;

    if (!tenantId) {
        return <div>请先登录</div>;
    }

    let channelTree: Awaited<ReturnType<typeof getChannelTree>> = [];
    let categoryTypes: Awaited<ReturnType<typeof getActiveChannelCategories>> = [];

    try {
        [channelTree, categoryTypes] = await Promise.all([
            getChannelTree(),
            getActiveChannelCategories(),
        ]);
    } catch (error) {
        console.error('加载渠道数据失败:', error);
        // 数据加载失败时返回空数组，页面仍可显示
    }

    return (
        <div className="space-y-6">
            <Suspense fallback={<ChannelTreeSkeleton />}>
                <ChannelTree
                    initialData={channelTree}
                    categoryTypes={categoryTypes}
                    tenantId={tenantId}
                />
            </Suspense>
        </div>
    );
}

function ChannelTreeSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <Skeleton className="h-10 w-[200px]" />
                <Skeleton className="h-10 w-[120px]" />
            </div>
            <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        </div>
    );
}
