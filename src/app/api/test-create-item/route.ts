import { createQuoteItem } from '@/features/quotes/actions/quote-item-crud';
import { NextResponse } from 'next/server';
export async function GET() {
  try {
    const result = await createQuoteItem({
      quoteId: '110e8400-e29b-41d4-a716-446655440000',
      category: 'CURTAIN',
      productName: 'test product',
      unitPrice: 100,
      quantity: 1,
      width: 0,
      height: 0,
    });
    return NextResponse.json({ result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error', stack: e.stack }, { status: 500 });
  }
}
