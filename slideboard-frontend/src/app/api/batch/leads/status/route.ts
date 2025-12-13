import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server';
import { withApiHandler, ApiError, validateRequest } from '@/utils/api-error-handler';
import { withAuth } from '@/middleware/auth';

export const runtime = 'edge';

/**
 * POST /api/batch/leads/status
 * Bulk update lead statuses
 */
const MAX_BATCH_SIZE = 100
const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(MAX_BATCH_SIZE),
  status: z.string().min(1)
})

const handlePost = async (request: NextRequest, userId: string) => {
  const supabase = await createClient();
  
  // 使用validateRequest函数验证请求参数
  const requestBody = await request.json();
  const validationResult = await validateRequest(schema, requestBody);
  
  if (!validationResult.success) {
    throw validationResult.error;
  }
  
  const { ids, status } = validationResult.data

  const { error } = await supabase
    .from('leads')
    .update({ status, updated_at: new Date().toISOString() })
    .in('id', ids);

  if (error) {
    throw new ApiError('DB_ERROR', 'Failed to update lead statuses', 500, {
      successCount: 0,
      failureCount: ids.length,
      errors: ids.map(id => ({ id, error: error.message }))
    });
  }

  return {
    successCount: ids.length,
    failureCount: 0,
    errors: []
  };
};

// 允许访问的角色
const ALLOWED_ROLES_UPDATE_LEADS = ['admin', 'LEAD_ADMIN', 'LEAD_SALES', 'LEAD_CHANNEL', 'SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL']

export const POST = withApiHandler(withAuth(handlePost, ALLOWED_ROLES_UPDATE_LEADS));

