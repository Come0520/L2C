/**
 * Upload 模块安全与权限测试
 *
 * 覆盖范围：
 * - 无 session 的上传请求被拒绝
 * - 租户隔离：租户 A 无法访问租户 B 的文件
 * - 非法 tenantId 请求处理
 * - 上传操作审计日志记录
 * - 删除操作认证检查与审计日志
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSession } from '@/shared/tests/mock-factory';

/** ─────────── Hoisted Mock Refs ─────────── */
const { mockAuth, mockWriteFile, mockDbInsert, mockAuditLog } = vi.hoisted(() => {
    const mockWriteFileFn = vi.fn().mockResolvedValue(undefined);
    const mockAuthFn = vi.fn();
    const mockInsertValuesFn = vi.fn().mockResolvedValue(undefined);
    const mockInsertFn = vi.fn().mockReturnValue({ values: mockInsertValuesFn });
    const mockAuditLogFn = vi.fn().mockResolvedValue(undefined);
    return {
        mockAuth: mockAuthFn,
        mockWriteFile: mockWriteFileFn,
        mockDbInsert: mockInsertFn,
        mockAuditLog: mockAuditLogFn,
    };
});

/** ─────────── 顶层 Mock 配置 ─────────── */

vi.mock('@/shared/lib/auth', () => ({ auth: mockAuth }));

vi.mock('fs/promises', () => ({
    writeFile: mockWriteFile,
    default: { writeFile: mockWriteFile },
}));

vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn().mockReturnValue(true),
        mkdirSync: vi.fn(),
    },
}));

vi.mock('@/shared/api/db', () => ({
    db: { insert: mockDbInsert },
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: mockAuditLog },
}));

vi.mock('@/shared/lib/server-action', () => ({
    createSafeAction: (_schema: unknown, handler: (p: unknown, ctx: unknown) => unknown) =>
        (input: unknown) => handler(input, { session: MOCK_SESSION_A }),
}));

vi.mock('next/cache', () => ({
    unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
    revalidateTag: vi.fn(),
}));

/** ─────────── 常量 ─────────── */
const TENANT_A_ID = 'tenant-aaaa-1111';
const TENANT_B_ID = 'tenant-bbbb-2222';

const MOCK_SESSION_A = createMockSession({
    user: { id: 'user-a', tenantId: TENANT_A_ID, role: 'SALES', name: '用户A' },
});

const MOCK_SESSION_B = createMockSession({
    user: { id: 'user-b', tenantId: TENANT_B_ID, role: 'SALES', name: '用户B' },
});

/** ─────────── 工具函数 ─────────── */
function createMockFile(options: { name: string; size: number; type: string }): File {
    const file = new File(['x'], options.name, { type: options.type });
    Object.defineProperty(file, 'size', { value: options.size, configurable: true });
    Object.defineProperty(file, 'arrayBuffer', {
        value: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
        configurable: true,
    });
    return file;
}

/** ─────────── 测试套件 ─────────── */

describe('Upload 安全与权限', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockDbInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
        mockWriteFile.mockResolvedValue(undefined);
        mockAuditLog.mockResolvedValue(undefined);
    });

    // ── 无 session 的上传请求应被拒绝 ──

    it('无 session 的上传请求应被拒绝', async () => {
        mockAuth.mockResolvedValue(null);

        const formData = new FormData();
        formData.append('file', createMockFile({ name: 'test.png', size: 1024, type: 'image/png' }));

        const { uploadFileAction } = await import('../actions/upload');
        const result = await uploadFileAction(formData);

        expect(result.success).toBe(false);
        expect(result.error).toBe('未授权访问');
    });

    // ── 租户隔离 ──

    it('租户 A 的上传文件 URL 包含自身 tenantId，而非租户 B', async () => {
        mockAuth.mockResolvedValue(MOCK_SESSION_A);

        const formData = new FormData();
        formData.append('file', createMockFile({ name: 'report.pdf', size: 5000, type: 'application/pdf' }));

        const { uploadFileAction } = await import('../actions/upload');
        const result = await uploadFileAction(formData);

        expect(result.success).toBe(true);
        if (result.success) {
            // 文件 URL 应包含租户 A 的 ID
            expect(result.url).toContain(TENANT_A_ID);
            // 不应包含租户 B 的 ID
            expect(result.url).not.toContain(TENANT_B_ID);
        }
    });

    // ── 非法 tenantId 请求处理 ──

    it('session 中无 tenantId 时应返回未授权错误', async () => {
        mockAuth.mockResolvedValue({
            user: { id: 'user-no-tenant', role: 'SALES', name: '无租户用户' },
            expires: new Date().toISOString(),
        });

        const formData = new FormData();
        formData.append('file', createMockFile({ name: 'test.png', size: 1024, type: 'image/png' }));

        const { uploadFileAction } = await import('../actions/upload');
        const result = await uploadFileAction(formData);

        expect(result.success).toBe(false);
        expect(result.error).toBe('未授权访问');
    });

    // ── 上传操作审计日志 ──

    it('上传操作应记录审计日志（AuditService）', async () => {
        mockAuth.mockResolvedValue(MOCK_SESSION_A);

        const formData = new FormData();
        formData.append('file', createMockFile({ name: 'audit-test.jpg', size: 2048, type: 'image/jpeg' }));

        const { uploadFileAction } = await import('../actions/upload');
        await uploadFileAction(formData);

        // AuditService.log 应被调用（上传成功触发审计日志）
        expect(mockAuditLog).toHaveBeenCalled();
        // 审计日志应包含正确的 action 和 tenantId
        const auditCall = mockAuditLog.mock.calls.find(
            (call: unknown[]) => (call[1] as Record<string, unknown>)?.action === 'UPLOAD_FILE'
        );
        expect(auditCall).toBeDefined();
        expect((auditCall![1] as Record<string, unknown>).tenantId).toBe(TENANT_A_ID);
    });

    // ── 删除操作认证检查 ──

    it('未登录时删除文件应返回未授权错误', async () => {
        mockAuth.mockResolvedValue(null);

        const { deleteUploadedFileAction } = await import('../actions/upload');
        const result = await deleteUploadedFileAction('some-file-id');

        expect(result.success).toBe(false);
        expect(result.error).toBe('未授权');
    });

    // ── 删除操作审计日志 ──

    it('删除操作应记录审计日志', async () => {
        mockAuth.mockResolvedValue(MOCK_SESSION_A);

        const { deleteUploadedFileAction } = await import('../actions/upload');
        await deleteUploadedFileAction('delete-target-file');

        expect(mockAuditLog).toHaveBeenCalled();
        const deleteCall = mockAuditLog.mock.calls.find(
            (call: unknown[]) => (call[1] as Record<string, unknown>)?.action === 'DELETE'
        );
        expect(deleteCall).toBeDefined();
        expect((deleteCall![1] as Record<string, unknown>).recordId).toBe('delete-target-file');
    });
});
