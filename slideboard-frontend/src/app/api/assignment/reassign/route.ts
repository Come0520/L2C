import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

/**
 * POST /api/assignment/reassign
 * Re-assign a resource (lead, order, measurement task, or installation task) to a different user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'User not authenticated' }, 
        { status: 401 }
      );
    }

    // 增强的Zod验证模式，支持更多资源类型
    const schema = z.object({
      resourceType: z.enum(['lead', 'order', 'measurement', 'installation']),
      resourceId: z.string().min(1, '资源ID不能为空'),
      assigneeId: z.string().min(1, '分配对象ID不能为空'),
      reason: z.string().max(500, '原因不能超过500个字符').optional(),
      scheduledTime: z.string().optional().nullable()
    })
    
    const result = schema.safeParse(await request.json())
    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request', 
          details: result.error.format() 
        }, 
        { status: 400 }
      );
    }
    
    const { resourceType, resourceId, assigneeId, reason, scheduledTime } = result.data

    // RBAC Check: Get user role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.error('Failed to verify permissions:', profileError);
      return NextResponse.json(
        { error: 'Failed to verify permissions', details: profileError?.message }, 
        { status: 500 }
      );
    }

    const ALLOWED_ROLES_REASSIGN = ['admin', 'LEAD_ADMIN', 'LEAD_SALES', 'LEAD_CHANNEL', 'SERVICE_DISPATCH']
    if (!ALLOWED_ROLES_REASSIGN.includes(userProfile.role)) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions', 
          details: `User role ${userProfile.role} is not allowed to reassign resources` 
        }, 
        { status: 403 }
      );
    }

    // Perform reassignment based on resource type
    let reassignError: Error | null = null;
    
    switch (resourceType) {
      case 'lead':
        const { error: leadError } = await supabase.rpc('assign_lead', {
          p_lead_id: resourceId,
          p_assignee_id: assigneeId,
          p_reason: reason
        });
        reassignError = leadError;
        break;
        
      case 'order':
        // Get assignee name
        const { data: assignee, error: assigneeError } = await supabase
          .from('users')
          .select('name')
          .eq('id', assigneeId)
          .single();

        if (assigneeError || !assignee) {
          return NextResponse.json(
            { error: 'Assignee not found', details: 'The specified assignee does not exist' }, 
            { status: 404 }
          );
        }

        const { error: orderError } = await supabase
          .from('sales_orders')
          .update({
            sales_person: assignee.name,
            updated_at: new Date().toISOString()
          })
          .eq('id', resourceId);
        reassignError = orderError;
        break;
        
      case 'measurement':
        // 分配测量任务
        const { error: measurementError } = await supabase
          .from('measurement_tasks')
          .update({
            assigned_to: assigneeId,
            assigned_by: user.id,
            scheduled_time: scheduledTime,
            status: 'assigned',
            updated_at: new Date().toISOString()
          })
          .eq('id', resourceId);
        reassignError = measurementError;
        break;
        
      case 'installation':
        // 分配安装任务
        const { error: installationError } = await supabase
          .from('installation_tasks')
          .update({
            assigned_to: assigneeId,
            assigned_by: user.id,
            scheduled_time: scheduledTime,
            status: 'assigned',
            updated_at: new Date().toISOString()
          })
          .eq('id', resourceId);
        reassignError = installationError;
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid resource type', details: `Resource type ${resourceType} is not supported` }, 
          { status: 400 }
        );
    }

    if (reassignError) {
      console.error(`Failed to reassign ${resourceType}:`, reassignError);
      return NextResponse.json(
        { 
          error: `Failed to reassign ${resourceType}`, 
          details: reassignError.message 
        }, 
        { status: 500 }
      );
    }

    // 返回统一的成功响应
    return NextResponse.json(
      { 
        success: true, 
        message: `${resourceType} reassigned successfully`,
        data: { resourceType, resourceId, assigneeId }
      }, 
      { status: 200 }
    );
  } catch (err) {
    console.error('Unexpected error during reassignment:', err);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: err instanceof Error ? err.message : String(err) 
      }, 
      { status: 500 }
    );
  }
}
