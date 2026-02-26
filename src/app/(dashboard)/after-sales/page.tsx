import React from 'react';
import { AfterSalesList } from '@/features/after-sales/components/after-sales-list';

export const dynamic = 'force-dynamic';

export default function AfterSalesPage() {
    return (
        <div className="flex h-full flex-col">
            <AfterSalesList />
        </div>
    );
}
