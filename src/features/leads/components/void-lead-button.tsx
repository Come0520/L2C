'use client';

import { logger } from "@/shared/lib/logger";
/**
 * 作废线索按钮 - 客户端组件包装器
 * 封装 VoidLeadDialog 的 open/onOpenChange 受控状态
 */

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import Ban from 'lucide-react/dist/esm/icons/ban';
import { VoidLeadDialog } from './void-lead-dialog';

interface VoidLeadButtonProps {
    leadId: string;
    userId: string;
}

export function VoidLeadButton({ leadId, userId }: VoidLeadButtonProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="text-error-600 border-error-200 hover:bg-error-50"
                onClick={() => setOpen(true)}
            >
                <Ban className="h-4 w-4 mr-2" />
                标记作废
            </Button>
            <VoidLeadDialog
                leadId={leadId}
                userId={userId}
                open={open}
                onOpenChange={setOpen}
            />
        </>
    );
}
