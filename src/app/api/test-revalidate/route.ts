import { updateTag } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * 测试缓存失效的调试路由
 * 用于验证 updateTag 是否正常工作
 */
export async function GET() {
  try {
    updateTag('quotes');
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
