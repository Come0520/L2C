'use client';

import React, { useEffect, useState } from 'react';

import { QuoteForm } from '@/features/quotes/components/quote-form';
import { CreateQuoteFormData } from '@/features/quotes/schemas/quote-schema';
import { quoteService } from '@/services/quotes.client';

export default function EditQuoteClient({ id }: { id: string }) {
  const [initialData, setInitialData] = useState<Partial<CreateQuoteFormData> | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const quote = await quoteService.getQuote(id);
        
        // Transform Quote to Form Data
        // Ideally use current draft version or latest version
        const version = quote.currentVersion || (quote.versions && quote.versions.length > 0 ? quote.versions[0] : null);
        
        if (version) {
          setInitialData({
            projectName: quote.projectName,
            projectAddress: quote.projectAddress,
            customerId: quote.customerId,
            items: version.items.map(item => ({
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              category: item.category,
              space: item.space,
              description: item.description,
              productId: item.productId,
              variantId: item.variantId,
              unit: item.unit
            }))
          });
        } else {
            setInitialData({
                projectName: quote.projectName,
                projectAddress: quote.projectAddress,
                customerId: quote.customerId,
                items: []
            })
        }
      } catch (error) {
        console.error('Failed to fetch quote:', error);
        // Handle error (e.g. toast)
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [id]);

  if (loading) {
    return <div>加载中...</div>;
  }

  return <QuoteForm initialData={initialData} quoteId={id} isEditing={true} />;
}
