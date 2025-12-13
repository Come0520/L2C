'use client';

import { useSearchParams } from 'next/navigation';

import { QuoteForm } from '@/features/quotes/components/quote-form';

export default function QuoteCreateClient() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get('leadId') || undefined;
  
  return <QuoteForm leadId={leadId} />;
}
