import { NextRequest, NextResponse } from 'next/server';
import { submitTenantApplication } from '@/features/platform/actions/tenant-registration';
import { z } from 'zod';
import { logger } from '@/shared/lib/logger';

// 验证 Schema
const registerSchema = z.object({
  companyName: z.string().min(2, '企业名称至少 2 个字').max(100),
  applicantName: z.string().min(2, '联系人姓名至少 2 个字').max(50),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  email: z.string().email('邮箱格式不正确'),
  password: z
    .string()
    .min(8, '密码至少 8 位')
    .regex(/(?=.*[a-zA-Z])(?=.*\d)/, '密码需包含字母和数字'),
  region: z.string().min(2, '请选择地区'),
  businessDescription: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || '参数错误',
        },
        { status: 400 }
      );
    }

    const result = await submitTenantApplication(parsed.data);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: { tenantId: result.tenantId },
      message: '提交企业入驻申请成功',
    });
  } catch (error: unknown) {
    logger.error('[MiniProgram API] 提交入驻申请发生异常', error);
    return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
  }
}
