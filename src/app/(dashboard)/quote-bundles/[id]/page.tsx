import { Suspense } from 'react';
import { auth } from '@/shared/lib/auth';
import { fetchQuotePlans } from '@/features/quotes/lib/plan-loader';
import { getQuoteBundleById } from '@/features/quotes/actions/queries';
import { QuoteBundleDetailView } from '@/features/quotes/components/quote-bundle-detail-view';
import { notFound } from 'next/navigation';

export default async function QuoteBundleDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const session = await auth();
    const [result, plans] = await Promise.all([
        getQuoteBundleById({ id }),
        session?.user?.tenantId ? fetchQuotePlans(session.user.tenantId) : Promise.resolve({})
    ]);

    if (!result.success || !result.data) {
        notFound();
    }

    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Bundle...</div>}>
            <QuoteBundleDetailView bundle={result.data} plans={plans} />
        </Suspense>
    );
}
