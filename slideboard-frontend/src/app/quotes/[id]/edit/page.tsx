import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

import { QuoteForm } from '@/features/quotes/components/quote-form';
import { quoteService } from '@/services/quotes.client';

export const metadata: Metadata = {
  title: '编辑报价单',
};

// params 类型在 Next.js 15 中可能是 Promise
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditQuotePage({ params }: PageProps) {
  const { id } = await params;
  
  // 在这里我们可以在服务端获取数据，或者让客户端组件获取
  // 为了简单起见，我们先让 QuoteForm 处理数据获取，或者传递 id
  // 但我们的 QuoteForm 目前设计是接收 initialData。
  // 理想情况下，我们应该在这里获取数据。
  
  // 由于 quoteService.getQuote 是客户端服务（使用了 supabase client），
  // 我们在 Server Component 中使用它可能会有问题，除非我们确保它只在客户端运行，
  // 或者我们有对应的 Server Action / Service。
  // 鉴于目前是 Client-side data fetching 模式，我们创建一个 Client Component Wrapper。
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-ink-500 hover:text-primary-600 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Link>
      </div>
      
      <EditQuoteClient id={id} />
    </div>
  );
}

// 简单的客户端包装器
import EditQuoteClient from './client';
