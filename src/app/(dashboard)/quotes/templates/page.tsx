import { Suspense } from 'react';
import { getQuoteTemplates } from '@/features/quotes/actions/template-actions';
import { QuoteTemplateList } from '@/features/quotes/components/quote-template-list';
import { Button } from '@/shared/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: '报价模板 | L2C',
    description: '管理和使用报价模板',
};

export default async function QuoteTemplatesPage() {
    const templatesRes = await getQuoteTemplates({});
    const templates = templatesRes?.data?.templates || [];
    const categories = templatesRes?.data?.categories || [];

    return (
        <div className="space-y-6 p-8">
            {/* 头部 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/quotes">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">报价模板</h1>
                        <p className="text-muted-foreground text-sm">
                            快速复用常用报价配置，提高报价效率
                        </p>
                    </div>
                </div>
            </div>

            {/* 模板列表 */}
            <Suspense fallback={<div className="text-muted-foreground">加载中...</div>}>
                <QuoteTemplateList
                    templates={templates}
                    categories={categories as string[]}
                />
            </Suspense>
        </div>
    );
}
