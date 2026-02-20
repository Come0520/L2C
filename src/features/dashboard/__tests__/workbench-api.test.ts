import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getTodos } from '@/app/api/workbench/todos/route';
import { GET as getAlerts } from '@/app/api/workbench/alerts/route';
import { auth } from '@/shared/lib/auth';
import { WorkbenchService } from '@/services/workbench.service';
import { NextResponse } from 'next/server';

// Mock auth
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

// Mock WorkbenchService
vi.mock('@/services/workbench.service', () => ({
    WorkbenchService: {
        getUnifiedTodos: vi.fn(),
        getAlerts: vi.fn(),
    },
}));

// Mock NextResponse
vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((data, options) => ({
            status: options?.status || 200,
            json: async () => data,
        })),
    },
}));

describe('Workbench API 路由集成测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/workbench/todos', () => {
        it('未授权请求应返回 401', async () => {
            (auth as any).mockResolvedValue(null);
            const res = await getTodos();
            expect(res.status).toBe(401);
            const data = await (res as any).json();
            expect(data.error).toBe('未授权');
        });

        it('授权请求且 Service 正常时应返回 200 和数据', async () => {
            const mockSession = { user: { id: 'u1', tenantId: 't1', roles: ['SALES'] } };
            const mockTodos = { categories: [], leads: [] };
            (auth as any).mockResolvedValue(mockSession);
            (WorkbenchService.getUnifiedTodos as any).mockResolvedValue(mockTodos);

            const res = await getTodos();
            expect(res.status).toBe(200);
            const data = await (res as any).json();
            expect(data).toEqual(mockTodos);
            expect(WorkbenchService.getUnifiedTodos).toHaveBeenCalledWith('t1', 'u1', ['SALES']);
        });

        it('Service 抛错时应返回 500', async () => {
            (auth as any).mockResolvedValue({ user: { id: 'u1', tenantId: 't1' } });
            (WorkbenchService.getUnifiedTodos as any).mockRejectedValue(new Error('SERVICE_ERROR'));

            const res = await getTodos();
            expect(res.status).toBe(500);
            const data = await (res as any).json();
            expect(data.error).toBe('获取待办事项失败');
        });
    });

    describe('GET /api/workbench/alerts', () => {
        it('授权请求且 Service 正常时应返回报警数据', async () => {
            const mockSession = { user: { tenantId: 't1' } };
            const mockAlerts = { categories: [], items: [] };
            (auth as any).mockResolvedValue(mockSession);
            (WorkbenchService.getAlerts as any).mockResolvedValue(mockAlerts);

            const res = await getAlerts();
            expect(res.status).toBe(200);
            const data = await (res as any).json();
            expect(data).toEqual(mockAlerts);
        });

        it('无租户 ID 时应返回 401', async () => {
            (auth as any).mockResolvedValue({ user: {} });
            const res = await getAlerts();
            expect(res.status).toBe(401);
        });
    });
});
