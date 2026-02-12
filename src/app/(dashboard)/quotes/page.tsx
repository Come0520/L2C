import { Suspense } from 'react';
import { QuoteList } from '@/features/quotes/components/quote-list';

export default function QuotesPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex h-full items-center justify-center">
          加载中...
        </div>
      }
    >
      <QuoteList />
    </Suspense>
  );
}
