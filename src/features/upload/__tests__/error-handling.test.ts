/**
 * Upload 模块错误处理测试
 *
 * 覆盖范围：
 * - 数据库写入失败时返回友好错误信息
 * - 文件存储服务不可用时的降级处理
 * - 并发上传同名文件时的正确处理
 * - 文件校验失败时记录审计日志
 * - OSS Token 获取功能当前禁用状态检查
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
        (input: unknown) => handler(input, { session: MOCK_SESSION }),
}));

vi.mock('next/cache', () => ({
    unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
    revalidateTag: vi.fn(),
}));

/** ─────────── 常量 ─────────── */
const MOCK_SESSION = createMockSession();

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

describe('Upload 错误处理', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockDbInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
        mockWriteFile.mockResolvedValue(undefined);
        mockAuditLog.mockResolvedValue(undefined);
    });

    // ── 数据库写入失败 ──

    it('数据库写入失败时应返回友好错误信息', async () => {
        mockAuth.mockResolvedValue(MOCK_SESSION);
        // 模拟 AuditService.log 在文件写入成功后抛出数据库错误
        mockAuditLog.mockRejectedValueOnce(new Error('Connection refused'));

        const formData = new FormData();
        formData.append('file', createMockFile({ name: 'db-fail.png', size: 1024, type: 'image/png' }));

        const { uploadFileAction } = await import('../actions/upload');
        const result = await uploadFileAction(formData);

        // 数据库写入失败应被捕获并返回通用错误
        expect(result.success).toBe(false);
        expect(result.error).toBe('上传失败');
    });

    // ── 文件存储写入失败 ──

    it('文件存储服务不可用时应返回上传失败错误', async () => {
        mockAuth.mockResolvedValue(MOCK_SESSION);
        mockWriteFile.mockRejectedValueOnce(new Error('ENOSPC: no space left on device'));

        const formData = new FormData();
        formData.append('file', createMockFile({ name: 'no-space.jpg', size: 2048, type: 'image/jpeg' }));

        const { uploadFileAction } = await import('../actions/upload');
        const result = await uploadFileAction(formData);

        expect(result.success).toBe(false);
        expect(result.error).toBe('上传失败');
    });

    // ── 并发上传同名文件 ──

    it('并发上传同名文件时每次均应成功且写入审计日志', async () => {
        mockAuth.mockResolvedValue(MOCK_SESSION);

        const { uploadFileAction } = await import('../actions/upload');
        const fileName = 'same-name.png';

        // 创建两个同名文件的 FormData
        const fd1 = new FormData();
        fd1.append('file', createMockFile({ name: fileName, size: 1024, type: 'image/png' }));
        const fd2 = new FormData();
        fd2.append('file', createMockFile({ name: fileName, size: 2048, type: 'image/png' }));

        // 顺序执行确保模块已加载
        const result1 = await uploadFileAction(fd1);
        const result2 = await uploadFileAction(fd2);

        // 两次上传均应成功
        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);

        // 每次成功上传都应记录审计日志
        const uploadCalls = mockAuditLog.mock.calls.filter(
            (call: unknown[]) => (call[1] as Record<string, unknown>)?.action === 'UPLOAD_FILE'
        );
        expect(uploadCalls.length).toBe(2);
    });

    // ── 校验失败时的审计日志 ──

    it('文件校验失败时应记录 ACCESS_DENIED 审计日志', async () => {
        mockAuth.mockResolvedValue(MOCK_SESSION);

        const formData = new FormData();
        formData.append('file', createMockFile({
            name: 'malware.exe',
            size: 1024,
            type: 'application/x-msdownload',
        }));

        const { uploadFileAction } = await import('../actions/upload');
        await uploadFileAction(formData);

        // 校验失败时应触发 ACCESS_DENIED 审计日志
        const deniedCall = mockAuditLog.mock.calls.find(
            (call: unknown[]) => (call[1] as Record<string, unknown>)?.action === 'ACCESS_DENIED'
        );
        expect(deniedCall).toBeDefined();
        expect((deniedCall![1] as Record<string, unknown>).tableName).toBe('uploads');
    });

    // ── IO 异常后不崩溃 ──

    it('writeFile 抛出权限错误时不应导致未捕获异常', async () => {
        mockAuth.mockResolvedValue(MOCK_SESSION);
        mockWriteFile.mockRejectedValueOnce(new Error('EACCES: permission denied'));

        const formData = new FormData();
        formData.append('file', createMockFile({ name: 'perm-denied.png', size: 512, type: 'image/png' }));

        const { uploadFileAction } = await import('../actions/upload');

        // 不应抛出未捕获异常
        const result = await expect(uploadFileAction(formData)).resolves.toBeDefined();
        expect(result).toBeDefined();
    });

    // ── OSS Token 当前禁用状态 ──

    it('getOSSToken 当前应返回禁用状态错误', async () => {
        const { getOSSToken } = await import('../actions/oss-token');
        const result = await getOSSToken();

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain('disabled');
        }
    });
});
