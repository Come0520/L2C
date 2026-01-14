'use client';

import { Button } from "@/shared/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ChannelForm } from "@/features/settings/components/channel-form";
import { marketChannelCategories } from "@/shared/api/schema";

type MarketChannelCategory = typeof marketChannelCategories.$inferSelect;

export function ChannelFormWrapper({ categories }: { categories: MarketChannelCategory[] }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                新建渠道
            </Button>
            <ChannelForm
                open={open}
                onOpenChange={setOpen}
                categories={categories}
            />
        </>
    );
}
