import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getTodos } from '@/app/api/workbench/todos/route';
import { GET as getAlerts } from '@/app/api/workbench/alerts/route';
import { auth } from '@/shared/lib/auth';
import { WorkbenchService } from '@/services/workbench.service';


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
            vi.mocked(auth).mockResolvedValue(null);
            const res = await getTodos();
            expect(res.status).toBe(401);
            const data = await (res as Response).json();
            expect(data.error).toBe('未授权');
        });

        it('授权请求且 Service 正常时应返回 200 和数据', async () => {
            const mockSession = { user: { id: 'u1', tenantId: 't1', roles: ['SALES'] } };
            const mockTodos = { categories: [], leads: [] };
            vi.mocked(auth).mockResolvedValue(mockSession as never);
            vi.mocked(WorkbenchService.getUnifiedTodos).mockResolvedValue(mockTodos as never);

            const res = await getTodos();
            expect(res.status).toBe(200);
            const data = await (res as Response).json();
            expect(data).toEqual(mockTodos);
            expect(WorkbenchService.getUnifiedTodos).toHaveBeenCalledWith('t1', 'u1', ['SALES']);
        });

        it('Service 抛错时应返回 500', async () => {
            vi.mocked(auth).mockResolvedValue({ user: { id: 'u1', tenantId: 't1' } } as never);
            vi.mocked(WorkbenchService.getUnifiedTodos).mockRejectedValue(new Error('SERVICE_ERROR'));

            const res = await getTodos();
            expect(res.status).toBe(500);
            const data = await (res as Response).json();
            expect(data.error).toBe('获取待办事项失败');
        });
    });

    describe('GET /api/workbench/alerts', () => {
        it('授权请求且 Service 正常时应返回报警数据', async () => {
            const mockSession = { user: { tenantId: 't1' } };
            const mockAlerts = { categories: [], items: [] };
            vi.mocked(auth).mockResolvedValue(mockSession as never);
            vi.mocked(WorkbenchService.getAlerts).mockResolvedValue(mockAlerts as never);

            const res = await getAlerts();
            expect(res.status).toBe(200);
            const data = await (res as Response).json();
            expect(data).toEqual(mockAlerts);
        });

        it('无租户 ID 时应返回 401', async () => {
            vi.mocked(auth).mockResolvedValue({ user: {} } as never);
            const res = await getAlerts();
            expect(res.status).toBe(401);
        });
    });
});
