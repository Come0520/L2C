/**
 * 移动端 API 审计日志单元测试
 * 验证所有移动端路由正确记录审计日志，包含 traceId、userAgent、ipAddress 等追踪元数据
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { AuditService } from '@/shared/services/audit-service';
import { authenticateMobile } from '@/shared/middleware/mobile-auth';

// ===== Mock：数据库 (db) =====
// 提供链式调用支持：db.update().set().where()、db.select().from().where()
const mockWhere = vi.fn().mockResolvedValue([{}]);
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelectFn = vi.fn(() => ({ from: mockFrom }));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            installTasks: { findFirst: vi.fn() },
            measureTasks: { findFirst: vi.fn() }
        },
        update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue([{}]) })) })),
        select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([{ count: 3 }]) })) })),
        insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => [{}]) })) })),
        transaction: vi.fn((cb: (...args: any[]) => any) => cb({
            update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue([{}]) })) })),
            insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => [{}]) })) })),
            query: {
                installTasks: { findFirst: vi.fn() },
                measureTasks: { findFirst: vi.fn() }
            }
        }))
    }
}));

// ===== Mock：审计服务 =====
vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: vi.fn().mockResolvedValue(undefined) }
}));

// ===== Mock：移动端认证中间件 =====
vi.mock('@/shared/middleware/mobile-auth', () => ({
    authenticateMobile: vi.fn(),
    requireWorker: vi.fn(() => ({ allowed: true }))
}));

// ===== Mock：速率限制器 =====
vi.mock('@/shared/middleware/rate-limiter', () => ({
    withRateLimit: (handler: (...args: any[]) => any) => handler,
    getRateLimitKey: () => () => 'key'
}));

// ===== Mock：日志 =====
vi.mock('@/shared/lib/logger', () => ({
    createLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() })
}));

// ===== Mock：drizzle-orm 操作符 =====
vi.mock('drizzle-orm', () => ({
    eq: vi.fn((_col: unknown, val: unknown) => val),
    and: vi.fn((...args: unknown[]) => args),
    count: vi.fn(() => 'count_fn'),
    sql: vi.fn(),
}));

// ===== Mock：schema =====
vi.mock('@/shared/api/schema', () => ({
    installTasks: { id: 'install_tasks.id', tenantId: 'install_tasks.tenantId', installerId: 'install_tasks.installerId', $inferSelect: {} },
    measureTasks: { id: 'measure_tasks.id', tenantId: 'measure_tasks.tenantId', assignedWorkerId: 'measure_tasks.assignedWorkerId', $inferSelect: {} },
    installPhotos: { installTaskId: 'install_photos.installTaskId' },
    auditLogs: {},
}));

// ===== Mock：API 响应工具 =====
vi.mock('@/shared/lib/api-response', () => ({
    apiSuccess: vi.fn((data: unknown, message?: string) =>
        new Response(JSON.stringify({ success: true, data, message }), { status: 200 })
    ),
    apiError: vi.fn((message: string, status = 400) =>
        new Response(JSON.stringify({ success: false, error: message }), { status })
    ),
    apiNotFound: vi.fn((message: string) =>
        new Response(JSON.stringify({ success: false, error: message }), { status: 404 })
    ),
    apiForbidden: vi.fn((message: string) =>
        new Response(JSON.stringify({ success: false, error: message }), { status: 403 })
    ),
}));

// ===== 动态导入路由处理器（确保 mock 先注册） =====
const importHandlers = async () => {
    const completeRoute = await import('@/app/api/mobile/tasks/[id]/complete/route');
    const installCheckInRoute = await import('@/app/api/mobile/tasks/[id]/install-check-in/route');
    const installCompleteRoute = await import('@/app/api/mobile/tasks/[id]/install-complete/route');
    const acceptRoute = await import('@/app/api/mobile/tasks/[id]/accept/route');
    const installAcceptRoute = await import('@/app/api/mobile/tasks/[id]/install-accept/route');
    return {
        complete: completeRoute.POST,
        installCheckIn: installCheckInRoute.POST,
        installComplete: installCompleteRoute.POST,
        accept: acceptRoute.POST,
        installAccept: installAcceptRoute.POST
    };
};

describe('移动端 API 审计日志', () => {
     
    let handlers: Awaited<ReturnType<typeof importHandlers>>;
    const mockSession = {
        tenantId: 't1',
        userId: 'u1',
        role: 'WORKER',
        traceId: 'trace-abc-123',
        userAgent: 'MobileApp/1.0',
        ipAddress: '192.168.1.100'
    };

    beforeEach(async () => {
        vi.clearAllMocks();
         
        (authenticateMobile as any).mockResolvedValue({ success: true, session: mockSession });
        handlers = await importHandlers();
    });

    // ----- 测试1：任务完工 (complete) -----
    it('任务完工应记录 COMPLETE_MOBILE 审计日志', async () => {
         
        (db.query.measureTasks.findFirst as any).mockResolvedValue({
            id: 'task-1', status: 'IN_PROGRESS', assignedWorkerId: 'u1', tenantId: 't1'
        });

        const req = new NextRequest('http://test/api/mobile/tasks/task-1/complete', {
            method: 'POST',
            body: JSON.stringify({})
        });

        await handlers.complete(req, { params: Promise.resolve({ id: 'task-1' }) });

        expect(AuditService.log).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                action: 'COMPLETE_MOBILE',
                traceId: 'trace-abc-123',
                userAgent: 'MobileApp/1.0',
                ipAddress: '192.168.1.100',
            })
        );
    });

    // ----- 测试2：安装签到 (install-check-in) -----
    it('安装签到应记录 INSTALL_CHECK_IN_MOBILE 审计日志', async () => {
        // 返回状态为 PENDING_VISIT 且 installerId 匹配当前用户
         
        (db.query.installTasks.findFirst as any).mockResolvedValue({
            id: 'task-2', status: 'PENDING_VISIT', installerId: 'u1', tenantId: 't1'
        });

        const req = new NextRequest('http://test/api/mobile/tasks/task-2/install-check-in', {
            method: 'POST',
            body: JSON.stringify({ latitude: 30.123, longitude: 120.456, accuracy: 10, address: '杭州市西湖区' })
        });

        // install-check-in 的 POST 签名：POST(request, { params })
        await handlers.installCheckIn(req, { params: Promise.resolve({ id: 'task-2' }) });

        expect(AuditService.log).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                action: 'INSTALL_CHECK_IN_MOBILE',
                tableName: 'install_tasks',
                recordId: 'task-2',
                traceId: 'trace-abc-123',
            })
        );
    });

    // ----- 测试3：安装完工 (install-complete) -----
    it('安装完工应记录 INSTALL_COMPLETE_MOBILE 审计日志', async () => {
        // 任务状态 IN_PROGRESS，installerId 匹配
         
        (db.query.installTasks.findFirst as any).mockResolvedValue({
            id: 'task-3', status: 'IN_PROGRESS', installerId: 'u1', tenantId: 't1'
        });

        const req = new NextRequest('http://test/api/mobile/tasks/task-3/install-complete', {
            method: 'POST',
            body: JSON.stringify({ latitude: 30.1, longitude: 120.4, accuracy: 5, address: '地址' })
        });

        await handlers.installComplete(req, { params: Promise.resolve({ id: 'task-3' }) });

        expect(AuditService.log).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                action: 'INSTALL_COMPLETE_MOBILE',
                tableName: 'install_tasks',
                recordId: 'task-3',
                traceId: 'trace-abc-123',
            })
        );
    });

    // ----- 测试4：测量任务接单 (accept) -----
    it('测量任务接单应记录 ACCEPT_TASK_MOBILE 审计日志', async () => {
        // accept 路由先查 measureTasks，需要 assignedWorkerId 匹配 + 状态为 PENDING_ACCEPT
         
        (db.query.measureTasks.findFirst as any).mockResolvedValue({
            id: 'task-4', status: 'PENDING_ACCEPT', assignedWorkerId: 'u1', tenantId: 't1'
        });

        const req = new NextRequest('http://test/api/mobile/tasks/task-4/accept', {
            method: 'POST',
            body: JSON.stringify({ accept: true })
        });

        // accept 路由签名：POST(request, props: { params: Promise<{ id }> })
        await handlers.accept(req, { params: Promise.resolve({ id: 'task-4' }) });

        expect(AuditService.log).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                action: 'ACCEPT_TASK_MOBILE',
                tableName: 'measure_tasks',
                recordId: 'task-4',
                traceId: 'trace-abc-123',
            })
        );
    });

    // ----- 测试5：安装任务拒单 (install-accept) -----
    it('安装任务拒单应记录 REJECT_TASK_MOBILE 审计日志', async () => {
        // install-accept 路由：action 为字符串 'accept' | 'reject'，状态需为 PENDING_ACCEPT
         
        (db.query.installTasks.findFirst as any).mockResolvedValue({
            id: 'task-5', status: 'PENDING_ACCEPT', installerId: 'u1', tenantId: 't1'
        });

        const req = new NextRequest('http://test/api/mobile/tasks/task-5/install-accept', {
            method: 'POST',
            body: JSON.stringify({ action: 'reject', reason: '工期冲突' })
        });

        await handlers.installAccept(req, { params: Promise.resolve({ id: 'task-5' }) });

        expect(AuditService.log).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                action: 'REJECT_TASK_MOBILE',
                tableName: 'install_tasks',
                recordId: 'task-5',
                traceId: 'trace-abc-123',
            })
        );
    });
});
