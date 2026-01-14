import React from 'react';
import { AfterSalesDetail } from '@/features/after-sales/components/after-sales-detail';

export default async function TicketDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div className="flex h-full flex-col">
            <AfterSalesDetail ticketId={id} />
        </div>
    );
}
