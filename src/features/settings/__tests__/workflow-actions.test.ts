import { describe, it, expect, vi, beforeEach } from 'vitest';

// 使用 vi.hoisted 提升 mock 定义
const mocks = vi.hoisted(() => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

// Mock 依赖
vi.mock('@/shared/lib/auth', () => ({
    auth: mocks.auth,
    checkPermission: mocks.checkPermission,
}));

import { getWorkflows, createWorkflow, updateWorkflow, deleteWorkflow } from '../workflow/actions';

describe('WorkflowActions', () => {
    const mockTenantId = 'tenant-1';
    const mockSession = {
        user: { id: 'user-1', tenantId: mockTenantId, role: 'ADMIN' },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.auth.mockResolvedValue(mockSession);
    });

    describe('getWorkflows', () => {
        it('未授权时应返回错误', async () => {
            mocks.auth.mockResolvedValue(null);
            const result = await getWorkflows();
            expect(result.success).toBe(false);
            expect(result.error).toBe('未授权');
        });

        it('授权用户应能获取列表', async () => {
            const result = await getWorkflows();
            expect(result.success).toBe(true);
            expect(result.data).toEqual([]);
        });
    });

    describe('createWorkflow', () => {
        it('拥有权限时应成功', async () => {
            mocks.checkPermission.mockResolvedValue(true);
            const result = await createWorkflow({ name: 'New Workflow' });
            expect(result.success).toBe(true);
            expect(result.message).toBe('Workflow created');
        });

        it('未授权时应返回错误', async () => {
            mocks.auth.mockResolvedValue(null);
            const result = await createWorkflow({});
            expect(result.success).toBe(false);
            expect(result.error).toBe('未授权');
        });
    });

    describe('updateWorkflow', () => {
        it('拥有权限时应成功', async () => {
            mocks.checkPermission.mockResolvedValue(true);
            const result = await updateWorkflow({ id: 'wf-1', name: 'Updated' });
            expect(result.success).toBe(true);
            expect(result.message).toBe('Workflow updated');
        });
    });

    describe('deleteWorkflow', () => {
        it('拥有权限时应成功', async () => {
            mocks.checkPermission.mockResolvedValue(true);
            const result = await deleteWorkflow('wf-1');
            expect(result.success).toBe(true);
            expect(result.message).toBe('Workflow deleted');
        });
    });
});
