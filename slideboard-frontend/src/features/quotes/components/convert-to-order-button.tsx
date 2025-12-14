'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { PaperButton } from '@/components/ui/paper-button';

import { convertToOrder } from '../services/quote.service';

interface ConvertToOrderButtonProps {
    quoteId: string;
}

export function ConvertToOrderButton({ quoteId }: ConvertToOrderButtonProps) {
    const router = useRouter();
    const [isConverting, setIsConverting] = useState(false);

    const handleConvert = async () => {
        if (!confirm('确定要将此报价单转为销售单吗？此操作不可撤销。')) {
            return;
        }

        setIsConverting(true);
        try {
            const result = await convertToOrder(quoteId);
            alert(`转换成功！销售单号：${result.salesNo}`);

            // Optionally redirect to sales order detail
            // router.push(`/sales-orders/${result.salesOrderId}`);

            // Or refresh current page to show updated status
            router.refresh();
        } catch (error) {
            console.error('Failed to convert quote:', error);
            alert(`转换失败：${error instanceof Error ? error.message : '未知错误'}`);
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <PaperButton
            variant="primary"
            onClick={handleConvert}
            loading={isConverting}
        >
            转为销售单
        </PaperButton>
    );
}
