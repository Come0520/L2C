import { Suspense } from 'react';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { ChannelProductPool } from '@/features/channels/components/channel-product-pool';
import {
    getChannelProducts,
    getAvailableProducts,
} from '@/features/channels/actions/channel-products';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

/**
 * 渠道选品池页面
 */
export default async function ChannelProductsPage() {
    const [channelProductsRes, availableProductsRes] = await Promise.all([
        getChannelProducts(),
        getAvailableProducts(),
    ]);

    const channelProducts = channelProductsRes.success ? channelProductsRes.data : [];
    const availableProducts = availableProductsRes.success ? availableProductsRes.data : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/settings/channels">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <DashboardPageHeader
                    title="渠道选品池"
                    subtitle="管理可供渠道分销的商品及其底价配置"
                />
            </div>

            <Suspense fallback={<div>加载中...</div>}>
                <ChannelProductPool
                    channelProducts={channelProducts}
                    availableProducts={availableProducts}
                />
            </Suspense>
        </div>
    );
}
