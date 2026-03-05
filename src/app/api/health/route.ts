import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const commitSha = process.env.NEXT_PUBLIC_GIT_COMMIT_SHA || 'unknown';
  let dbStatus = 'unknown';
  let authReady = false;
  let errorDetail = '';

  try {
    const { db } = await import('@/shared/api/db');
    const { sql } = await import('drizzle-orm');

    // 基础连接检查
    await db.execute(sql`SELECT 1`);
    dbStatus = 'connected';

    // 认证子系统就绪检查：验证 users 表可查询（防止 Schema 不匹配导致登录不可用）
    await db.execute(sql`SELECT id FROM users LIMIT 1`);
    authReady = true;
  } catch (error) {
    console.error('Health check failed:', error);
    dbStatus = dbStatus === 'connected' ? 'connected' : 'disconnected';
    errorDetail = error instanceof Error ? error.message : String(error);
  }

  const isHealthy = dbStatus === 'connected' && authReady;

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: commitSha,
      dbStatus,
      authReady,
      error: errorDetail || undefined,
    },
    { status: isHealthy ? 200 : 503 }
  );
}
