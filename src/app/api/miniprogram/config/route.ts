import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      templates: {
        tenantApproved: process.env.WECHAT_TEMPLATE_TENANT_APPROVED || '',
        tenantRejected: process.env.WECHAT_TEMPLATE_TENANT_REJECTED || '',
        orderStatus: process.env.WECHAT_TEMPLATE_ORDER_STATUS || '',
        taskAssign: process.env.WECHAT_TEMPLATE_TASK_ASSIGN || '',
      },
    },
  });
}
