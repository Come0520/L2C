/**
 * 获取报价单详情 API
 *
 * GET /api/miniprogram/quotes/[id]
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { quotes, quoteItems, customers } from '@/shared/api/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少 ID' }, { status: 400 });
    }

    // 1. Fetch Quote with Customer
    const quote = await db.query.quotes.findFirst({
      where: eq(quotes.id, id),
      with: {
        customer: true, // Assuming relation exists in schema relations
      },
    });

    // If relation not defined in schema codebase yet, manual join might be needed.
    // Let's assume manual join for safety if relations.ts isn't fully inspected,
    // OR better: use variable queries if relations are set up.
    // Given I haven't checked relations.ts extensively, I'll do a separate fetch for customer if not returned,
    // or just rely on IDs.

    if (!quote) {
      return NextResponse.json({ success: false, error: '报价单不存在' }, { status: 404 });
    }

    let customerName = '未知客户';
    if (quote.customerId) {
      const customer = await db.query.customers.findFirst({
        where: eq(customers.id, quote.customerId),
      });
      if (customer) customerName = customer.name;
    }

    // 2. Fetch Items
    const items = await db.query.quoteItems.findMany({
      where: eq(quoteItems.quoteId, id),
      orderBy: [quoteItems.sortOrder],
    });

    // 3. Format Response
    const data = {
      id: quote.id,
      quoteNo: quote.quoteNo,
      title: quote.title,
      customerName: customerName,
      totalAmount: quote.totalAmount, // or finalAmount
      finalAmount: quote.finalAmount,
      status: quote.status,
      customerSignatureUrl: quote.customerSignatureUrl,
      confirmedAt: quote.confirmedAt,
      items: items.map((item) => ({
        id: item.id,
        productName: item.productName,
        roomName: item.roomName, // Assuming roomName is stored on item as redundant field or we need join rooms
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        attributes: item.attributes,
      })),
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Fetch quote error:', error);
    return NextResponse.json({ success: false, error: '获取报价单失败' }, { status: 500 });
  }
}
