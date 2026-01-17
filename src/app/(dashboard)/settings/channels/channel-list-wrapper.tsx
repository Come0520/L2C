'use client';

import { ChannelList } from "@/features/settings/components/channel-list";
import { marketChannels } from "@/shared/api/schema";

type MarketChannel = typeof marketChannels.$inferSelect;
type MarketChannelCategory = typeof marketChannels.$inferSelect;

// 扩展类型，包含categoryName字段
interface ChannelWithCategory extends MarketChannel {
    categoryName?: string;
}

export function ChannelListWrapper({ initialData, categories }: { initialData: ChannelWithCategory[], categories: MarketChannelCategory[] }) {
    return (
        <ChannelList
            data={initialData}
            categories={categories}
        />
    );
}
