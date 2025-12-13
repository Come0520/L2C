import Link from 'next/link'
import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card'
import { getQuotes } from '@/features/quotes/services/quote.service'
import { QuoteListTable } from '@/features/quotes/components/quote-list-table'

export default async function QuotesPage() {
    const quotes = await getQuotes()

    return (
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">报价单管理</h1>
                        <p className="text-gray-500 mt-1">管理所有报价单及其版本 (独立模块)</p>
                    </div>
                    <Link href="/quotes/create">
                        <PaperButton variant="primary">
                            + 新建报价单
                        </PaperButton>
                    </Link>
                </div>

                <PaperCard>
                    <PaperCardHeader>
                        <PaperCardTitle>报价单列表</PaperCardTitle>
                    </PaperCardHeader>
                    <PaperCardContent>
                        {/* Filter controls could be a client component, simplifying for MVP */}
                        <QuoteListTable quotes={quotes} />
                    </PaperCardContent>
                </PaperCard>
            </div>
    )
}
