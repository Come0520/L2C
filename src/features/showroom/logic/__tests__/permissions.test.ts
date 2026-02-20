import { describe, it, expect } from 'vitest';
import { canManageShowroomItem } from '../permissions';

import type { Session } from 'next-auth';

describe('canManageShowroomItem 权限逻辑单元测试', () => {
    it('Session 为空时应返回 false', async () => {
        expect(await canManageShowroomItem(null, 'u1')).toBe(false);
        expect(await canManageShowroomItem({ user: {} } as unknown as Session, 'u1')).toBe(false);
    });

    it('超级管理员 (SUPER_ADMIN) 应有权管理任何素材', async () => {
        const session = { user: { id: 'admin1', role: 'SUPER_ADMIN' } } as unknown as Session;
        expect(await canManageShowroomItem(session, 'u1')).toBe(true);
    });

    it('管理员 (ADMIN) 应有权管理任何素材', async () => {
        const session = { user: { id: 'admin2', role: 'ADMIN' } } as unknown as Session;
        expect(await canManageShowroomItem(session, 'u1')).toBe(true);
    });

    it('创建者本人应有权管理该素材', async () => {
        const session = { user: { id: 'u1', role: 'SALES' } } as unknown as Session;
        expect(await canManageShowroomItem(session, 'u1')).toBe(true);
    });

    it('非创建者且非管理员应被拒绝', async () => {
        const session = { user: { id: 'u2', role: 'SALES' } } as unknown as Session;
        expect(await canManageShowroomItem(session, 'u1')).toBe(false);
    });

    it('边界情况：用户 ID 匹配但 Role 缺失（非 Admin 角色）应视为普通用户逻辑', async () => {
        const session = { user: { id: 'u1' } } as unknown as Session;
        expect(await canManageShowroomItem(session, 'u1')).toBe(true);
        expect(await canManageShowroomItem(session, 'u2')).toBe(false);
    });
});
