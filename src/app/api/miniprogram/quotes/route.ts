/**
 * 创建报价单 API
 *
 * POST /api/miniprogram/quotes
 * Body: { customerId, rooms: [{ name, items: [{ productId, quantity, ... }] }] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { quotes, quoteRooms, quoteItems } from '@/shared/api/schema';
import { users } from '@/shared/api/schema'; // users needed?
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';

// Helper
async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.slice(7);
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.userId as string,
      tenantId: payload.tenantId as string,
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, rooms } = body;

    if (!customerId) {
      return NextResponse.json({ success: false, error: '必须包含客户ID' }, { status: 400 });
    }

    // Transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create Quote
      // Generate Quote No (Simple Timestamp + Random for demo)
      const quoteNo = `Q${Date.now()}`;

      const [newQuote] = await tx
        .insert(quotes)
        .values({
          tenantId: user.tenantId,
          quoteNo: quoteNo,
          customerId: customerId,
          createdBy: user.id,
          title: `报价单 ${quoteNo}`,
          status: 'DRAFT',
          finalAmount: '0', // Will update later
          version: 1,
        })
        .returning();

      let total = 0;

      // 2. Create Rooms & Items
      if (rooms && Array.isArray(rooms)) {
        for (let i = 0; i < rooms.length; i++) {
          const r = rooms[i];
          const [newRoom] = await tx
            .insert(quoteRooms)
            .values({
              tenantId: user.tenantId,
              quoteId: newQuote.id,
              name: r.name,
              sortOrder: i,
            })
            .returning();

          if (r.items && Array.isArray(r.items)) {
            for (let j = 0; j < r.items.length; j++) {
              const item = r.items[j];
              const itemSubtotal = parseFloat(item.subtotal) || 0;
              total += itemSubtotal;

              await tx.insert(quoteItems).values({
                tenantId: user.tenantId,
                quoteId: newQuote.id,
                roomId: newRoom.id,
                productId: item.id, // mapped from frontend product.id
                productName: item.name,
                unit: item.unit,
                unitPrice: item.unitPrice + '',
                quantity: item.quantity + '',
                width: item.width + '',
                height: item.height + '',
                foldRatio: item.foldRatio + '',
                subtotal: itemSubtotal + '',
                category: item.category || 'GENERAL',
                sortOrder: j,
              });
            }
          }
        }
      }

      // 3. Update Total
      await tx
        .update(quotes)
        .set({
          totalAmount: total.toFixed(2),
          finalAmount: total.toFixed(2),
        })
        .where(eq(quotes.id, newQuote.id));

      return newQuote;
    });

    return NextResponse.json({ success: true, data: { id: result.id } });
  } catch (error) {
    console.error('Create Quote Error:', error);
    return NextResponse.json({ success: false, error: '创建报价单失败 ' + error }, { status: 500 });
  }
}
