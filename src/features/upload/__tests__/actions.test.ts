/**
 * Upload 模块安全测试
 * 覆盖 Auth 保护、Zod 校验（文件类型/大小）、TenantId 隔离
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateUpload } from '../actions/upload';
import { auth } from '@/shared/lib/auth';

// ===== Mock 依赖 =====

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        insert: vi.fn(() => ({
            values: vi.fn().mockResolvedValue([]),
        })),
    },
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// ===== 常量 =====

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const USER_ID = '33333333-3333-3333-3333-333333333333';

const makeSession = (tenantId = TENANT_A) => ({
    user: { id: USER_ID, role: 'SALES', tenantId, name: '测试用户' },
});

const mockAuth = vi.mocked(auth);

// ===== 测试套件 =====

describe('Upload 模块安全测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Auth 保护', () => {
        it('未登录应返回 success: false', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await validateUpload({
                fileName: 'test.png',
                fileSize: 1024,
                mimeType: 'image/png',
            });
            expect(result.success).toBe(false);
        });

        it('已登录应通过校验', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await validateUpload({
                fileName: 'test.png',
                fileSize: 1024,
                mimeType: 'image/png',
            });
            expect(result.success).toBe(true);
        });
    });

    describe('Zod 校验 - 文件类型', () => {
        it('不支持的 MIME 类型应拒绝', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await validateUpload({
                fileName: 'script.sh',
                fileSize: 1024,
                mimeType: 'application/x-sh',
            });
            expect(result.success).toBe(false);
        });
    });

    describe('Zod 校验 - 文件大小', () => {
        it('超过 10MB 的文件应拒绝', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await validateUpload({
                fileName: 'huge.png',
                fileSize: 11 * 1024 * 1024,
                mimeType: 'image/png',
            });
            expect(result.success).toBe(false);
        });
    });

    describe('TenantId 隔离', () => {
        it('校验通过时应返回 tenantId', async () => {
            mockAuth.mockResolvedValue(makeSession(TENANT_A) as never);
            const result = await validateUpload({
                fileName: 'doc.pdf',
                fileSize: 5000,
                mimeType: 'application/pdf',
            });
            expect(result.success).toBe(true);
            expect((result.data as Record<string, unknown>)?.tenantId).toBe(TENANT_A);
        });
    });
});
