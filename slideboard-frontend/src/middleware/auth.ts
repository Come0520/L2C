import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 定义角色类型
export type Role = 'admin' | 'LEAD_ADMIN' | 'LEAD_SALES' | 'LEAD_CHANNEL' | 'SALES_STORE' | 'SALES_REMOTE' | 'SALES_CHANNEL' | 'INSTALLATION_ADMIN' | 'INSTALLATION_STAFF' | 'MEASUREMENT_ADMIN' | 'MEASUREMENT_STAFF';

// 定义权限需求类型
export interface PermissionRequirement {
  roles: Role[];
  scopes?: string[];
}

/**
 * 权限检查中间件
 * 
 * @param request - Next.js请求对象
 * @param allowedRoles - 允许访问的角色列表
 * @returns 允许访问返回true，否则返回NextResponse
 */
export async function checkPermissions(
  request: NextRequest,
  allowedRoles: Role[]
): Promise<{ success: true; userId: string } | { success: false; response: NextResponse }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { 
      success: false, 
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) 
    };
  }

  // 获取用户角色
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !allowedRoles.includes(profile.role as Role)) {
    return { 
      success: false, 
      response: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }) 
    };
  }

  return { success: true, userId: user.id };
}

/**
 * API路由权限装饰器
 * 
 * @param handler - API处理函数
 * @param allowedRoles - 允许访问的角色列表
 * @returns 包装后的API处理函数
 */
export function withAuth(handler: (request: NextRequest, userId: string) => Promise<NextResponse>, allowedRoles: Role[]) {
  return async (request: NextRequest) => {
    const permissionCheck = await checkPermissions(request, allowedRoles);
    if (!permissionCheck.success) {
      return permissionCheck.response;
    }
    return handler(request, permissionCheck.userId);
  };
}
