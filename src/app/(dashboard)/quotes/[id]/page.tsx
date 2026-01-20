
import { getQuote } from '@/features/quotes/actions/queries';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader, CardContent } from '@/shared/ui/card';
import { StatusBadge } from '@/shared/ui/status-badge';
import { ArrowLeft, Printer, FileText } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { QuoteDetail } from '@/features/quotes/components/quote-detail';
import { getQuoteVersions } from '@/features/quotes/actions/queries';
import { getMyQuoteConfig } from '@/features/quotes/actions/config-actions';

export default async function QuoteDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    // 并行获取报价和用户配置 (消除 Waterfall)
    const [result, config] = await Promise.all([
        getQuote(id),
        getMyQuoteConfig()
    ]);

    const quote = result.data;

    if (!quote) {
        notFound();
    }

    // Fetch Versions (依赖 quote.rootQuoteId，无法并行)
    const rootId = quote.rootQuoteId || quote.id;
    const versions = await getQuoteVersions(rootId);

    return (
        <div className="max-w-[1600px] mx-auto pb-10">
            <QuoteDetail quote={quote} versions={versions} initialConfig={config} />
        </div>
    );
}
