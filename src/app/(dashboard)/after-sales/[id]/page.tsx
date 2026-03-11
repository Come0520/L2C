import React, { Suspense } from 'react';
import { AfterSalesDetail } from '@/features/after-sales/components/after-sales-detail';
import { getTicketDetail } from '@/features/after-sales/actions';
import { Skeleton } from '@/shared/ui/skeleton';

// Async Wrapper Component to trigger Suspense boundary
async function TicketDetailData({ id }: { id: string }) {
  const initialData = await getTicketDetail(id);
  return <AfterSalesDetail ticketId={id} initialData={initialData} />;
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="flex h-full flex-col">
      <Suspense
        fallback={
          <div data-loading className="mx-auto w-full max-w-7xl space-y-6 p-8">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Skeleton className="h-[400px] md:col-span-2" />
              <Skeleton className="h-[400px]" />
            </div>
          </div>
        }
      >
        <TicketDetailData id={id} />
      </Suspense>
    </div>
  );
}
