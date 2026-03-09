import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkOutInstallTaskAction } from '../actions';
import { fileService } from '@/shared/services/file-service';
import { AuditService } from '@/shared/services/audit-service';

// Mocks
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue({
        user: { id: 'worker-1', tenantId: 'tenant-1', name: 'Installer', role: 'INSTALLER' },
    }),
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        recordFromSession: vi.fn(),
    },
}));

vi.mock('@/shared/services/file-service', () => ({
    fileService: {
        uploadFile: vi.fn(),
    },
}));

const mockUpdateSet = vi.fn(() => ({
    where: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            installTasks: {
                findFirst: vi.fn(),
            },
        },
        update: vi.fn(() => ({
            set: mockUpdateSet,
        })),
    },
}));

describe('TDD: Check Out Action (完工签退)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('1. 如果上传的是 Base64 签名，应该先上传到 OSS，将链接落库', async () => {
        const { db } = await import('@/shared/api/db');

        (db.query.installTasks.findFirst as any).mockResolvedValue({
            id: 'task-1',
            tenantId: 'tenant-1',
            installerId: 'worker-1',
            checklistStatus: { allCompleted: true },
        });

        (fileService.uploadFile as any).mockResolvedValue({
            success: true,
            url: 'https://oss.aliyun.com/signatures/task-1-123.png',
        });

        const base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

        const result = await checkOutInstallTaskAction({
            id: 'task-1',
            location: { latitude: 30, longitude: 120 },
            customerSignatureUrl: base64Data,
        });

        expect(result.data?.success).toBe(true);

        // 验证是否调用了 fileService 上传
        expect(fileService.uploadFile).toHaveBeenCalledTimes(1);

        // 验证落库使用的字段是不是 OSS Url
        expect(mockUpdateSet).toHaveBeenCalledWith(
            expect.objectContaining({
                customerSignatureUrl: 'https://oss.aliyun.com/signatures/task-1-123.png'
            })
        );
    });

    it('2. 如果上传的已经是外部 URL (如 HTTPS)，直接落库', async () => {
        const { db } = await import('@/shared/api/db');

        (db.query.installTasks.findFirst as any).mockResolvedValue({
            id: 'task-1',
            tenantId: 'tenant-1',
            installerId: 'worker-1',
            checklistStatus: { allCompleted: true },
        });

        const existingUrl = 'https://l2c.oss-cn-hangzhou.aliyuncs.com/signatures/old.png';

        const result = await checkOutInstallTaskAction({
            id: 'task-1',
            location: { latitude: 30, longitude: 120 },
            customerSignatureUrl: existingUrl,
        });

        expect(result.data?.success).toBe(true);

        // 不应该重复上传
        expect(fileService.uploadFile).not.toHaveBeenCalled();

        // 落库原链接
        expect(mockUpdateSet).toHaveBeenCalledWith(
            expect.objectContaining({
                customerSignatureUrl: existingUrl
            })
        );
    });
});
