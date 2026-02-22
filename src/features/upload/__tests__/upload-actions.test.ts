/**
 * Upload 模块 Server Actions 测试
 *
 * 覆盖范围：
 * - uploadFileAction 认证检查（未登录/无 tenantId）
 * - 文件大小超限拒绝（>10MB）
 * - 非法 MIME 类型拒绝（如 .exe）
 * - 正常上传返回包含 tenantId 的文件 URL
 * - 上传成功后写入审计日志
 * - 路径遍历攻击防护（文件名含 ../）
 * - 空文件字段处理（FormData 无 file）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSession } from '@/shared/tests/mock-factory';

/** ─────────── Hoisted Mock Refs（必须在 vi.mock 之前提升）─────────── */
const { mockAuth, mockWriteFile, mockDbInsert } = vi.hoisted(() => {
    const mockWriteFileFn = vi.fn().mockResolvedValue(undefined);
    const mockAuthFn = vi.fn();
    const mockInsertValuesFn = vi.fn().mockResolvedValue(undefined);
    const mockInsertFn = vi.fn().mockReturnValue({ values: mockInsertValuesFn });
    return {
        mockAuth: mockAuthFn,
        mockWriteFile: mockWriteFileFn,
        mockDbInsert: mockInsertFn,
    };
});

/** ─────────── 顶层 Mock 配置 ─────────── */

vi.mock('@/shared/lib/auth', () => ({ auth: mockAuth }));

// 直接用固定 mock 覆盖 fs/promises（Node 内置模块必须同时导出命名字段和 default）
vi.mock('fs/promises', () => ({
    writeFile: mockWriteFile,
    default: {
        writeFile: mockWriteFile,
    },
}));


// fs 仅用到 existsSync / mkdirSync，直接提供 default
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
    logger: { info: vi.fn(), error: vi.fn() },
}));

vi.mock('@/shared/lib/server-action', () => ({
    createSafeAction: (_schema: unknown, handler: (p: unknown, ctx: unknown) => unknown) =>
        (input: unknown) => handler(input, { session: MOCK_SESSION }),
}));

/** ─────────── 常量 ─────────── */
const MOCK_SESSION = createMockSession();

/** ─────────── 工具函数：构造 Mock File ─────────── */
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

describe('Upload Actions (L5)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // 恢复 insert 链式调用（clearAllMocks 会清除 mockReturnValue）
        mockDbInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
        mockWriteFile.mockResolvedValue(undefined);
    });

    // ── 认证检查 ──

    describe('uploadFileAction - 认证检查', () => {
        it('未登录时应返回未授权错误', async () => {
            mockAuth.mockResolvedValue(null);

            const formData = new FormData();
            formData.append('file', createMockFile({ name: 'test.png', size: 1024, type: 'image/png' }));

            const { uploadFileAction } = await import('../actions/upload');
            const result = await uploadFileAction(formData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('未授权访问');
        });

        it('session 无 tenantId 时应返回未授权错误', async () => {
            mockAuth.mockResolvedValue({ user: { id: 'user-1' }, expires: '' });

            const formData = new FormData();
            formData.append('file', createMockFile({ name: 'test.png', size: 1024, type: 'image/png' }));

            const { uploadFileAction } = await import('../actions/upload');
            const result = await uploadFileAction(formData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('未授权访问');
        });
    });

    // ── 文件大小校验 ──

    describe('uploadFileAction - 文件大小校验', () => {
        it('文件大小超 10MB 时应被拒绝', async () => {
            mockAuth.mockResolvedValue(MOCK_SESSION);

            const formData = new FormData();
            formData.append('file', createMockFile({
                name: 'large.jpg', size: 10 * 1024 * 1024 + 1, type: 'image/jpeg',
            }));

            const { uploadFileAction } = await import('../actions/upload');
            const result = await uploadFileAction(formData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('10MB');
        });

        it('文件大小恰好 10MB 时应被允许', async () => {
            mockAuth.mockResolvedValue(MOCK_SESSION);

            const formData = new FormData();
            formData.append('file', createMockFile({
                name: 'exactly10mb.jpg', size: 10 * 1024 * 1024, type: 'image/jpeg',
            }));

            const { uploadFileAction } = await import('../actions/upload');
            const result = await uploadFileAction(formData);

            expect(result.success).toBe(true);
        });
    });

    // ── MIME 类型校验 ──

    describe('uploadFileAction - MIME 类型校验', () => {
        it('可执行文件（application/x-msdownload）应被拒绝', async () => {
            mockAuth.mockResolvedValue(MOCK_SESSION);

            const formData = new FormData();
            formData.append('file', createMockFile({
                name: 'virus.exe', size: 1024, type: 'application/x-msdownload',
            }));

            const { uploadFileAction } = await import('../actions/upload');
            const result = await uploadFileAction(formData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('不支持的文件类型');
        });

        it('JS 脚本文件（text/javascript）应被拒绝', async () => {
            mockAuth.mockResolvedValue(MOCK_SESSION);

            const formData = new FormData();
            formData.append('file', createMockFile({
                name: 'malicious.js', size: 512, type: 'text/javascript',
            }));

            const { uploadFileAction } = await import('../actions/upload');
            const result = await uploadFileAction(formData);

            expect(result.success).toBe(false);
        });

        it('合法 Word 文档（.docx）应被允许', async () => {
            mockAuth.mockResolvedValue(MOCK_SESSION);

            const formData = new FormData();
            formData.append('file', createMockFile({
                name: 'report.docx',
                size: 50 * 1024,
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            }));

            const { uploadFileAction } = await import('../actions/upload');
            const result = await uploadFileAction(formData);

            expect(result.success).toBe(true);
        });

        it('PDF 文件应被允许上传', async () => {
            mockAuth.mockResolvedValue(MOCK_SESSION);

            const formData = new FormData();
            formData.append('file', createMockFile({
                name: 'contract.pdf', size: 200 * 1024, type: 'application/pdf',
            }));

            const { uploadFileAction } = await import('../actions/upload');
            const result = await uploadFileAction(formData);

            expect(result.success).toBe(true);
        });
    });

    // ── 正常上传 ──

    describe('uploadFileAction - 正常上传', () => {
        it('合法图片应返回包含 tenantId 的文件 URL', async () => {
            mockAuth.mockResolvedValue(MOCK_SESSION);

            const formData = new FormData();
            formData.append('file', createMockFile({
                name: 'product.png', size: 200 * 1024, type: 'image/png',
            }));

            const { uploadFileAction } = await import('../actions/upload');
            const result = await uploadFileAction(formData);

            expect(result.success).toBe(true);
            expect(result.url).toContain('test-tenant-id');
        });

        it('上传成功后应写入审计日志', async () => {
            mockAuth.mockResolvedValue(MOCK_SESSION);

            const formData = new FormData();
            formData.append('file', createMockFile({
                name: 'audit.jpg', size: 1024, type: 'image/jpeg',
            }));

            const { uploadFileAction } = await import('../actions/upload');
            await uploadFileAction(formData);

            expect(mockDbInsert).toHaveBeenCalled();
        });
    });

    // ── 路径遍历防护 ──

    describe('uploadFileAction - 路径遍历防护', () => {
        it('文件名含 ../ 时 URL 不应泄露遍历路径', async () => {
            mockAuth.mockResolvedValue(MOCK_SESSION);

            const formData = new FormData();
            formData.append('file', createMockFile({
                name: '../../../etc/passwd', size: 512, type: 'image/png',
            }));

            const { uploadFileAction } = await import('../actions/upload');
            const result = await uploadFileAction(formData);

            if (result.success) {
                expect(result.url).not.toContain('../');
                expect(result.url).not.toContain('etc/passwd');
            }
        });

        it('文件名含特殊字符时应被安全净化', async () => {
            mockAuth.mockResolvedValue(MOCK_SESSION);

            const formData = new FormData();
            formData.append('file', createMockFile({
                name: 'file name (1) <bad>.png', size: 1024, type: 'image/png',
            }));

            const { uploadFileAction } = await import('../actions/upload');
            const result = await uploadFileAction(formData);

            if (result.success) {
                expect(result.url).not.toMatch(/[ <>]/);
            }
        });
    });

    // ── 空文件处理 ──

    describe('uploadFileAction - 空文件处理', () => {
        it('FormData 无 file 字段时应返回错误', async () => {
            mockAuth.mockResolvedValue(MOCK_SESSION);

            const { uploadFileAction } = await import('../actions/upload');
            const result = await uploadFileAction(new FormData());

            expect(result.success).toBe(false);
            expect(result.error).toBe('未上传文件');
        });
    });

    // ── L5 边界场景：并发上传 ──

    describe('uploadFileAction - 并发上传', () => {
        it('多个文件同时上传应全部成功', async () => {
            mockAuth.mockResolvedValue(MOCK_SESSION);

            const { uploadFileAction } = await import('../actions/upload');
            const files = Array.from({ length: 5 }, (_, i) => {
                const fd = new FormData();
                fd.append('file', createMockFile({
                    name: `concurrent-${i}.png`, size: 1024, type: 'image/png',
                }));
                return fd;
            });

            const results = await Promise.all(files.map(fd => uploadFileAction(fd)));

            results.forEach(r => {
                expect(r.success).toBe(true);
            });

            // 每次上传都应写入审计日志
            expect(mockDbInsert).toHaveBeenCalledTimes(5);
        });
    });

    // ── L5 边界场景：写入失败 ──

    describe('uploadFileAction - 磁盘写入失败', () => {
        it('writeFile 抛出异常时应返回 "上传失败"', async () => {
            mockAuth.mockResolvedValue(MOCK_SESSION);
            mockWriteFile.mockRejectedValueOnce(new Error('ENOSPC: disk full'));

            const formData = new FormData();
            formData.append('file', createMockFile({
                name: 'disk-full.png', size: 1024, type: 'image/png',
            }));

            const { uploadFileAction } = await import('../actions/upload');
            const result = await uploadFileAction(formData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('上传失败');
        });
    });

    // ── L5 边界场景：零字节文件 ──

    describe('uploadFileAction - 零字节文件', () => {
        it('大小为 0 的文件应被 Zod 校验拒绝', async () => {
            mockAuth.mockResolvedValue(MOCK_SESSION);

            const formData = new FormData();
            formData.append('file', createMockFile({
                name: 'empty.png', size: 0, type: 'image/png',
            }));

            const { uploadFileAction } = await import('../actions/upload');
            const result = await uploadFileAction(formData);

            expect(result.success).toBe(false);
        });
    });

    // ── L5 边界场景：超长文件名 ──

    describe('uploadFileAction - 超长文件名', () => {
        it('文件名超过 255 字符应被 Zod 校验拒绝', async () => {
            mockAuth.mockResolvedValue(MOCK_SESSION);
            const longName = 'a'.repeat(256) + '.png';

            const formData = new FormData();
            formData.append('file', createMockFile({
                name: longName, size: 1024, type: 'image/png',
            }));

            const { uploadFileAction } = await import('../actions/upload');
            const result = await uploadFileAction(formData);

            expect(result.success).toBe(false);
        });
    });

    // ── L5 边界场景：双重扩展名攻击 ──

    describe('uploadFileAction - 双重扩展名欺骗', () => {
        it('恶意双重扩展名（如 .png.exe）应被 MIME 校验拦截', async () => {
            mockAuth.mockResolvedValue(MOCK_SESSION);

            const formData = new FormData();
            formData.append('file', createMockFile({
                name: 'photo.png.exe', size: 1024, type: 'application/x-msdownload',
            }));

            const { uploadFileAction } = await import('../actions/upload');
            const result = await uploadFileAction(formData);

            expect(result.success).toBe(false);
        });
    });

    // ── L5 边界场景：Unicode 文件名 ──

    describe('uploadFileAction - Unicode / CJK 文件名', () => {
        it('中文文件名应被安全净化为下划线', async () => {
            mockAuth.mockResolvedValue(MOCK_SESSION);

            const formData = new FormData();
            formData.append('file', createMockFile({
                name: '产品报价单.xlsx', size: 2048,
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            }));

            const { uploadFileAction } = await import('../actions/upload');
            const result = await uploadFileAction(formData);

            expect(result.success).toBe(true);
            if (result.success) {
                // 中文字符应被替换为下划线，但 .xlsx 扩展名保留
                expect(result.url).toContain('.xlsx');
                expect(result.url).not.toMatch(/[\u4e00-\u9fff]/);
            }
        });
    });
});
