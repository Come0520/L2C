import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getTenantInfo,
    canEditTenantInfo,
    updateTenantInfo,
    uploadTenantLogo,
    getVerificationStatus,
    submitVerification,
    uploadBusinessLicense
} from '../actions/tenant-info';

// Hoist mocks to avoid initialization order issues
const mocks = vi.hoisted(() => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
    dbFindFirst: vi.fn(),
    logAudit: vi.fn(),
    revalidatePath: vi.fn(),
    mkdir: vi.fn(),
    writeFile: vi.fn(),
}));

// Mock next-auth
vi.mock('@/shared/lib/auth', () => ({
    auth: mocks.auth,
    checkPermission: mocks.checkPermission,
}));

// Mock next/cache
vi.mock('next/cache', () => ({
    revalidatePath: mocks.revalidatePath,
}));

// Mock audit service
vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: mocks.logAudit },
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
    mkdir: mocks.mkdir,
    writeFile: mocks.writeFile,
    default: {
        mkdir: mocks.mkdir,
        writeFile: mocks.writeFile,
    }
}));

// Mock Drizzle ORM
vi.mock('@/shared/api/db', () => {
    const createUpdateChain = () => ({
        set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue({}),
        }),
    });

    const tx = {
        select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    for: vi.fn().mockResolvedValue([{
                        settings: { contact: { phone: '123' } },
                        verificationStatus: 'unverified'
                    }]),
                }),
            }),
        }),
        update: vi.fn().mockReturnValue(createUpdateChain()),
    };

    return {
        db: {
            query: {
                tenants: { findFirst: mocks.dbFindFirst },
            },
            update: vi.fn().mockReturnValue(createUpdateChain()),
            transaction: vi.fn(async (callback) => await callback(tx)),
        },
    };
});

describe('Tenant Info Actions', () => {
    const mockTenantId = 'tenant-123';
    const mockUserId = 'user-456';
    const mockSession = { user: { id: mockUserId, tenantId: mockTenantId } };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.auth.mockResolvedValue(mockSession);
        mocks.checkPermission.mockResolvedValue(undefined);
    });

    describe('getTenantInfo', () => {
        it('should return tenant info successfully', async () => {
            mocks.dbFindFirst.mockResolvedValue({
                id: mockTenantId,
                name: 'Test Tenant',
                code: 'TEST',
                logoUrl: '/logo.png',
                settings: { contact: { address: '123 St', phone: '111', email: 'test@test.com' } },
            });

            const result = await getTenantInfo();
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('Test Tenant');
                expect(result.data.contact.phone).toBe('111');
            }
        });

        it('should handle unauthenticated user', async () => {
            mocks.auth.mockResolvedValue(null);
            const result = await getTenantInfo();
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('未登录或无租户信息');
            }
        });

        it('should handle tenant not found', async () => {
            mocks.dbFindFirst.mockResolvedValue(null);
            const result = await getTenantInfo();
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('租户不存在');
            }
        });
    });

    describe('updateTenantInfo', () => {
        it('should update tenant info successfully', async () => {
            const result = await updateTenantInfo({
                name: 'New Name',
                phone: '999',
            });
            expect(result.success).toBe(true);
            expect(mocks.revalidatePath).toHaveBeenCalledWith('/settings/general');
            expect(mocks.logAudit).toHaveBeenCalled();
        });

        it('should validate input', async () => {
            const result = await updateTenantInfo({ name: '' });
            expect(result.success).toBe(false);
            expect(result.error).toBe('企业名称不能为空');
        });

        it('should handle unauthorized user', async () => {
            mocks.checkPermission.mockRejectedValue(new Error('Unauthorized'));
            const result = await updateTenantInfo({ name: 'New Name' });
            expect(result.success).toBe(false);
            expect(result.error).toBe('无权限执行此操作');
        });
    });

    describe('submitVerification', () => {
        it('should submit verification successfully', async () => {
            // 模拟事务内的审计日志
            mocks.logAudit.mockResolvedValue(undefined);

            const result = await submitVerification({
                legalRepName: 'John Doe',
                businessLicenseUrl: '/lic.pdf',
            });
            expect(result.success).toBe(true);
            expect(mocks.revalidatePath).toHaveBeenCalledWith('/settings/verification');
        });

        it('should validate verification input', async () => {
            const result = await submitVerification({ legalRepName: '', businessLicenseUrl: '/lic.pdf' });
            expect(result.success).toBe(false);
            expect(result.error).toBe('法定代表人不能为空');
        });
    });

    describe('uploadTenantLogo', () => {
        it('should upload logo successfully', async () => {
            const formData = new FormData();
            const file = new File(['dummy content'], 'logo.png', { type: 'image/png' });
            file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));
            formData.append('logo', file);

            const result = await uploadTenantLogo(formData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.logoUrl).toContain('/uploads/logos/');
                expect(mocks.mkdir).toHaveBeenCalled();
                expect(mocks.writeFile).toHaveBeenCalled();
            }
        });

        it('should reject invalid file type', async () => {
            const formData = new FormData();
            const file = new File(['dummy content'], 'doc.pdf', { type: 'application/pdf' });
            formData.append('logo', file);

            const result = await uploadTenantLogo(formData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('只支持 JPG, PNG, WEBP 格式图片');
            }
        });

        it('should reject large files', async () => {
            const formData = new FormData();
            // 模拟一个大于 2MB 的文件
            const largeContent = new Uint8Array(2.1 * 1024 * 1024);
            const file = new File([largeContent], 'large.png', { type: 'image/png' });
            formData.append('logo', file);

            const result = await uploadTenantLogo(formData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('图片文件不能超过 2MB');
            }
        });
    });

    describe('canEditTenantInfo', () => {
        it('should return true if user has permission', async () => {
            const result = await canEditTenantInfo();
            expect(result).toBe(true);
        });

        it('should return false if checkPermission fails', async () => {
            mocks.checkPermission.mockRejectedValue(new Error('Unauthorized'));
            const result = await canEditTenantInfo();
            expect(result).toBe(false);
        });
    });

    describe('getVerificationStatus', () => {
        it('should return status successfully', async () => {
            mocks.dbFindFirst.mockResolvedValue({
                verificationStatus: 'verified',
                businessLicenseUrl: '/lic.png',
                legalRepName: 'John',
            });
            const result = await getVerificationStatus();
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.status).toBe('verified');
            }
        });
    });

    describe('uploadBusinessLicense', () => {
        it('should upload license successfully', async () => {
            const formData = new FormData();
            const file = new File(['dummy content'], 'lic.pdf', { type: 'application/pdf' });
            file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));
            formData.append('license', file);

            const result = await uploadBusinessLicense(formData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.licenseUrl).toContain('/uploads/licenses/');
                expect(mocks.mkdir).toHaveBeenCalled();
                expect(mocks.writeFile).toHaveBeenCalled();
            }
        });

        it('should reject invalid file type for license', async () => {
            const formData = new FormData();
            const file = new File(['dummy content'], 'doc.txt', { type: 'text/plain' });
            formData.append('license', file);

            const result = await uploadBusinessLicense(formData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('仅支持 JPG、PNG、WebP、PDF 格式');
            }
        });
    });
});
