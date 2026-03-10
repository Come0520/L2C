import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createTemplate, updateTemplate, toggleTemplateStatus, deleteTemplate } from '../template-actions';
import { AuditService } from '@/shared/services/audit-service';

// Mock auth 模块
const mockSession = { user: { id: 'super-admin-1', role: 'SUPER_ADMIN', tenantId: 't1' } };
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(() => Promise.resolve(mockSession)),
}));

// Mock AuditService
vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn(),
    },
}));

// Mock DB 模块
const mockDbQueryFirst = vi.fn().mockResolvedValue({ id: 'mock-id', name: 'old-name' });
const mockInsertValues = vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]) });
const mockUpdateSet = vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'mock-id', name: 'new-name' }]) }) });
const mockDeleteWhere = vi.fn().mockResolvedValue([{ id: 'mock-id' }]);

const txMock = {
    insert: vi.fn().mockReturnValue({ values: mockInsertValues }),
    update: vi.fn().mockReturnValue({ set: mockUpdateSet }),
    delete: vi.fn().mockReturnValue({ where: mockDeleteWhere }),
    query: {
        aiCurtainStyleTemplates: {
            findFirst: mockDbQueryFirst,
        },
    },
};

vi.mock('@/shared/api/db', () => ({
    db: {
        transaction: vi.fn(async (cb) => cb(txMock)),
    },
}));

// Mock cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

describe('template-actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('createTemplate should call AuditService.log', async () => {
        await createTemplate({
            name: 'test',
            category: 'track',
            promptFragment: 'test fragment',
            sortOrder: 0,
            isActive: 1,
        });

        expect(AuditService.log).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'CREATE_STYLE_TEMPLATE',
                tableName: 'ai_curtain_style_templates',
            }),
            expect.any(Object)
        );
    });

    it('updateTemplate should call AuditService.log', async () => {
        await updateTemplate('mock-id', { name: 'test-update' });

        expect(AuditService.log).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'UPDATE_STYLE_TEMPLATE',
                tableName: 'ai_curtain_style_templates',
                recordId: 'mock-id',
            }),
            expect.any(Object)
        );
    });

    it('toggleTemplateStatus should call AuditService.log', async () => {
        await toggleTemplateStatus('mock-id', 0);

        expect(AuditService.log).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'TOGGLE_STYLE_TEMPLATE_STATUS',
                tableName: 'ai_curtain_style_templates',
                recordId: 'mock-id',
            }),
            expect.any(Object)
        );
    });

    it('deleteTemplate should call AuditService.log', async () => {
        await deleteTemplate('mock-id');

        expect(AuditService.log).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'DELETE_STYLE_TEMPLATE',
                tableName: 'ai_curtain_style_templates',
                recordId: 'mock-id',
            }),
            expect.any(Object)
        );
    });
});
