// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

/**
 * POST /api/batch/orders/status
 * Bulk update order statuses
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const MAX_BATCH_SIZE = 100
    const schema = z.object({
      ids: z.array(z.string().min(1)).min(1).max(MAX_BATCH_SIZE),
      status: z.string().min(1)
    })
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    const { ids, status } = parsed.data

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const ALLOWED_ROLES_UPDATE_ORDERS = ['admin', 'LEAD_ADMIN', 'LEAD_SALES', 'LEAD_CHANNEL', 'DELIVERY_SERVICE', 'SERVICE_DISPATCH']
    if (!profile || !ALLOWED_ROLES_UPDATE_ORDERS.includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { error } = await supabase
      .from('sales_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (error) {
      return NextResponse.json({
        successCount: 0,
        failureCount: ids.length,
        errors: ids.map(id => ({ id, error: error.message }))
      }, { status: 500 });
    }

    return NextResponse.json({
      successCount: ids.length,
      failureCount: 0,
      errors: []
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
