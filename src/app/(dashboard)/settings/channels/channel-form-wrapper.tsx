'use client';

import { Button } from "@/shared/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ChannelFormDialog } from "@/features/channels/components/channel-form-dialog";
// Type from channelCategories schema in 'src/shared/api/schema/channels' (inferred or imported)
// Better to let TS infer or use any if we want to be quick, but let's try to match.
// 'categoryTypes' in ChannelFormDialog expects { id: string; name: string; code: string }
// The data from getChannelCategories (from features/channels/actions/categories) returns exactly that structure (from db query).

interface CategoryType {
    id: string;
    name: string;
    code: string;
}

interface WrapperProps {
    categories: CategoryType[];
    tenantId: string;
}

export function ChannelFormWrapper({ categories, tenantId }: WrapperProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                新建渠道
            </Button>
            <ChannelFormDialog
                open={open}
                onOpenChange={setOpen}
                categoryTypes={categories}
                tenantId={tenantId}
                onSuccess={() => {
                    setOpen(false);
                    // 简单的页面刷新以显示新渠道，或者依赖 react server components 的重验证
                    window.location.reload();
                }}
            />
        </>
    );
}
