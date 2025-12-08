import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { quoteCollaborationService } from '@/services/quote-collaboration.client';

// POST /api/collaboration/invite - 邀请协作者
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slide_id, phone, permission } = body;

    if (!slide_id || !phone || !permission) {
      return NextResponse.json(
        { error: '缺少必填参数' },
        { status: 400 }
      );
    }

    // 验证权限类型
    const validPermissions = ['view', 'edit', 'admin'];
    if (!validPermissions.includes(permission)) {
      return NextResponse.json(
        { error: '无效的权限类型' },
        { status: 400 }
      );
    }

    // 验证手机号格式
    if (!/^1[3-9]\\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: '手机号格式不正确' },
        { status: 400 }
      );
    }

    // Invite collaborator via service
    const collaborator = await quoteCollaborationService.inviteCollaborator(
      slide_id,
      phone,
      permission as 'view' | 'edit'
    );

    return NextResponse.json({
      collaborator,
      message: '邀请发送成功',
    });
    } catch (error: any) {
    try {
      const supabase = await createClient();
      const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      const newLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        userId: 'api_user',
        userName: 'API Service',
        action: 'invite_collaborator',
        level: 'error',
        resourceType: 'quote_collaboration',
        details: {
          error: error.message || String(error),
          stack: error.stack,
          requestBody: undefined
        },
        ipAddress,
        userAgent,
        createdAt: new Date().toISOString()
      };
      
      await supabase
        .from('logs')
        .insert(newLog)
        .select()
        .single();
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return NextResponse.json(
      { error: error.message || '发送邀请失败，请重试' },
      { status: 500 }
    );
  }
}
