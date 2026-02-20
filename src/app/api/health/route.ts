import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const commitSha = process.env.NEXT_PUBLIC_GIT_COMMIT_SHA || 'unknown';
  let dbStatus = 'unknown';
  let errorDetail = '';

  try {
    // Dynamic import to prevent route crash if DB config is missing
    const { db } = await import('@/shared/api/db');
    const { sql } = await import('drizzle-orm');

    // Execute a simple query to check database connectivity
    await db.execute(sql`SELECT 1`);
    dbStatus = 'connected';
  } catch (error) {
    console.error('Health check DB connection failed:', error);
    dbStatus = 'disconnected';
    errorDetail = error instanceof Error ? error.message : String(error);
  }

  const isHealthy = dbStatus === 'connected';

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: commitSha,
      dbStatus,
      error: errorDetail || undefined,
    },
    { status: isHealthy ? 200 : 503 }
  );
}
