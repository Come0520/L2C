import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { quoteCollaborationService } from '@/services/quote-collaboration.client';

// Validation schema for collaboration invite
const collaborationInviteSchema = z.object({
  slide_id: z.string().min(1, 'slide_id is required'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, 'Invalid phone number format'),
  permission: z.enum(['view', 'edit', 'admin'], { message: 'Invalid permission type' })
});

// POST /api/collaboration/invite - 邀请协作者
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = collaborationInviteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }

    const { slide_id, phone, permission } = validationResult.data;

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
