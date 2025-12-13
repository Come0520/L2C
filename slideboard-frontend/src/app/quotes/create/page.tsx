import { QuoteEditor } from '@/features/quotes/components/quote-editor';

interface CreateQuotePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CreateQuotePage({ searchParams }: CreateQuotePageProps) {
  const params = await searchParams;
  const leadId = typeof params.leadId === 'string' ? params.leadId : undefined;
  const customerId = typeof params.customerId === 'string' ? params.customerId : undefined;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">新建报价单</h1>
        <p className="text-gray-500 mt-1">创建新的报价单，支持多版本管理</p>
      </div>

      <QuoteEditor leadId={leadId} customerId={customerId} />
    </div>
  );
}
