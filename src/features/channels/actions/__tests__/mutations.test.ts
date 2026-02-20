import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------
// 稳定的 Mock 闭环
// ---------------------------------------------------------

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            channels: { findFirst: vi.fn() }
        },
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn()
            }))
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => ({
                    returning: vi.fn()
                }))
            }))
        })),
        transaction: vi.fn((cb) => cb({
            insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn() })) })),
            update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn() })) })) })),
            delete: vi.fn(() => ({ where: vi.fn() })),
            $count: vi.fn(),
            query: { channels: { findFirst: vi.fn() } }
        }))
    }
}));

vi.mock('@/shared/api/schema/channels', () => ({
    channels: { id: 'channels.id', tenantId: 'channels.tenantId', parentId: 'channels.parentId', channelNo: 'channels.channelNo', name: 'channels.name' },
    channelContacts: { id: 'channelContacts.id', channelId: 'channelContacts.channelId', tenantId: 'channelContacts.tenantId', isMain: 'channelContacts.isMain' },
    channelCommissions: { id: 'channelCommissions.id', channelId: 'channelCommissions.channelId', tenantId: 'channelCommissions.tenantId' }
}));

vi.mock('@/shared/api/schema', () => ({
    leads: { id: 'leads.id', channelId: 'leads.channelId', tenantId: 'leads.tenantId' }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: vi.fn() }
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}));

// 重写 Zod 校验部分以配合测试
vi.mock('../schema', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        // 如果需要可以对 schema 做 patch，但目前我们的冲突点在于 partial()
        // 这里暂时不修改原始 schema，在测试中传递完整数据或 catch 错误
    };
});

import { createChannel, updateChannel, deleteChannel, toggleContactMain } from '../mutations';
import { db } from '@/shared/api/db';
import { auth, checkPermission } from '@/shared/lib/auth';

describe('Channels Mutations (Final)', () => {
    const mockId = '550e8400-e29b-41d4-a716-446655440000';
    const mockContactId = '770e8400-e29b-41d4-a716-446655440000';
    const mockTenantId = '880e8400-e29b-41d4-a716-446655440000';
    const mockSession = { user: { id: 'u1', tenantId: mockTenantId, roles: ['ADMIN'] } };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockSession as any);
        vi.mocked(checkPermission).mockResolvedValue(true);
    });

    it('createChannel 成功', async () => {
        const input = {
            name: '测试渠道',
            channelNo: 'CH100',
            category: 'OFFLINE' as const,
            channelType: 'STORE' as const,
            contactName: '王五',
            phone: '13811112222',
            commissionRate: 5,
            commissionType: 'FIXED' as const,
            cooperationMode: 'COMMISSION' as const,
            hierarchyLevel: 1,
            level: 'A' as const,
            settlementType: 'MONTHLY' as const,
            status: 'ACTIVE' as const,
        };

        vi.mocked(db.query.channels.findFirst).mockResolvedValue(null);
        vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
            return cb({
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: mockId, ...input, tenantId: mockTenantId }])
                    })
                })
            });
        });

        const result = await createChannel(input);
        expect(result.id).toBe(mockId);
    });

    it('deleteChannel 成功', async () => {
        vi.mocked(db.query.channels.findFirst).mockResolvedValue({ id: mockId, tenantId: mockTenantId } as any);
        vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
            return cb({
                $count: vi.fn().mockResolvedValue(0),
                delete: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue(true)
                }),
                query: { channels: { findFirst: vi.fn().mockResolvedValue({ id: mockId }) } }
            });
        });
        await deleteChannel(mockId);
        expect(db.transaction).toHaveBeenCalled();
    });

    it('toggleContactMain 成功', async () => {
        vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
            return cb({
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue(true)
                    })
                })
            });
        });
        await toggleContactMain(mockId, mockContactId);
        expect(db.transaction).toHaveBeenCalled();
    });
});
