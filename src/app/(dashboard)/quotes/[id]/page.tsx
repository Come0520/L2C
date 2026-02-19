import { getQuote } from '@/features/quotes/actions/queries';
import { auth } from '@/shared/lib/auth';
import { notFound } from 'next/navigation';
import { QuoteDetail } from '@/features/quotes/components/quote-detail';
import { getQuoteVersions } from '@/features/quotes/actions/queries';
import { getMyQuoteConfig } from '@/features/quotes/actions/config-actions';
import { QuoteService } from '@/services/quote.service';

export default async function QuoteDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    // 并行获取报价和用户配置 (消除 Waterfall)
    // 注意：先获取 ID，然后并行执行

    // 1. 检查是否过期
    const session = await auth();
    if (session?.user?.tenantId) {
        await QuoteService.checkAndExpireQuote(id, session.user.tenantId);
    }

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
