import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

/**
 * POST /api/assignment/reassign
 * Re-assign a resource (lead or order) to a different user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schema = z.object({
      resourceType: z.enum(['lead', 'order']),
      resourceId: z.string().min(1),
      assigneeId: z.string().min(1),
      reason: z.string().max(500).optional()
    })
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    const { resourceType, resourceId, assigneeId, reason } = parsed.data

    // RBAC Check: Get user role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 });
    }

    const ALLOWED_ROLES_REASSIGN = ['admin', 'LEAD_ADMIN', 'LEAD_SALES', 'LEAD_CHANNEL', 'SERVICE_DISPATCH']
    if (!ALLOWED_ROLES_REASSIGN.includes(userProfile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Perform reassignment
    if (resourceType === 'lead') {
      const { error } = await supabase.rpc('assign_lead', {
        p_lead_id: resourceId,
        p_assignee_id: assigneeId,
        p_reason: reason
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else if (resourceType === 'order') {
      // Get assignee name
      const { data: assignee, error: assigneeError } = await supabase
        .from('users')
        .select('name')
        .eq('id', assigneeId)
        .single();

      if (assigneeError || !assignee) {
        return NextResponse.json({ error: 'Assignee not found' }, { status: 404 });
      }

      const { error } = await supabase
        .from('sales_orders')
        .update({
          sales_person: assignee.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', resourceId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid resource type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
