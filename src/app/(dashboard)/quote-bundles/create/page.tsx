import { QuoteBundleEditor } from '@/features/quotes/components/quote-bundle-editor';
import { Suspense } from 'react';

interface PageProps {
    searchParams: Promise<{
        customerId?: string;
        leadId?: string;
    }>;
}

export default async function CreateQuoteBundlePage({ searchParams }: PageProps) {
    const params = await searchParams;

    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">加载�?..</div>}>
            <QuoteBundleEditor
                initialCustomerId={params.customerId}
                initialLeadId={params.leadId}
            />
        </Suspense>
    );
}
