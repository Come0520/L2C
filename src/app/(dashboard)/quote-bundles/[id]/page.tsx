import { Suspense } from 'react';
import { auth } from '@/shared/lib/auth';
import { fetchQuotePlans } from '@/features/quotes/lib/plan-loader';
import { getQuoteBundleById } from '@/features/quotes/actions/queries';
import { QuoteBundleDetailView } from '@/features/quotes/components/quote-bundle-detail-view';
import { notFound } from 'next/navigation';
import { DetailSkeleton } from '@/shared/ui/skeleton-variants';

export default async function QuoteBundleDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const [{ id }, session] = await Promise.all([
        params,
        auth()
    ]);
    const tenantId = session?.user?.tenantId;
    if (!tenantId) {
        notFound();
    }

    // 修正 Promise.all 和解构的错误
    const [result, plans] = await Promise.all([
        getQuoteBundleById({ id }),
        fetchQuotePlans(tenantId)
    ]);

    if (!result.success || !result.data) {
        notFound();
    }

    return (
        <Suspense fallback={<DetailSkeleton />}>
            <QuoteBundleDetailView bundle={result.data} plans={plans || {}} />
        </Suspense>
    );
}
