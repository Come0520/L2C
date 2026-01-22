
import { Suspense } from 'react';
import { getChannels, getChannelCategories } from '@/features/settings/actions';
import { getChannelCategories as getChannelCategoryTypes } from '@/features/channels/actions/categories';
import { auth } from '@/shared/lib/auth';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { ChannelListWrapper } from './channel-list-wrapper';
import { ChannelFormWrapper } from './channel-form-wrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { AttributionSettingsForm } from '@/features/channels/components/attribution-settings-form';
import { CategoryManager } from '@/features/channels/components/category-manager';
import { getChannelGradeDiscounts } from '@/features/channels/actions/channel-config';
import { GradeDiscountConfigForm } from '@/features/channels/components/grade-discount-config-form';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

/**
 * 渠道配置页面
 */
export default async function ChannelsPage() {
    const session = await auth();
    const tenantId = session?.user?.tenantId || '';

    const [channelsRes, categoriesRes, categoryTypesRes, gradeDiscounts] = await Promise.all([
        getChannels(),
        getChannelCategories(),
        tenantId ? getChannelCategoryTypes() : Promise.resolve([]),
        getChannelGradeDiscounts(),
    ]);

    const channels = channelsRes.success ? (channelsRes.data || []) : [];
    const categories = categoriesRes.success ? (categoriesRes.data || []) : [];
    const categoryTypes = categoryTypesRes || [];

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="渠道配置"
                subtitle="管理渠道列表、类型分类及归因规则"
            />

            <Tabs defaultValue="list" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="list">渠道列表</TabsTrigger>
                    <TabsTrigger value="types">渠道类型</TabsTrigger>
                    <TabsTrigger value="config">佣金配置</TabsTrigger>
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

                <TabsContent value="types">
                    <CategoryManager
                        initialData={categoryTypes}
                        tenantId={tenantId}
                    />
                </TabsContent>

                <TabsContent value="config" className="max-w-2xl space-y-4">
                    <GradeDiscountConfigForm initialData={gradeDiscounts} />

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h4 className="font-medium">渠道选品池</h4>
                            <p className="text-sm text-muted-foreground">管理可供渠道分销的商品及其底价</p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/settings/channels/products">
                                管理选品
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="attribution" className="max-w-2xl">
                    <AttributionSettingsForm />
                </TabsContent>
            </Tabs>
        </div>
    );
}
