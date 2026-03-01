import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/health/route';

vi.mock('@/shared/api/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock('drizzle-orm', () => ({
  sql: vi.fn((strings: TemplateStringsArray) => strings.join('')),
}));

describe('Health Check Endpoint (Monitoring)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('数据库连接正常时，端点可用性探测应返回 200 和 healthy 状态', async () => {
    const { db } = await import('@/shared/api/db');
    vi.mocked(db.execute).mockResolvedValueOnce({} as any);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.status).toBe('healthy');
    expect(json.dbStatus).toBe('connected');
  });

  it('数据库连接失败时，端点可用性探测应返回 503 和 unhealthy 状态', async () => {
    const { db } = await import('@/shared/api/db');
    vi.mocked(db.execute).mockRejectedValueOnce(new Error('Connection failed'));

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.status).toBe('unhealthy');
    expect(json.dbStatus).toBe('disconnected');
    expect(json.error).toBe('Connection failed');
  });
});
