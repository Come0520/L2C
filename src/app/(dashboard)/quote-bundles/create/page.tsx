import { QuoteBundleEditor } from '@/features/quotes/components/quote-bundle-editor';
import { Suspense } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '创建报价单 | Antigravity L2C',
};

interface PageProps {
    searchParams: Promise<{
        customerId?: string;
        leadId?: string;
    }>;
}

export default async function CreateQuoteBundlePage({ searchParams }: PageProps) {
    const resolvedParams = await searchParams;

    return (
        <div className="container py-6">
            <h1 className="mb-6 text-2xl font-bold">创建报价单</h1>
            <Suspense fallback={<div className="p-8 text-center text-muted-foreground">加载中...</div>}>
                <QuoteBundleEditor
                    initialCustomerId={resolvedParams.customerId}
                    initialLeadId={resolvedParams.leadId}
                />
            </Suspense>
        </div>
    );
}
