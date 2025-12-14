import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PaperButton } from '@/components/ui/paper-button';
import { ConvertToOrderButton } from '@/features/quotes/components/convert-to-order-button';
import { QuoteDetailView } from '@/features/quotes/components/quote-detail-view';
import { getQuote } from '@/features/quotes/services/quote.service';

interface QuoteDetailPageProps {
    params: {
        id: string;
    };
}

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
    const quote = await getQuote(params.id);

    if (!quote) {
        notFound();
    }

    const currentVersion = quote.currentVersion || quote.versions?.find(v => v.id === quote.currentVersionId);
    const canConvert = currentVersion?.status === 'accepted' && quote.status !== 'won';

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">报价单详情</h1>
                    <p className="text-gray-500 mt-1">查看和管理报价单版本</p>
                </div>
                <div className="flex gap-2">
                    {canConvert && (
                        <ConvertToOrderButton quoteId={quote.id} />
                    )}
                    <Link href="/quotes">
                        <PaperButton variant="outline">
                            返回列表
                        </PaperButton>
                    </Link>
                </div>
            </div>

            <QuoteDetailView quote={quote} />
        </div>
    );
}
