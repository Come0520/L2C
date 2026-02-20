
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createAfterSalesTicket, updateTicketStatus, getAfterSalesTickets } from '../actions/ticket';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { AuditService } from '@/shared/lib/audit-service';
import { revalidatePath, revalidateTag } from 'next/cache';

// Mock Modules
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            afterSalesTickets: { findFirst: vi.fn(), findMany: vi.fn() },
            orders: { findFirst: vi.fn() },
        },
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn(() => Promise.resolve([{ id: 'mock-ticket-id', ticketNo: 'AS12345' }]))
            }))
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => Promise.resolve({}))
            }))
        })),
        transaction: vi.fn((cb) => cb({
            query: {
                orders: { findFirst: vi.fn() },
            },
            insert: vi.fn(() => ({
                values: vi.fn(() => ({
                    returning: vi.fn(() => Promise.resolve([{ id: 'mock-ticket-id', ticketNo: 'AS12345' }]))
                }))
            })),
        })),
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        recordFromSession: vi.fn().mockResolvedValue({}),
    }
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

// Mock ticket utils
vi.mock('../utils', () => ({
    generateTicketNo: vi.fn().mockResolvedValue('AS12345'),
    escapeLikePattern: vi.fn(s => s),
    maskPhoneNumber: vi.fn(s => s),
}));

describe('After-Sales Ticket Actions', () => {
    const VALID_USER_ID = '550e8400-e29b-41d4-a716-446655440004';
    const VALID_TENANT_ID = '550e8400-e29b-41d4-a716-446655440005';
    const VALID_TICKET_ID = '550e8400-e29b-41d4-a716-446655440006';
    const VALID_ORDER_ID = '550e8400-e29b-41d4-a716-446655440007';

    const mockSession = {
        user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as any).mockResolvedValue(mockSession);
    });

    describe('createAfterSalesTicket', () => {
        it('should create a ticket successfully', async () => {
            const input = {
                orderId: VALID_ORDER_ID,
                customerId: 'customer-1',
                type: 'REPAIR' as const,
                description: 'Test problem',
                priority: 'MEDIUM' as const,
            };

            // Setup transaction mock behavior
            (db.transaction as any).mockImplementation(async (cb: any) => {
                const tx = {
                    query: {
                        orders: {
                            findFirst: vi.fn().mockResolvedValue({ id: VALID_ORDER_ID, tenantId: VALID_TENANT_ID, customerId: 'customer-1' })
                        }
                    },
                    insert: vi.fn(() => ({
                        values: vi.fn(() => ({
                            returning: vi.fn(() => Promise.resolve([{ id: 'mock-ticket-id', ticketNo: 'AS12345' }]))
                        }))
                    })),
                };
                return cb(tx);
            });

            const result = await createAfterSalesTicket(input);

            expect(result.success).toBe(true);
            expect(AuditService.recordFromSession).toHaveBeenCalled();
            expect(revalidatePath).toHaveBeenCalledWith('/after-sales');
            expect(revalidateTag).toHaveBeenCalledWith('after-sales-analytics');
        });

        it('should fail if unauthorized', async () => {
            (auth as any).mockResolvedValue(null);

            const result = await createAfterSalesTicket({
                orderId: VALID_ORDER_ID,
                customerId: 'customer-1',
                type: 'REPAIR' as const,
                description: 'Test',
                priority: 'MEDIUM' as const,
            });

            expect(result.success).toBe(false);
        });
    });

    describe('updateTicketStatus', () => {
        it('should update ticket status successfully', async () => {
            const input = {
                ticketId: VALID_TICKET_ID,
                status: 'INVESTIGATING' as const,
            };

            (db.query.afterSalesTickets.findFirst as any).mockResolvedValue({
                id: VALID_TICKET_ID,
                status: 'PENDING',
                tenantId: VALID_TENANT_ID
            });

            const result = await updateTicketStatus(input);

            expect(result.success).toBe(true);
            expect(db.update).toHaveBeenCalled();
            expect(revalidateTag).toHaveBeenCalledWith('after-sales-analytics');
        });

        it('should fail for invalid status transition', async () => {
            const input = {
                ticketId: VALID_TICKET_ID,
                status: 'CLOSED' as const,
            };

            (db.query.afterSalesTickets.findFirst as any).mockResolvedValue({
                id: VALID_TICKET_ID,
                status: 'PENDING',
                tenantId: VALID_TENANT_ID
            });

            const result = await updateTicketStatus(input);
            console.log('Test Update Result:', result);
            expect(result.success).toBe(false);
            expect(result.message).toContain('无法从');
        });
    });

    describe('getAfterSalesTickets', () => {
        it('should return ticket list', async () => {
            (db.query.afterSalesTickets.findMany as any).mockResolvedValue([
                { id: '1', ticketNo: 'AS001' }
            ]);

            const result = await getAfterSalesTickets({});

            expect(result.success).toBe(true);
            expect(Array.isArray(result.data)).toBe(true);
        });
    });
});
