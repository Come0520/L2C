'use client';

import { ChannelList } from "@/features/settings/components/channel-list";
// We are using 'channels' schema now, data comes from getChannels query.
// It has 'channelCategory' relation.

export function ChannelListWrapper({ initialData, categories }: { initialData: any[], categories: any[] }) {
    return (
        <ChannelList
            data={initialData}
            categories={categories}
        />
    );
}
