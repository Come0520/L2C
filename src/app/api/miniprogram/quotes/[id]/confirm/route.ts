/**
 * 确认报价单 API
 *
 * POST /api/miniprogram/quotes/[id]/confirm
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { quotes } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // Next.js 15+ params is a Promise
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { signatureUrl } = body;

    if (!signatureUrl) {
      return NextResponse.json(
        { success: false, error: 'Signature URL is required' },
        { status: 400 }
      );
    }

    // Update Quote Status
    await db
      .update(quotes)
      .set({
        status: 'ACCEPTED',
        customerSignatureUrl: signatureUrl,
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, id));

    return NextResponse.json({ success: true, data: { status: 'ACCEPTED' } });
  } catch (error) {
    console.error('Confirm quote error:', error);
    return NextResponse.json({ success: false, error: 'Confirmation failed' }, { status: 500 });
  }
}
