
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
// processingOrders is used in mock? No, I used literal string 'new-po-id'.
// But wait, the file imports them.
// Lint error said they are unused.
// Let's remove them.
import {
    createProcessingOrder,
    updateProcessingOrder,
    getProcessingOrderById as getProcessingOrder, // Alias to match test code
    // deleteProcessingOrder // Removed
} from '../actions/processing-actions';

// Mock Modules
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockReturnValue(true),
    getSession: vi.fn().mockResolvedValue({
        user: { id: 'test-user-id', tenantId: 'test-tenant-id', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString(),
    })
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        insert: vi.fn().mockImplementation(() => ({
            values: vi.fn().mockImplementation(() => ({
                returning: vi.fn().mockResolvedValue([{ id: 'new-po-id', woNo: 'WO-TEST-001' }])
            }))
        })),
        update: vi.fn().mockImplementation(() => ({
            set: vi.fn().mockImplementation(() => ({
                where: vi.fn().mockImplementation(() => ({
                    returning: vi.fn().mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174003', status: 'UPDATED' }])
                }))
            }))
        })),
        // Mocking select with chainable methods
        select: vi.fn().mockImplementation(() => ({
            from: vi.fn().mockImplementation(() => ({
                leftJoin: vi.fn().mockImplementation(function () { return this; }),
                where: vi.fn().mockImplementation(function () { return this; }),
                orderBy: vi.fn().mockImplementation(function () { return this; }),
                limit: vi.fn().mockImplementation(function () { return this; }),
                offset: vi.fn().mockImplementation(function () { return this; }),
                // Make it thenable to support await
                then: (resolve: any) => resolve([{ id: '123e4567-e89b-12d3-a456-426614174003', status: 'PENDING', total: 1 }]),
            }))
        })),
        query: {
            processingOrders: {
                findFirst: vi.fn(),
                findMany: vi.fn(),
            },
            suppliers: {
                findFirst: vi.fn().mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174002', name: 'Test Processor' }),
            }
        },
        transaction: vi.fn().mockImplementation(async (callback) => {
            const tx = {
                insert: vi.fn().mockImplementation(() => ({
                    values: vi.fn().mockImplementation(() => ({
                        returning: vi.fn().mockResolvedValue([{ id: 'new-po-id', woNo: 'WO-TEST-001' }])
                    }))
                })),
                update: vi.fn().mockImplementation(() => ({
                    set: vi.fn().mockImplementation(() => ({
                        where: vi.fn().mockResolvedValue([{ id: 'new-po-id' }])
                    }))
                }),),
                select: vi.fn().mockImplementation(() => ({
                    from: vi.fn().mockImplementation(() => ({
                        where: vi.fn().mockImplementation(() => ({
                            limit: vi.fn().mockResolvedValue([{ id: '123e4567-e89b-12d3-a456-426614174001' }])
                        }))
                    }))
                }))
            };
            return await callback(tx);
        })
    },
}));

vi.mock('@/shared/lib/utils', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(actual as any),
        generateDocNo: vi.fn().mockReturnValue('WO-TEST-001'),
    };
});

describe('Processing Actions', () => {
    const mockSession = {
        user: { id: 'test-user-id', tenantId: 'test-tenant-id', role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as unknown as import('vitest').Mock).mockResolvedValue(mockSession);
    });

    describe('createProcessingOrder', () => {
        it('should create a processing order successfully', async () => {
            const input = {
                orderId: '123e4567-e89b-12d3-a456-426614174001',
                poId: '123e4567-e89b-12d3-a456-426614174002',
                supplierId: '123e4567-e89b-12d3-a456-426614174003',
                items: [
                    { orderItemId: '123e4567-e89b-12d3-a456-426614174004' }
                ],
                remark: 'Test Remark'
            };

            const result = await createProcessingOrder(input);

            if (!result.success) {
                console.error('createProcessingOrder failed:', result.error);
            }
            expect(result.success).toBe(true);
        });
    });

    describe('updateProcessingOrder', () => {
        it('should update processing order successfully', async () => {
            const id = '123e4567-e89b-12d3-a456-426614174003';
            const data = {
                remark: 'Updated remark'
            };

            const result = await updateProcessingOrder(id, data);

            if (!result.success) {
                console.error('updateProcessingOrder failed:', result.error);
            }
            expect(result.success).toBe(true);
        });
    });
});
